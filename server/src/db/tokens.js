import crypto from 'node:crypto';
import { getDB } from './connection.js';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function createPasswordResetToken(userId) {
  const token = makeToken();
  const now = new Date();
  getDB()
    .prepare('INSERT INTO password_reset_tokens (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .run(token, userId, new Date(now.getTime() + RESET_TOKEN_TTL_MS).toISOString(), now.toISOString());
  return token;
}

export function consumePasswordResetToken(token) {
  const row = getDB().prepare('SELECT * FROM password_reset_tokens WHERE token = ?').get(token);
  if (!row) return null;
  if (row.used) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  getDB().prepare('UPDATE password_reset_tokens SET used = 1 WHERE token = ?').run(token);
  return row.user_id;
}

export function createEmailVerificationToken(userId) {
  const token = makeToken();
  const now = new Date();
  getDB()
    .prepare('INSERT INTO email_verification_tokens (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .run(token, userId, new Date(now.getTime() + VERIFY_TOKEN_TTL_MS).toISOString(), now.toISOString());
  return token;
}

export function consumeEmailVerificationToken(token) {
  const row = getDB().prepare('SELECT * FROM email_verification_tokens WHERE token = ?').get(token);
  if (!row) return null;
  if (row.used) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  getDB().prepare('UPDATE email_verification_tokens SET used = 1 WHERE token = ?').run(token);
  return row.user_id;
}
