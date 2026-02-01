// State
let chain = [];
let currentLetter = '';
let isPlaying = false;
let gameDelay = 1500; // ms between turns
let audioCtx = null;
const MAX_CHAIN_LENGTH = 300; // Safety limit

// Sound effects using Web Audio API
function initAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('Audio not available:', e);
    return null;
  }
}

function playPop() {
  try {
    const ctx = initAudio();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.warn('Sound error:', e);
  }
}

function playMilestone() {
  try {
    const ctx = initAudio();
    if (!ctx) return;

    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = freq;
      osc.type = 'sine';

      const startTime = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  } catch (e) {
    console.warn('Sound error:', e);
  }
}

function playGameOver() {
  try {
    const ctx = initAudio();
    if (!ctx) return;

    const notes = [400, 350, 300, 200];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = freq;
      osc.type = 'sawtooth';

      const startTime = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  } catch (e) {
    console.warn('Sound error:', e);
  }
}

// Elements
const startControls = document.getElementById('start-controls');
const gameDisplay = document.getElementById('game-display');
const startBtn = document.getElementById('start-btn');
const randomBtn = document.getElementById('random-btn');
const startLetterInput = document.getElementById('start-letter');
const chainEl = document.getElementById('chain');
const chainCountEl = document.getElementById('chain-count');
const currentLetterEl = document.getElementById('current-letter');
const statusEl = document.getElementById('status');
const gameOverEl = document.getElementById('game-over');
const gameOverTitleEl = document.getElementById('game-over-title');
const gameOverReasonEl = document.getElementById('game-over-reason');
const learningNoteEl = document.getElementById('learning-note');
const playerNameInput = document.getElementById('player-name');
const saveScoreBtn = document.getElementById('save-score-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const leaderboardEl = document.getElementById('leaderboard');
const lessonsEl = document.getElementById('lessons');
const modalOverlay = document.getElementById('modal-overlay');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');
const modalStats = document.getElementById('modal-stats');
const modalChain = document.getElementById('modal-chain');

// Event listeners
startBtn.addEventListener('click', startGame);
randomBtn.addEventListener('click', () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  startLetterInput.value = letters[Math.floor(Math.random() * 26)];
});
playAgainBtn.addEventListener('click', resetGame);
saveScoreBtn.addEventListener('click', saveScore);

// Start the game
async function startGame() {
  initAudio(); // Init audio on user interaction

  let letter = startLetterInput.value.trim().toUpperCase();
  if (!letter || !/^[A-Z]$/.test(letter)) {
    letter = 'A'; // Default
  }

  chain = [];
  currentLetter = letter.toLowerCase();
  isPlaying = true;

  // Update UI
  startControls.style.display = 'none';
  gameDisplay.style.display = 'block';
  gameOverEl.style.display = 'none';
  statusEl.innerHTML = '<span class="thinking">Thinking...</span>';
  chainEl.innerHTML = '';
  updateStats();

  // Start the game loop
  playTurn();
}

// Play a single turn
async function playTurn() {
  if (!isPlaying) return;

  // Safety limit
  if (chain.length >= MAX_CHAIN_LENGTH) {
    endGame(`Incredible! Hit the ${MAX_CHAIN_LENGTH} animal limit!`);
    return;
  }

  try {
    const response = await fetch('/api/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chain, letter: currentLetter })
    });

    const data = await response.json();

    if (data.stuck) {
      endGame(data.reason);
      return;
    }

    // Add animal to chain
    chain.push(data.animal);
    currentLetter = data.nextLetter;

    // Update display
    addAnimalToDisplay(data.animal, chain.length);
    updateStats();

    // Sound effects
    if (chain.length % 25 === 0) {
      playMilestone();
    } else {
      playPop();
    }

    // Continue after delay
    setTimeout(playTurn, gameDelay);

  } catch (error) {
    console.error('Error:', error);
    endGame('Network error');
  }
}

// Get Wikipedia URL for an animal
function getWikiUrl(animal) {
  const formatted = animal.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_');
  return `https://en.wikipedia.org/wiki/${formatted}`;
}

// Add animal to the visual chain
function addAnimalToDisplay(animal, number) {
  const el = document.createElement('a');
  el.className = 'animal new';
  el.href = getWikiUrl(animal);
  el.target = '_blank';
  el.rel = 'noopener';

  const firstLetter = animal[0].toUpperCase();
  const lastLetter = animal.slice(-1).toUpperCase();

  el.innerHTML = `
    <span class="number">${number}</span>
    <span class="letter">${firstLetter}</span>${animal.slice(1, -1)}<span class="letter">${lastLetter}</span>
  `;

  chainEl.appendChild(el);

  // Scroll to bottom
  const container = document.querySelector('.chain-container');
  container.scrollTop = container.scrollHeight;

  // Remove 'new' class after animation
  setTimeout(() => el.classList.remove('new'), 400);
}

// Update stats display
function updateStats() {
  chainCountEl.textContent = chain.length;
  currentLetterEl.textContent = currentLetter.toUpperCase();
}

// Add failed letter indicator to chain
function addFailedLetterToDisplay(letter) {
  const el = document.createElement('span');
  el.className = 'animal failed new';

  el.innerHTML = `
    <span class="number">✗</span>
    <span class="letter">${letter.toUpperCase()}</span>???
  `;

  chainEl.appendChild(el);

  const container = document.querySelector('.chain-container');
  container.scrollTop = container.scrollHeight;
}

