export const RUY_LOPEZ_FEN = 'r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 2 3';

export const recentGames = [
  { id: 'g_1', opponent: 'MagnusFan', result: 'win', delta: 8, mode: 'Blitz', timeControl: '5+0', moves: 34, endedAt: '2h ago', fen: RUY_LOPEZ_FEN },
  { id: 'g_2', opponent: 'KnightStorm', result: 'loss', delta: -12, mode: 'Rapid', timeControl: '10+0', moves: 51, endedAt: '5h ago', fen: RUY_LOPEZ_FEN },
  { id: 'g_3', opponent: 'ChessMaster', result: 'draw', delta: 0, mode: 'Blitz', timeControl: '3+2', moves: 67, endedAt: '1d ago', fen: RUY_LOPEZ_FEN },
  { id: 'g_4', opponent: 'PawnStar99', result: 'win', delta: 6, mode: 'Bullet', timeControl: '1+0', moves: 22, endedAt: '1d ago', fen: RUY_LOPEZ_FEN },
  { id: 'g_5', opponent: 'RookRider', result: 'win', delta: 9, mode: 'Blitz', timeControl: '5+0', moves: 41, endedAt: '2d ago', fen: RUY_LOPEZ_FEN },
  { id: 'g_6', opponent: 'EndgameQueen', result: 'loss', delta: -7, mode: 'Rapid', timeControl: '15+10', moves: 88, endedAt: '3d ago', fen: RUY_LOPEZ_FEN },
];

export const activeGames = [
  {
    id: 'ag_1',
    opponent: 'KnightHunter',
    opponentRating: 1301,
    mode: 'Rapid',
    timeControl: '10+0',
    yourTurn: true,
    timeRemaining: '08:32',
    fen: RUY_LOPEZ_FEN,
  },
];

export function getGameById(id) {
  return (
    recentGames.find((g) => g.id === id) ||
    activeGames.find((g) => g.id === id) || {
      id,
      opponent: 'KnightHunter',
      opponentRating: 1301,
      mode: 'Rapid',
      timeControl: '10+0',
      fen: RUY_LOPEZ_FEN,
      moves: [
        { no: 1, white: 'e4', black: 'e5' },
        { no: 2, white: 'Nf3', black: 'Nc6' },
        { no: 3, white: 'Bb5', black: 'a6' },
      ],
    }
  );
}
