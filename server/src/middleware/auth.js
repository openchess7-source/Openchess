import { COOKIE_NAME, verifyToken } from '../utils/jwt.js';
import { touchLastSeen, findUserById } from '../db/users.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const payload = verifyToken(token);
    req.userId = Number(payload.sub);
    // Checked on every request, not just at login — a ban issued mid-session
    // must take effect immediately, not wait for the existing token to expire.
    const user = findUserById(req.userId);
    if (!user) return res.status(401).json({ message: 'Session expired' });
    if (user.banned) return res.status(403).json({ message: 'This account has been suspended' });
    req.isAdmin = !!user.is_admin;
    try {
      touchLastSeen(req.userId);
    } catch {
      // presence tracking must never block the request
    }
    next();
  } catch {
    return res.status(401).json({ message: 'Session expired' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.isAdmin) return res.status(403).json({ message: 'Admin access required' });
  next();
}
