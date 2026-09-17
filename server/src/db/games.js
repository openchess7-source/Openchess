import crypto from 'node:crypto';
import { getDB } from './connection.js';

export function createGame({ whiteId, blackId, mode, initial, increment, fen, tournamentId = null }) {
  const db = getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const initialMs = initial * 1000;
  db.prepare(
    `INSERT INTO games (id, white_id, black_id, mode, tournament_id, initial, increment, fen, turn, white_remaining_ms, black_remaining_ms, turn_started_at, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'white', ?, ?, ?, 'active', ?, ?)`
  ).run(id, whiteId, blackId, mode, tournamentId, initial, increment, fen, initialMs, initialMs, now, now, now);
  return id;
}

export function updateClocks(gameId, { whiteRemainingMs, blackRemainingMs, turnStartedAt }) {
  getDB()
    .prepare('UPDATE games SET white_remaining_ms = ?, black_remaining_ms = ?, turn_started_at = ? WHERE id = ?')
    .run(Math.max(0, Math.round(whiteRemainingMs)), Math.max(0, Math.round(blackRemainingMs)), turnStartedAt, gameId);
}

export function getGameById(id) {
  return getDB().prepare('SELECT * FROM games WHERE id = ?').get(id) || null;
}

// think_time_ms is the real elapsed wall-clock time the server measured
// for this move — the same number the clock deduction is based on. This
// is what the anti-cheat heuristic in services/anticheat.js analyzes.
export function appendMove(gameId, ply, move, thinkTimeMs) {
  getDB()
    .prepare('INSERT INTO game_moves (game_id, ply, from_sq, to_sq, san, promotion, think_time_ms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(gameId, ply, move.from, move.to, move.san, move.promotion || null, Math.round(thinkTimeMs), new Date().toISOString());
}

export function getMoveThinkTimes(gameId) {
  return getDB()
    .prepare('SELECT think_time_ms FROM game_moves WHERE game_id = ? ORDER BY ply')
    .all(gameId)
    .map((r) => r.think_time_ms);
}

export function updateGameState(gameId, { fen, pgn, turn }) {
  getDB()
    .prepare('UPDATE games SET fen = ?, pgn = ?, turn = ?, updated_at = ? WHERE id = ?')
    .run(fen, pgn, turn, new Date().toISOString(), gameId);
}

export function completeGame(gameId, { result, reason }) {
  getDB()
    .prepare("UPDATE games SET status = 'completed', result = ?, reason = ?, updated_at = ? WHERE id = ?")
    .run(result, reason, new Date().toISOString(), gameId);
}

export function flagGameForReview(gameId, reason) {
  getDB().prepare('UPDATE games SET flagged_for_review = 1, flagged_reason = ? WHERE id = ?').run(reason, gameId);
}

export function getMoveCount(gameId) {
  return getDB().prepare('SELECT COUNT(*) AS c FROM game_moves WHERE game_id = ?').get(gameId).c;
}

// Used once, at boot, to rebuild the in-memory clock/board state that a
// restart wipes — see rehydrateActiveGames in sockets/index.js. Every
// field it needs (fen, remaining ms, increment, white/black ids) is
// already kept current on every move via updateGameState/updateClocks,
// so this is a read, not a new persistence mechanism.
export function findAllActiveGames() {
  return getDB().prepare("SELECT * FROM games WHERE status = 'active'").all();
}

export function findActiveGamesForUser(userId) {
  return getDB()
    .prepare("SELECT * FROM games WHERE status = 'active' AND (white_id = ? OR black_id = ?) ORDER BY updated_at DESC")
    .all(userId, userId);
}

export function findCompletedGamesForUser(userId, limit = 20) {
  return getDB()
    .prepare(
      "SELECT * FROM games WHERE status = 'completed' AND (white_id = ? OR black_id = ?) ORDER BY created_at DESC LIMIT ?"
    )
    .all(userId, userId, limit);
}

export function countUserWins(userId) {
  return getDB()
    .prepare(
      `SELECT COUNT(*) AS c FROM games WHERE
       (white_id = ? AND result = 'white') OR (black_id = ? AND result = 'black')`
    )
    .get(userId, userId).c;
}

export function findFlaggedGames(limit = 50) {
  return getDB()
    .prepare("SELECT * FROM games WHERE flagged_for_review = 1 AND review_status = 'pending' ORDER BY created_at DESC LIMIT ?")
    .all(limit);
}

export function findReviewedGames(limit = 50) {
  return getDB()
    .prepare("SELECT * FROM games WHERE flagged_for_review = 1 AND review_status != 'pending' ORDER BY reviewed_at DESC LIMIT ?")
    .all(limit);
}

export function getMovesForGame(gameId) {
  return getDB()
    .prepare('SELECT ply, from_sq, to_sq, san, promotion, think_time_ms FROM game_moves WHERE game_id = ? ORDER BY ply')
    .all(gameId);
}

// review_status: 'cleared' (admin looked, found nothing) or 'confirmed'
// (admin agrees the flag was right — pair with users.setBanned separately,
// this function only records the review decision on the game itself).
export function setReviewStatus(gameId, status, adminUserId) {
  getDB()
    .prepare('UPDATE games SET review_status = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?')
    .run(status, adminUserId, new Date().toISOString(), gameId);
}
