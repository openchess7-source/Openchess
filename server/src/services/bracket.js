// Pure bracket-math helpers. Deliberately has no database or socket
// dependency so the seeding logic can be reasoned about (and tested) on
// its own — the orchestration that turns this into real games lives in
// sockets/index.js, next to the rest of the live-game machinery.

export function nextPowerOfTwo(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// Standard single-elimination seed order, e.g. seedOrder(8) -> [1,8,4,5,2,7,3,6].
// Seed 1 plays the lowest remaining seed, seed 2 the next, etc., so that
// (as long as byes occupy the *highest* seed numbers, which is how
// generateBracket assigns them) no round-1 match can ever pair two byes
// against each other — every bracket size we generate has byes < size/2.
export function seedOrder(size) {
  let seeds = [1];
  while (seeds.length < size) {
    const n = seeds.length * 2;
    const next = [];
    for (const s of seeds) next.push(s, n + 1 - s);
    seeds = next;
  }
  return seeds;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Returns { round, slot, position } — where a round-1 match's winner
// should land in the next round. position is 1 or 2 (which side of the
// next match they fill). Pure so it can be unit-tested directly; the
// caller (sockets/index.js) is responsible for actually writing it and
// deciding whether round was the final.
export function nextSlot(round, slot) {
  return {
    round: round + 1,
    slot: Math.floor(slot / 2),
    position: slot % 2 === 0 ? 1 : 2,
  };
}

// Returns { size, rounds, slots } where slots[i] is a userId or null
// (bye), in round-1 bracket order (pair slots[0]&[1], [2]&[3], ...).
export function buildSeeding(participantIds) {
  const n = participantIds.length;
  const size = nextPowerOfTwo(n);
  const rounds = Math.log2(size);
  const order = seedOrder(size);
  const shuffled = shuffle(participantIds);
  const slots = order.map((seed) => (seed <= n ? shuffled[seed - 1] : null));
  return { size, rounds, slots };
}
