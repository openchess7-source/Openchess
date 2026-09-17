import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getDB } from '../src/db/connection.js';
import { resetDb, makeUsers } from './helpers.js';
import { upsertTournament, applyByePoint, getStandings, joinTournament } from '../src/db/tournaments.js';
import {
  insertMatch,
  getRoundMatches,
  isRoundComplete,
  getPlayedPairKeys,
  getByeRecipients,
  setMatchResult,
  serializeRoundMatches,
} from '../src/db/brackets.js';

beforeEach(resetDb);

function makeSwissTournament(totalRounds = 3) {
  return upsertTournament({
    name: `S-${Math.random()}`,
    format: 'Swiss',
    formatType: 'swiss',
    totalRounds,
    mode: 'rapid',
    initial: 900,
    increment: 10,
    startsAt: new Date().toISOString(),
  });
}

describe('Swiss DB queries', () => {
  test('isRoundComplete is false while any match is pending or active', () => {
    const t = makeSwissTournament();
    const [a, b, c, d] = makeUsers(4);
    insertMatch(t, 1, 0, a, b, 'pending');
    insertMatch(t, 1, 1, c, d, 'active');
    assert.equal(isRoundComplete(t, 1), false);
  });

  test('isRoundComplete is true once every match is completed or bye', () => {
    const t = makeSwissTournament();
    const [a, b, c] = makeUsers(3);
    const m1 = insertMatch(t, 1, 0, a, b, 'pending');
    insertMatch(t, 1, 1, c, null, 'bye');
    assert.equal(isRoundComplete(t, 1), false);
    setMatchResult(m1, 'player1', a);
    assert.equal(isRoundComplete(t, 1), true);
  });

  test('getPlayedPairKeys aggregates across all rounds, order-independent', () => {
    const t = makeSwissTournament();
    const [a, b, c] = makeUsers(3);
    insertMatch(t, 1, 0, a, b, 'pending');
    insertMatch(t, 2, 0, b, a, 'pending'); // reversed order, same pair
    insertMatch(t, 2, 1, a, c, 'pending');
    const keys = getPlayedPairKeys(t);
    assert.equal(keys.size, 2); // a-b (deduped) and a-c
    assert.ok(keys.has(a < b ? `${a}-${b}` : `${b}-${a}`));
    assert.ok(keys.has(a < c ? `${a}-${c}` : `${c}-${a}`));
  });

  test('getByeRecipients only counts status=bye rows', () => {
    const t = makeSwissTournament();
    const [a, b] = makeUsers(2);
    insertMatch(t, 1, 0, a, null, 'bye');
    insertMatch(t, 1, 1, b, null, 'pending'); // not actually a bye status
    const byes = getByeRecipients(t);
    assert.equal(byes.size, 1);
    assert.ok(byes.has(a));
  });

  test('applyByePoint adds exactly one point without touching win/loss/draw counts', () => {
    const t = makeSwissTournament();
    const [a] = makeUsers(1);
    joinTournament(t, a);
    applyByePoint(t, a);
    const standings = getStandings(t);
    assert.equal(standings[0].score, 1);
    assert.equal(standings[0].wins, 0);
  });

  test('serializeRoundMatches stringifies ids and includes both players', () => {
    const t = makeSwissTournament();
    const [a, b] = makeUsers(2);
    insertMatch(t, 1, 0, a, b, 'pending');
    const [m] = serializeRoundMatches(t, 1);
    assert.equal(typeof m.player1.id, 'string');
    assert.equal(m.player1.id, String(a));
    assert.equal(m.player2.id, String(b));
  });

  test('getRoundMatches only returns the requested round, sorted by slot', () => {
    const t = makeSwissTournament();
    const [a, b, c, d] = makeUsers(4);
    insertMatch(t, 1, 1, c, d, 'pending');
    insertMatch(t, 1, 0, a, b, 'pending');
    insertMatch(t, 2, 0, a, c, 'pending');
    const round1 = getRoundMatches(t, 1);
    assert.equal(round1.length, 2);
    assert.equal(round1[0].slot, 0);
    assert.equal(round1[1].slot, 1);
  });
});
