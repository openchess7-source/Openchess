import { Router } from 'express';
import { listTournaments, getTournamentById, participantCount, serializeTournament, joinTournament, getStandings, computedStatus } from '../db/tournaments.js';
import { hasBracket, serializeBracket, getMaxRound, isRoundComplete, serializeRoundMatches } from '../db/brackets.js';
import { generateBracketAndLaunch, generateNextSwissRound } from '../sockets/index.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const tournaments = listTournaments(50);
  res.json(tournaments.map((t) => serializeTournament(t, req.userId, participantCount(t.id))));
}));

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const t = getTournamentById(req.params.id);
  if (!t) return res.status(404).json({ message: 'Tournament not found' });
  res.json(serializeTournament(t, req.userId, participantCount(t.id)));
}));

router.get('/:id/standings', requireAuth, asyncHandler(async (req, res) => {
  const t = getTournamentById(req.params.id);
  if (!t) return res.status(404).json({ message: 'Tournament not found' });
  const rows = getStandings(t.id);
  res.json(
    rows.map((r, i) => ({
      rank: i + 1,
      name: r.name,
      score: r.score,
      wins: r.wins,
      draws: r.draws,
      losses: r.losses,
      isYou: r.userId === req.userId,
    }))
  );
}));

router.post('/:id/join', requireAuth, asyncHandler(async (req, res) => {
  const t = getTournamentById(req.params.id);
  if (!t) return res.status(404).json({ message: 'Tournament not found' });
  if (computedStatus(t.starts_at) === 'completed') return res.status(400).json({ message: 'This tournament has already ended' });
  // Elimination registration closes the moment the bracket is drawn —
  // joining after that would mean a player with no assigned slot. Swiss
  // closes the same way once round 1 is paired — a latecomer would have
  // no game for any round already played.
  if (t.format_type === 'elimination' && hasBracket(t.id)) {
    return res.status(400).json({ message: 'Registration is closed — this bracket has already started' });
  }
  if (t.format_type === 'swiss' && getMaxRound(t.id) > 0) {
    return res.status(400).json({ message: 'Registration is closed — round 1 has already been paired' });
  }

  joinTournament(t.id, req.userId);
  res.json(serializeTournament(t, req.userId, participantCount(t.id)));
}));

router.get('/:id/bracket', requireAuth, asyncHandler(async (req, res) => {
  const t = getTournamentById(req.params.id);
  if (!t) return res.status(404).json({ message: 'Tournament not found' });
  if (t.format_type !== 'elimination') return res.status(400).json({ message: 'This tournament has no bracket' });

  if (computedStatus(t.starts_at) === 'upcoming') {
    return res.json({ status: 'upcoming', rounds: [], winner: null });
  }

  if (!hasBracket(t.id)) {
    const io = req.app.get('io');
    generateBracketAndLaunch(io, t.id);
    if (!hasBracket(t.id)) {
      return res.json({ status: 'insufficient_players', rounds: [], winner: null });
    }
  }

  const rounds = serializeBracket(t.id);
  const finalMatch = rounds[rounds.length - 1]?.[0];
  const complete = finalMatch && (finalMatch.status === 'completed' || finalMatch.status === 'bye');

  res.json({
    status: complete ? 'completed' : 'in_progress',
    rounds,
    winner: complete ? { id: finalMatch.winnerId, username: finalMatch.winnerUsername } : null,
  });
}));

router.get('/:id/swiss', requireAuth, asyncHandler(async (req, res) => {
  const t = getTournamentById(req.params.id);
  if (!t) return res.status(404).json({ message: 'Tournament not found' });
  if (t.format_type !== 'swiss') return res.status(400).json({ message: 'This tournament has no Swiss pairings' });

  if (computedStatus(t.starts_at) === 'upcoming') {
    return res.json({ status: 'upcoming', currentRound: 0, totalRounds: t.total_rounds, pairings: [], standings: [] });
  }

  if (getMaxRound(t.id) === 0) {
    const io = req.app.get('io');
    generateNextSwissRound(io, t.id);
    if (getMaxRound(t.id) === 0) {
      return res.json({ status: 'insufficient_players', currentRound: 0, totalRounds: t.total_rounds, pairings: [], standings: [] });
    }
  }

  const currentRound = getMaxRound(t.id);
  const complete = currentRound >= (t.total_rounds || 0) && isRoundComplete(t.id, currentRound);
  const standings = getStandings(t.id).map((r, i) => ({
    rank: i + 1,
    name: r.name,
    score: r.score,
    wins: r.wins,
    draws: r.draws,
    losses: r.losses,
    isYou: r.userId === req.userId,
  }));

  res.json({
    status: complete ? 'completed' : 'in_progress',
    currentRound,
    totalRounds: t.total_rounds,
    pairings: serializeRoundMatches(t.id, currentRound),
    standings,
  });
}));

export default router;
