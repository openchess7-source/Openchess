import crypto from 'node:crypto';

export const CSRF_COOKIE_NAME = 'oc_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';

// Paths that are exempt: registration/login don't have a session yet to
// protect, and this check only ever applies to state-changing verbs anyway.
const EXEMPT_PATHS = new Set(['/api/auth/register', '/api/auth/login']);

function csrfCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: false, // must be readable by frontend JS — that's the whole mechanism
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

// Ensures every client has a CSRF token cookie, issuing one if missing.
// Mount this before routes so the token exists on the very first request.
export function ensureCsrfCookie(req, res, next) {
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions());
    req.cookies[CSRF_COOKIE_NAME] = token; // so the check below sees it on this same request
  }
  next();
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireCsrfToken(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (EXEMPT_PATHS.has(req.path)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: 'Invalid or missing CSRF token' });
  }
  next();
}
