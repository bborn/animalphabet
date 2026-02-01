import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors());

// Daily request limit to prevent runaway costs
const DAILY_LIMIT = 1000; // ~$0.10/day max with 70B model
const MAX_CHAIN_LENGTH = 100; // Prevent infinite games

async function checkRateLimit(env) {
  if (!env.STRATEGY) return true;

  const today = new Date().toISOString().split('T')[0];
  const key = `ratelimit:${today}`;
  const count = parseInt(await env.STRATEGY.get(key) || '0');

  if (count >= DAILY_LIMIT) {
    return false;
  }

  await env.STRATEGY.put(key, String(count + 1), { expirationTtl: 86400 });
  return true;
}

// Validate animal exists on Wikipedia using their REST API
async function validateAnimal(animal) {
  try {
    const formatted = animal.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_');
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${formatted}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Animalphabet/1.0 (https://animalphabet.bruno-bornsztein.workers.dev)' }
    });
    console.log(`  Wikipedia API: ${url} -> ${response.status}`);
    return response.status === 200;
  } catch (e) {
    console.log(`  Wikipedia API error: ${e.message}`);
    return false;
  }
}

// Extract clean animal name from LLM response
function parseAnimalName(response, letter) {
  // Clean up the response
  let text = response.trim().toLowerCase();

  // Remove common LLM garbage
  text = text
    .replace(/^(the |a |an )/i, '')
    .replace(/[^a-z\s-]/g, '')
    .trim();

  // If it's a short clean response, use it
  if (text.split(' ').length <= 3 && !text.includes('forbidden') && !text.includes('already')) {
    return text;
  }

  // Try to extract first valid-looking animal name
  const words = text.split(/\s+/);
  for (let i = 0; i < Math.min(words.length, 5); i++) {
    const word = words[i];
    if (word.startsWith(letter.toLowerCase()) && word.length > 2) {
      // Check for multi-word animals (e.g., "red panda")
      if (i + 1 < words.length && !['is', 'are', 'the', 'so', 'and', 'or'].includes(words[i + 1])) {
        return `${word} ${words[i + 1]}`;
      }
      return word;
    }
  }

  return null;
}

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

GAME RESULT:
- Chain length: ${chain.length} animals
- FAILED on letter: "${failedLetter.toUpperCase()}"
- Animals used: ${chain.join(', ')}

MOST IMPORTANT: Add a lesson for the letter "${failedLetter.toUpperCase()}" with 3-5 valid animals that start with it.
Example format: "FOR ${failedLetter.toUpperCase()}: rat, raven, robin, rhinoceros, rooster"

ALSO consider:
- Which letters are dangerous (X, Q, Z have few animals)
- Which endings lead to those dangerous letters
- What animals were already used that could have ended differently

WRITE 5-10 SPECIFIC LESSONS. Always include one "FOR ${failedLetter.toUpperCase()}:" lesson with real animals.
One lesson per line, no numbering, no bullet points.`;

    const response = await env.AI.run(env.AI_MODEL, {
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

  // Check rate limit
  if (!await checkRateLimit(env)) {
    return c.json({ stuck: true, reason: 'Daily limit reached - try again tomorrow!' });
  }

  // Check max chain length
  if (chain.length >= MAX_CHAIN_LENGTH) {
    return c.json({ stuck: true, reason: `Amazing! You hit the ${MAX_CHAIN_LENGTH} animal limit!` });
  }

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
    // Try up to 3 times to get a valid animal
    let animal = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;

      const response = await env.AI.run(env.AI_MODEL, {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50
      });

      const rawResponse = response.response;
      console.log(`Attempt ${attempts}: Raw response = "${rawResponse}"`);

      // Check if stuck
      if (rawResponse.toLowerCase().includes('stuck')) {
        console.log('  -> Rejected: stuck');
        continue;
      }

      // Parse out the animal name from potentially messy response
      let candidate = parseAnimalName(rawResponse, letter);
      console.log(`  -> Parsed: "${candidate}"`);
      if (!candidate) {
        console.log('  -> Rejected: parse failed');
        continue;
      }

      // Validate: starts with correct letter?
      if (!candidate.startsWith(letter.toLowerCase())) {
        console.log(`  -> Rejected: wrong letter (got ${candidate[0]}, need ${letter})`);
        continue;
      }

      // Validate: not a repeat?
      if (chain.map(a => a.toLowerCase()).includes(candidate)) {
        console.log('  -> Rejected: repeat');
        continue;
      }

      // Validate: is a real animal on Wikipedia?
      const isReal = await validateAnimal(candidate);
      console.log(`  -> Wikipedia check: ${isReal}`);
      if (!isReal) {
        console.log('  -> Rejected: not on Wikipedia');
        continue;
      }

      // Valid!
      animal = candidate;
      break;
    }

    if (!animal) {
      return c.json({ stuck: true, reason: `Couldn't find an animal starting with ${letter.toUpperCase()} after ${maxAttempts} attempts` });
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
