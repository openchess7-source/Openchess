import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

let db = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  title TEXT,
  bio TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  ratings TEXT NOT NULL,
  peak_rating INTEGER NOT NULL DEFAULT 800,
  games INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  last_seen_at TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,
  banned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_verify_tokens_user ON email_verification_tokens(user_id);

CREATE TABLE IF NOT EXISTS friends (
  user_id INTEGER NOT NULL REFERENCES users(id),
  friend_id INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (user_id, friend_id)
);

CREATE TABLE IF NOT EXISTS friend_requests (
  from_id INTEGER NOT NULL REFERENCES users(id),
  to_id INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (from_id, to_id)
);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  white_id INTEGER NOT NULL REFERENCES users(id),
  black_id INTEGER NOT NULL REFERENCES users(id),
  mode TEXT NOT NULL,
  tournament_id INTEGER REFERENCES tournaments(id),
  initial INTEGER NOT NULL,
  increment INTEGER NOT NULL DEFAULT 0,
  fen TEXT NOT NULL,
  pgn TEXT NOT NULL DEFAULT '',
  turn TEXT NOT NULL DEFAULT 'white',
  white_remaining_ms INTEGER NOT NULL,
  black_remaining_ms INTEGER NOT NULL,
  turn_started_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  result TEXT,
  reason TEXT,
  flagged_for_review INTEGER NOT NULL DEFAULT 0,
  flagged_reason TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_games_white ON games(white_id, created_at);
CREATE INDEX IF NOT EXISTS idx_games_black ON games(black_id, created_at);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_tournament ON games(tournament_id);

CREATE TABLE IF NOT EXISTS game_moves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL REFERENCES games(id),
  ply INTEGER NOT NULL,
  from_sq TEXT NOT NULL,
  to_sq TEXT NOT NULL,
  san TEXT NOT NULL,
  promotion TEXT,
  think_time_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_moves_game ON game_moves(game_id, ply);

CREATE TABLE IF NOT EXISTS puzzles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fen TEXT NOT NULL UNIQUE,
  side_to_move TEXT NOT NULL,
  solution TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 1200,
  category TEXT NOT NULL,
  hint TEXT NOT NULL DEFAULT '',
  is_daily_eligible INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_puzzles_category ON puzzles(category);

CREATE TABLE IF NOT EXISTS puzzle_solves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  puzzle_id INTEGER NOT NULL REFERENCES puzzles(id),
  correct INTEGER NOT NULL,
  solved_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_solves_user ON puzzle_solves(user_id, solved_at);

CREATE TABLE IF NOT EXISTS tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  format TEXT NOT NULL DEFAULT 'Arena',
  format_type TEXT NOT NULL DEFAULT 'arena',
  total_rounds INTEGER,
  mode TEXT NOT NULL,
  initial INTEGER NOT NULL,
  increment INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tournaments_starts ON tournaments(starts_at);

CREATE TABLE IF NOT EXISTS tournament_participants (
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  score REAL NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tournament_id, user_id)
);

-- One row per pairing/slot in a tournament that isn't scored purely by a
-- fixed-window arena clock — used by both elimination brackets (see
-- services/bracket.js) and Swiss pairings (see services/swiss.js).
-- status: 'pending' (waiting on both players), 'active' (game in
-- progress), 'completed' (decisive or drawn result recorded), or 'bye'
-- (one slot empty, other player auto-advanced/auto-scored). result (Swiss
-- only — elimination never stores draws here, it replays them instead):
-- 'player1' | 'player2' | 'draw'.
CREATE TABLE IF NOT EXISTS tournament_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id),
  round INTEGER NOT NULL,
  slot INTEGER NOT NULL,
  player1_id INTEGER REFERENCES users(id),
  player2_id INTEGER REFERENCES users(id),
  game_id TEXT REFERENCES games(id),
  winner_id INTEGER REFERENCES users(id),
  result TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  UNIQUE(tournament_id, round, slot)
);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON tournament_matches(tournament_id, round, slot);
CREATE INDEX IF NOT EXISTS idx_matches_game ON tournament_matches(game_id);

CREATE TABLE IF NOT EXISTS clubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'public',
  owner_id INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS club_members (
  club_id INTEGER NOT NULL REFERENCES clubs(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (club_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at);
`;

export function connectDB() {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || './data/openchess.db';
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;'); // safer under concurrent reads/writes
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  // CREATE TABLE IF NOT EXISTS above only helps tables that didn't exist
  // yet — a `tournaments` file created before format_type existed needs
  // an explicit ALTER. SQLite has no "ADD COLUMN IF NOT EXISTS", so this
  // is a no-op (caught and ignored) on any DB that already has it.
  try {
    db.exec("ALTER TABLE tournaments ADD COLUMN format_type TEXT NOT NULL DEFAULT 'arena';");
  } catch {
    // column already exists — nothing to do
  }
  try {
    db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;');
  } catch {
    // column already exists — nothing to do
  }
  try {
    db.exec('ALTER TABLE users ADD COLUMN banned INTEGER NOT NULL DEFAULT 0;');
  } catch {
    // column already exists — nothing to do
  }
  try {
    db.exec("ALTER TABLE games ADD COLUMN review_status TEXT NOT NULL DEFAULT 'pending';");
  } catch {
    // column already exists — nothing to do
  }
  try {
    db.exec('ALTER TABLE games ADD COLUMN reviewed_by INTEGER;');
  } catch {
    // column already exists — nothing to do
  }
  try {
    db.exec('ALTER TABLE games ADD COLUMN reviewed_at TEXT;');
  } catch {
    // column already exists — nothing to do
  }
  try {
    db.exec('ALTER TABLE tournaments ADD COLUMN total_rounds INTEGER;');
  } catch {
    // column already exists — nothing to do
  }
  try {
    db.exec('ALTER TABLE tournament_matches ADD COLUMN result TEXT;');
  } catch {
    // column already exists — nothing to do
  }
  console.log(`[db] SQLite ready at ${dbPath}`);
  return db;
}

export function getDB() {
  if (!db) throw new Error('Database not connected — call connectDB() first');
  return db;
}

export function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}
