import cookie from 'cookie';
import { Chess } from 'chess.js';
import { createGame, getGameById, appendMove, updateGameState, completeGame, getMoveCount, updateClocks, getMoveThinkTimes, flagGameForReview, findAllActiveGames } from '../db/games.js';
import { findUserById, updateUserRatingAndStats } from '../db/users.js';
import { findLiveTournamentForPlayers, recordTournamentResult, applyByePoint, getTournamentById, getRegisteredUserIds, getStandings } from '../db/tournaments.js';
import {
  hasBracket,
  insertMatch,
  getMatch,
  getMatchByGameId,
  setMatchGame,
  setMatchWinner,
  setMatchResult,
  setMatchPlayer,
  getMaxRound,
  isRoundComplete,
  getPlayedPairKeys,
  getByeRecipients,
} from '../db/brackets.js';
import { buildSeeding, nextSlot } from '../services/bracket.js';
import { pairRound } from '../services/swiss.js';
import { computeRehydratedClockState } from '../services/rehydration.js';
import { createNotification } from '../db/notifications.js';
import { evaluateMoveTiming } from '../services/anticheat.js';
import { COOKIE_NAME, verifyToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

const DISCONNECT_GRACE_MS = 30_000;

const queues = new Map(); // mode:initial:increment -> [{ socket, userId }]
const activeGames = new Map(); // gameId -> game state (see createActiveGameEntry)
const socketsByUser = new Map(); // userId -> Socket

function queueKey({ mode, timeControl }) {
  return `${mode}:${timeControl.initial}:${timeControl.increment}`;
}

function roomFor(gameId) {
  return `game:${gameId}`;
}

function removeFromAllQueues(socket) {
  for (const [key, waiting] of queues.entries()) {
    queues.set(key, waiting.filter((entry) => entry.socket.id !== socket.id));
    if (queues.get(key).length === 0) queues.delete(key);
  }
}

function findActiveGameEntryForUser(userId) {
  for (const [gameId, entry] of activeGames.entries()) {
    if (entry.whiteUserId === userId || entry.blackUserId === userId) return [gameId, entry];
  }
  return [null, null];
}

// ---------------- Server-authoritative clock ----------------
// The client's on-screen clock is a preview; this is the real one. Every
// move recalculates remaining time from wall-clock elapsed time (not
// trusted client input), and a server-side timer — not a client
// report — is what actually ends a game on timeout. A player cannot gain
// time by manipulating their local clock display.

function createActiveGameEntry({ whiteUserId, blackUserId, initialMs, increment }) {
  return {
    whiteUserId,
    blackUserId,
    chess: new Chess(),
    remaining: { white: initialMs, black: initialMs },
    incrementMs: increment * 1000,
    turnStartedAt: Date.now(),
    timeoutTimer: null,
    disconnectTimers: new Map(),
  };
}

function armTimeoutTimer(io, gameId, entry) {
  if (entry.timeoutTimer) clearTimeout(entry.timeoutTimer);
  const turnColor = entry.chess.turn() === 'w' ? 'white' : 'black';
  const msRemaining = entry.remaining[turnColor];
  entry.timeoutTimer = setTimeout(() => {
    endGame(io, gameId, { result: turnColor === 'white' ? 'black' : 'white', reason: 'timeout' });
  }, Math.max(0, msRemaining));
}

function clearAllTimers(entry) {
  if (entry.timeoutTimer) clearTimeout(entry.timeoutTimer);
  entry.disconnectTimers.forEach((t) => clearTimeout(t));
}

// ---------------- Crash/restart recovery ----------------
// activeGames only lives in process memory — a restart or crash wipes it.
// Everything needed to rebuild it is already durable, though: fen,
// remaining clock ms, and increment are written to the games table after
// every single move (see updateGameState/updateClocks above), not just
// at game end. So "persistent game state" here means REBUILDING the
// in-memory cache from that durable row on boot, not inventing a new
// store — this deployment is one process against one SQLite file (see
// README's rationale), so that's the actual failure mode to cover, not
// multi-instance state sharing this architecture doesn't attempt anyway.
//
// Deliberate UX choice: a restart PAUSES both clocks rather than
// bleeding real wall-clock time across the outage. turnStartedAt resets
// to "now" and the stored remaining_ms is used as-is — nobody should
// lose on time because of an operational failure that wasn't their
// fault. (Compare this to armTimeoutTimer, which is otherwise the only
// other place remaining time and a fresh turnStartedAt are paired up.)
function rehydrateActiveGameEntry(game) {
  const clockState = computeRehydratedClockState(game);
  return {
    whiteUserId: game.white_id,
    blackUserId: game.black_id,
    chess: new Chess(game.fen),
    remaining: clockState.remaining,
    incrementMs: clockState.incrementMs,
    turnStartedAt: clockState.turnStartedAt,
    timeoutTimer: null,
    disconnectTimers: new Map(),
  };
}

export function rehydrateActiveGames(io) {
  const games = findAllActiveGames();
  let recovered = 0;
  for (const game of games) {
    try {
      const entry = rehydrateActiveGameEntry(game);
      activeGames.set(game.id, entry);
      armTimeoutTimer(io, game.id, entry);
      // Keep the DB's turn_started_at consistent with the paused clock
      // we just armed, so a second crash before the next move rehydrates
      // from an accurate timestamp rather than the pre-crash one.
      updateClocks(game.id, {
        whiteRemainingMs: entry.remaining.white,
        blackRemainingMs: entry.remaining.black,
        turnStartedAt: new Date(entry.turnStartedAt).toISOString(),
      });
      recovered += 1;
    } catch (err) {
      // One corrupt/unparseable row (bad FEN, etc.) must not take down
      // the whole boot sequence. It stays 'active' in the DB — visible
      // to a human via the admin panel or a direct query — rather than
      // silently vanishing or crashing startup.
      logger.error({ gameId: game.id, err: err.message }, 'failed to rehydrate an active game on boot — skipping it');
    }
  }
  if (games.length > 0) {
    logger.info({ found: games.length, recovered }, 'rehydrated active games from database after restart');
  }
}

function updateRatingsAfterGame(game) {
  const K = 16;
  const white = findUserById(game.white_id);
  const black = findUserById(game.black_id);
  if (!white || !black) return;

  const scoreWhite = game.result === 'white' ? 1 : game.result === 'draw' ? 0.5 : 0;
  const scoreBlack = 1 - scoreWhite;
  const mode = game.mode;
  const rw = white.ratings[mode] ?? 800;
  const rb = black.ratings[mode] ?? 800;
  const expectedWhite = 1 / (1 + 10 ** ((rb - rw) / 400));
  const expectedBlack = 1 - expectedWhite;

  updateUserRatingAndStats(white.id, {
    mode,
    newRating: Math.round(rw + K * (scoreWhite - expectedWhite)),
    outcome: game.result === 'white' ? 'win' : game.result === 'draw' ? 'draw' : 'loss',
  });
  updateUserRatingAndStats(black.id, {
    mode,
    newRating: Math.round(rb + K * (scoreBlack - expectedBlack)),
    outcome: game.result === 'black' ? 'win' : game.result === 'draw' ? 'draw' : 'loss',
  });
}

function runAntiCheatCheck(gameId, game) {
  const thinkTimes = getMoveThinkTimes(gameId);
  // ply is 1-indexed and alternates white/black starting with white.
  const whiteTimes = thinkTimes.filter((_, i) => i % 2 === 0);
  const blackTimes = thinkTimes.filter((_, i) => i % 2 === 1);

  const whiteCheck = evaluateMoveTiming(whiteTimes);
  const blackCheck = evaluateMoveTiming(blackTimes);

  if (whiteCheck.flagged || blackCheck.flagged) {
    const reasons = [];
    if (whiteCheck.flagged) reasons.push(`white: ${whiteCheck.reason}`);
    if (blackCheck.flagged) reasons.push(`black: ${blackCheck.reason}`);
    flagGameForReview(gameId, reasons.join(' | '));
    logger.warn({ gameId, reasons }, 'game flagged for review by anti-cheat timing heuristic');
  }
}

function endGame(io, gameId, { result, reason }) {
  const entry = activeGames.get(gameId);
  const game = getGameById(gameId);
  if (!game || game.status === 'completed') return;

  completeGame(gameId, { result, reason });
  updateRatingsAfterGame({ ...game, result, reason });

  if (game.tournament_id) {
    const tournament = getTournamentById(game.tournament_id);
    if (tournament?.format_type === 'elimination') {
      resolveEliminationMatch(io, game, result);
    } else {
      recordTournamentResult(game.tournament_id, game.white_id, game.black_id, result);
      if (tournament?.format_type === 'swiss') {
        resolveSwissMatch(io, tournament, game, result);
      }
    }
  }

  // Only worth analyzing decisive/drawn games that actually had moves —
  // a 0-move abandonment has nothing to evaluate.
  if (reason !== 'abandonment') runAntiCheatCheck(gameId, game);

  io.to(roomFor(gameId)).emit('game_over', { gameId, result, reason });
  logger.info({ gameId, result, reason, tournamentId: game.tournament_id }, 'game ended');

  if (entry) {
    clearAllTimers(entry);
    activeGames.delete(gameId);
  }
}

// ---------------- Shared live-game launcher ----------------
// Used both by matchmaking (join_queue, below) and by elimination-bracket
// pairings (launchMatch, further down) — anywhere two specific users need
// a real, clock-ticking game created and both of them joined to its room.
function startLiveGame(io, { whiteUserId, blackUserId, mode, initial, increment, tournamentId = null }) {
  const initialMs = initial * 1000;
  const startFen = new Chess().fen();
  const gid = createGame({
    whiteId: whiteUserId,
    blackId: blackUserId,
    mode,
    initial,
    increment,
    fen: startFen,
    tournamentId,
  });

  const gameEntry = createActiveGameEntry({ whiteUserId, blackUserId, initialMs, increment });
  activeGames.set(gid, gameEntry);
  armTimeoutTimer(io, gid, gameEntry);

  for (const uid of [whiteUserId, blackUserId]) {
    const sock = socketsByUser.get(uid);
    if (sock) {
      sock.join(roomFor(gid));
      sock.emit('match_found', { gameId: gid });
    }
  }

  return gid;
}

// ---------------- Elimination bracket orchestration ----------------
// Rounds beyond 1 are pre-created empty (both player slots null) so a
// match's (round, slot) address is stable from the start — advancing a
// winner is then just "fill slot floor(slot/2) of round+1", no need to
// rebuild the tree as the bracket progresses.
function launchMatch(io, tournament, match, player1Id, player2Id) {
  const whiteFirst = Math.random() < 0.5;
  const gid = startLiveGame(io, {
    whiteUserId: whiteFirst ? player1Id : player2Id,
    blackUserId: whiteFirst ? player2Id : player1Id,
    mode: tournament.mode,
    initial: tournament.initial,
    increment: tournament.increment,
    tournamentId: tournament.id,
  });
  setMatchGame(match.id, gid);
  for (const uid of [player1Id, player2Id]) {
    createNotification(uid, 'tournament', `Your round ${match.round} match in "${tournament.name}" is ready.`);
  }
  logger.info({ tournamentId: tournament.id, matchId: match.id, gameId: gid }, 'elimination match launched');
}

function propagateWinner(io, tournament, round, slot, winnerId) {
  const finalRound = getMaxRound(tournament.id);
  if (round === finalRound) {
    createNotification(winnerId, 'tournament', `You won "${tournament.name}"! 🏆`);
    logger.info({ tournamentId: tournament.id, winnerId }, 'elimination tournament won');
    return;
  }
  const dest = nextSlot(round, slot);
  const nextMatch = getMatch(tournament.id, dest.round, dest.slot);
  if (!nextMatch) return; // defensive — shouldn't happen, bracket is fully pre-created
  setMatchPlayer(nextMatch.id, dest.position, winnerId);

  const updated = getMatch(tournament.id, dest.round, dest.slot);
  if (updated.player1_id && updated.player2_id) {
    launchMatch(io, tournament, updated, updated.player1_id, updated.player2_id);
  }
}

// Generates the bracket the first time anyone views it after starts_at —
// this deployment has no background job scheduler, so lazily generating
// on first access (same pattern computedStatus already uses for arena
// tournaments) is the honest, simple option rather than a fake cron.
export function generateBracketAndLaunch(io, tournamentId) {
  if (hasBracket(tournamentId)) return;
  const tournament = getTournamentById(tournamentId);
  if (!tournament || tournament.format_type !== 'elimination') return;

  const participantIds = getRegisteredUserIds(tournamentId);
  if (participantIds.length < 2) return; // not enough players yet — try again next view

  const { size, rounds, slots } = buildSeeding(participantIds);

  // Pre-create every later round's empty placeholder matches first, so
  // round-1 byes can propagate into them immediately below.
  for (let r = 2; r <= rounds; r++) {
    const matchesInRound = size / 2 ** r;
    for (let s = 0; s < matchesInRound; s++) insertMatch(tournamentId, r, s, null, null, 'pending');
  }

  for (let i = 0; i < size / 2; i++) {
    const p1 = slots[2 * i];
    const p2 = slots[2 * i + 1];
    const isBye = p1 === null || p2 === null;
    const matchId = insertMatch(tournamentId, 1, i, p1, p2, isBye ? 'bye' : 'pending');

    if (isBye) {
      const winner = p1 ?? p2;
      setMatchWinner(matchId, winner, 'bye');
      if (rounds > 1) propagateWinner(io, tournament, 1, i, winner);
    } else {
      launchMatch(io, tournament, { id: matchId, round: 1 }, p1, p2);
    }
  }

  logger.info({ tournamentId, players: participantIds.length, size, rounds }, 'bracket generated');
}

// Called from endGame() for any game that belongs to an elimination
// match. A draw doesn't eliminate anyone in a knockout format, so instead
// of flipping a coin, the same two players immediately replay with
// colors swapped until the match produces a decisive result.
function resolveEliminationMatch(io, game, result) {
  const match = getMatchByGameId(game.id);
  if (!match) return;
  const tournament = getTournamentById(match.tournament_id);
  if (!tournament) return;

  if (result === 'draw') {
    launchMatch(io, tournament, match, game.white_id, game.black_id);
    return;
  }

  const winnerId = result === 'white' ? game.white_id : game.black_id;
  setMatchWinner(match.id, winnerId);
  propagateWinner(io, tournament, match.round, match.slot, winnerId);
}

// ---------------- Swiss orchestration ----------------
// Unlike elimination (a fixed tree, fully pre-created), Swiss pairs one
// round at a time — round N+1 only exists once round N is fully decided,
// because pairing depends on standings that aren't final until then.
function launchSwissPairing(io, tournament, matchId, player1Id, player2Id) {
  const whiteFirst = Math.random() < 0.5;
  const gid = startLiveGame(io, {
    whiteUserId: whiteFirst ? player1Id : player2Id,
    blackUserId: whiteFirst ? player2Id : player1Id,
    mode: tournament.mode,
    initial: tournament.initial,
    increment: tournament.increment,
    tournamentId: tournament.id,
  });
  setMatchGame(matchId, gid);
  for (const uid of [player1Id, player2Id]) {
    createNotification(uid, 'tournament', `Your next round pairing in "${tournament.name}" is ready.`);
  }
}

// Called lazily (same reasoning as generateBracketAndLaunch — no cron
// here) on first view after starts_at for round 1, and again from
// resolveSwissMatch below whenever a round's last game finishes.
export function generateNextSwissRound(io, tournamentId) {
  const tournament = getTournamentById(tournamentId);
  if (!tournament || tournament.format_type !== 'swiss') return;

  const currentRound = getMaxRound(tournamentId);
  if (currentRound > 0 && !isRoundComplete(tournamentId, currentRound)) return; // still in progress
  if (currentRound >= (tournament.total_rounds || 0)) return; // all rounds played

  const participantIds = getRegisteredUserIds(tournamentId);
  if (participantIds.length < 2) return;

  const scoreByUser = new Map(getStandings(tournamentId).map((s) => [s.userId, s.score]));
  const players = participantIds.map((uid) => {
    const user = findUserById(uid);
    return { userId: uid, score: scoreByUser.get(uid) ?? 0, rating: user?.ratings?.[tournament.mode] ?? 800 };
  });

  const { pairs, byeUserId } = pairRound(players, getPlayedPairKeys(tournamentId), getByeRecipients(tournamentId));
  const round = currentRound + 1;
  let slot = 0;

  if (byeUserId !== null) {
    insertMatch(tournamentId, round, slot, byeUserId, null, 'bye');
    slot += 1;
    applyByePoint(tournamentId, byeUserId);
    createNotification(byeUserId, 'tournament', `You have a bye this round in "${tournament.name}" — a free point.`);
  }

  for (const { a, b } of pairs) {
    const matchId = insertMatch(tournamentId, round, slot, a, b, 'pending');
    slot += 1;
    launchSwissPairing(io, tournament, matchId, a, b);
  }

  logger.info({ tournamentId, round, pairings: pairs.length, bye: byeUserId }, 'swiss round paired');
}

function resolveSwissMatch(io, tournament, game, result) {
  const match = getMatchByGameId(game.id);
  if (!match) return;

  const matchResult =
    result === 'draw' ? 'draw' : game.white_id === match.player1_id ? (result === 'white' ? 'player1' : 'player2') : result === 'white' ? 'player2' : 'player1';
  const winnerId = result === 'draw' ? null : result === 'white' ? game.white_id : game.black_id;
  setMatchResult(match.id, matchResult, winnerId);

  if (isRoundComplete(tournament.id, match.round)) {
    generateNextSwissRound(io, tournament.id);
  }
}

function authenticateSocket(socket) {
  const raw = socket.handshake.headers.cookie;
  if (!raw) return null;
  const parsed = cookie.parse(raw);
  const token = parsed[COOKIE_NAME];
  if (!token) return null;
  try {
    return Number(verifyToken(token).sub);
  } catch {
    return null;
  }
}

export function attachSocketServer(io) {
  io.use((socket, next) => {
    const userId = authenticateSocket(socket);
    if (!userId) return next(new Error('unauthorized'));
    socket.data.userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    const { userId } = socket.data;
    socketsByUser.set(userId, socket);

    const [gameId, entry] = findActiveGameEntryForUser(userId);
    if (gameId) {
      socket.join(roomFor(gameId));
      const timer = entry.disconnectTimers.get(userId);
      if (timer) {
        clearTimeout(timer);
        entry.disconnectTimers.delete(userId);
        socket.to(roomFor(gameId)).emit('opponent_reconnected', { gameId });
      }
    }

    socket.on('join_queue', ({ mode, timeControl }) => {
      if (!mode || !timeControl?.initial) return;
      const key = queueKey({ mode, timeControl });
      const waiting = queues.get(key) || [];
      const opponentEntry = waiting.find((w) => w.userId !== userId);

      if (opponentEntry) {
        queues.set(key, waiting.filter((w) => w !== opponentEntry));

        const whiteFirst = Math.random() < 0.5;
        const whiteUserId = whiteFirst ? userId : opponentEntry.userId;
        const blackUserId = whiteFirst ? opponentEntry.userId : userId;

        const tournament = findLiveTournamentForPlayers(mode, timeControl.initial, timeControl.increment, whiteUserId, blackUserId);
        const gid = startLiveGame(io, {
          whiteUserId,
          blackUserId,
          mode,
          initial: timeControl.initial,
          increment: timeControl.increment,
          tournamentId: tournament ? tournament.id : null,
        });
        if (tournament) logger.info({ gameId: gid, tournamentId: tournament.id }, 'game linked to live tournament');
        logger.info({ gameId: gid, whiteUserId, blackUserId, mode }, 'match found');
      } else {
        queues.set(key, [...waiting, { socket, userId }]);
      }
    });

    socket.on('leave_queue', () => removeFromAllQueues(socket));

    socket.on('make_move', ({ gameId: gid, from, to, promotion }) => {
      const active = activeGames.get(gid);
      if (!active) return socket.emit('invalid_move', { gameId: gid, reason: 'game-not-active' });

      const isWhite = active.whiteUserId === userId;
      const isBlack = active.blackUserId === userId;
      if (!isWhite && !isBlack) return socket.emit('invalid_move', { gameId: gid, reason: 'not-a-participant' });

      const moverColor = active.chess.turn() === 'w' ? 'white' : 'black';
      if ((moverColor === 'white' && !isWhite) || (moverColor === 'black' && !isBlack)) {
        return socket.emit('invalid_move', { gameId: gid, reason: 'not-your-turn' });
      }

      // Server-authoritative clock deduction — computed from real elapsed
      // wall-clock time since the last move, never from anything the
      // client reports.
      const now = Date.now();
      const elapsed = now - active.turnStartedAt;
      active.remaining[moverColor] = Math.max(0, active.remaining[moverColor] - elapsed);
      if (active.remaining[moverColor] <= 0) {
        // Timer should have already fired, but guard against the race.
        return endGame(io, gid, { result: moverColor === 'white' ? 'black' : 'white', reason: 'timeout' });
      }

      let result;
      try {
        result = active.chess.move({ from, to, promotion: promotion || undefined });
      } catch {
        result = null;
      }
      if (!result) return socket.emit('invalid_move', { gameId: gid, reason: 'illegal-move' });

      active.remaining[moverColor] += active.incrementMs;
      active.turnStartedAt = now;

      const fen = active.chess.fen();
      const pgn = active.chess.pgn();
      const turn = active.chess.turn() === 'w' ? 'white' : 'black';

      updateGameState(gid, { fen, pgn, turn });
      appendMove(gid, getMoveCount(gid) + 1, result, elapsed);
      updateClocks(gid, {
        whiteRemainingMs: active.remaining.white,
        blackRemainingMs: active.remaining.black,
        turnStartedAt: new Date(now).toISOString(),
      });

      io.to(roomFor(gid)).emit('move_made', {
        gameId: gid,
        move: { from: result.from, to: result.to, promotion: result.promotion || null, san: result.san },
        fen,
        pgn,
        turn,
        whiteRemainingMs: Math.round(active.remaining.white),
        blackRemainingMs: Math.round(active.remaining.black),
      });

      if (active.chess.isCheckmate()) {
        return endGame(io, gid, { result: turn === 'white' ? 'black' : 'white', reason: 'checkmate' });
      }
      if (active.chess.isStalemate()) return endGame(io, gid, { result: 'draw', reason: 'stalemate' });
      if (active.chess.isInsufficientMaterial()) return endGame(io, gid, { result: 'draw', reason: 'insufficient-material' });
      if (active.chess.isThreefoldRepetition()) return endGame(io, gid, { result: 'draw', reason: 'threefold-repetition' });
      if (active.chess.isDraw()) return endGame(io, gid, { result: 'draw', reason: 'fifty-move-rule' });

      // Game continues — rearm the timeout timer for whoever's turn it is now.
      armTimeoutTimer(io, gid, active);
    });

    socket.on('resign', ({ gameId: gid }) => {
      const active = activeGames.get(gid);
      if (!active) return;
      const isWhite = active.whiteUserId === userId;
      endGame(io, gid, { result: isWhite ? 'black' : 'white', reason: 'resignation' });
    });

    socket.on('offer_draw', ({ gameId: gid }) => {
      socket.to(roomFor(gid)).emit('offer_draw', { gameId: gid });
    });

    socket.on('draw_response', ({ gameId: gid, accept }) => {
      if (accept) {
        endGame(io, gid, { result: 'draw', reason: 'draw-agreement' });
      } else {
        socket.to(roomFor(gid)).emit('draw_response', { gameId: gid, accept: false });
      }
    });

    socket.on('disconnect', () => {
      removeFromAllQueues(socket);
      if (socketsByUser.get(userId) === socket) socketsByUser.delete(userId);

      const [gid, active] = findActiveGameEntryForUser(userId);
      if (!gid) return;

      socket.to(roomFor(gid)).emit('opponent_disconnected', { gameId: gid });

      const timer = setTimeout(() => {
        const isWhite = active.whiteUserId === userId;
        endGame(io, gid, { result: isWhite ? 'black' : 'white', reason: 'abandonment' });
      }, DISCONNECT_GRACE_MS);
      active.disconnectTimers.set(userId, timer);
    });
  });
}
