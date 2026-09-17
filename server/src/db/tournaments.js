import { getDB } from './connection.js';
import { hasBracket, isBracketComplete, getBracketWinner, getMaxRound, isRoundComplete } from './brackets.js';

function computedStatus(startsAtIso) {
  const now = Date.now();
  const start = new Date(startsAtIso).getTime();
  const ARENA_DURATION_MS = 2 * 60 * 60 * 1000;
  if (now < start) return 'upcoming';
  if (now < start + ARENA_DURATION_MS) return 'live';
  return 'completed';
}

// Elimination tournaments don't run for a fixed window — a bracket ends
// whenever the final match does, which could be minutes or days after
// starts_at depending on how fast players finish their games. So status
// tracks bracket state instead of a clock once the start time has passed.
function eliminationStatus(row) {
  const now = Date.now();
  if (now < new Date(row.starts_at).getTime()) return 'upcoming';
  if (isBracketComplete(row.id)) return 'completed';
  return 'live';
}

// A Swiss tournament runs for as many rounds as it takes — round N+1 only
// starts once round N's games are all done, which (like elimination) can
// take far more or less than a fixed clock window.
function swissStatus(row) {
  const now = Date.now();
  if (now < new Date(row.starts_at).getTime()) return 'upcoming';
  const round = getMaxRound(row.id);
  if (round === 0) return 'live'; // started, first round not paired yet (paired lazily on first view)
  if (round >= (row.total_rounds || 0) && isRoundComplete(row.id, round)) return 'completed';
  return 'live';
}

export function serializeTournament(row, userId, participantCountVal) {
  const isElimination = row.format_type === 'elimination';
  const isSwiss = row.format_type === 'swiss';
  const status = isElimination ? eliminationStatus(row) : isSwiss ? swissStatus(row) : computedStatus(row.starts_at);
  return {
    id: String(row.id),
    name: row.name,
    format: row.format,
    formatType: row.format_type,
    totalRounds: row.total_rounds,
    mode: row.mode,
    timeControl: `${row.initial / 60}+${row.increment}`,
    players: participantCountVal,
    status,
    startsInSeconds: status === 'upcoming' ? Math.max(0, Math.round((new Date(row.starts_at).getTime() - Date.now()) / 1000)) : null,
    isRegistered: userId ? isRegistered(row.id, userId) : false,
    bracketStarted: isElimination ? hasBracket(row.id) : undefined,
    winnerId: isElimination && status === 'completed' ? getBracketWinner(row.id) : undefined,
  };
}

export function upsertTournament(t) {
  const db = getDB();
  const existing = db.prepare('SELECT id FROM tournaments WHERE name = ?').get(t.name);
  if (existing) return existing.id;
  const result = db
    .prepare('INSERT INTO tournaments (name, format, format_type, total_rounds, mode, initial, increment, starts_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(t.name, t.format, t.formatType || 'arena', t.totalRounds || null, t.mode, t.initial, t.increment, t.startsAt);
  return result.lastInsertRowid;
}

export function getRegisteredUserIds(tournamentId) {
  return getDB()
    .prepare('SELECT user_id FROM tournament_participants WHERE tournament_id = ?')
    .all(tournamentId)
    .map((r) => r.user_id);
}

export function listTournaments(limit = 50) {
  return getDB().prepare('SELECT * FROM tournaments ORDER BY starts_at ASC LIMIT ?').all(limit);
}

export function getTournamentById(id) {
  return getDB().prepare('SELECT * FROM tournaments WHERE id = ?').get(id) || null;
}

export function participantCount(tournamentId) {
  return getDB().prepare('SELECT COUNT(*) AS c FROM tournament_participants WHERE tournament_id = ?').get(tournamentId).c;
}

export function isRegistered(tournamentId, userId) {
  return !!getDB()
    .prepare('SELECT 1 FROM tournament_participants WHERE tournament_id = ? AND user_id = ?')
    .get(tournamentId, userId);
}

export function joinTournament(tournamentId, userId) {
  getDB()
    .prepare('INSERT OR IGNORE INTO tournament_participants (tournament_id, user_id) VALUES (?, ?)')
    .run(tournamentId, userId);
}

export function getStandings(tournamentId) {
  return getDB()
    .prepare(
      'SELECT u.username AS name, tp.score, tp.wins, tp.draws, tp.losses, tp.user_id AS userId FROM tournament_participants tp JOIN users u ON u.id = tp.user_id WHERE tp.tournament_id = ? ORDER BY tp.score DESC'
    )
    .all(tournamentId);
}

export { computedStatus };

// Called when two players are matched via normal queue matchmaking — if
// they're both registered in the same live tournament with a matching
// mode/time control, the resulting game should count toward it. This is
// intentionally conservative: it only links games that organically match
// an active tournament's exact format, never invents participation.
export function findLiveTournamentForPlayers(mode, initial, increment, userIdA, userIdB) {
  const db = getDB();
  const candidates = db
    .prepare('SELECT * FROM tournaments WHERE mode = ? AND initial = ? AND increment = ?')
    .all(mode, initial, increment);

  for (const t of candidates) {
    if (computedStatus(t.starts_at) !== 'live') continue;
    const aIn = isRegistered(t.id, userIdA);
    const bIn = isRegistered(t.id, userIdB);
    if (aIn && bIn) return t;
  }
  return null;
}

// Updates both participants' tournament score/wins/draws/losses after a
// linked game completes. Score uses standard chess tournament points:
// win = 1, draw = 0.5, loss = 0.
export function recordTournamentResult(tournamentId, whiteUserId, blackUserId, result) {
  const db = getDB();
  const whiteScore = result === 'white' ? 1 : result === 'draw' ? 0.5 : 0;
  const blackScore = result === 'black' ? 1 : result === 'draw' ? 0.5 : 0;

  const apply = (userId, score, outcome) => {
    db.prepare(
      `UPDATE tournament_participants SET
         score = score + ?,
         wins = wins + ?,
         draws = draws + ?,
         losses = losses + ?
       WHERE tournament_id = ? AND user_id = ?`
    ).run(
      score,
      outcome === 'win' ? 1 : 0,
      outcome === 'draw' ? 1 : 0,
      outcome === 'loss' ? 1 : 0,
      tournamentId,
      userId
    );
  };

  apply(whiteUserId, whiteScore, result === 'white' ? 'win' : result === 'draw' ? 'draw' : 'loss');
  apply(blackUserId, blackScore, result === 'black' ? 'win' : result === 'draw' ? 'draw' : 'loss');
}

// A Swiss bye is a free point with no game played — same convention as a
// win for standings purposes, just without touching wins/losses/draws
// (there's no opponent to have "beaten").
export function applyByePoint(tournamentId, userId) {
  getDB()
    .prepare('UPDATE tournament_participants SET score = score + 1 WHERE tournament_id = ? AND user_id = ?')
    .run(tournamentId, userId);
}
