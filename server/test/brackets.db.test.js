import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getDB } from '../src/db/connection.js';
import { resetDb, makeUsers } from './helpers.js';
import {
  insertMatch,
  hasBracket,
  getMatch,
  getMatchByGameId,
  setMatchGame,
  setMatchWinner,
  setMatchPlayer,
  getMaxRound,
  isBracketComplete,
  getBracketWinner,
  serializeBracket,
} from '../src/db/brackets.js';
import { upsertTournament } from '../src/db/tournaments.js';

function makeTournament() {
  return upsertTournament({
    name: `T-${Math.random()}`,
    format: 'Single elimination',
    formatType: 'elimination',
    mode: 'bullet',
    initial: 60,
    increment: 0,
    startsAt: new Date().toISOString(),
  });
}

// Inserts a minimal real games row so game_id foreign keys resolve —
// mirrors what sockets/index.js's createGame() actually writes.
function makeGame(tournamentId, whiteId, blackId) {
  const id = `g-${Math.random()}`;
  const now = new Date().toISOString();
  getDB()
    .prepare(
      `INSERT INTO games (id, white_id, black_id, mode, tournament_id, initial, increment, fen, white_remaining_ms, black_remaining_ms, turn_started_at, created_at, updated_at)
       VALUES (?, ?, ?, 'bullet', ?, 60, 0, 'startpos', 60000, 60000, ?, ?, ?)`
    )
    .run(id, whiteId, blackId, tournamentId, now, now, now);
  return id;
}

beforeEach(resetDb);

describe('tournament_matches CRUD', () => {
  test('hasBracket is false until a match exists, true after', () => {
    const t = makeTournament();
    assert.equal(hasBracket(t), false);
    insertMatch(t, 1, 0, null, null, 'pending');
    assert.equal(hasBracket(t), true);
  });

  test('setMatchPlayer writes the correct column for position 1 vs 2', () => {
    const t = makeTournament();
    const [a, b] = makeUsers(2);
    const id = insertMatch(t, 2, 0, null, null, 'pending');
    setMatchPlayer(id, 1, a);
    setMatchPlayer(id, 2, b);
    const m = getMatch(t, 2, 0);
    assert.equal(m.player1_id, a);
    assert.equal(m.player2_id, b);
  });

  test('setMatchGame flips status to active and stores the game id', () => {
    const t = makeTournament();
    const [a, b] = makeUsers(2);
    const id = insertMatch(t, 1, 0, a, b, 'pending');
    const gid = makeGame(t, a, b);
    setMatchGame(id, gid);
    const m = getMatch(t, 1, 0);
    assert.equal(m.status, 'active');
    assert.equal(m.game_id, gid);
    assert.deepEqual(getMatchByGameId(gid).id, id);
  });

  test('setMatchWinner defaults status to completed, accepts override for byes', () => {
    const t = makeTournament();
    const [a] = makeUsers(1);
    const id1 = insertMatch(t, 1, 0, a, null, 'bye');
    setMatchWinner(id1, a, 'bye');
    assert.equal(getMatch(t, 1, 0).status, 'bye');

    const id2 = insertMatch(t, 1, 1, a, a, 'pending');
    setMatchWinner(id2, a);
    assert.equal(getMatch(t, 1, 1).status, 'completed');
  });
});

describe('bracket completion detection', () => {
  test('isBracketComplete is false with no matches at all', () => {
    const t = makeTournament();
    assert.equal(isBracketComplete(t), false);
    assert.equal(getBracketWinner(t), null);
  });

  test('is false while the final round exists but is undecided', () => {
    const t = makeTournament();
    const [a, b] = makeUsers(2);
    insertMatch(t, 1, 0, a, b, 'pending'); // getMaxRound = 1, this IS the final, but status pending
    assert.equal(isBracketComplete(t), false);
  });

  test('is true once the single final match is completed, and reports the right winner', () => {
    const t = makeTournament();
    const [a, b] = makeUsers(2);
    const id = insertMatch(t, 1, 0, a, b, 'pending');
    setMatchWinner(id, a);
    assert.equal(isBracketComplete(t), true);
    assert.equal(getBracketWinner(t), String(a));
  });

  test('a bye final also counts as complete', () => {
    const t = makeTournament();
    const [a] = makeUsers(1);
    const id = insertMatch(t, 1, 0, a, null, 'bye');
    setMatchWinner(id, a, 'bye');
    assert.equal(isBracketComplete(t), true);
  });

  test('multi-round bracket: only the LAST round decides completeness, not round 1', () => {
    const t = makeTournament();
    const [a, b, c, d] = makeUsers(4);
    const r1a = insertMatch(t, 1, 0, a, b, 'pending');
    insertMatch(t, 1, 1, c, d, 'pending');
    insertMatch(t, 2, 0, null, null, 'pending'); // getMaxRound is now 2

    setMatchWinner(r1a, a); // round 1 slot 0 done...
    assert.equal(isBracketComplete(t), false, 'round 1 finishing should not mark the tournament complete');

    const final = getMatch(t, 2, 0);
    setMatchWinner(final.id, a);
    assert.equal(isBracketComplete(t), true);
  });
});

describe('serializeBracket — ids are stringified to match serializeUser()', () => {
  test('player and winner ids come back as strings, nulls stay null', () => {
    const t = makeTournament();
    const [a, b] = makeUsers(2);
    const id = insertMatch(t, 1, 0, a, b, 'pending');
    setMatchWinner(id, a);
    insertMatch(t, 2, 0, null, null, 'pending');

    const rounds = serializeBracket(t);
    assert.equal(rounds.length, 2);
    const [m] = rounds[0];
    assert.equal(typeof m.player1.id, 'string');
    assert.equal(m.player1.id, String(a));
    assert.equal(typeof m.winnerId, 'string');
    assert.equal(m.winnerId, String(a));

    const [pending] = rounds[1];
    assert.equal(pending.player1, null);
    assert.equal(pending.winnerId, null);
  });

  test('rounds come back sorted, and matches within a round sorted by slot', () => {
    const t = makeTournament();
    const [a, b, c, d] = makeUsers(4);
    // Insert out of order on purpose.
    insertMatch(t, 1, 1, c, d, 'pending');
    insertMatch(t, 1, 0, a, b, 'pending');
    insertMatch(t, 2, 0, null, null, 'pending');

    const rounds = serializeBracket(t);
    assert.deepEqual(rounds.map((r) => r.length), [2, 1]);
    assert.equal(rounds[0][0].slot, 0);
    assert.equal(rounds[0][1].slot, 1);
  });
});
