import { getDB } from './connection.js';

export function insertMatch(tournamentId, round, slot, player1Id, player2Id, status) {
  const db = getDB();
  const result = db
    .prepare(
      `INSERT INTO tournament_matches (tournament_id, round, slot, player1_id, player2_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(tournamentId, round, slot, player1Id, player2Id, status, new Date().toISOString());
  return result.lastInsertRowid;
}

export function hasBracket(tournamentId) {
  return !!getDB().prepare('SELECT 1 FROM tournament_matches WHERE tournament_id = ? LIMIT 1').get(tournamentId);
}

export function getBracketMatches(tournamentId) {
  return getDB()
    .prepare('SELECT * FROM tournament_matches WHERE tournament_id = ? ORDER BY round ASC, slot ASC')
    .all(tournamentId);
}

export function getMatch(tournamentId, round, slot) {
  return (
    getDB()
      .prepare('SELECT * FROM tournament_matches WHERE tournament_id = ? AND round = ? AND slot = ?')
      .get(tournamentId, round, slot) || null
  );
}

export function getMatchByGameId(gameId) {
  return getDB().prepare('SELECT * FROM tournament_matches WHERE game_id = ?').get(gameId) || null;
}

export function setMatchGame(matchId, gameId) {
  getDB().prepare("UPDATE tournament_matches SET game_id = ?, status = 'active' WHERE id = ?").run(gameId, matchId);
}

export function setMatchWinner(matchId, winnerId, status = 'completed') {
  getDB().prepare('UPDATE tournament_matches SET winner_id = ?, status = ? WHERE id = ?').run(winnerId, status, matchId);
}

// Swiss-only: records a decisive or drawn result without the
// elimination-style "advance the winner" semantics — Swiss standings are
// tracked separately in tournament_participants (see recordTournamentResult
// in db/tournaments.js); this just closes out the match row itself so
// round-completion and rematch-avoidance queries below see it.
export function setMatchResult(matchId, result, winnerId = null) {
  getDB().prepare("UPDATE tournament_matches SET result = ?, winner_id = ?, status = 'completed' WHERE id = ?").run(result, winnerId, matchId);
}

export function setMatchPlayer(matchId, position, userId) {
  const col = position === 1 ? 'player1_id' : 'player2_id';
  getDB().prepare(`UPDATE tournament_matches SET ${col} = ? WHERE id = ?`).run(userId, matchId);
}

export function getMaxRound(tournamentId) {
  const row = getDB().prepare('SELECT MAX(round) AS r FROM tournament_matches WHERE tournament_id = ?').get(tournamentId);
  return row?.r ?? 0;
}

// ---------------- Swiss-specific queries ----------------
// (Elimination doesn't need these — its tree structure IS the pairing
// history, whereas Swiss re-derives history fresh each round.)

export function getRoundMatches(tournamentId, round) {
  return getDB()
    .prepare('SELECT * FROM tournament_matches WHERE tournament_id = ? AND round = ? ORDER BY slot ASC')
    .all(tournamentId, round);
}

export function isRoundComplete(tournamentId, round) {
  const row = getDB()
    .prepare("SELECT COUNT(*) AS c FROM tournament_matches WHERE tournament_id = ? AND round = ? AND status NOT IN ('completed', 'bye')")
    .get(tournamentId, round);
  return row.c === 0;
}

export function getPlayedPairKeys(tournamentId) {
  const rows = getDB()
    .prepare('SELECT player1_id, player2_id FROM tournament_matches WHERE tournament_id = ? AND player1_id IS NOT NULL AND player2_id IS NOT NULL')
    .all(tournamentId);
  return new Set(rows.map((r) => (r.player1_id < r.player2_id ? `${r.player1_id}-${r.player2_id}` : `${r.player2_id}-${r.player1_id}`)));
}

export function getByeRecipients(tournamentId) {
  const rows = getDB()
    .prepare("SELECT player1_id FROM tournament_matches WHERE tournament_id = ? AND status = 'bye'")
    .all(tournamentId);
  return new Set(rows.map((r) => r.player1_id));
}

// Joins usernames in for a single round's pairings — used by the Swiss
// standings/pairings page (serializeBracket above is elimination's
// equivalent, grouped by every round instead of just the current one).
export function serializeRoundMatches(tournamentId, round) {
  const rows = getDB()
    .prepare(
      `SELECT m.*, p1.username AS p1_username, p2.username AS p2_username
       FROM tournament_matches m
       LEFT JOIN users p1 ON p1.id = m.player1_id
       LEFT JOIN users p2 ON p2.id = m.player2_id
       WHERE m.tournament_id = ? AND m.round = ?
       ORDER BY m.slot ASC`
    )
    .all(tournamentId, round);

  return rows.map((r) => ({
    id: r.id,
    slot: r.slot,
    player1: r.player1_id ? { id: String(r.player1_id), username: r.p1_username } : null,
    player2: r.player2_id ? { id: String(r.player2_id), username: r.p2_username } : null,
    gameId: r.game_id,
    result: r.result,
    winnerId: r.winner_id ? String(r.winner_id) : null,
    status: r.status,
  }));
}

export function isBracketComplete(tournamentId) {
  const finalRound = getMaxRound(tournamentId);
  if (!finalRound) return false;
  const final = getMatch(tournamentId, finalRound, 0);
  return !!final && (final.status === 'completed' || final.status === 'bye');
}

export function getBracketWinner(tournamentId) {
  const finalRound = getMaxRound(tournamentId);
  if (!finalRound) return null;
  const final = getMatch(tournamentId, finalRound, 0);
  return final?.winner_id ? String(final.winner_id) : null;
}

// Joins usernames in for display — the bracket UI never needs raw ids.
export function serializeBracket(tournamentId) {
  const rows = getDB()
    .prepare(
      `SELECT m.*, p1.username AS p1_username, p2.username AS p2_username, w.username AS winner_username
       FROM tournament_matches m
       LEFT JOIN users p1 ON p1.id = m.player1_id
       LEFT JOIN users p2 ON p2.id = m.player2_id
       LEFT JOIN users w ON w.id = m.winner_id
       WHERE m.tournament_id = ?
       ORDER BY m.round ASC, m.slot ASC`
    )
    .all(tournamentId);

  const byRound = new Map();
  for (const r of rows) {
    if (!byRound.has(r.round)) byRound.set(r.round, []);
    byRound.get(r.round).push({
      id: r.id,
      slot: r.slot,
      player1: r.player1_id ? { id: String(r.player1_id), username: r.p1_username } : null,
      player2: r.player2_id ? { id: String(r.player2_id), username: r.p2_username } : null,
      gameId: r.game_id,
      winnerId: r.winner_id ? String(r.winner_id) : null,
      winnerUsername: r.winner_username,
      status: r.status,
    });
  }
  return [...byRound.keys()].sort((a, b) => a - b).map((round) => byRound.get(round));
}
