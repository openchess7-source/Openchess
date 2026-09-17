import { Router } from 'express';
import { getGameById, findActiveGamesForUser, findCompletedGamesForUser, getMoveCount } from '../db/games.js';
import { findUserById } from '../db/users.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/active', requireAuth, asyncHandler(async (req, res) => {
  const games = findActiveGamesForUser(req.userId);
  res.json(
    games.map((g) => {
      const isWhite = g.white_id === req.userId;
      const opponent = findUserById(isWhite ? g.black_id : g.white_id);
      return {
        id: g.id,
        opponent: opponent.username,
        opponentRating: opponent.ratings[g.mode] ?? opponent.ratings.blitz,
        mode: g.mode,
        timeControl: `${g.initial / 60}+${g.increment}`,
        yourTurn: (g.turn === 'white') === isWhite,
        fen: g.fen,
      };
    })
  );
}));

router.get('/mine', requireAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const games = findCompletedGamesForUser(req.userId, limit);
  res.json(
    games.map((g) => {
      const isWhite = g.white_id === req.userId;
      const opponent = findUserById(isWhite ? g.black_id : g.white_id);
      const result = g.result === 'draw' ? 'draw' : g.result === (isWhite ? 'white' : 'black') ? 'win' : 'loss';
      return {
        id: g.id,
        opponent: opponent.username,
        result,
        mode: g.mode,
        timeControl: `${g.initial / 60}+${g.increment}`,
        moves: getMoveCount(g.id),
        fen: g.fen,
        endedAt: g.updated_at,
      };
    })
  );
}));

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const game = getGameById(req.params.id);
  if (!game) return res.status(404).json({ message: 'Game not found' });
  const white = findUserById(game.white_id);
  const black = findUserById(game.black_id);
  res.json({ ...game, white: { username: white.username, ratings: white.ratings }, black: { username: black.username, ratings: black.ratings } });
}));

export default router;
