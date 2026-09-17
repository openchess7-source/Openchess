import { getDB } from './connection.js';

const PRESENCE_WINDOW_MS = 60_000;

export function memberCount(clubId) {
  return getDB().prepare('SELECT COUNT(*) AS c FROM club_members WHERE club_id = ?').get(clubId).c;
}

export function onlineMemberCount(clubId) {
  const rows = getDB()
    .prepare(
      'SELECT u.last_seen_at AS lastSeenAt FROM club_members cm JOIN users u ON u.id = cm.user_id WHERE cm.club_id = ?'
    )
    .all(clubId);
  return rows.filter((r) => Date.now() - new Date(r.lastSeenAt).getTime() < PRESENCE_WINDOW_MS).length;
}

export function isMember(clubId, userId) {
  return !!getDB().prepare('SELECT 1 FROM club_members WHERE club_id = ? AND user_id = ?').get(clubId, userId);
}

export function serializeClub(row, userId) {
  return {
    id: String(row.id),
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    ownerId: String(row.owner_id),
    members: memberCount(row.id),
    online: onlineMemberCount(row.id),
    joined: userId ? isMember(row.id, userId) : false,
  };
}

export function createClub({ name, description, visibility, ownerId }) {
  const db = getDB();
  const result = db
    .prepare('INSERT INTO clubs (name, description, visibility, owner_id) VALUES (?, ?, ?, ?)')
    .run(name, description || '', visibility === 'private' ? 'private' : 'public', ownerId);
  db.prepare('INSERT OR IGNORE INTO club_members (club_id, user_id) VALUES (?, ?)').run(result.lastInsertRowid, ownerId);
  return result.lastInsertRowid;
}

export function findClubByName(name) {
  return getDB().prepare('SELECT * FROM clubs WHERE name = ?').get(name) || null;
}

export function getClubById(id) {
  return getDB().prepare('SELECT * FROM clubs WHERE id = ?').get(id) || null;
}

export function listClubsForUser(userId) {
  return getDB()
    .prepare('SELECT c.* FROM clubs c JOIN club_members cm ON cm.club_id = c.id WHERE cm.user_id = ?')
    .all(userId);
}

export function listFeaturedClubs(excludeUserId, limit = 20) {
  return getDB()
    .prepare(
      "SELECT * FROM clubs WHERE visibility = 'public' AND id NOT IN (SELECT club_id FROM club_members WHERE user_id = ?) LIMIT ?"
    )
    .all(excludeUserId, limit);
}

export function joinClub(clubId, userId) {
  getDB().prepare('INSERT OR IGNORE INTO club_members (club_id, user_id) VALUES (?, ?)').run(clubId, userId);
}

export function leaveClub(clubId, userId) {
  getDB().prepare('DELETE FROM club_members WHERE club_id = ? AND user_id = ?').run(clubId, userId);
}

export function listMembers(clubId) {
  return getDB()
    .prepare(
      'SELECT u.id, u.username, u.ratings, u.last_seen_at AS lastSeenAt FROM club_members cm JOIN users u ON u.id = cm.user_id WHERE cm.club_id = ?'
    )
    .all(clubId)
    .map((r) => ({ ...r, ratings: JSON.parse(r.ratings) }));
}
