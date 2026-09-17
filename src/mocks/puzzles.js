export const PUZZLE_FEN = 'r3k2r/ppp2ppp/2n5/3q4/3P4/2N2N2/PPP2PPP/R2QK2R b KQkq - 0 1';

export const dailyPuzzle = {
  id: 'pz_daily',
  rating: 1567,
  streak: 12,
  fen: PUZZLE_FEN,
  sideToMove: 'black',
  prompt: 'Find the winning tactic',
  hint: 'Look at the pinned knight on c3.',
  solution: ['Qd1+'],
};

export const puzzleCategories = [
  { id: 'forks', name: 'Forks', count: 240 },
  { id: 'pins', name: 'Pins', count: 180 },
  { id: 'skewers', name: 'Skewers', count: 96 },
  { id: 'back-rank', name: 'Back Rank', count: 140 },
  { id: 'discovered', name: 'Discovered Attacks', count: 110 },
  { id: 'endgame', name: 'Endgame Tactics', count: 205 },
];

export function getPuzzleById(id) {
  return { ...dailyPuzzle, id };
}
