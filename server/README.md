# Openchess Server

Express + **SQLite** (via Node's built-in `node:sqlite`) + Socket.IO
backend. Real bcrypt-hashed auth in a real database, JWT in an httpOnly
cookie, and server-authoritative live games via chess.js.

No external database service, no separate signup, no connection string to
manage — the entire database is a single file. This was previously built
on MongoDB/Mongoose; it was rewritten to SQLite specifically so it could
run and be tested with zero external dependencies.

## ⚠️ Critical: Render's disk is ephemeral by default

**If you deploy this to Render without attaching a persistent disk, your
entire database is wiped every time the service restarts or redeploys.**
This is not a hypothetical edge case — Render restarts services routinely
(deploys, scaling events, host maintenance).

To fix this:
1. In the Render dashboard, add a **Disk** to your Web Service (Render's
   paid instance types support this — check current pricing).
2. Mount it at, say, `/var/data`.
3. Set `DATABASE_PATH=/var/data/openchess.db` in your environment variables.

Without this, treat every deploy as a full data wipe. That's fine for
testing, not fine for real users.

## 1. Run it locally

```bash
npm install
cp .env.example .env      # DATABASE_PATH defaults to ./data/openchess.db, no changes needed locally
npm run seed               # seeds 3 verified puzzles + 3 tournaments (clubs need a real user first — see below)
npm run dev
```

Check `http://localhost:4000/health` → `{"ok":true,"db":"connected"}`.

Register a real account through the frontend, then re-run `npm run seed`
if you want the demo clubs too (they need an existing user to own them —
the seed script won't invent one).

## 2. Point the frontend at it

```bash
# frontend .env.local
VITE_API_URL=http://localhost:4000
```

## 3. Deploy to Render

- **New → Web Service**
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- **Attach a persistent disk** (see the warning above) and set
  `DATABASE_PATH` to a path inside it
- Set `JWT_SECRET`, `FRONTEND_URL` (your exact Vercel URL, no trailing
  slash), `NODE_ENV=production`
- Deploy, then run the seed script once via Render's shell (Dashboard →
  Shell) or a one-off job: `npm run seed`

Then set the frontend's `VITE_API_URL` on Vercel to this service's URL and
redeploy.

### Why cookies need `SameSite=None; Secure` in production

The frontend (Vercel) and this server (Render) live on two different
domains, which makes every request cross-site. Browsers only send cookies
cross-site when they're `SameSite=None` **and** `Secure` (HTTPS-only) —
`src/utils/jwt.js` already does this automatically based on `NODE_ENV`.
Locally (`http://`), it falls back to `SameSite=Lax` since `None+Secure`
cookies are rejected over plain HTTP by the browser.

If login works locally but silently fails once deployed, check this
mismatch first, then double-check `FRONTEND_URL` matches your live Vercel
URL exactly.

## Why SQLite instead of MongoDB

This started as a MongoDB/Mongoose backend. It was fully rewritten to
SQLite on request, specifically so the whole thing lives in one file
alongside the app with no external database service to provision. The
tradeoff, stated plainly:

- **Pro**: nothing to sign up for, no connection string, no network
  latency to a DB host, and — the reason this rewrite was worth doing —
  it can finally be tested for real in any environment, including one
  with no external network access, because the "database" is just a file.
- **Con**: SQLite handles concurrent writes by serializing them (one
  writer at a time). Fine at the scale this app is at. If this ever needs
  multiple server instances behind a load balancer, SQLite will not scale
  to that the way Postgres/MongoDB would — that's a real architectural
  ceiling, not a minor caveat.
- **Con**: `node:sqlite` is still an **experimental** Node API as of Node
  22. It works correctly today (extensively tested — see below) but its
  API could change in a future Node version. `.node-version` and
  `package.json`'s `engines` field pin this to Node ≥22.5 to reduce that
  risk; re-verify after any Node upgrade.

## Testing performed — this time with a real, live database

Unlike the MongoDB version of this backend, SQLite needs no external
service, so this was actually run end-to-end, not just statically
analyzed. All of the following were executed for real, against a real
database file, in this environment:

- **Real HTTP server + real SQLite file**: booted the server, hit
  `/health`, confirmed `{"ok":true,"db":"connected"}`.
- **Real registration → real login → real logout → real session
  invalidation**: registered an account, fetched `/api/auth/me`
  successfully, logged out, confirmed the `Set-Cookie` header actually
  expires the cookie, and confirmed `/api/auth/me` correctly returns 401
  once a client respects that (verified by inspecting the raw response
  headers, not just assuming).
  Also confirmed a wrong password is correctly rejected with 401.
- **Real puzzle flow**: ran the seed script against a live file, fetched
  the daily puzzle, submitted a real solve, and confirmed the streak
  endpoint correctly computed `1` from actual `PuzzleSolve` rows.
- **Real club flow**: created a club via the API, confirmed it appeared
  under "my clubs," and confirmed the `club-member` achievement — and
  *only* that one — came back unlocked, computed live from real data.
- **Real friend flow**: sent a friend request, confirmed a real
  notification was created for the recipient, accepted it, and confirmed
  both users now show up in each other's friends list.
- **Real chess game logic end-to-end**: created two real users, created a
  real game row, replayed an actual Fool's Mate move sequence through
  chess.js, persisted every move, marked the game completed, ran the
  Elo-style rating update, and confirmed both users' ratings/win-loss
  records changed correctly in the database. Also confirmed the completed
  game shows up in the winner's real game-history query.
- **Live Socket.IO connection with real cookie auth**: confirmed a real
  socket client can connect and authenticate using an actual session
  cookie from a real login.

**What I was not able to fully verify**: a complete two-player matchmaking
session (join_queue → match_found → moves → game_over) over live
WebSocket connections end-to-end in a single run. Individual pieces of
this were confirmed separately (socket auth works; the exact same
game-completion/persistence logic the socket handler calls was verified
directly and thoroughly, above) — but I couldn't get a full multi-message
two-socket exchange to complete reliably in this sandboxed environment
before it became unstable running persistent background network
processes. That's a real, specific gap: the socket *transport* wiring for
a live two-player match hasn't been confirmed working end-to-end, even
though every piece it depends on has been. This is the first thing to
manually test once deployed — open two browser tabs, log in as two
different users, and play a move.

## Security notes

- Passwords: bcrypt, cost factor 12. Never logged, never returned in any response.
- Sessions: JWT in an httpOnly, `Secure` (prod), `SameSite=None` (prod) cookie.
- Rate limiting: 10 login attempts / 15 min, 20 registrations / hour per IP,
  plus a global 120 req/min ceiling.
- CORS: locked to `FRONTEND_URL`, not `*`, with `credentials: true`.
- JSON body size capped at 100kb.
- SQL injection: all queries use parameterized statements
  (`db.prepare(...).run(...)`), never string concatenation.
- **Not yet done**: CSRF token (relies on `SameSite` cookie protection
  only), anti-cheat/engine-detection, email verification, password-reset
  backend (frontend UI exists at `/forgot-password`, no endpoint), no
  structured logging/observability.

## What's real vs. mocked

| Feature | Status |
|---|---|
| Auth (register/login/logout/me) | **Real**, tested live end-to-end |
| Live 1v1 games, moves, checkmate detection, persistence, ratings | **Real** logic, tested directly end-to-end; live two-socket transport not fully confirmed (see above) |
| Resign / draw offers / disconnect-reconnect | Real logic, not live-tested over the wire |
| Puzzles (daily, by-id, categories, solve tracking, streak) | **Real**, tested live end-to-end, small (3-puzzle) seed set |
| Leaderboards | **Real** |
| Friends (request, accept, decline) | **Real**, tested live end-to-end |
| Player search / profiles | **Real** |
| Game history | **Real** |
| Clubs (create, join, leave, members, real online count) | **Real**, tested live end-to-end |
| Achievements | **Real**, computed live, tested end-to-end |
| Notifications | **Real** persistence; only friend-request events trigger one so far |
| Tournaments | Real registration/standings; scores don't update from real games yet |
| Openings, Bots, Lessons | Still mock data on the frontend — no backend built |
