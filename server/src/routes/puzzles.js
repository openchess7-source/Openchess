import { Router } from 'express';
import {
  countDailyEligible,
  getDailyPuzzleByIndex,
  getPuzzleById,
  listCategories,
  recordSolve,
  computeStreak,
} from '../db/puzzles.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

function dailyIndexForToday(count) {
  const dateKey = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (const ch of dateKey) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % count;
}

router.get('/streak', requireAuth, asyncHandler(async (req, res) => {
  res.json({ streak: computeStreak(req.userId) });
}));

router.get('/daily', asyncHandler(async (_req, res) => {
  const count = countDailyEligible();
  if (count === 0) return res.status(404).json({ message: 'No puzzles seeded yet — run npm run seed' });
  const puzzle = getDailyPuzzleByIndex(dailyIndexForToday(count));
  res.json(puzzle);
}));

router.get('/categories', asyncHandler(async (_req, res) => {
  const categories = listCategories();
  res.json(categories.map((c) => ({ id: c.category, name: c.category, count: c.count })));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const puzzle = getPuzzleById(req.params.id);
  if (!puzzle) return res.status(404).json({ message: 'Puzzle not found' });
  res.json(puzzle);
}));

router.post('/:id/solve', requireAuth, asyncHandler(async (req, res) => {
  const { correct } = req.body || {};
  const puzzle = getPuzzleById(req.params.id);
  if (!puzzle) return res.status(404).json({ message: 'Puzzle not found' });
  recordSolve(req.userId, puzzle.id, !!correct);
  res.json({ success: true });
}));

export default router;
