(function () {
  const params = new URLSearchParams(window.location.search);
  const boardNum = parseInt(params.get('board')) || 1;

  let state = null;
  let isSpymaster = false;

  // Update board badge label
  document.getElementById('boardBadge').textContent = `Board ${boardNum}`;
  document.title = `Codenames Board ${boardNum} — ARN Edition`;

  const socket = io();

  socket.on('connect', () => {
    socket.emit('joinBoard', boardNum);
  });

  socket.on('gameState', (newState) => {
    state = newState;
    render();
  });

  // ── Render ────────────────────────────────────────────────
  function render() {
    if (!state) return;
    renderScoreboard();
    renderGrid();
    renderTurnIndicator();
    renderOverlay();
  }

  function renderScoreboard() {
    document.getElementById('redFound').textContent  = state.redFound;
    document.getElementById('redTotal').textContent  = state.redTotal;
    document.getElementById('blueFound').textContent = state.blueFound;
    document.getElementById('blueTotal').textContent = state.blueTotal;
  }

  function renderTurnIndicator() {
    const dot   = document.getElementById('turnDot');
    const label = document.getElementById('turnLabel');
    if (state.gameOver) {
      dot.className = 'turn-dot';
      label.textContent = 'Game Over';
    } else {
      dot.className = `turn-dot ${state.currentTeam}`;
      label.textContent = `${state.currentTeam.toUpperCase()} Team's Turn`;
    }
  }

  function renderGrid() {
    const grid = document.getElementById('boardGrid');
    grid.innerHTML = '';

    state.words.forEach((word, i) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.index = i;

      const revealed = state.revealed[i];
      const assignment = state.assignments[i]; // null if unrevealed and not spymaster

      if (revealed) {
        card.classList.add('revealed', assignment);
      } else if (isSpymaster && assignment) {
        card.classList.add(`hint-${assignment}`);
      }

      card.innerHTML = `<span class="card-word">${word}</span>`;

      if (!revealed && !state.gameOver) {
        card.addEventListener('click', () => revealCard(i));
      }

      grid.appendChild(card);
    });
  }

  function renderOverlay() {
    const overlay = document.getElementById('overlay');
    if (!state.gameOver) {
      overlay.style.display = 'none';
      return;
    }

    overlay.style.display = 'flex';
    const icon  = document.getElementById('overlayIcon');
    const title = document.getElementById('overlayTitle');
    const msg   = document.getElementById('overlayMsg');

    title.className = `overlay-title ${state.winner}`;

    const losingTeam = state.winner === 'red' ? 'blue' : 'red';
    if (state.winReason === 'assassin') {
      icon.innerHTML    = '&#128128;';
      title.textContent = `${state.winner.toUpperCase()} WINS!`;
      msg.textContent   = `The ${losingTeam} team revealed the assassin!`;
    } else if (state.winner === 'red') {
      icon.innerHTML    = '&#x1F534;';
      title.textContent = 'RED WINS!';
      msg.textContent   = 'The red team found all their agents. Well played!';
    } else {
      icon.innerHTML    = '&#x1F535;';
      title.textContent = 'BLUE WINS!';
      msg.textContent   = 'The blue team found all their agents. Well played!';
    }
  }

  // ── Actions ───────────────────────────────────────────────
  function revealCard(index) {
    if (!state || state.gameOver || state.revealed[index]) return;
    socket.emit('revealCard', { boardNum, index });
  }

  window.endTurn = function () {
    if (!state || state.gameOver) return;
    socket.emit('endTurn', { boardNum });
  };

  window.newGame = function () {
    if (!confirm('Start a new game? This will reset the board for everyone.')) return;
    isSpymaster = false;
    updateSpymasterUI();
    socket.emit('newGame', { boardNum });
  };

  window.toggleSpymaster = function () {
    isSpymaster = !isSpymaster;
    updateSpymasterUI();
    socket.emit('toggleSpymaster', { boardNum, isSpymaster });
    // Server will send back the appropriate gameState (full or public)
  };

  function updateSpymasterUI() {
    const btn    = document.getElementById('spymasterBtn');
    const banner = document.getElementById('spymasterBanner');
    if (isSpymaster) {
      btn.classList.add('active');
      banner.style.display = 'block';
    } else {
      btn.classList.remove('active');
      banner.style.display = 'none';
    }
  }
})();
