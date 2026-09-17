import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';

import { connectDB, getDB } from './db/connection.js';
import { logger, requestLogger } from './utils/logger.js';
import { ensureCsrfCookie, requireCsrfToken, CSRF_COOKIE_NAME } from './middleware/csrf.js';
import authRoutes from './routes/auth.js';
import gamesRoutes from './routes/games.js';
import puzzlesRoutes from './routes/puzzles.js';
import friendsRoutes from './routes/friends.js';
import leaderboardsRoutes from './routes/leaderboards.js';
import playersRoutes from './routes/players.js';
import tournamentsRoutes from './routes/tournaments.js';
import clubsRoutes from './routes/clubs.js';
import achievementsRoutes from './routes/achievements.js';
import notificationsRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import { attachSocketServer, rehydrateActiveGames } from './sockets/index.js';

const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

let dbReady = false;
try {
  connectDB();
  dbReady = true;
} catch (err) {
  logger.error({ err }, 'failed to open the SQLite database — every DB-backed route will fail until this is fixed');
}

const app = express();

app.use(requestLogger);
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false }));
app.use(ensureCsrfCookie);
app.use(requireCsrfToken);

app.get('/health', (_req, res) => {
  let ok = dbReady;
  if (ok) {
    try {
      getDB().prepare('SELECT 1').get();
    } catch {
      ok = false;
    }
  }
  res.status(ok ? 200 : 503).json({ ok, db: ok ? 'connected' : 'disconnected' });
});

// The oc_csrf cookie is set by ensureCsrfCookie above, but on a
// cross-origin deployment (frontend on Vercel, this API on Render) the
// frontend's document.cookie can NEVER see it — cookies are scoped to
// the domain that set them, not the page that requested them. So the
// token also needs to be readable from a response body at least once;
// the frontend fetches this on boot and caches it in memory.
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.cookies[CSRF_COOKIE_NAME] });
});

app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/puzzles', puzzlesRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/leaderboards', leaderboardsRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/tournaments', tournamentsRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, _next) => {
  logger.error({ err, reqId: req.id, path: req.path }, 'unhandled error');
  res.status(500).json({ message: 'Internal server error' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: FRONTEND_URL, credentials: true },
});
app.set('io', io); // lets REST routes (e.g. GET /tournaments/:id/bracket) launch real live games
attachSocketServer(io);

// Rebuild in-memory clock/board state for any game that was active when
// the process last stopped — see rehydrateActiveGames in sockets/index.js
// for why this is safe and what it deliberately does and doesn't do.
if (dbReady) {
  try {
    rehydrateActiveGames(io);
  } catch (err) {
    logger.error({ err }, 'failed to rehydrate active games on boot — active games from before this restart will not accept moves until players start a new one');
  }
}

server.listen(PORT, () => logger.info(`server listening on :${PORT}`));
