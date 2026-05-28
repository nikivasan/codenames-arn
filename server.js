const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const BOARDS = {
  1: [
    'Chai', 'Spicy pickle', 'Listening', 'Research', 'Silence',
    'Poet', 'Filmmaker', 'Astrology', 'Broncos', 'Trailblazer',
    'Sagar Enjeti', 'Puns', 'Hummingbirds', 'Maple', 'The Ocean',
    'Redwood', 'Red Rocks', 'Travel', 'Rasam', 'Bhajans',
    'Plants', 'Elon Musk', 'Nancy Pelosi', 'Photography', 'Tamarind'
  ],
  2: [
    'London', 'Om Shanti', 'San Jose', 'Air India', 'Skiing',
    'Tennis', 'Santa Hats', 'Laughing fits', 'Corny', 'Retired',
    'Masters', 'H1B', 'Specs', 'Rummy', 'Hijacked',
    'Wimbledon', 'Love', 'Travel', 'Chai', 'Bollywood',
    'Chennai', 'Idris Elba', 'SunTV', 'Subaru', 'Scrabble'
  ]
};

const gameStates = {};
// Per board: Set of socket IDs that have activated spymaster mode
const spymasterSockets = { 1: new Set(), 2: new Set() };

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateAssignments() {
  const firstTeam = Math.random() < 0.5 ? 'red' : 'blue';
  const second = firstTeam === 'red' ? 'blue' : 'red';
  const assignments = [
    ...Array(9).fill(firstTeam),
    ...Array(8).fill(second),
    ...Array(7).fill('neutral'),
    'assassin'
  ];
  return { assignments: shuffle(assignments), firstTeam };
}

function createGameState(boardNum) {
  const { assignments, firstTeam } = generateAssignments();
  return {
    boardNum,
    words: BOARDS[boardNum],
    assignments,
    revealed: Array(25).fill(false),
    currentTeam: firstTeam,
    redTotal: assignments.filter(a => a === 'red').length,
    blueTotal: assignments.filter(a => a === 'blue').length,
    redFound: 0,
    blueFound: 0,
    gameOver: false,
    winner: null,
    winReason: null
  };
}

// State sent to non-spymaster sockets: assignments are hidden for unrevealed cards
function publicState(state) {
  return {
    ...state,
    assignments: state.revealed.map((r, i) => r ? state.assignments[i] : null)
  };
}

function broadcastState(boardNum) {
  const state = gameStates[boardNum];
  const roomName = `board-${boardNum}`;
  const room = io.sockets.adapter.rooms.get(roomName);
  if (!room) return;

  for (const socketId of room) {
    const sock = io.sockets.sockets.get(socketId);
    if (!sock) continue;
    if (spymasterSockets[boardNum].has(socketId)) {
      sock.emit('gameState', state);
    } else {
      sock.emit('gameState', publicState(state));
    }
  }
}

gameStates[1] = createGameState(1);
gameStates[2] = createGameState(2);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  let currentBoard = null;

  socket.on('joinBoard', (boardNum) => {
    if (currentBoard !== null) {
      socket.leave(`board-${currentBoard}`);
      spymasterSockets[currentBoard].delete(socket.id);
    }
    currentBoard = boardNum;
    socket.join(`board-${boardNum}`);
    // Send initial state to the joining socket only
    socket.emit('gameState', publicState(gameStates[boardNum]));
  });

  socket.on('toggleSpymaster', ({ boardNum, isSpymaster }) => {
    const state = gameStates[boardNum];
    if (isSpymaster) {
      spymasterSockets[boardNum].add(socket.id);
      socket.emit('gameState', state);
    } else {
      spymasterSockets[boardNum].delete(socket.id);
      socket.emit('gameState', publicState(state));
    }
  });

  socket.on('revealCard', ({ boardNum, index }) => {
    const state = gameStates[boardNum];
    if (state.gameOver || state.revealed[index]) return;

    state.revealed[index] = true;
    const role = state.assignments[index];

    if (role === 'assassin') {
      state.gameOver = true;
      state.winReason = 'assassin';
      state.winner = state.currentTeam === 'red' ? 'blue' : 'red';
    } else if (role === 'red') {
      state.redFound++;
      if (state.redFound >= state.redTotal) {
        state.gameOver = true;
        state.winReason = 'agents';
        state.winner = 'red';
      }
    } else if (role === 'blue') {
      state.blueFound++;
      if (state.blueFound >= state.blueTotal) {
        state.gameOver = true;
        state.winReason = 'agents';
        state.winner = 'blue';
      }
    }

    // End the turn if the guessed card wasn't the current team's
    if (!state.gameOver && role !== state.currentTeam) {
      state.currentTeam = state.currentTeam === 'red' ? 'blue' : 'red';
    }

    broadcastState(boardNum);
  });

  socket.on('endTurn', ({ boardNum }) => {
    const state = gameStates[boardNum];
    if (state.gameOver) return;
    state.currentTeam = state.currentTeam === 'red' ? 'blue' : 'red';
    broadcastState(boardNum);
  });

  socket.on('newGame', ({ boardNum }) => {
    gameStates[boardNum] = createGameState(boardNum);
    spymasterSockets[boardNum].clear();
    broadcastState(boardNum);
  });

  socket.on('disconnect', () => {
    if (currentBoard !== null) {
      spymasterSockets[currentBoard].delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Codenames ARN Edition running at http://localhost:${PORT}`);
});
