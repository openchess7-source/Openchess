import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { createUser, findUserByUsernameOrEmail, findUserByEmail, findUserById, serializeUser, touchLastSeen, setPasswordHash, markEmailVerified } from '../db/users.js';
import { createPasswordResetToken, consumePasswordResetToken, createEmailVerificationToken, consumeEmailVerificationToken } from '../db/tokens.js';
import { COOKIE_NAME, cookieOptions, signToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendEmail, passwordResetEmail, verificationEmail } from '../services/email.js';
import { logger } from '../utils/logger.js';

const router = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const forgotPasswordLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

router.post('/register', registerLimiter, asyncHandler(async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are all required' });
  }
  if (username.length < 3) return res.status(400).json({ message: 'Username must be at least 3 characters' });
  if (!isValidEmail(email)) return res.status(400).json({ message: 'Enter a valid email address' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

  const existing = findUserByUsernameOrEmail(username) || findUserByUsernameOrEmail(email.toLowerCase());
  if (existing) return res.status(409).json({ message: 'That username or email is already taken' });

  const passwordHash = await bcrypt.hash(password, 12);
  let user;
  try {
    user = createUser({ username, email: email.toLowerCase(), passwordHash });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ message: 'That username or email is already taken' });
    }
    throw err;
  }

  try {
    const verifyToken = createEmailVerificationToken(user.id);
    const { subject, html } = verificationEmail(`${FRONTEND_URL}/verify-email?token=${verifyToken}`);
    await sendEmail({ to: user.email, subject, html });
  } catch (err) {
    // Registration should still succeed even if the verification email
    // fails to send — the user can request a new one later.
    logger.error({ err, userId: user.id }, 'failed to send verification email');
  }

  const token = signToken(user.id);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.status(201).json(serializeUser(user));
}));

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const { usernameOrEmail, password } = req.body || {};
  if (!usernameOrEmail || !password) {
    return res.status(400).json({ message: 'Username/email and password are required' });
  }

  const user = findUserByUsernameOrEmail(usernameOrEmail);
  if (!user) return res.status(401).json({ message: 'Incorrect username/email or password' });
  if (user.banned) return res.status(403).json({ message: 'This account has been suspended' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ message: 'Incorrect username/email or password' });

  touchLastSeen(user.id);

  const token = signToken(user.id);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json(serializeUser(user));
}));

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  res.json({ success: true });
});

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.status(401).json({ message: 'Not authenticated' });
  res.json(serializeUser(user));
}));

router.post('/forgot-password', forgotPasswordLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  // Always return the same response whether or not the email exists —
  // don't leak which emails are registered.
  const genericResponse = { message: 'If an account exists for that email, a reset link has been sent.' };
  if (!email || !isValidEmail(email)) return res.json(genericResponse);

  const user = findUserByEmail(email);
  if (user) {
    const token = createPasswordResetToken(user.id);
    const { subject, html } = passwordResetEmail(`${FRONTEND_URL}/reset-password?token=${token}`);
    try {
      await sendEmail({ to: user.email, subject, html });
    } catch (err) {
      logger.error({ err, userId: user.id }, 'failed to send password reset email');
    }
  }
  res.json(genericResponse);
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required' });
  if (newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

  const userId = consumePasswordResetToken(token);
  if (!userId) return res.status(400).json({ message: 'This reset link is invalid or has expired' });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  setPasswordHash(userId, passwordHash);
  res.json({ success: true });
}));

router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ message: 'Token is required' });

  const userId = consumeEmailVerificationToken(token);
  if (!userId) return res.status(400).json({ message: 'This verification link is invalid or has expired' });

  markEmailVerified(userId);
  res.json({ success: true });
}));

router.post('/resend-verification', requireAuth, forgotPasswordLimiter, asyncHandler(async (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.status(401).json({ message: 'Not authenticated' });
  if (user.email_verified) return res.json({ message: 'Already verified' });

  const token = createEmailVerificationToken(user.id);
  const { subject, html } = verificationEmail(`${FRONTEND_URL}/verify-email?token=${token}`);
  await sendEmail({ to: user.email, subject, html });
  res.json({ success: true });
}));

export default router;
