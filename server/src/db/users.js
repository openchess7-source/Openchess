import { getDB } from './connection.js';

const RATING_MODES = ['bullet', 'blitz', 'rapid', 'classical', 'puzzle', 'chess960'];
const DEFAULT_RATING = 800;
const PRESENCE_WINDOW_MS = 60_000;

function defaultRatings() {
  return RATING_MODES.reduce((acc, m) => ({ ...acc, [m]: DEFAULT_RATING }), {});
}

function rowToUser(row) {
  if (!row) return null;
  return { ...row, ratings: JSON.parse(row.ratings) };
}

export function serializeUser(user) {
  if (!user) return null;
  const online = Date.now() - new Date(user.last_seen_at).getTime() < PRESENCE_WINDOW_MS;
  return {
    id: String(user.id),
    username: user.username,
    title: user.title,
    avatarInitials: user.username.slice(0, 2).toUpperCase(),
    region: user.region,
    bio: user.bio,
    ratings: user.ratings,
    peakRating: user.peak_rating,
    games: user.games,
    winRate: user.games > 0 ? user.wins / user.games : 0,
    online,
    emailVerified: !!user.email_verified,
    isAdmin: !!user.is_admin,
  };
}

export function createUser({ username, email, passwordHash }) {
  const db = getDB();
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO users (username, email, password_hash, ratings, peak_rating, last_seen_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(username, email, passwordHash, JSON.stringify(defaultRatings()), DEFAULT_RATING, now, now);
  return findUserById(result.lastInsertRowid);
}

export function findUserById(id) {
  const row = getDB().prepare('SELECT * FROM users WHERE id = ?').get(id);
  return rowToUser(row);
}

export function findUserByUsernameOrEmail(value) {
  const row = getDB()
    .prepare('SELECT * FROM users WHERE username = ? OR email = ?')
    .get(value, value.toLowerCase());
  return rowToUser(row);
}

export function findUserByUsername(username) {
  const row = getDB().prepare('SELECT * FROM users WHERE username = ?').get(username);
  return rowToUser(row);
}

export function searchUsersByUsernamePrefix(prefix, limit = 20) {
  const rows = getDB()
    .prepare('SELECT * FROM users WHERE username LIKE ? COLLATE NOCASE ORDER BY username LIMIT ?')
    .all(`${prefix}%`, limit);
  return rows.map(rowToUser);
}

export function touchLastSeen(id) {
  getDB().prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').run(new Date().toISOString(), id);
}

export function updateUserRatingAndStats(id, { mode, newRating, outcome }) {
  const user = findUserById(id);
  if (!user) return;
  const ratings = { ...user.ratings, [mode]: newRating };
  const peak = Math.max(user.peak_rating, newRating);
  const wins = user.wins + (outcome === 'win' ? 1 : 0);
  const losses = user.losses + (outcome === 'loss' ? 1 : 0);
  const draws = user.draws + (outcome === 'draw' ? 1 : 0);
  getDB()
    .prepare(
      'UPDATE users SET ratings = ?, peak_rating = ?, games = games + 1, wins = ?, losses = ?, draws = ? WHERE id = ?'
    )
    .run(JSON.stringify(ratings), peak, wins, losses, draws, id);
}

export function topUsersByRating(mode, limit = 50) {
  // ratings is stored as JSON text, so sort in JS rather than SQL —
  // fine at this scale; would need a generated column or separate
  // ratings table to sort in SQL efficiently at real scale.
  const rows = getDB().prepare('SELECT * FROM users').all();
  return rows
    .map(rowToUser)
    .sort((a, b) => b.ratings[mode] - a.ratings[mode])
    .slice(0, limit);
}

export function rankOfUser(mode, rating) {
  const rows = getDB().prepare('SELECT ratings FROM users').all();
  const higher = rows.filter((r) => JSON.parse(r.ratings)[mode] > rating).length;
  return higher + 1;
}

export function findUserByEmail(email) {
  const row = getDB().prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  return rowToUser(row);
}

export function markEmailVerified(userId) {
  getDB().prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(userId);
}

export function setPasswordHash(userId, passwordHash) {
  getDB().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId);
}

export function setBanned(userId, banned) {
  getDB().prepare('UPDATE users SET banned = ? WHERE id = ?').run(banned ? 1 : 0, userId);
}

export function setAdmin(userId, isAdmin) {
  getDB().prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(isAdmin ? 1 : 0, userId);
}

export { RATING_MODES, DEFAULT_RATING };
