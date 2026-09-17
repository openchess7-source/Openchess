import { Router } from 'express';
import { listNotifications, markRead, markAllRead } from '../db/notifications.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  res.json(listNotifications(req.userId));
}));

router.post('/:id/read', asyncHandler(async (req, res) => {
  const n = markRead(req.params.id, req.userId);
  if (!n) return res.status(404).json({ message: 'Notification not found' });
  res.json({ id: String(n.id), type: n.type, text: n.text, read: !!n.read, time: n.created_at });
}));

router.post('/read-all', asyncHandler(async (req, res) => {
  markAllRead(req.userId);
  res.json({ success: true });
}));

export default router;
