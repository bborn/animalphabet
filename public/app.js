// Animalphabet v2
let chain = [];

// Animal emoji mapping
const animalEmojis = {
  aardvark: '🐽', alligator: '🐊', ant: '🐜', anteater: '🐽', antelope: '🦌',
  ape: '🦍', armadillo: '🦔', axolotl: '🦎',
  baboon: '🐒', badger: '🦡', bat: '🦇', bear: '🐻', beaver: '🦫', bee: '🐝',
  beetle: '🪲', bird: '🐦', bison: '🦬', boar: '🐗', buffalo: '🦬', bug: '🐛',
  bull: '🐂', butterfly: '🦋',
  camel: '🐫', canary: '🐦', capybara: '🦫', cat: '🐱', caterpillar: '🐛',
  cheetah: '🐆', chicken: '🐔', chimpanzee: '🐒', chipmunk: '🐿️', clam: '🦪',
  cobra: '🐍', cockroach: '🪳', cod: '🐟', condor: '🦅', coral: '🪸',
  cougar: '🐆', cow: '🐄', coyote: '🐺', crab: '🦀', crane: '🦩', cricket: '🦗',
  crocodile: '🐊', crow: '🐦‍⬛', cuttlefish: '🦑',
  deer: '🦌', dingo: '🐕', dog: '🐕', dolphin: '🐬', donkey: '🫏', dove: '🕊️',
  dragon: '🐉', dragonfly: '🪰', duck: '🦆',
  eagle: '🦅', eel: '🐍', egret: '🦢', elephant: '🐘', elk: '🦌', emu: '🐦',
  falcon: '🦅', ferret: '🦦', finch: '🐦', fish: '🐟', flamingo: '🦩',
  fly: '🪰', fox: '🦊', frog: '🐸',
  gazelle: '🦌', gecko: '🦎', gerbil: '🐹', giraffe: '🦒', goat: '🐐',
  goose: '🪿', gopher: '🐿️', gorilla: '🦍', grasshopper: '🦗', grouse: '🐦',
  guinea: '🐹',
  hamster: '🐹', hare: '🐇', hawk: '🦅', hedgehog: '🦔', heron: '🦢',
  hippo: '🦛', hippopotamus: '🦛', hornet: '🐝', horse: '🐴', hound: '🐕',
  hummingbird: '🐦', hyena: '🐕',
  ibex: '🐐', ibis: '🦩', iguana: '🦎', impala: '🦌',
  jackal: '🐺', jaguar: '🐆', jay: '🐦', jellyfish: '🪼',
  kangaroo: '🦘', kingfisher: '🐦', kiwi: '🥝', koala: '🐨', koi: '🐟',
  ladybug: '🐞', lark: '🐦', lemur: '🐒', leopard: '🐆', lion: '🦁',
  lizard: '🦎', llama: '🦙', lobster: '🦞', locust: '🦗', lynx: '🐱',
  macaw: '🦜', magpie: '🐦', mammoth: '🦣', manatee: '🦭', mandrill: '🐒',
  manta: '🐟', mantis: '🦗', meerkat: '🦡', mole: '🐀', mongoose: '🦡',
  monkey: '🐒', moose: '🫎', mosquito: '🦟', moth: '🦋', mouse: '🐭', mule: '🫏',
  narwhal: '🐋', newt: '🦎', nightingale: '🐦', numbat: '🐿️',
  octopus: '🐙', opossum: '🐀', orangutan: '🦧', orca: '🐋', ostrich: '🦤',
  otter: '🦦', owl: '🦉', ox: '🐂', oyster: '🦪',
  panda: '🐼', panther: '🐆', parakeet: '🦜', parrot: '🦜', partridge: '🐦',
  peacock: '🦚', pelican: '🦤', penguin: '🐧', pheasant: '🐦', pig: '🐷',
  pigeon: '🐦', piranha: '🐟', platypus: '🦫', pony: '🐴', poodle: '🐩',
  porcupine: '🦔', porpoise: '🐬', prawn: '🦐', puffin: '🐦', puma: '🐆',
  quail: '🐦', quokka: '🦘',
  rabbit: '🐰', raccoon: '🦝', ram: '🐏', rat: '🐀', rattlesnake: '🐍',
  raven: '🐦‍⬛', reindeer: '🦌', rhino: '🦏', rhinoceros: '🦏', roadrunner: '🐦',
  robin: '🐦', rooster: '🐓',
  salamander: '🦎', salmon: '🐟', sardine: '🐟', scorpion: '🦂', seahorse: '🐟',
  seal: '🦭', shark: '🦈', sheep: '🐑', shrimp: '🦐', skunk: '🦨', sloth: '🦥',
  snail: '🐌', snake: '🐍', sparrow: '🐦', spider: '🕷️', squid: '🦑',
  squirrel: '🐿️', starfish: '⭐', stingray: '🐟', stork: '🦢', swan: '🦢',
  tapir: '🐽', tarantula: '🕷️', termite: '🐜', tiger: '🐅', toad: '🐸',
  tortoise: '🐢', toucan: '🦜', trout: '🐟', tuna: '🐟', turkey: '🦃', turtle: '🐢',
  uakari: '🐒',
  viper: '🐍', vulture: '🦅',
  wallaby: '🦘', walrus: '🦭', warthog: '🐗', wasp: '🐝', weasel: '🦦',
  whale: '🐋', wolf: '🐺', wolverine: '🦡', wombat: '🐻', woodpecker: '🐦',
  worm: '🪱',
  yak: '🐂',
  zebra: '🦓'
};

