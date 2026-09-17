import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { nextPowerOfTwo, seedOrder, buildSeeding, nextSlot } from '../src/services/bracket.js';

describe('nextPowerOfTwo', () => {
  test('exact powers of two map to themselves', () => {
    assert.equal(nextPowerOfTwo(1), 1);
    assert.equal(nextPowerOfTwo(2), 2);
    assert.equal(nextPowerOfTwo(4), 4);
    assert.equal(nextPowerOfTwo(8), 8);
  });
  test('rounds up to the next power of two', () => {
    assert.equal(nextPowerOfTwo(3), 4);
    assert.equal(nextPowerOfTwo(5), 8);
    assert.equal(nextPowerOfTwo(7), 8);
    assert.equal(nextPowerOfTwo(9), 16);
    assert.equal(nextPowerOfTwo(17), 32);
  });
});

describe('seedOrder', () => {
  test('known small cases match standard tournament seeding', () => {
    assert.deepEqual(seedOrder(2), [1, 2]);
    assert.deepEqual(seedOrder(4), [1, 4, 2, 3]);
    assert.deepEqual(seedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]);
  });

  test('is a permutation of 1..size for every power-of-two size up to 128', () => {
    for (let size = 2; size <= 128; size *= 2) {
      const order = seedOrder(size);
      const sorted = [...order].sort((a, b) => a - b);
      assert.deepEqual(sorted, Array.from({ length: size }, (_, i) => i + 1), `size=${size}`);
    }
  });
});

describe('nextSlot — round-advancement arithmetic used by propagateWinner in production', () => {
  test('two round-1 matches converge on the same round-2 match, opposite positions', () => {
    assert.deepEqual(nextSlot(1, 0), { round: 2, slot: 0, position: 1 });
    assert.deepEqual(nextSlot(1, 1), { round: 2, slot: 0, position: 2 });
    assert.deepEqual(nextSlot(1, 2), { round: 2, slot: 1, position: 1 });
    assert.deepEqual(nextSlot(1, 3), { round: 2, slot: 1, position: 2 });
  });

  test('every slot in a round maps to a slot within range for the next round', () => {
    for (let round = 1; round <= 5; round++) {
      const matchesThisRound = 2 ** (6 - round); // e.g. round 1 of a 64-bracket has 32 matches
      const matchesNextRound = matchesThisRound / 2;
      for (let slot = 0; slot < matchesThisRound; slot++) {
        const dest = nextSlot(round, slot);
        assert.equal(dest.round, round + 1);
        assert.ok(dest.slot >= 0 && dest.slot < matchesNextRound, `slot ${dest.slot} out of range for round ${dest.round}`);
        assert.ok(dest.position === 1 || dest.position === 2);
      }
    }
  });

  test('no two round-1 slots collide on the same (nextSlot, position) pair', () => {
    const seen = new Set();
    for (let slot = 0; slot < 16; slot++) {
      const dest = nextSlot(1, slot);
      const key = `${dest.round}-${dest.slot}-${dest.position}`;
      assert.ok(!seen.has(key), `collision at ${key}`);
      seen.add(key);
    }
  });
});
describe('buildSeeding — the property that actually matters: byes never face each other', () => {
  // For every participant count from 2 to 40, no round-1 match should
  // ever end up with both slots empty (two byes paired together) — that
  // would silently eliminate zero players and produce a broken bracket.
  for (let n = 2; n <= 40; n++) {
    test(`n=${n} produces no double-null round-1 match`, () => {
      const ids = Array.from({ length: n }, (_, i) => i + 1);
      const { size, rounds, slots } = buildSeeding(ids);

      assert.ok(size >= n, 'bracket size must fit every participant');
      assert.equal(size, 2 ** rounds, 'size must be a power of two');
      assert.equal(slots.length, size);

      const realPlayers = slots.filter((s) => s !== null);
      assert.equal(realPlayers.length, n, 'every participant appears exactly once');
      assert.equal(new Set(realPlayers).size, n, 'no participant appears twice');

      for (let i = 0; i < size / 2; i++) {
        const p1 = slots[2 * i];
        const p2 = slots[2 * i + 1];
        assert.ok(p1 !== null || p2 !== null, `match ${i} has two byes (n=${n})`);
      }
    });
  }

  test('exact power-of-two counts produce zero byes', () => {
    for (const n of [2, 4, 8, 16, 32]) {
      const ids = Array.from({ length: n }, (_, i) => i + 1);
      const { slots } = buildSeeding(ids);
      assert.ok(slots.every((s) => s !== null), `n=${n} should have no byes`);
    }
  });

  test('shuffles across calls (not the same seat order every time)', () => {
    const ids = Array.from({ length: 16 }, (_, i) => i + 1);
    const runs = new Set();
    for (let i = 0; i < 20; i++) runs.add(buildSeeding(ids).slots.join(','));
    // Overwhelmingly likely to see more than one distinct arrangement in
    // 20 runs of a real shuffle; this would only ever flake by fluke.
    assert.ok(runs.size > 1, 'expected randomized seeding across repeated calls');
  });
});
