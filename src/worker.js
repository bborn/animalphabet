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

    // Analyze the chain for patterns
    const letterCounts = {};
    chain.forEach(animal => {
      const lastLetter = animal.slice(-1).toLowerCase();
      letterCounts[lastLetter] = (letterCounts[lastLetter] || 0) + 1;
    });

    const prompt = `You manage a knowledge base for an Animal Name Game. Be SPECIFIC and CONCRETE.

CURRENT KNOWLEDGE:
${currentLearnings.length > 0 ? currentLearnings.map((l, i) => `${i + 1}. ${l}`).join('\n') : '(empty)'}

GAME ANALYSIS:
- Chain: ${chain.length} animals
- FAILED on letter: "${failedLetter.toUpperCase()}" (this is important!)
- Last 5 animals before failure: ${chain.slice(-5).join(' → ')}
- Full chain: ${chain.join(' → ')}

BAD PATTERNS TO LEARN FROM:
1. What animal led to "${failedLetter.toUpperCase()}"? That animal's ending letter caused the failure.
2. Could a different animal choice earlier have avoided this?

WRITE SPECIFIC LESSONS like:
- "AVOID: Lynx, Fox, Sphinx - they end in X which has almost no animals"
- "FOR letter K: Use Kangaroo→O or Kiwi→I, NOT Koala→A (leads to Axolotl→L→Lynx→X trap)"
- "X is a death letter - only X-ray tetra works, and it ends in A"
- "SAFE endings: E, A, R, S, T, N - many animals start with these"

Update the knowledge base. Be SPECIFIC with animal names and letter patterns. No generic advice.
Return 5-12 lessons, one per line, no numbering.`;

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

  const usedList = chain.length > 0
    ? chain.map(a => a.toUpperCase()).join(', ')
    : null;

  const strategySection = lessons.length > 0
    ? `\nSTRATEGY:\n${lessons.map(l => `• ${l}`).join('\n')}\n`
    : '';

  const prompt = `${BASE_RULES}

CURRENT STATE:
- Need animal starting with: ${letter.toUpperCase()}
${usedList ? `\n⚠️ FORBIDDEN (already used - DO NOT SAY THESE): ${usedList}\n` : ''}
${strategySection}
Animal starting with "${letter.toUpperCase()}":`;

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

// User suggestion for what AI should have done
app.post('/api/suggest', async (c) => {
  const env = c.env;
  const { animal, letter } = await c.req.json();

  // Validate
  const cleanAnimal = animal.trim().toLowerCase();
  if (!cleanAnimal || cleanAnimal.length < 2) {
    return c.json({ success: false, error: 'Please enter a valid animal name' });
  }

  if (!cleanAnimal.startsWith(letter.toLowerCase())) {
    return c.json({ success: false, error: `"${animal}" doesn't start with ${letter.toUpperCase()}` });
  }

  // Add to learnings
  try {
    const lessons = await env.STRATEGY.get('lessons', 'json') || [];
    const newLesson = `FOR letter ${letter.toUpperCase()}: Try "${cleanAnimal}" (user suggestion)`;

    // Check if similar lesson exists
    const exists = lessons.some(l => l.toLowerCase().includes(cleanAnimal));
    if (!exists) {
      lessons.push(newLesson);
      await env.STRATEGY.put('lessons', JSON.stringify(lessons.slice(-20)));
    }

    return c.json({ success: true, message: `Thanks! AI will remember "${cleanAnimal}" for letter ${letter.toUpperCase()}` });
  } catch (e) {
    return c.json({ success: false, error: 'Failed to save suggestion' });
  }
});

export default app;
