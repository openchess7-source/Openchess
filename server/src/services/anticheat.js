// This is a starting heuristic, not a real anti-cheat system. It has no
// way to detect engine assistance directly — that would require running
// a real chess engine server-side to compare move quality against, which
// doesn't exist in this codebase (see server/README.md's roadmap). What
// this CAN honestly detect: play that is suspiciously fast and
// suspiciously *consistent* in timing, which is a real (if weak) signal
// correlated with scripted/automated play. It will have false positives
// (very strong or very familiar players can play fast too) and false
// negatives (a careful cheater paces themselves normally). Treat a flag
// as "worth a human look," never as proof.

const MIN_MOVES_TO_EVALUATE = 10;
const SUSPICIOUS_AVG_MS = 600; // faster than this on average, sustained, is unusual
const SUSPICIOUS_STDDEV_MS = 150; // and very little variation between moves

function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values) {
  const avg = mean(values);
  const variance = mean(values.map((v) => (v - avg) ** 2));
  return Math.sqrt(variance);
}

/**
 * @param {number[]} thinkTimesMs - one entry per move made by ONE side
 *   (pre-filter to just white's or just black's moves before calling —
 *   mixing both sides' timings would average out real signal).
 * @returns {{ flagged: boolean, reason: string|null, avgMs: number, stddevMs: number }}
 */
export function evaluateMoveTiming(thinkTimesMs) {
  if (thinkTimesMs.length < MIN_MOVES_TO_EVALUATE) {
    return { flagged: false, reason: null, avgMs: null, stddevMs: null };
  }

  const avgMs = mean(thinkTimesMs);
  const stddevMs = stddev(thinkTimesMs);

  if (avgMs < SUSPICIOUS_AVG_MS && stddevMs < SUSPICIOUS_STDDEV_MS) {
    return {
      flagged: true,
      reason: `avg move time ${Math.round(avgMs)}ms with stddev ${Math.round(stddevMs)}ms across ${thinkTimesMs.length} moves — unusually fast and unusually consistent`,
      avgMs,
      stddevMs,
    };
  }

  return { flagged: false, reason: null, avgMs, stddevMs };
}
