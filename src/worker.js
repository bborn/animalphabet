import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors());

// System prompt for the animal game
const BASE_RULES = `You are playing the Animal Name Game.

RULES:
1. Name an animal starting with the given letter
2. The LAST letter of your animal becomes the NEXT required starting letter
3. No repeating animals already used in the chain
4. Real animals only (no mythical creatures)
5. Respond with ONLY the animal name in lowercase, nothing else
6. Say "STUCK" only if you truly cannot think of a valid animal`;

// Get learned lessons
async function getLessons(env) {
  if (!env.STRATEGY) return [];

  try {
    const lessons = await env.STRATEGY.get('lessons', 'json') || [];
    return lessons.slice(-15); // Most recent lessons
  } catch {
    return [];
  }
}

// Update learnings based on game result
async function updateLearnings(env, chain, failedLetter) {
  if (!env.STRATEGY) return null;

  try {
    const currentLearnings = await env.STRATEGY.get('lessons', 'json') || [];

    const prompt = `You manage a LIVING KNOWLEDGE BASE for an Animal Name Game AI.

CURRENT KNOWLEDGE BASE:
${currentLearnings.length > 0 ? currentLearnings.map((l, i) => `${i + 1}. ${l}`).join('\n') : '(empty - this is the first game)'}

GAME JUST PLAYED:
- Chain length: ${chain.length} animals
- Got stuck on letter: "${failedLetter.toUpperCase()}"
- Full chain: ${chain.join(' → ')}

ANALYZE this game and UPDATE the knowledge base. You can:
- ADD new insights discovered from this game
- UPDATE existing lessons if this game provides better understanding
- DELETE lessons that this game proved wrong or unhelpful
- COMBINE similar lessons into stronger ones
- KEEP lessons that are still valid

The goal is a concise, accurate set of 5-15 strategic lessons. Focus on:
- Which ending letters to avoid (trap letters)
- Which ending letters are safe
- Specific animal choices that help or hurt
- Patterns that lead to long chains

Return ONLY the updated lessons, one per line. No numbering, no explanations.`;

    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600
    });

    const updated = response.response
      .trim()
      .split('\n')
      .map(l => l.trim().replace(/^[-•]\s*/, ''))
      .filter(l => l.length > 10 && !l.match(/^\d+[\.\)]/));

    if (updated.length > 0) {
      await env.STRATEGY.put('lessons', JSON.stringify(updated));
      return updated;
    }
    return currentLearnings;
  } catch (e) {
    console.error('Failed to update learnings:', e);
    return null;
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


// Play one turn of the game
app.post('/api/turn', async (c) => {
  const env = c.env;
  const { chain, letter } = await c.req.json();

  const lessons = await getLessons(env);

  const usedAnimals = chain.length > 0
    ? `Animals already used (cannot repeat): ${chain.join(', ')}`
    : 'This is the first animal in the chain.';

  const strategySection = lessons.length > 0
    ? `\nSTRATEGY (learned from previous games - APPLY THESE):\n${lessons.map(l => `• ${l}`).join('\n')}\n`
    : '';

  const prompt = `${BASE_RULES}

CURRENT STATE:
- You need an animal starting with: ${letter.toUpperCase()}
- ${usedAnimals}
${strategySection}
Name an animal starting with "${letter.toUpperCase()}":`;

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

  let updatedLearnings = null;

  // Update knowledge base based on this game
  if (chain.length > 0 && failedLetter) {
    updatedLearnings = await updateLearnings(env, chain, failedLetter);
  }

  // Update leaderboard
  if (chain.length > 0) {
    await updateLeaderboard(env, {
      name: playerName || 'Anonymous',
      length: chain.length,
      chain: chain,
      failedLetter: failedLetter,
      date: new Date().toISOString()
    });
  }

  return c.json({ success: true, learnings: updatedLearnings });
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
