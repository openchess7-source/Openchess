import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { pairRound } from '../src/services/swiss.js';

function players(n, scores = {}) {
  return Array.from({ length: n }, (_, i) => ({ userId: i + 1, score: scores[i + 1] ?? 0, rating: 1000 - i }));
}

describe('pairRound — basic shape', () => {
  test('even field, round 1: everyone paired, no bye', () => {
    const { pairs, byeUserId } = pairRound(players(8));
    assert.equal(byeUserId, null);
    assert.equal(pairs.length, 4);
    const seen = new Set();
    for (const { a, b } of pairs) {
      seen.add(a);
      seen.add(b);
    }
    assert.equal(seen.size, 8, 'every player appears exactly once');
  });

  test('odd field: exactly one bye, everyone else paired', () => {
    const { pairs, byeUserId } = pairRound(players(7));
    assert.notEqual(byeUserId, null);
    assert.equal(pairs.length, 3);
    const seen = new Set([byeUserId]);
    for (const { a, b } of pairs) {
      seen.add(a);
      seen.add(b);
    }
    assert.equal(seen.size, 7);
  });

  test('a single player: bye, no pairs', () => {
    const { pairs, byeUserId } = pairRound(players(1));
    assert.equal(pairs.length, 0);
    assert.equal(byeUserId, 1);
  });

  test('nobody appears twice, nobody is dropped, across many field sizes', () => {
    for (let n = 2; n <= 33; n++) {
      const { pairs, byeUserId } = pairRound(players(n));
      const seen = [];
      if (byeUserId !== null) seen.push(byeUserId);
      for (const { a, b } of pairs) seen.push(a, b);
      assert.equal(seen.length, n, `n=${n}`);
      assert.equal(new Set(seen).size, n, `n=${n} had a duplicate`);
    }
  });
});

describe('pairRound — bye fairness', () => {
  test('bye goes to the lowest-scored, lowest-rated player when nobody has had one yet', () => {
    const ps = players(5); // scores all 0, ratings 1000,999,998,997,996 -> lowest rating is userId 5
    const { byeUserId } = pairRound(ps);
    assert.equal(byeUserId, 5);
  });

  test('a player who already had a bye does not get a second one while others have none', () => {
    const ps = players(5);
    const priorByes = new Set([5]); // player 5 already had a bye
    const { byeUserId } = pairRound(ps, new Set(), priorByes);
    assert.notEqual(byeUserId, 5);
    assert.equal(byeUserId, 4); // next-lowest-ranked without a bye
  });

  test('degenerate case: everyone has had a bye already — still pairs the round instead of failing', () => {
    const ps = players(3);
    const priorByes = new Set([1, 2, 3]);
    const { byeUserId, pairs } = pairRound(ps, new Set(), priorByes);
    assert.notEqual(byeUserId, null);
    assert.equal(pairs.length, 1);
  });
});

describe('pairRound — score-based seeding', () => {
  test('players are grouped/ranked by score first, not just rating', () => {
    // userId 4 has a low rating but the highest score — should rank above
    // higher-rated but lower-scoring players.
    const ps = [
      { userId: 1, score: 1, rating: 1500 },
      { userId: 2, score: 1, rating: 1400 },
      { userId: 3, score: 0, rating: 1600 },
      { userId: 4, score: 2, rating: 900 },
    ];
    const { pairs } = pairRound(ps);
    // Sorted by score desc: [4(2), 1(1), 2(1), 3(0)] -> top=[4,1], bottom=[2,3]
    // Fold pairing: 4 vs 2, 1 vs 3
    const asSet = new Set(pairs.map(({ a, b }) => [a, b].sort((x, y) => x - y).join(',')));
    assert.ok(asSet.has('2,4'));
    assert.ok(asSet.has('1,3'));
  });
});

describe('pairRound — rematch avoidance', () => {
  test('avoids a pairing that has already happened when an alternative exists', () => {
    const ps = players(4); // 1,2,3,4 — round 1 fold pairing would be 1v3, 2v4
    const prior = new Set(['1-3']); // 1 and 3 already played
    const { pairs } = pairRound(ps, prior);
    const asKeys = pairs.map(({ a, b }) => (a < b ? `${a}-${b}` : `${b}-${a}`));
    assert.ok(!asKeys.includes('1-3'), 'should not repeat a pairing that already happened when swapping avoids it');
  });

  test('falls back to a repeat pairing rather than failing when no alternative exists', () => {
    const ps = players(2);
    const prior = new Set(['1-2']);
    const { pairs } = pairRound(ps, prior);
    assert.equal(pairs.length, 1);
    assert.deepEqual([pairs[0].a, pairs[0].b].sort(), [1, 2]);
  });
});
