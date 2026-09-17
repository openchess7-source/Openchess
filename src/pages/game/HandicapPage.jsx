import { Chess } from 'chess.js';
import { useState } from 'react';
import Board from '../../components/chess/Board';

// Remove White's queenside knight as the handicap, and adjust rating math for display.
function handicapFen() {
  const chess = new Chess();
  chess.remove('b1');
  return chess.fen();
}

export default function HandicapPage() {
  const [fen] = useState(handicapFen());
  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-lg font-bold">Handicap</div>
        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}>Variant</span>
      </div>
      <p className="mb-4 text-sm" style={{ color: 'var(--ink-soft)' }}>
        The stronger-rated player starts a piece down. Rating gain/loss is adjusted to reflect the handicap.
      </p>
      <div className="mb-4 flex items-center justify-between rounded-md border p-3.5" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
        <div>
          <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>Missing piece</div>
          <div className="font-display text-xl font-bold">♘ Queenside knight</div>
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>Rating adjustment</div>
          <div className="font-display text-xl font-bold" style={{ color: 'var(--win)' }}>×0.7</div>
        </div>
      </div>
      <Board fen={fen} interactive={false} className="max-w-[520px]" />
    </div>
  );
}
