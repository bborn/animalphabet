// State
let chain = [];
let currentLetter = '';
let isPlaying = false;
let gameDelay = 1500; // ms between turns

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

    // Continue after delay
    setTimeout(playTurn, gameDelay);

  } catch (error) {
    console.error('Error:', error);
    endGame('Network error');
  }
}

// Add animal to the visual chain
function addAnimalToDisplay(animal, number) {
  const el = document.createElement('span');
  el.className = 'animal new';

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

// End the game
async function endGame(reason) {
  isPlaying = false;

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
    await fetch('/api/end-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chain,
        failedLetter: currentLetter,
        playerName: ''
      })
    });

    learningNoteEl.textContent = '🧠 AI has learned a new strategy lesson from this game!';
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
    const scores = await response.json();

    if (scores.length === 0) {
      leaderboardEl.innerHTML = '<p class="empty">No scores yet. Be the first!</p>';
      return;
    }

    leaderboardEl.innerHTML = scores.slice(0, 10).map((entry, i) => {
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const preview = entry.chain ? entry.chain.slice(0, 3).join(' → ') + '...' : '';

      return `
        <div class="leaderboard-entry">
          <span class="rank ${rankClass}">${i + 1}</span>
          <div class="info">
            <div class="name">${escapeHtml(entry.name)}</div>
            <div class="preview">${preview}</div>
          </div>
          <span class="score">${entry.length}</span>
        </div>
      `;
    }).join('');
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

// Initial load
loadLeaderboard();
loadLessons();
