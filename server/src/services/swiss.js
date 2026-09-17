// Simplified Swiss pairing: sort by score (then rating as a seeding
// tiebreak), split into top/bottom halves, pair across the split ("fold"
// pairing), and greedily avoid rematches. This is NOT a full Dutch-system
// constraint solver — a real tournament arbiter's software does far more
// (color balancing, float limits, exhaustive rematch avoidance via
// backtracking). At the field sizes and round counts a casual online
// tournament actually runs, this produces valid, sensible pairings; in a
// small or adversarial field it can fall back to a repeat pairing rather
// than fail outright. That trade-off is deliberate and documented, same
// as the honesty policy in services/anticheat.js.

function pairKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/**
 * @param {{userId: number, score: number, rating: number}[]} players
 * @param {Set<string>} priorPairKeys - pairKey(a,b) for every pair that has already played
 * @param {Set<number>} priorByeIds - userIds who have already received a bye
 * @returns {{ pairs: {a: number, b: number}[], byeUserId: number|null }}
 */
export function pairRound(players, priorPairKeys = new Set(), priorByeIds = new Set()) {
  const sorted = [...players].sort(
    (x, y) => y.score - x.score || y.rating - x.rating || x.userId - y.userId
  );

  let pool = sorted;
  let byeUserId = null;

  if (pool.length % 2 === 1) {
    // The lowest-ranked player without a prior bye gets this one — giving
    // byes to weaker players first is the standard Swiss convention.
    let byeIndex = -1;
    for (let i = pool.length - 1; i >= 0; i--) {
      if (!priorByeIds.has(pool[i].userId)) {
        byeIndex = i;
        break;
      }
    }
    // Degenerate case: everyone has already had a bye (very short field,
    // many rounds). Give it to the last-ranked player again rather than
    // fail to pair the round at all.
    if (byeIndex === -1) byeIndex = pool.length - 1;
    byeUserId = pool[byeIndex].userId;
    pool = pool.slice(0, byeIndex).concat(pool.slice(byeIndex + 1));
  }

  const half = pool.length / 2;
  const top = pool.slice(0, half);
  const bottom = pool.slice(half);

  const usedBottom = new Set();
  const pairs = [];
  for (const p of top) {
    let idx = bottom.findIndex((q, i) => !usedBottom.has(i) && !priorPairKeys.has(pairKey(p.userId, q.userId)));
    if (idx === -1) {
      // No fresh opponent left in the bottom half — fall back to the
      // first still-unused one, accepting a repeat pairing.
      idx = bottom.findIndex((_, i) => !usedBottom.has(i));
    }
    usedBottom.add(idx);
    pairs.push({ a: p.userId, b: bottom[idx].userId });
  }

  return { pairs, byeUserId };
}
