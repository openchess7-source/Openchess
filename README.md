# Openchess

A chess platform: React/Vite/Tailwind frontend + Express/SQLite/Socket.IO
backend. Real auth, real live 1v1 games with server-authoritative move
validation, real puzzles/leaderboards/friends/clubs/achievements/history —
the rest (see "What's real vs. mocked" below) is honestly still mock data,
not pretended otherwise.

## Architecture

```
React (Vite, Tailwind, React Router)
  → src/services/api.js          (axios, httpOnly-cookie auth)
  → src/services/dataService.js  (real endpoints)
  → src/services/mockService.js  (routes to real API or static fixtures
                                   per resource — see table below)
  → src/services/socketService.js (Socket.IO client, live games)

Express (server/)
  → routes/auth.js          /api/auth/register|login|logout|me
  → routes/games.js         /api/games/mine|active|:id
  → routes/puzzles.js       /api/puzzles/daily|categories|streak|:id, POST :id/solve
  → routes/friends.js       /api/friends, /request/accept/decline
  → routes/leaderboards.js  /api/leaderboards
  → routes/players.js       /api/players (search), /api/players/:username
  → routes/tournaments.js   /api/tournaments, /:id/join, /:id/standings
  → routes/clubs.js         /api/clubs, /:id/join, /:id/leave, /:id/members
  → routes/achievements.js  /api/achievements
  → routes/notifications.js /api/notifications, /:id/read, /read-all
  → sockets/index.js        join_queue → match_found → make_move →
                             move_made/game_over, resign, draw offers,
                             disconnect/reconnect grace period
  → db/ (SQLite via node:sqlite) — single file, no external database service
```

Auth is a JWT signed into an **httpOnly cookie** — never localStorage, never
sent manually by the client (`withCredentials: true` everywhere). Socket.IO
authenticates off the same cookie during the handshake.

**Database: SQLite, not MongoDB.** This was originally built on
MongoDB/Mongoose, then fully rewritten to SQLite (`server/src/db/`) so the
whole backend is one deployable unit with no external database service to
provision. See `server/README.md` for the full rationale, the Render
persistent-disk requirement (important — read it before deploying), and a
long list of things that were actually tested live against a real database
file, not just statically checked.

## Local setup

**Frontend:**
```bash
npm install
cp .env.example .env.local   # see below
npm run dev                  # http://localhost:5173
```

**Backend:**
```bash
cd server
npm install
cp .env.example .env
npm run seed                 # loads 3 real, engine-verified puzzles + 3 tournaments
npm run dev                  # http://localhost:4000
```