function getAnimalEmoji(animal) {
  const name = animal.toLowerCase().split(' ').pop(); // get last word for "red panda" -> "panda"
  return animalEmojis[name] || '🐾';
}
let currentLetter = '';
let isPlaying = false;
let gameDelay = 1500; // ms between turns
let leaderboardData = [];

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
const suggestionBox = document.getElementById('suggestion-box');
const failedLetterDisplay = document.getElementById('failed-letter-display');
const suggestionInput = document.getElementById('suggestion-input');
const submitSuggestionBtn = document.getElementById('submit-suggestion-btn');
const suggestionResult = document.getElementById('suggestion-result');
const stopBtn = document.getElementById('stop-btn');
const stopControls = document.getElementById('stop-controls');

// Event listeners
stopBtn.addEventListener('click', stopGame);
startBtn.addEventListener('click', startGame);
randomBtn.addEventListener('click', () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  startLetterInput.value = letters[Math.floor(Math.random() * 26)];
});
playAgainBtn.addEventListener('click', resetGame);
saveScoreBtn.addEventListener('click', saveScore);
if (submitSuggestionBtn) {
  submitSuggestionBtn.addEventListener('click', submitSuggestion);
}

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
  stopControls.style.display = 'block';
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

// Get Wikipedia URL for an animal
function getWikiUrl(animal) {
  const formatted = animal.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_');
  return `https://en.wikipedia.org/wiki/${formatted}`;
}

