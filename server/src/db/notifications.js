import { getDB } from './connection.js';

export function createNotification(userId, type, text) {
  getDB()
    .prepare('INSERT INTO notifications (user_id, type, text, created_at) VALUES (?, ?, ?, ?)')
    .run(userId, type, text, new Date().toISOString());
}

export function listNotifications(userId, limit = 50) {
  return getDB()
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(userId, limit)
    .map((r) => ({ id: String(r.id), type: r.type, text: r.text, read: !!r.read, time: r.created_at }));
}

export function markRead(id, userId) {
  const db = getDB();
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
  return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
}

export function markAllRead(userId) {
  getDB().prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').run(userId);
}
