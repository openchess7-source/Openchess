import { getDB } from './connection.js';

export function areFriends(userId, otherId) {
  return !!getDB().prepare('SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?').get(userId, otherId);
}

export function hasRequestFrom(fromId, toId) {
  return !!getDB().prepare('SELECT 1 FROM friend_requests WHERE from_id = ? AND to_id = ?').get(fromId, toId);
}

export function createRequest(fromId, toId) {
  getDB().prepare('INSERT OR IGNORE INTO friend_requests (from_id, to_id) VALUES (?, ?)').run(fromId, toId);
}

export function removeRequest(fromId, toId) {
  getDB().prepare('DELETE FROM friend_requests WHERE from_id = ? AND to_id = ?').run(fromId, toId);
}

export function makeFriends(aId, bId) {
  const db = getDB();
  db.prepare('INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)').run(aId, bId);
  db.prepare('INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)').run(bId, aId);
}

export function listFriendIds(userId) {
  return getDB()
    .prepare('SELECT friend_id AS id FROM friends WHERE user_id = ?')
    .all(userId)
    .map((r) => r.id);
}

export function listIncomingRequestIds(userId) {
  return getDB()
    .prepare('SELECT from_id AS id FROM friend_requests WHERE to_id = ?')
    .all(userId)
    .map((r) => r.id);
}