// End the game
async function endGame(reason) {
  isPlaying = false;
  playGameOver();

  // Show the failed letter in the chain
  addFailedLetterToDisplay(currentLetter);

  statusEl.innerHTML = '';
  gameOverEl.style.display = 'block';

  if (chain.length >= 100) {
    gameOverTitleEl.textContent = '🎉 Incredible!';
  } else if (chain.length >= 50) {
    gameOverTitleEl.textContent = '🔥 Amazing!';
  } else if (chain.length >= 20) {
    gameOverTitleEl.textContent = '👏 Great Run!';
  } else {
    gameOverTitleEl.textContent = '💀 Game Over';
  }

  gameOverReasonEl.textContent = reason;
  learningNoteEl.textContent = 'AI is learning from this game...';

  // Submit game for learning
  try {
    const response = await fetch('/api/end-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chain,
        failedLetter: currentLetter,
        playerName: ''
      })
    });

    const data = await response.json();

    if (data.learnings && data.learnings.length > 0) {
      learningNoteEl.innerHTML = '🧠 <strong>Knowledge base updated!</strong> AI reviewed and revised its strategy.';
    } else {
      learningNoteEl.textContent = '🧠 AI analyzed this game.';
    }
    loadLessons(); // Refresh lessons display
  } catch (e) {
    learningNoteEl.textContent = '';
  }
}

// Save score to leaderboard
async function saveScore() {
  const name = playerNameInput.value.trim() || 'Anonymous';

  try {
    await fetch('/api/end-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chain,
        failedLetter: currentLetter,
        playerName: name
      })
    });

    saveScoreBtn.textContent = 'Saved!';
    saveScoreBtn.disabled = true;
    loadLeaderboard();
  } catch (e) {
    console.error('Failed to save score:', e);
  }
}

// Reset to start screen
function resetGame() {
  chain = [];
  currentLetter = '';
  isPlaying = false;

  startControls.style.display = 'flex';
  gameDisplay.style.display = 'none';
  gameOverEl.style.display = 'none';
  saveScoreBtn.textContent = 'Save Score';
  saveScoreBtn.disabled = false;
  playerNameInput.value = '';
}

// Load leaderboard
async function loadLeaderboard() {
  try {
    const response = await fetch('/api/leaderboard');
    leaderboardData = await response.json();

    if (leaderboardData.length === 0) {
      leaderboardEl.innerHTML = '<p class="empty">No scores yet. Be the first!</p>';
      return;
    }

    leaderboardEl.innerHTML = leaderboardData.slice(0, 10).map((entry, i) => {
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const preview = entry.chain ? entry.chain.slice(0, 3).join(' → ') + '...' : '';

      return `
        <div class="leaderboard-entry" data-index="${i}">
          <span class="rank ${rankClass}">${i + 1}</span>
          <div class="info">
            <div class="name">${escapeHtml(entry.name)}</div>
            <div class="preview">${preview}</div>
          </div>
          <span class="score">${entry.length}</span>
        </div>
      `;
    }).join('');

    // Add click handlers
    leaderboardEl.querySelectorAll('.leaderboard-entry').forEach(el => {
      el.addEventListener('click', () => {
        const index = parseInt(el.dataset.index);
        showChainModal(leaderboardData[index]);
      });
    });
  } catch (e) {
    leaderboardEl.innerHTML = '<p class="empty">Failed to load leaderboard</p>';
  }
}

// Load learned lessons
async function loadLessons() {
  try {
    const response = await fetch('/api/lessons');
    const lessons = await response.json();

    if (lessons.length === 0) {
      lessonsEl.innerHTML = '<p class="empty">No lessons learned yet. Play some games!</p>';
      return;
    }

    lessonsEl.innerHTML = lessons.slice().reverse().map(lesson =>
      `<div class="lesson">${escapeHtml(lesson)}</div>`
    ).join('');
  } catch (e) {
    lessonsEl.innerHTML = '<p class="empty">Failed to load lessons</p>';
  }
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Modal functions
let leaderboardData = [];

function showChainModal(entry) {
  modalTitle.textContent = `${entry.name}'s Chain`;

  const date = new Date(entry.date).toLocaleDateString();
  modalStats.innerHTML = `
    <div class="stat">
      <span class="stat-value">${entry.length}</span>
      <span class="stat-label">Animals</span>
    </div>
    <div class="stat">
      <span class="stat-value">${date}</span>
      <span class="stat-label">Date</span>
    </div>
  `;

  modalChain.innerHTML = entry.chain.map((animal, i) => {
    const firstLetter = animal[0].toUpperCase();
    const lastLetter = animal.slice(-1).toUpperCase();
    return `
      <a class="animal" href="${getWikiUrl(animal)}" target="_blank" rel="noopener">
        <span class="number">${i + 1}</span>
        <span class="letter">${firstLetter}</span>${animal.slice(1, -1)}<span class="letter">${lastLetter}</span>
      </a>
    `;
  }).join('');

  modalOverlay.classList.add('active');
}

function closeModal() {
  modalOverlay.classList.remove('active');
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// Initial load
loadLeaderboard();
loadLessons();
