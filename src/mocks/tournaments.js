export const tournaments = [
  {
    id: 't_1',
    name: 'Blitz Arena',
    format: 'Arena',
    formatType: 'arena',
    timeControl: '5+0',
    players: 1248,
    status: 'upcoming',
    startsInSeconds: 2 * 3600 + 13 * 60 + 42,
    prize: 'Trophy + Title',
  },
  {
    id: 't_2',
    name: 'Weekend Rapid Swiss',
    format: 'Swiss · 7 rounds',
    formatType: 'swiss',
    totalRounds: 7,
    timeControl: '15+10',
    players: 512,
    status: 'live',
    startsInSeconds: 0,
    prize: 'Rating boost',
  },
  {
    id: 't_3',
    name: 'Bullet Bracket',
    format: 'Single elimination',
    formatType: 'elimination',
    timeControl: '1+0',
    players: 64,
    status: 'completed',
    startsInSeconds: null,
    prize: 'Bragging rights',
  },
];

export function getTournament(id) {
  return tournaments.find((t) => t.id === id) || tournaments[0];
}

export const standings = [
  { rank: 1, name: 'GM PlayerName', score: 6.5, wins: 6, draws: 1, losses: 0 },
  { rank: 2, name: 'IM AnotherPlayer', score: 6, wins: 6, draws: 0, losses: 1 },
  { rank: 3, name: 'PlayerThree', score: 5.5, wins: 5, draws: 1, losses: 1 },
  { rank: 4, name: 'EndgameQueen', score: 5, wins: 5, draws: 0, losses: 2 },
  { rank: 42, name: 'JordanMoves', score: 3.5, wins: 3, draws: 1, losses: 3, isYou: true },
];

// Shape matches the real GET /api/tournaments/:id/bracket response
// (server/src/routes/tournaments.js), so TournamentBracketPage doesn't
// need a separate demo-mode code path.
function player(username, id) {
  return { id, username };
}

export function buildBracket() {
  const rounds = [
    [
      { slot: 0, player1: player('MagnusFan', 1), player2: player('PawnStar99', 2), status: 'completed', winnerId: 1, winnerUsername: 'MagnusFan', gameId: 'demo' },
      { slot: 1, player1: player('KnightStorm', 3), player2: player('RookRider', 4), status: 'completed', winnerId: 3, winnerUsername: 'KnightStorm', gameId: 'demo' },
      { slot: 2, player1: player('ChessMaster', 5), player2: player('EndgameQueen', 6), status: 'completed', winnerId: 5, winnerUsername: 'ChessMaster', gameId: 'demo' },
      { slot: 3, player1: player('PlayerThree', 7), player2: null, status: 'bye', winnerId: 7, winnerUsername: 'PlayerThree' },
    ],
    [
      { slot: 0, player1: player('MagnusFan', 1), player2: player('KnightStorm', 3), status: 'active', winnerId: null, gameId: 'demo' },
      { slot: 1, player1: player('ChessMaster', 5), player2: player('PlayerThree', 7), status: 'pending', winnerId: null },
    ],
    [{ slot: 0, player1: null, player2: null, status: 'pending', winnerId: null }],
  ];
  return { status: 'in_progress', rounds, winner: null };
}

// Shape matches the real GET /api/tournaments/:id/swiss response.
export function buildSwissRound() {
  return {
    status: 'in_progress',
    currentRound: 4,
    totalRounds: 7,
    pairings: [
      { id: 1, slot: 0, player1: player('GM PlayerName', 1), player2: player('JordanMoves', 99), status: 'active', result: null, gameId: 'demo' },
      { id: 2, slot: 1, player1: player('IM AnotherPlayer', 2), player2: player('PlayerThree', 7), status: 'completed', result: 'player1', winnerId: 2, gameId: 'demo' },
      { id: 3, slot: 2, player1: player('EndgameQueen', 6), player2: null, status: 'bye', result: null, gameId: null },
    ],
    standings,
  };
}
