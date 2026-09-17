import { Router } from 'express';
import { findFlaggedGames, findReviewedGames, getGameById, getMovesForGame, setReviewStatus } from '../db/games.js';
import { findUserById, setBanned } from '../db/users.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';

const router = Router();
router.use(requireAuth, requireAdmin);

function summarize(game) {
  const white = findUserById(game.white_id);
  const black = findUserById(game.black_id);
  return {
    id: game.id,
    mode: game.mode,
    white: white ? { id: String(white.id), username: white.username } : null,
    black: black ? { id: String(black.id), username: black.username } : null,
    result: game.result,
    reason: game.reason,
    flaggedReason: game.flagged_reason,
    reviewStatus: game.review_status,
    reviewedBy: game.reviewed_by,
    reviewedAt: game.reviewed_at,
    createdAt: game.created_at,
  };
}

// GET /api/admin/flagged-games?status=pending|reviewed (default pending)
router.get('/flagged-games', asyncHandler(async (req, res) => {
  const status = req.query.status === 'reviewed' ? 'reviewed' : 'pending';
  const games = status === 'pending' ? findFlaggedGames() : findReviewedGames();
  res.json(games.map(summarize));
}));

router.get('/flagged-games/:gameId', asyncHandler(async (req, res) => {
  const game = getGameById(req.params.gameId);
  if (!game || !game.flagged_for_review) return res.status(404).json({ message: 'Not a flagged game' });
  res.json({ ...summarize(game), moves: getMovesForGame(game.id) });
}));

// body: { decision: 'cleared' | 'confirmed', banUserId?: string }
// banUserId is optional and independent of the decision on purpose — an
// admin might confirm a flag was justified but only warn, not ban, on a
// first offense, or clear the flag but still ban for an unrelated reason.
router.post('/flagged-games/:gameId/review', asyncHandler(async (req, res) => {
  const game = getGameById(req.params.gameId);
  if (!game || !game.flagged_for_review) return res.status(404).json({ message: 'Not a flagged game' });

  const { decision, banUserId } = req.body || {};
  if (decision !== 'cleared' && decision !== 'confirmed') {
    return res.status(400).json({ message: "decision must be 'cleared' or 'confirmed'" });
  }

  setReviewStatus(game.id, decision, req.userId);

  if (banUserId) {
    const target = Number(banUserId);
    if (target !== game.white_id && target !== game.black_id) {
      return res.status(400).json({ message: 'Can only ban a player from this game' });
    }
    setBanned(target, true);
    logger.warn({ gameId: game.id, adminId: req.userId, bannedUserId: target }, 'admin banned a player from a flagged game');
  }

  logger.info({ gameId: game.id, adminId: req.userId, decision }, 'flagged game reviewed');
  res.json({ ...summarize(getGameById(game.id)) });
}));

export default router;
