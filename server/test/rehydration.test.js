import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getDB } from '../src/db/connection.js';
import { resetDb, makeUsers } from './helpers.js';
import { createGame, completeGame, findAllActiveGames } from '../src/db/games.js';
import { computeRehydratedClockState } from '../src/services/rehydration.js';

describe('computeRehydratedClockState — pure clock-pause logic', () => {
  test('carries remaining ms over exactly, does not deduct anything', () => {
    const game = { white_remaining_ms: 42_000, black_remaining_ms: 17_500, increment: 5 };
    const state = computeRehydratedClockState(game, 999_999);
    assert.equal(state.remaining.white, 42_000);
    assert.equal(state.remaining.black, 17_500);
  });

  test('turnStartedAt becomes "now", not anything derived from the old timestamp', () => {
    const game = { white_remaining_ms: 1000, black_remaining_ms: 1000, increment: 0 };
    const now = 1_700_000_000_000;
    const state = computeRehydratedClockState(game, now);
    assert.equal(state.turnStartedAt, now);
  });

  test('a long outage does not reduce remaining time — the whole point of pausing', () => {
    const game = { white_remaining_ms: 5000, black_remaining_ms: 5000, increment: 0 };
    // Simulate rehydrating a full hour after the game's last persisted move.
    const farFuture = Date.now() + 60 * 60 * 1000;
    const state = computeRehydratedClockState(game, farFuture);
    assert.equal(state.remaining.white, 5000, 'an hour of downtime must not cost the player any clock time');
    assert.equal(state.remaining.black, 5000);
  });

  test('even a player already at 0ms remaining is preserved as 0, not negative or reset', () => {
    const game = { white_remaining_ms: 0, black_remaining_ms: 3000, increment: 0 };
    const state = computeRehydratedClockState(game);
    assert.equal(state.remaining.white, 0);
    // (armTimeoutTimer in sockets/index.js is what actually ends this
    // game near-instantly via Math.max(0, msRemaining) — this function's
    // job is only to carry the number over faithfully.)
  });

  test('converts increment from seconds (DB) to ms (in-memory), same convention as everywhere else', () => {
    const game = { white_remaining_ms: 1000, black_remaining_ms: 1000, increment: 10 };
    const state = computeRehydratedClockState(game);
    assert.equal(state.incrementMs, 10_000);
  });
});

describe('findAllActiveGames', () => {
  beforeEach(resetDb);

  function makeGame(whiteId, blackId) {
    return createGame({ whiteId, blackId, mode: 'blitz', initial: 300, increment: 0, fen: 'startpos' });
  }

  test('returns only status=active games, not completed ones', () => {
    const [a, b] = makeUsers(2);
    const active1 = makeGame(a, b);
    const active2 = makeGame(a, b);
    const done = makeGame(a, b);
    completeGame(done, { result: 'white', reason: 'checkmate' });

    const found = findAllActiveGames().map((g) => g.id);
    assert.ok(found.includes(active1));
    assert.ok(found.includes(active2));
    assert.ok(!found.includes(done));
    assert.equal(found.length, 2);
  });

  test('returns an empty array, not an error, when nothing is active', () => {
    assert.deepEqual(findAllActiveGames(), []);
  });

  test('every field rehydration actually needs is present on the returned rows', () => {
    const [a, b] = makeUsers(2);
    const gid = makeGame(a, b);
    const [row] = findAllActiveGames();
    assert.equal(row.id, gid);
    for (const field of ['fen', 'white_id', 'black_id', 'white_remaining_ms', 'black_remaining_ms', 'increment']) {
      assert.ok(field in row, `missing field ${field}`);
    }
  });
});
