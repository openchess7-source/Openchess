export const currentUser = {
  id: 'u_1',
  username: 'JordanMoves',
  title: null,
  avatarInitials: 'JM',
  region: 'US-East',
  bio: 'Blitz enthusiast. Ruy Lopez all day.',
  ratings: { bullet: 1198, blitz: 1284, rapid: 1312, classical: 1402, puzzle: 1567, chess960: 1220 },
  peakRating: 1342,
  games: 482,
  winRate: 0.54,
  online: true,
  isAdmin: false,
};

export const players = [
  { id: 'p_1', username: 'MagnusFan', title: 'GM', rating: 2842, online: true },
  { id: 'p_2', username: 'AnotherPlayer', title: 'IM', rating: 2761, online: false },
  { id: 'p_3', username: 'PlayerThree', title: null, rating: 2718, online: true },
  { id: 'p_4', username: 'EndgameQueen', title: 'WGM', rating: 2655, online: true },
  { id: 'p_5', username: 'RookRider', title: null, rating: 2602, online: false },
  { id: 'p_6', username: 'KnightHunter', title: null, rating: 1301, online: true },
  { id: 'p_7', username: 'KnightStorm', title: 'CM', rating: 1690, online: false },
  { id: 'p_8', username: 'ChessMaster', title: null, rating: 1450, online: true },
  { id: 'p_9', username: 'PawnStar99', title: null, rating: 980, online: true },
];

export function findPlayer(username) {
  if (username === currentUser.username) return currentUser;
  return players.find((p) => p.username === username) || null;
}
