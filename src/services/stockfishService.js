/**
 * Real integration point for Stockfish.js/WASM (spec §3, §9 Analysis page).
 *
 * Wiring a real engine requires shipping the stockfish.wasm binary and
 * running it in a Web Worker speaking the UCI protocol. That asset isn't
 * available in this build environment, so this module exposes the same
 * async interface a real worker-backed engine would, backed by a
 * deterministic mock evaluator — swap `evaluateMock` for a real
 * `postMessage`/`onmessage` UCI bridge without touching call sites.
 *
 * Real implementation sketch:
 *   const worker = new Worker('/stockfish.wasm.js');
 *   worker.postMessage(`position fen ${fen}`);
 *   worker.postMessage(`go depth ${depth}`);
 *   worker.onmessage = (e) => parseUciInfo(e.data);
 */

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function materialBalance(fen) {
  const board = fen.split(' ')[0];
  let score = 0;
  for (const ch of board) {
    const lower = ch.toLowerCase();
    if (PIECE_VALUES[lower] === undefined) continue;
    const value = PIECE_VALUES[lower];
    score += ch === lower ? -value : value;
  }
  return score;
}

export async function evaluatePosition(fen, { depth = 14 } = {}) {
  // Mock latency so the UI's loading state is exercised honestly.
  await new Promise((r) => setTimeout(r, 180));
  const material = materialBalance(fen);
  const noise = Math.round((Math.sin(fen.length * 12.9898) * 43758.5453 % 1) * 40) / 10;
  const cp = Math.round((material * 100 + noise) * 10) / 10;
  return {
    depth,
    scoreCp: cp,
    mate: null,
    bestMove: null, // requires a real engine
    pv: [],
  };
}

export function classifyMove({ evalBefore, evalAfter, isBestMove }) {
  const delta = Math.abs(evalAfter - evalBefore);
  if (isBestMove) return 'best';
  if (delta < 20) return 'good';
  if (delta < 90) return 'inaccuracy';
  if (delta < 200) return 'mistake';
  return 'blunder';
}
