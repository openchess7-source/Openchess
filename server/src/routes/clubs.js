import { Router } from 'express';
import {
  serializeClub, createClub, findClubByName, getClubById, listClubsForUser, listFeaturedClubs,
  joinClub, leaveClub, listMembers,
} from '../db/clubs.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const mine = listClubsForUser(req.userId).map((c) => serializeClub(c, req.userId));
  const featured = listFeaturedClubs(req.userId, 20).map((c) => serializeClub(c, req.userId));
  res.json({ myClubs: mine, featuredClubs: featured });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, description, visibility } = req.body || {};
  if (!name || name.trim().length < 3) return res.status(400).json({ message: 'Club name must be at least 3 characters' });
  if (findClubByName(name.trim())) return res.status(409).json({ message: 'A club with that name already exists' });

  const id = createClub({ name: name.trim(), description, visibility, ownerId: req.userId });
  res.status(201).json(serializeClub(getClubById(id), req.userId));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const club = getClubById(req.params.id);
  if (!club) return res.status(404).json({ message: 'Club not found' });
  res.json(serializeClub(club, req.userId));
}));

router.get('/:id/members', asyncHandler(async (req, res) => {
  const club = getClubById(req.params.id);
  if (!club) return res.status(404).json({ message: 'Club not found' });
  const members = listMembers(club.id);
  res.json(
    members.map((m) => ({
      id: String(m.id),
      name: m.username,
      role: m.id === club.owner_id ? 'Owner' : 'Member',
      rating: m.ratings.blitz,
      online: Date.now() - new Date(m.lastSeenAt).getTime() < 60_000,
    }))
  );
}));

router.post('/:id/join', asyncHandler(async (req, res) => {
  const club = getClubById(req.params.id);
  if (!club) return res.status(404).json({ message: 'Club not found' });
  if (club.visibility === 'private') return res.status(403).json({ message: 'This club is invite-only' });

  joinClub(club.id, req.userId);
  res.json(serializeClub(club, req.userId));
}));

router.post('/:id/leave', asyncHandler(async (req, res) => {
  const club = getClubById(req.params.id);
  if (!club) return res.status(404).json({ message: 'Club not found' });
  if (club.owner_id === req.userId) return res.status(400).json({ message: 'Transfer ownership before leaving your own club' });

  leaveClub(club.id, req.userId);
  res.json(serializeClub(club, req.userId));
}));

export default router;
