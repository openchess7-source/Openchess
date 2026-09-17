import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getDB } from '../src/db/connection.js';
import { resetDb, makeUser } from './helpers.js';
import {
  findFlaggedGames,
  findReviewedGames,
  getMovesForGame,
  setReviewStatus,
  flagGameForReview,
  appendMove,
} from '../src/db/games.js';
import { findUserById, setBanned, setAdmin } from '../src/db/users.js';

beforeEach(resetDb);

function makeGame(whiteId, blackId) {
  const id = `g-${Math.random()}`;
  const now = new Date().toISOString();
  getDB()
    .prepare(
      `INSERT INTO games (id, white_id, black_id, mode, initial, increment, fen, white_remaining_ms, black_remaining_ms, turn_started_at, created_at, updated_at)
       VALUES (?, ?, ?, 'bullet', 60, 0, 'startpos', 60000, 60000, ?, ?, ?)`
    )
    .run(id, whiteId, blackId, now, now, now);
  return id;
}

describe('flagged-game queries', () => {
  test('findFlaggedGames only returns pending, flagged games', () => {
    const [w, b] = [makeUser(), makeUser()];
    const flagged = makeGame(w, b);
    const notFlagged = makeGame(w, b);
    flagGameForReview(flagged, 'suspicious timing');

    const pending = findFlaggedGames();
    assert.equal(pending.length, 1);
    assert.equal(pending[0].id, flagged);
    assert.ok(!pending.some((g) => g.id === notFlagged));
  });

  test('a reviewed game drops out of the pending list and into the reviewed list', () => {
    const [w, b] = [makeUser(), makeUser()];
    const admin = makeUser();
    const gid = makeGame(w, b);
    flagGameForReview(gid, 'suspicious timing');

    assert.equal(findFlaggedGames().length, 1);
    assert.equal(findReviewedGames().length, 0);

    setReviewStatus(gid, 'cleared', admin);

    assert.equal(findFlaggedGames().length, 0);
    assert.equal(findReviewedGames().length, 1);
    assert.equal(findReviewedGames()[0].review_status, 'cleared');
    assert.equal(findReviewedGames()[0].reviewed_by, admin);
  });

  test('getMovesForGame returns moves in ply order with think times', () => {
    const [w, b] = [makeUser(), makeUser()];
    const gid = makeGame(w, b);
    appendMove(gid, 1, { from: 'e2', to: 'e4', san: 'e4' }, 400);
    appendMove(gid, 2, { from: 'e7', to: 'e5', san: 'e5' }, 410);

    const moves = getMovesForGame(gid);
    assert.equal(moves.length, 2);
    assert.equal(moves[0].ply, 1);
    assert.equal(moves[0].san, 'e4');
    assert.equal(moves[1].think_time_ms, 410);
  });
});

describe('ban / admin flags', () => {
  test('setBanned toggles the banned column', () => {
    const u = makeUser();
    assert.equal(findUserById(u).banned, 0);
    setBanned(u, true);
    assert.equal(findUserById(u).banned, 1);
    setBanned(u, false);
    assert.equal(findUserById(u).banned, 0);
  });

  test('setAdmin toggles the is_admin column', () => {
    const u = makeUser();
    assert.equal(findUserById(u).is_admin, 0);
    setAdmin(u, true);
    assert.equal(findUserById(u).is_admin, 1);
  });
});
