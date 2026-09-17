import 'dotenv/config';
import { Chess } from 'chess.js';
import { connectDB, closeDB } from '../db/connection.js';
import { upsertPuzzle } from '../db/puzzles.js';

const PUZZLES = [
  {
    fen: '7k/6pp/8/8/8/8/8/R5K1 w - - 0 1',
    sideToMove: 'white',
    solution: ['Ra8#'],
    rating: 900,
    category: 'back-rank',
    hint: 'The king has no escape along the back rank.',
  },
  {
    fen: '3r2k1/1p3ppp/8/8/8/8/1P3PPP/3RR1K1 w - - 0 1',
    sideToMove: 'white',
    solution: ['Rxd8#'],
    rating: 1100,
    category: 'back-rank',
    hint: 'Trade rooks to open the back rank.',
  },
  {
    fen: '6rk/6pp/7N/8/8/8/8/6QK w - - 0 1',
    sideToMove: 'white',
    solution: ['Nf7#'],
    rating: 1500,
    category: 'endgame',
    hint: 'The knight delivers the final blow next to a boxed-in king.',
  },
];

function verify(p) {
  const chess = new Chess(p.fen);
  if ((chess.turn() === 'w' ? 'white' : 'black') !== p.sideToMove) return false;
  for (const san of p.solution) {
    if (!chess.move(san)) return false;
  }
  return chess.isCheckmate();
}

connectDB();
for (const p of PUZZLES) {
  if (!verify(p)) {
    console.error(`[seed] REFUSING to seed unverified puzzle: ${p.fen}`);
    continue;
  }
  upsertPuzzle(p);
  console.log(`[seed] upserted puzzle: ${p.category} (rating ${p.rating})`);
}
console.log('[seed] puzzles done');
closeDB();
