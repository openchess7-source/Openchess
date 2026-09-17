import { useState } from 'react';
import { Chess } from 'chess.js';
import Board from '../../components/chess/Board';

// Mocked visibility model until backend variant support exists: squares
// adjacent to any of the player's own pieces (plus the pieces themselves)
// are visible; everything else is fogged.
function visibleSquares(fen, color) {
  const chess = new Chess(fen);
  const board = chess.board();
  const visible = new Set();
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  board.forEach((row, r) =>
    row.forEach((piece, c) => {
      if (piece && piece.color === color) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const rr = r + dr;
            const cc = c + dc;
            if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) visible.add(`${files[cc]}${8 - rr}`);
          }
        }
      }
    })
  );
  return visible;
}

export default function FogOfWarPage() {
  const [fen] = useState(new Chess().fen());
  const visible = visibleSquares(fen, 'w');

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-lg font-bold">Fog of War</div>
        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}>
          Variant
        </span>
      </div>
      <p className="mb-4 text-sm" style={{ color: 'var(--ink-soft)' }}>
        You can only see squares near your own pieces. Enemy territory stays hidden until you approach it.
      </p>
      <div className="relative">
        <Board fen={fen} interactive={false} className="max-w-[520px]" />
        <div className="pointer-events-none absolute inset-0 mx-auto grid max-w-[520px] grid-cols-8 grid-rows-8">
          {Array.from({ length: 64 }).map((_, i) => {
            const r = Math.floor(i / 8);
            const c = i % 8;
            const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
            const sq = `${files[c]}${8 - r}`;
            return <div key={sq} style={{ background: visible.has(sq) ? 'transparent' : 'rgba(11,12,14,0.82)' }} />;
          })}
        </div>
      </div>
      <div className="mt-4 rounded-sm px-3 py-2.5 text-center text-xs font-semibold" style={{ background: 'var(--warning-tint)', color: 'var(--warning)' }}>
        Fog visibility is mocked client-side until the backend variant engine ships.
      </div>
    </div>
  );
}
