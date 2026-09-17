import { Router } from 'express';
import { topUsersByRating, findUserById, rankOfUser } from '../db/users.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const VALID_MODES = ['bullet', 'blitz', 'rapid', 'classical'];

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const mode = VALID_MODES.includes(req.query.mode) ? req.query.mode : 'blitz';
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const top = topUsersByRating(mode, limit);
  const rows = top.map((u, i) => ({
    rank: i + 1,
    name: u.username,
    title: u.title,
    rating: u.ratings[mode],
    isYou: u.id === req.userId,
  }));

  if (!rows.some((r) => r.isYou)) {
    const me = findUserById(req.userId);
    if (me) {
      const myRank = rankOfUser(mode, me.ratings[mode]);
      rows.push({ rank: myRank, name: me.username, title: me.title, rating: me.ratings[mode], isYou: true });
    }
  }

  res.json(rows);
}));

export default router;