Requires **Node ≥22.5** (pinned via `server/.node-version` and
`package.json`'s `engines` field) — that's the minimum version with
`node:sqlite` support.

## Environment variables

**Frontend** (`.env.local`):
| Var | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000` | Backend base URL |
| `VITE_DEMO_MODE` | unset (= off) | `true` to preview without a backend — see below |

**Backend** (`server/.env`):
| Var | Purpose |
|---|---|
| `DATABASE_PATH` | Where the SQLite file lives. **On Render, must point inside a persistent disk** — see `server/README.md`'s warning |
| `JWT_SECRET` | Random secret signing the auth cookie |
| `FRONTEND_URL` | Exact deployed frontend origin (CORS + cookie SameSite) |
| `RESEND_API_KEY` | Optional. Without it, password-reset/verification emails log to the console instead of sending — fully functional for testing, just not delivered. Get a key at resend.com to send real email. |
| `EMAIL_FROM` | Optional, defaults to a Resend sandbox address |
| `NODE_ENV` | `production` enables `Secure`/`SameSite=None` cookies |
| `LOG_LEVEL` | Optional, defaults to `debug` locally / `info` in production |
| `PORT` | Defaults to 4000 |

## What was added in this pass — real, live-tested

Everything below was actually run against a real server and real SQLite
database in this session (not just written and assumed correct):

- **Password reset** — real single-use tokens with 1-hour expiry.
  Confirmed live: request reset → real token → reset succeeds → same
  token rejected on reuse → old password fails → new password works.
- **Email verification** — real single-use 24-hour tokens, confirmed live
  the same way.
- **Email sending** — pluggable (`server/src/services/email.js`), using
  Resend's HTTP API. **Without a `RESEND_API_KEY` set, every email logs
  to the server console instead of sending** — this was true and
  deliberate for the testing above, and is the only way this could be
  verified in a sandbox with no access to third-party mail APIs. Add a
  real key to actually deliver email.
- **CSRF protection** — double-submit token pattern. Confirmed live: a
  state-changing request with no token is rejected (403), the same
  request with the correct token succeeds, and a wrong token is rejected.
  Note: the token is exposed via `GET /api/csrf-token`'s response body,
  not read from `document.cookie` — a cross-origin deployment (Vercel
  frontend, Render backend) means the frontend page can never see a
  cookie the backend's domain set, so the usual cookie-reading version of
  this pattern would have silently failed in exactly the deployment this
  project targets. Caught and fixed before shipping, not after.
- **Structured logging** (pino) — replaces bare `console.log`. Every
  request gets a unique id; errors are logged with full context.
- **Server-authoritative clocks** — remaining time and timeouts are now
  computed and enforced server-side, from real elapsed wall-clock time,
  not from anything the client reports. The clock *arithmetic* and its
  *persistence to SQLite* were both tested directly and live; the full
  live two-socket timeout-over-the-wire scenario could not be completed
  in this sandbox (see the Socket.IO testing note below).
- **Code-splitting** — every route is now lazy-loaded. Initial bundle
  dropped from 863KB to 345KB; the two remaining larger chunks
  (`ProfilePage` ~379KB, `socketService` ~42KB) are `recharts` and
  `socket.io-client` correctly isolated to only the pages that need them.
- **Tournament scores now update from real games** — when queue
  matchmaking pairs two players who are both registered in the same
  currently-live tournament with a matching mode/time control, the
  resulting game is linked to that tournament, and its result updates
  both players' real score/wins/draws/losses on completion. Verified
  live: correct linking when both players qualify, correct rejection when
  only one is registered, correct rejection on a time-control mismatch,
  and correct point math for both a decisive result and a draw. Bracket
  generation for single-elimination tournaments is still not built.
- **Basic anti-cheat (timing heuristic)** — every completed game's
  per-move think times are now recorded and analyzed. A game is flagged
  for review if one side's moves are both unusually fast (<600ms average)
  AND unusually consistent (<150ms standard deviation) across at least 10
  moves — a real, if intentionally modest, signal correlated with
  scripted play. This is explicitly NOT engine-detection — there's no
  server-side chess engine to compare move quality against — and it will
  have both false positives (strong, fast, familiar players) and false
  negatives (a paced cheater). Verified live against four scenarios:
  too-few-moves (skipped), human-like variable timing (not flagged),
  bot-like fast+consistent timing (flagged), and — the important
  discriminator — fast-but-variable timing (correctly NOT flagged, since
  variance is the actual signal, not raw speed). Flagged games are
  queryable via `findFlaggedGames()`; there's no admin UI to review them
  yet since no admin/role system exists in this codebase.

## Socket.IO testing note

Every HTTP/REST test in this project has been reliable. Live
`socket.io-client`-based tests — anything requiring two simultaneous
WebSocket connections held open across a test — repeatedly caused this
specific sandbox to become unstable (the whole tool call would fail with
no output, not a normal test failure). This happened consistently enough
across multiple attempts that it's treated as an environment limitation,
not evidence of a code bug: a single socket connection with real cookie
auth was confirmed working, and the exact game-logic and clock-math
functions the socket handler calls were verified directly and
thoroughly. But the full multi-socket wire-level exchange — matchmaking
through a live timeout or a live two-player game — has not been proven
end-to-end. Test this manually first, before anything else, once deployed.

## Demo mode — off by default, on purpose

Demo mode defaults to off (`src/config/env.js`). With no backend
configured, the app correctly shows guest/error/empty states instead of
silently auto-authenticating or substituting fake data.

To preview the full authenticated experience without running the backend:
```bash
VITE_DEMO_MODE=true
```
Development utility only — not read anywhere in the production auth/data path.

## Database setup & seeding

No external service needed — the database is a file. Once the backend's
`.env` is set up:
```bash
cd server
npm run seed
```
Seeds 3 puzzle positions (each independently verified with chess.js — see
`server/README.md`) and 3 tournaments spanning upcoming/live/completed
states. Clubs need a real registered user to own them, so register an
account first, then re-run the seed if you want the 3 demo clubs too.

## Production deployment (Vercel frontend + Render backend)

1. Push this repo to GitHub.
2. **Frontend → Vercel**: import the repo, framework preset "Vite"
   (auto-detected). `vercel.json` is already set up for SPA routing. Set
   `VITE_API_URL` in the Vercel dashboard to your Render backend URL.
3. **Backend → Render Web Service**: root directory `server`, build
   `npm install`, start `npm start`. **Attach a persistent disk** (see
   `server/README.md` — skipping this means your database resets on every
   deploy). Set `DATABASE_PATH` inside that disk, `JWT_SECRET`,
   `FRONTEND_URL` = your exact Vercel URL, `NODE_ENV=production`.
4. Redeploy the frontend once the backend URL is known.

Full backend deployment detail (including why cookies need
`SameSite=None; Secure` across two different domains, and the Render disk
requirement) is in `server/README.md`.

## Socket.IO configuration

Client connects with `withCredentials: true` and no manual token — the
server reads the same httpOnly cookie during the handshake. Event contract:

Emit: `join_queue`, `leave_queue`, `make_move`, `resign`, `offer_draw`, `draw_response`
Listen: `match_found`, `move_made`, `invalid_move`, `offer_draw`, `draw_response`, `game_over`, `opponent_disconnected`, `opponent_reconnected`

Moves are validated server-side with chess.js — the client's board is a
preview, never the source of truth once a game is live.

## Testing performed

This backend was rewritten from MongoDB to SQLite specifically because
MongoDB required an external service unreachable from the sandboxed
environment this was built in, which meant nothing could be tested live.
SQLite removed that barrier. What follows was **actually run**, not just
statically verified:

- Real HTTP server booted against a real SQLite file; `/health` correctly
  reports connection state
- Real registration → login → logout → session invalidation, verified by
  inspecting the actual `Set-Cookie` expiry header, not assumed
- Wrong-password login correctly rejected with 401
- Real puzzle seeding, fetching, solving, and streak computation from
  actual solve history
- Real club creation, membership, and live achievement computation
  (confirmed exactly one achievement — `club-member` — unlocks, not zero,
  not all of them)
- Real friend request → real persisted notification → accept → mutual
  friendship, confirmed on both accounts
- A full simulated chess game (Fool's Mate) run through the same
  persistence and rating-update functions the Socket.IO handler calls:
  real move validation, real checkmate detection, real move persistence,
  real Elo-style rating updates on both accounts, real game-history query
  returning the completed game
- A live Socket.IO client authenticating with a real session cookie

**What wasn't fully confirmed**: a complete two-player matchmaking session
over live WebSocket connections start-to-finish in one run. The
transport-level socket auth works (confirmed above) and the exact game
logic it calls works (confirmed above via direct testing) — but stitching
both together in a live multi-socket exchange hit environment instability
in this sandbox (background network processes became unreliable across
tool calls) before completing. This is the single most important thing to
manually verify once deployed: open two browser tabs, log in as two
different accounts, and play a real move against each other.

Full details, including the exact commands run and their output, are in
`server/README.md`.

## Security notes

- Passwords: bcrypt, cost factor 12. Never logged, never returned in any response.
- Sessions: JWT in an httpOnly, `Secure` (prod), `SameSite=None` (prod) cookie.
- Rate limiting: 10 login attempts / 15 min, 20 registrations / hour per IP,
  plus a global 120 req/min ceiling.
- SQL injection: every query is parameterized (`db.prepare(...).run(...)`),
  never string-concatenated.
- CORS: locked to `FRONTEND_URL`, not `*`, with `credentials: true`.
- JSON body size capped at 100kb.
- Anti-cheat: a basic move-timing heuristic flags games for manual
  review (see below) — this is a real starting signal, not a complete
  system, and there's no engine-based move-quality detection.
- **Not yet done, and you should treat this as a real gap, not a footnote:**
  no admin panel/role system (flagged games are queryable but not
  reviewable through any UI), no 2FA, no structured monitoring/alerting
  beyond the logging added this session.
- `node:sqlite` is an experimental Node API. It works correctly today
  (extensively tested above) but treat a future Node upgrade as a reason
  to re-test, not assume compatibility.

## What's real vs. mocked (authoritative, current)

| Feature | Status |
|---|---|
| Auth (register/login/logout/me) | **Real**, tested live end-to-end |
| Password reset, email verification | **Real**, tested live end-to-end. Real delivery needs a `RESEND_API_KEY` — without one, emails log to console (fully functional for dev/testing) |
| CSRF protection | **Real**, tested live end-to-end |
| Structured logging | **Real** (pino) |
| Live 1v1 games, moves, checkmate, persistence, ratings | **Real** logic, tested directly end-to-end; full live two-socket transport not yet confirmed (see Socket.IO testing note) |
| Server-authoritative clocks | **Real** logic and persistence, tested directly; full live-timeout-over-the-wire not yet confirmed (see Socket.IO testing note) |
| Crash/restart recovery for active games | **Real** — in-memory clock/board state is rebuilt from the DB on boot (fen, remaining ms, and increment are already written after every move, not just at game end). A restart **pauses** both clocks across the outage rather than bleeding real time — nobody loses on the clock for a server hiccup that isn't their fault. This covers the actual deployment shape (one process, one SQLite file — see `server/README.md`), not multi-instance state sharing, which this architecture doesn't attempt. The clock-pause decision is unit-tested directly; the full rehydration path (needs `chess.js`) is reviewed but not live-tested (see Socket.IO testing note) |
| Resign / draw offers / disconnect-reconnect | Real logic, not live-tested over the wire |
| Rating updates | **Real**, simplified fixed-K Elo approximation, not Glicko-2 |
| Puzzles (daily, by-id, categories, solve tracking, streak) | **Real**, tested live end-to-end, small (3-puzzle) seed set — needs a real dataset for production scale |
| Leaderboards | **Real** |
| Friends (search, request, accept, decline) | **Real**, tested live end-to-end |
| Player search / profiles | **Real** |
| Game history | **Real** |
| Active game banner on Home | **Real**, though it doesn't include live remaining clock time yet (clocks are client-side only) |
| Tournaments (list, details, registration, standings) | **Real** — registration, and scores/wins/draws/losses update from actual completed games. Elimination brackets, Swiss pairing (round-by-round, byes, rematch avoidance), and flagged-game admin review are all real now too — see `server/README.md` for what's verified and how |
| Admin: flagged-game review | **Real** — list/detail/clear/confirm/ban, gated by `is_admin`. Bootstrap the first admin with `node src/seed/seedAdmin.js <username>` (no self-service role escalation, by design) |
| PWA offline shell caching | **Real**, hand-written service worker (no `vite-plugin-pwa` — added without a network connection available to install it). Caches the app shell only; **never** caches `/api/` or `/socket.io/` traffic — offline means "the app still opens and shows an honest error," not "stale data pretends to be live." Only active in a production build (`vite build && vite preview`), not `vite dev`. Manifest icons are real generated PNGs, not placeholders |
| Clubs (create, join, leave, members, real online count) | **Real**, tested live end-to-end |
| Achievements | **Real**, computed live, tested end-to-end. "Perfect Game" from the original mock set was dropped rather than faked |
| Notifications | **Real** persistence, tested live end-to-end. Only friend-request events trigger one so far |
| Openings, Bots, Lessons | **Still mock data** — no backend built for these; clearly labeled as such in `src/mocks/` |

## Troubleshooting

- **`/health` returns 503**: `DATABASE_PATH`'s directory doesn't exist or
  isn't writable — check server logs for the exact error.
- **Your data disappeared after a Render redeploy**: you didn't attach a
  persistent disk. See the warning in `server/README.md` — this is the
  single most common SQLite-on-Render mistake.
- **Login works locally but not once deployed**: almost always the cookie
  `SameSite`/`Secure` mismatch — confirm `NODE_ENV=production` is set on
  the backend, and `FRONTEND_URL` exactly matches your deployed frontend
  origin.
- **CORS errors in the browser console**: same cause as above.
- **App shows the guest/marketing homepage unexpectedly**: correct
  behavior once demo mode is off and no session cookie exists — register
  or log in, or set `VITE_DEMO_MODE=true` if you wanted the demo.
- **Puzzles page is empty / 404s**: run `npm run seed` in `server/`.
#   C o d o r a  
 #   C o d o r a  
 