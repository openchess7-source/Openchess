import { Router } from 'express';
import { searchUsersByUsernamePrefix, findUserByUsername, serializeUser } from '../db/users.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const users = searchUsersByUsernamePrefix(q, 20);
  res.json(users.map(serializeUser));
}));

router.get('/:username', requireAuth, asyncHandler(async (req, res) => {
  const user = findUserByUsername(req.params.username);
  if (!user) return res.status(404).json({ message: 'Player not found' });
  res.json(serializeUser(user));
}));

export default router;
