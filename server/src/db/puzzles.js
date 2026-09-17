import { getDB } from './connection.js';

function rowToPuzzle(row) {
  if (!row) return null;
  return { ...row, solution: JSON.parse(row.solution), sideToMove: row.side_to_move, isDailyEligible: !!row.is_daily_eligible };
}

export function upsertPuzzle(p) {
  const db = getDB();
  const existing = db.prepare('SELECT id FROM puzzles WHERE fen = ?').get(p.fen);
  if (existing) {
    db.prepare(
      'UPDATE puzzles SET side_to_move = ?, solution = ?, rating = ?, category = ?, hint = ? WHERE fen = ?'
    ).run(p.sideToMove, JSON.stringify(p.solution), p.rating, p.category, p.hint || '', p.fen);
    return existing.id;
  }
  const result = db
    .prepare(
      'INSERT INTO puzzles (fen, side_to_move, solution, rating, category, hint) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(p.fen, p.sideToMove, JSON.stringify(p.solution), p.rating, p.category, p.hint || '');
  return result.lastInsertRowid;
}

export function countDailyEligible() {
  return getDB().prepare('SELECT COUNT(*) AS c FROM puzzles WHERE is_daily_eligible = 1').get().c;
}

export function getDailyPuzzleByIndex(index) {
  const row = getDB()
    .prepare('SELECT * FROM puzzles WHERE is_daily_eligible = 1 ORDER BY id LIMIT 1 OFFSET ?')
    .get(index);
  return rowToPuzzle(row);
}

export function getPuzzleById(id) {
  return rowToPuzzle(getDB().prepare('SELECT * FROM puzzles WHERE id = ?').get(id));
}

export function listCategories() {
  return getDB()
    .prepare('SELECT category, COUNT(*) AS count FROM puzzles GROUP BY category')
    .all();
}

export function recordSolve(userId, puzzleId, correct) {
  getDB()
    .prepare('INSERT INTO puzzle_solves (user_id, puzzle_id, correct, solved_at) VALUES (?, ?, ?, ?)')
    .run(userId, puzzleId, correct ? 1 : 0, new Date().toISOString());
}

export function countCorrectSolves(userId) {
  return getDB()
    .prepare('SELECT COUNT(*) AS c FROM puzzle_solves WHERE user_id = ? AND correct = 1')
    .get(userId).c;
}

export function computeStreak(userId) {
  const rows = getDB()
    .prepare('SELECT solved_at FROM puzzle_solves WHERE user_id = ? AND correct = 1 ORDER BY solved_at DESC')
    .all(userId);
  const solvedDays = new Set(rows.map((r) => r.solved_at.slice(0, 10)));

  let streak = 0;
  const cursor = new Date();
  if (!solvedDays.has(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (solvedDays.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
