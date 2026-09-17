// Every test file uses an in-memory SQLite DB (no real file, no
// leftover state between runs). connectDB() caches a singleton, so
// resetDb() closes and reopens it fresh — cheap enough to do per test.
import { connectDB, closeDB, getDB } from '../src/db/connection.js';

export function resetDb() {
  closeDB();
  process.env.DATABASE_PATH = ':memory:';
  connectDB();
}

let userCounter = 0;

// Bypasses createUser()'s password-hashing dependency (bcrypt lives in
// services/auth, not db/users) — tests only need a row that satisfies
// the schema, not a real credential.
export function makeUser(username) {
  userCounter += 1;
  const now = new Date().toISOString();
  const db = getDB();
  const result = db
    .prepare(
      `INSERT INTO users (username, email, password_hash, bio, region, ratings, last_seen_at, created_at)
       VALUES (?, ?, 'x', '', '', '{}', ?, ?)`
    )
    .run(username || `user${userCounter}`, `${username || `user${userCounter}`}@test.com`, now, now);
  return result.lastInsertRowid;
}

export function makeUsers(n) {
  return Array.from({ length: n }, (_, i) => makeUser(`p${i + 1}`));
}
