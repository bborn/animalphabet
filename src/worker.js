import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors());

// System prompt for the animal game
const SYSTEM_PROMPT = `You are playing the Animal Name Game. The rules are simple:
1. Name an animal that starts with the given letter
2. The next animal must start with the LAST letter of the previous animal
3. You cannot repeat any animal that has already been used in this chain
4. Use real animals only (no mythical creatures)
5. When you truly cannot think of a valid animal, respond with "STUCK"

Respond with ONLY the animal name (or "STUCK"), nothing else. No explanations, no punctuation, just the animal name in lowercase.`;

// Build the strategy context from learned lessons
async function getStrategyContext(env) {
  if (!env.STRATEGY) return '';

  try {
    const lessons = await env.STRATEGY.get('lessons', 'json') || [];
    if (lessons.length === 0) return '';

    const recentLessons = lessons.slice(-20); // Last 20 lessons
    return `\n\nSTRATEGY LESSONS FROM PREVIOUS GAMES:\n${recentLessons.map(l => `- ${l}`).join('\n')}\n\nUse these lessons to avoid getting stuck!`;
  } catch {
    return '';
  }
}

// Save and consolidate lessons
async function saveLesson(env, newLesson) {
  if (!env.STRATEGY) return;

  try {
    const lessons = await env.STRATEGY.get('lessons', 'json') || [];

    // If we have enough lessons, periodically consolidate
    if (lessons.length >= 10 && lessons.length % 5 === 0) {
      const consolidated = await consolidateLessons(env, lessons, newLesson);
      await env.STRATEGY.put('lessons', JSON.stringify(consolidated));
    } else {
      lessons.push(newLesson);
      const trimmed = lessons.slice(-50);
      await env.STRATEGY.put('lessons', JSON.stringify(trimmed));
    }
  } catch (e) {
    console.error('Failed to save lesson:', e);
  }
}

// Use AI to consolidate and deduplicate lessons
async function consolidateLessons(env, lessons, newLesson) {
  try {
    const prompt = `You are reviewing strategy lessons from an Animal Name Game. The goal is to maintain a concise, non-redundant list of the most useful strategies.

EXISTING LESSONS:
${lessons.map((l, i) => `${i + 1}. ${l}`).join('\n')}

NEW LESSON TO ADD:
${newLesson}

Please consolidate these into 8-12 of the MOST IMPORTANT and DISTINCT lessons. Rules:
- Combine similar lessons into one stronger lesson
- Remove redundant or contradictory lessons
- Keep lessons specific and actionable
- Focus on letter management (avoiding X, using common letters, etc.)

Return ONLY the consolidated lessons, one per line, no numbering.`;

    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500
    });

    const consolidated = response.response
      .trim()
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 10 && !l.match(/^\d+\./));

    return consolidated.length > 0 ? consolidated : [...lessons.slice(-10), newLesson];
  } catch (e) {
    console.error('Failed to consolidate lessons:', e);
    return [...lessons.slice(-10), newLesson];
  }
}

// Get leaderboard
async function getLeaderboard(env) {
  if (!env.LEADERBOARD) return [];

  try {
    return await env.LEADERBOARD.get('scores', 'json') || [];
  } catch {
    return [];
  }
}

// Update leaderboard
async function updateLeaderboard(env, entry) {
  if (!env.LEADERBOARD) return;

  try {
    const scores = await env.LEADERBOARD.get('scores', 'json') || [];
    scores.push(entry);
    // Sort by chain length, keep top 50
    scores.sort((a, b) => b.length - a.length);
    const trimmed = scores.slice(0, 50);
    await env.LEADERBOARD.put('scores', JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to update leaderboard:', e);
  }
}

// Generate a lesson from a failed game
async function generateLesson(env, chain, failedLetter) {
  try {
    const prompt = `A game of the Animal Name Game just ended. The chain was ${chain.length} animals long and got stuck on the letter "${failedLetter.toUpperCase()}".

The chain was: ${chain.join(' → ')}

In ONE short sentence, what strategic lesson can be learned to avoid this in future games? Focus on letter management and which animals to avoid or prefer. Be specific.`;

    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100
    });

    return response.response.trim();
  } catch (e) {
    console.error('Failed to generate lesson:', e);
    return null;
  }
}

// Play one turn of the game
app.post('/api/turn', async (c) => {
  const env = c.env;
  const { chain, letter } = await c.req.json();

  const strategyContext = await getStrategyContext(env);

  const usedAnimals = chain.length > 0
    ? `\n\nAnimals already used (DO NOT repeat these): ${chain.join(', ')}`
    : '';

  const prompt = `${SYSTEM_PROMPT}${strategyContext}${usedAnimals}

Name an animal starting with the letter "${letter.toUpperCase()}":`;

  try {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50
    });

    let animal = response.response.trim().toLowerCase().replace(/[^a-z\s-]/g, '');

    // Check if stuck
    if (animal.includes('stuck') || animal === '') {
      return c.json({ stuck: true, reason: `Couldn't find an animal starting with ${letter.toUpperCase()}` });
    }

    // Validate: starts with correct letter?
    if (!animal.startsWith(letter.toLowerCase())) {
      return c.json({ stuck: true, reason: `AI gave "${animal}" but it doesn't start with ${letter.toUpperCase()}` });
    }

    // Validate: not a repeat?
    if (chain.map(a => a.toLowerCase()).includes(animal)) {
      return c.json({ stuck: true, reason: `AI repeated "${animal}"` });
    }

    const lastLetter = animal.slice(-1);

    return c.json({
      animal,
      nextLetter: lastLetter,
      chainLength: chain.length + 1
    });
  } catch (e) {
    console.error('AI error:', e);
    return c.json({ stuck: true, reason: 'AI error' }, 500);
  }
});

// End game and learn from it
app.post('/api/end-game', async (c) => {
  const env = c.env;
  const { chain, failedLetter, playerName } = await c.req.json();

  // Generate and save lesson
  if (chain.length > 0 && failedLetter) {
    const lesson = await generateLesson(env, chain, failedLetter);
    if (lesson) {
      await saveLesson(env, lesson);
    }
  }

  // Update leaderboard
  if (chain.length > 0) {
    await updateLeaderboard(env, {
      name: playerName || 'Anonymous',
      length: chain.length,
      chain: chain, // Store full chain
      date: new Date().toISOString()
    });
  }

  return c.json({ success: true });
});

// Get leaderboard
app.get('/api/leaderboard', async (c) => {
  const scores = await getLeaderboard(c.env);
  return c.json(scores);
});

// Get strategy lessons (for debugging/display)
app.get('/api/lessons', async (c) => {
  if (!c.env.STRATEGY) return c.json([]);
  try {
    const lessons = await c.env.STRATEGY.get('lessons', 'json') || [];
    return c.json(lessons.slice(-10)); // Last 10
  } catch {
    return c.json([]);
  }
});

export default app;
