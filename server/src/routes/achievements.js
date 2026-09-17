import { Router } from 'express';
import { findUserById } from '../db/users.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { computeAchievements } from '../services/achievements.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.status(401).json({ message: 'Not authenticated' });
  res.json(computeAchievements(req.userId, user));
}));

export default router;
