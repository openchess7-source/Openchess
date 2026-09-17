import { Router } from 'express';
import { findUserById, serializeUser } from '../db/users.js';
import { areFriends, hasRequestFrom, createRequest, removeRequest, makeFriends, listFriendIds, listIncomingRequestIds } from '../db/friends.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createNotification } from '../db/notifications.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const friends = listFriendIds(req.userId).map((id) => serializeUser(findUserById(id)));
  res.json(friends);
}));

router.get('/requests', asyncHandler(async (req, res) => {
  const requests = listIncomingRequestIds(req.userId).map((id) => serializeUser(findUserById(id)));
  res.json(requests);
}));

router.post('/request/:userId', asyncHandler(async (req, res) => {
  const targetId = Number(req.params.userId);
  if (targetId === req.userId) return res.status(400).json({ message: "You can't friend yourself" });

  const me = findUserById(req.userId);
  const target = findUserById(targetId);
  if (!target) return res.status(404).json({ message: 'Player not found' });
  if (areFriends(req.userId, targetId)) return res.status(409).json({ message: 'Already friends' });

  if (hasRequestFrom(targetId, req.userId)) {
    // They already requested us — treat this as an accept.
    makeFriends(req.userId, targetId);
    removeRequest(targetId, req.userId);
    createNotification(targetId, 'friend_accept', `${me.username} accepted your friend request`);
    return res.json({ status: 'accepted' });
  }

  createRequest(req.userId, targetId);
  createNotification(targetId, 'friend_request', `${me.username} sent you a friend request`);
  res.json({ status: 'requested' });
}));

router.post('/accept/:userId', asyncHandler(async (req, res) => {
  const requesterId = Number(req.params.userId);
  const me = findUserById(req.userId);
  const requester = findUserById(requesterId);
  if (!requester) return res.status(404).json({ message: 'Player not found' });

  makeFriends(req.userId, requesterId);
  removeRequest(requesterId, req.userId);
  createNotification(requesterId, 'friend_accept', `${me.username} accepted your friend request`);
  res.json({ status: 'accepted' });
}));

router.post('/decline/:userId', asyncHandler(async (req, res) => {
  const requesterId = Number(req.params.userId);
  removeRequest(requesterId, req.userId);
  res.json({ status: 'declined' });
}));

export default router;