// Add animal to the visual chain
function addAnimalToDisplay(animal, number) {
  const el = document.createElement('a');
  el.className = 'chain-row new';
  el.href = getWikiUrl(animal);
  el.target = '_blank';
  el.rel = 'noopener';

  const emoji = getAnimalEmoji(animal);
  let html = `<span class="number">${number}.</span><span class="emoji">${emoji}</span>`;

  if (number === 1) {
    // First animal - just show it with first/last letter highlighted
    const first = animal[0].toUpperCase();
    const middle = animal.slice(1, -1);
    const last = animal.slice(-1).toUpperCase();
    html += `<span class="letter">${first}</span>${middle}<span class="letter">${last}</span>`;
  } else {
    // Show previous animal (faded) joined with current animal
    const prev = chain[chain.length - 2];
    const prevPart = prev.slice(0, -1); // previous without last letter
    const joiningLetter = prev.slice(-1).toUpperCase(); // the shared letter
    const currentPart = animal.slice(1, -1); // current without first letter
    const lastLetter = animal.slice(-1).toUpperCase();

    html += `<span class="prev">${prevPart}</span><span class="letter">${joiningLetter}</span>${currentPart}<span class="letter">${lastLetter}</span>`;
  }

  el.innerHTML = html;
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
  stopControls.style.display = 'none';

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

  // Show suggestion box with failed letter
  failedLetterDisplay.textContent = currentLetter.toUpperCase();
  suggestionInput.value = '';
  suggestionResult.textContent = '';
  suggestionResult.className = 'suggestion-result';

  // Submit game for learning (don't save to leaderboard yet)
  try {
    const response = await fetch('/api/learn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chain,
        failedLetter: currentLetter
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

// Stop the current game
function stopGame() {
  if (!isPlaying) return;
  endGame('Stopped by player');
}

// Reset to start screen
function resetGame() {
  chain = [];
  currentLetter = '';
  isPlaying = false;

  startControls.style.display = 'flex';
  gameDisplay.style.display = 'none';
  gameOverEl.style.display = 'none';
  stopControls.style.display = 'none';
  saveScoreBtn.textContent = 'Save Score';
  saveScoreBtn.disabled = false;
  playerNameInput.value = '';
}

// Get fun title based on chain length
function getTitle(length) {
  if (length >= 75) return { title: 'Legend', icon: '👑' };
  if (length >= 50) return { title: 'Animal Whisperer', icon: '🧙' };
  if (length >= 35) return { title: 'Safari Master', icon: '🏆' };
  if (length >= 25) return { title: 'Wildlife Expert', icon: '🎓' };
  if (length >= 15) return { title: 'Zookeeper', icon: '🦁' };
  if (length >= 10) return { title: 'Nature Lover', icon: '🌿' };
  if (length >= 5) return { title: 'Beginner', icon: '🐣' };
  return { title: 'Tourist', icon: '📸' };
}

// Calculate joined chain length
function getChainWordLength(chain) {
  if (!chain || chain.length === 0) return 0;
  let len = chain[0].length;
  for (let i = 1; i < chain.length; i++) {
    len += chain[i].length - 1;
  }
  return len;
}

// Get all emojis for chain
function getChainEmojis(chain) {
  if (!chain || chain.length === 0) return ['🐾'];
  return chain.map(a => getAnimalEmoji(a));
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
      const { title, icon } = getTitle(entry.length);
      const emojis = getChainEmojis(entry.chain);
      const firstEmoji = emojis[0];
      const lastEmoji = emojis[emojis.length - 1];
      const wordLength = getChainWordLength(entry.chain);
      const deathLetter = entry.failedLetter ? entry.failedLetter.toUpperCase() : '?';

      const animalNames = entry.chain ? entry.chain.join('|') : '';
      const firstName = entry.chain ? entry.chain[0] : '?';
      const lastName = entry.chain ? entry.chain[entry.chain.length - 1] : '?';

      return `
        <div class="leaderboard-entry" data-index="${i}" data-emojis="${emojis.join('|')}" data-animals="${animalNames}">
          <span class="rank ${rankClass}">${i + 1}</span>
          <div class="emoji-parade">
            <span class="emoji-display">${firstEmoji}</span>
            <span class="emoji-arrow">→</span>
            <span class="emoji-last">${lastEmoji}</span>
            <span class="emoji-tooltip"></span>
          </div>
          <div class="info">
            <div class="name-row">
              <span class="name">${escapeHtml(entry.name)}</span>
              <span class="title">${icon} ${title}</span>
            </div>
            <div class="chain-summary">${firstName} → ${lastName}</div>
            <div class="stats-row">
              <span class="word-length">${wordLength} letters</span>
              <span class="death">💀 ${deathLetter}</span>
            </div>
          </div>
          <span class="score">${entry.length}</span>
        </div>
      `;
    }).join('');

    // Add click handlers and hover animation
    leaderboardEl.querySelectorAll('.leaderboard-entry').forEach(el => {
      el.addEventListener('click', () => {
        const index = parseInt(el.dataset.index);
        showChainModal(leaderboardData[index]);
      });

      // Emoji animation on hover with proximity slowdown and pause
      const emojis = el.dataset.emojis ? el.dataset.emojis.split('|') : [];
      const animals = el.dataset.animals ? el.dataset.animals.split('|') : [];
      const display = el.querySelector('.emoji-display');
      const arrow = el.querySelector('.emoji-arrow');
      const last = el.querySelector('.emoji-last');
      const tooltip = el.querySelector('.emoji-tooltip');
      let animationId = null;
      let currentIndex = 0;
      let proximity = 1; // 0 = close, 1 = far
      let paused = false;
      let isAnimating = false;
      let direction = 1; // 1 = forward, -1 = reverse

      el.addEventListener('mousemove', (e) => {
        const rect = display.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        const maxDist = 150;
        proximity = Math.min(dist / maxDist, 1);

        // Left of emoji = reverse, right = forward
        direction = e.clientX < centerX ? -1 : 1;
      });

      display.addEventListener('mouseenter', () => {
        paused = true;
        if (animationId) clearTimeout(animationId);
      });

      display.addEventListener('mouseleave', () => {
        paused = false;
        if (isAnimating && currentIndex < emojis.length) {
          scheduleNext();
        }
      });

      tooltip.addEventListener('click', (e) => {
        e.stopPropagation();
        const animal = tooltip.textContent;
        if (animal) {
          window.open(getWikiUrl(animal), '_blank');
        }
      });

      tooltip.addEventListener('mouseenter', () => {
        paused = true;
        if (animationId) clearTimeout(animationId);
      });

      tooltip.addEventListener('mouseleave', () => {
        paused = false;
        if (isAnimating && currentIndex < emojis.length) {
          scheduleNext();
        }
      });

      const scheduleNext = () => {
        const progress = direction === 1
          ? currentIndex / emojis.length
          : (emojis.length - currentIndex) / emojis.length;
        const baseDelay = 80 + Math.pow(progress, 2) * 300;
        const delay = baseDelay + (1 - proximity) * 400;
        animationId = setTimeout(animate, delay);
      };

      const animate = () => {
        if (paused) return;

        display.textContent = emojis[currentIndex];
        const animalName = animals[currentIndex] || '';
        tooltip.textContent = animalName;
        tooltip.style.opacity = animalName ? '1' : '0';
        display.classList.remove('emoji-pop');
        void display.offsetWidth; // force reflow
        display.classList.add('emoji-pop');

        const nextIndex = currentIndex + direction;
        if (nextIndex >= 0 && nextIndex < emojis.length) {
          currentIndex = nextIndex;
          scheduleNext();
        } else {
          // Bounce: reverse direction at edges
          direction *= -1;
          currentIndex += direction;
          if (currentIndex >= 0 && currentIndex < emojis.length) {
            scheduleNext();
          }
        }
      };

      el.addEventListener('mouseenter', (e) => {
        if (emojis.length <= 1) return;
        arrow.style.opacity = '0';
        last.style.opacity = '0';

        // Start from beginning or end based on mouse position
        const rect = display.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        direction = e.clientX < centerX ? -1 : 1;
        currentIndex = direction === 1 ? 0 : emojis.length - 1;

        isAnimating = true;
        paused = false;
        animate();
      });

      el.addEventListener('mouseleave', () => {
        if (animationId) clearTimeout(animationId);
        isAnimating = false;
        paused = false;
        display.textContent = emojis[0];
        display.classList.remove('emoji-pop');
        arrow.style.opacity = '';
        last.style.opacity = '';
        tooltip.style.opacity = '0';
        proximity = 1;
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
    const middle = animal.slice(1, -1);
    return `<a class="animal" href="${getWikiUrl(animal)}" target="_blank" rel="noopener"><span class="number">${i + 1}</span><span class="name"><span class="letter">${firstLetter}</span>${middle}<span class="letter">${lastLetter}</span></span></a>`;
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

// Submit user suggestion
// Confetti celebration
function createConfetti() {
  const colors = ['#6366f1', '#8b5cf6', '#d946ef', '#22c55e', '#f59e0b'];
  const container = document.querySelector('.suggestion-box');

  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (Math.random() * 1 + 1) + 's';
    container.appendChild(confetti);

    setTimeout(() => confetti.remove(), 2000);
  }
}

async function checkWikipedia(animal) {
  try {
    const formatted = animal.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_');
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${formatted}`);
    return response.status === 200;
  } catch {
    return false;
  }
}

async function submitSuggestion() {
  const animal = suggestionInput.value.trim().toLowerCase();
  if (!animal) {
    suggestionResult.textContent = 'Please enter an animal name';
    suggestionResult.className = 'suggestion-result error';
    return;
  }

  // Check starts with correct letter
  if (!animal.startsWith(currentLetter.toLowerCase())) {
    suggestionResult.textContent = `"${animal}" doesn't start with ${currentLetter.toUpperCase()}`;
    suggestionResult.className = 'suggestion-result error';
    return;
  }

  // Check not already used
  if (chain.map(a => a.toLowerCase()).includes(animal)) {
    suggestionResult.textContent = `"${animal}" was already used in this chain`;
    suggestionResult.className = 'suggestion-result error';
    return;
  }

  // Check exists on Wikipedia
  suggestionResult.textContent = 'Checking Wikipedia...';
  suggestionResult.className = 'suggestion-result';

  const exists = await checkWikipedia(animal);
  if (!exists) {
    suggestionResult.textContent = `"${animal}" not found on Wikipedia`;
    suggestionResult.className = 'suggestion-result error';
    return;
  }

  // Submit to backend
  try {
    const response = await fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ animal, letter: currentLetter })
    });

    const data = await response.json();

    if (data.success) {
      const emoji = getAnimalEmoji(animal);
      const celebrations = [
        `${emoji} Genius! You taught the AI "${animal}"!`,
        `${emoji} Brilliant! "${animal}" is now in the AI's brain!`,
        `${emoji} Amazing! The AI just got smarter thanks to you!`,
        `${emoji} You're a legend! "${animal}" saved for future games!`,
        `${emoji} Big brain energy! AI will remember "${animal}"!`,
      ];
      const msg = celebrations[Math.floor(Math.random() * celebrations.length)];
      suggestionResult.innerHTML = msg;
      suggestionResult.className = 'suggestion-result success';
      suggestionInput.value = '';

      // Confetti burst
      createConfetti();

      loadLessons();
    } else {
      suggestionResult.textContent = data.error;
      suggestionResult.className = 'suggestion-result error';
    }
  } catch (e) {
    suggestionResult.textContent = 'Failed to submit suggestion';
    suggestionResult.className = 'suggestion-result error';
  }
}

// Initial load
loadLeaderboard();
loadLessons();
