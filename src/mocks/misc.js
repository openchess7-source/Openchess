export const leaderboard = [
  { rank: 1, name: 'MagnusFan', title: 'GM', rating: 2842 },
  { rank: 2, name: 'AnotherPlayer', title: 'IM', rating: 2761 },
  { rank: 3, name: 'PlayerThree', title: null, rating: 2718 },
  { rank: 4, name: 'EndgameQueen', title: 'WGM', rating: 2655 },
  { rank: 5, name: 'RookRider', title: null, rating: 2602 },
  { rank: 142, name: 'JordanMoves', title: null, rating: 1284, isYou: true },
];

export const achievements = [
  { id: 'a1', icon: '🏆', label: 'First Win', unlocked: true, rarity: 'Common' },
  { id: 'a2', icon: '🔥', label: '10 Day Streak', unlocked: true, rarity: 'Uncommon' },
  { id: 'a3', icon: '♟', label: '100 Games', unlocked: true, rarity: 'Common' },
  { id: 'a4', icon: '⚡', label: 'Bullet Master', unlocked: false, rarity: 'Rare' },
  { id: 'a5', icon: '🧩', label: 'Puzzle Pro', unlocked: true, rarity: 'Uncommon' },
  { id: 'a6', icon: '👑', label: '1500 Rated', unlocked: false, rarity: 'Rare' },
  { id: 'a7', icon: '🎯', label: 'Perfect Game', unlocked: false, rarity: 'Epic' },
  { id: 'a8', icon: '🤝', label: 'Club Member', unlocked: true, rarity: 'Common' },
  { id: 'a9', icon: '📈', label: 'Rating Climb', unlocked: true, rarity: 'Uncommon' },
];

export const notifications = [
  { id: 'n1', type: 'challenge', text: 'KnightStorm challenged you to a Blitz game', time: '10m ago', read: false },
  { id: 'n2', type: 'tournament', text: 'Blitz Arena starts in 2 hours', time: '1h ago', read: false },
  { id: 'n3', type: 'club', text: 'Night Owls Chess Club posted an announcement', time: '3h ago', read: true },
  { id: 'n4', type: 'achievement', text: "You unlocked '10 Day Streak'", time: '1d ago', read: true },
  { id: 'n5', type: 'system', text: 'Openchess maintenance scheduled for Sunday', time: '2d ago', read: true },
];

export const friends = [
  { id: 'f1', name: 'MagnusFan', rating: 2842, online: true },
  { id: 'f2', name: 'PawnStar99', rating: 980, online: true },
  { id: 'f3', name: 'ChessMaster', rating: 1450, online: false },
];

export const friendRequests = [
  { id: 'r1', name: 'RookRider', rating: 2602 },
];

export const bots = [
  { id: 'b1', name: 'Rookie', rating: 400 },
  { id: 'b2', name: 'Beginner', rating: 800 },
  { id: 'b3', name: 'Easy', rating: 1100 },
  { id: 'b4', name: 'Intermediate', rating: 1400 },
  { id: 'b5', name: 'Hard', rating: 1700 },
  { id: 'b6', name: 'Expert', rating: 2000 },
  { id: 'b7', name: 'Master', rating: 2400 },
];

export const lessons = [
  { id: 'l1', topic: 'tactics', title: 'Spotting Forks', progress: 1 },
  { id: 'l2', topic: 'tactics', title: 'Pins and Skewers', progress: 0.6 },
  { id: 'l3', topic: 'endgames', title: 'King and Pawn Endings', progress: 0.3 },
  { id: 'l4', topic: 'openings', title: 'Ruy Lopez Fundamentals', progress: 0 },
  { id: 'l5', topic: 'strategy', title: 'Pawn Structures', progress: 0 },
  { id: 'l6', topic: 'checkmates', title: 'Back Rank Mates', progress: 1 },
];

export function getLesson(id) {
  return lessons.find((l) => l.id === id) || lessons[0];
}

// Preview-only fixture for the admin panel (see docs/README for why real
// mode never fakes data — this exists purely so the page renders in
// DEMO_MODE without a backend, and is obviously fixture data, not a
// stand-in for the review queue itself).
const _adminGames = [
  {
    id: 'demo-g1',
    mode: 'bullet',
    white: { id: 'p_1', username: 'MagnusFan' },
    black: { id: 'p_2', username: 'AnotherPlayer' },
    result: 'white',
    reason: 'checkmate',
    flaggedReason: 'white: avg move time 210ms with stddev 40ms across 24 moves — unusually fast and unusually consistent',
    reviewStatus: 'pending',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    moves: Array.from({ length: 6 }, (_, i) => ({
      ply: i + 1,
      from_sq: 'e2',
      to_sq: 'e4',
      san: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'][i],
      promotion: null,
      think_time_ms: 200 + (i % 3) * 15,
    })),
  },
];

export function adminFlaggedGames(status = 'pending') {
  return _adminGames.filter((g) => (status === 'pending' ? g.reviewStatus === 'pending' : g.reviewStatus !== 'pending'));
}

export function adminFlaggedGameDetail(id) {
  return _adminGames.find((g) => g.id === id) || null;
}

export function adminReviewGame(id, { decision }) {
  const g = _adminGames.find((x) => x.id === id);
  if (g) {
    g.reviewStatus = decision;
    g.reviewedAt = new Date().toISOString();
  }
  return g;
}
