import { Chess } from 'chess.js';
import { useState } from 'react';
import Board from '../../components/chess/Board';

export default function BughousePage() {
  const [fenA] = useState(new Chess().fen());
  const [fenB] = useState(new Chess().fen());

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-lg font-bold">Bughouse</div>
        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}>Variant</span>
      </div>
      <p className="mb-4 text-sm" style={{ color: 'var(--ink-soft)' }}>
        Two boards, two teams. Pieces you capture go to your teammate on the other board to drop back in.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        {[{ fen: fenA, label: 'Board A · You + JordanMoves', team: 'Team 1' }, { fen: fenB, label: 'Board B · KnightStorm + RookRider', team: 'Team 2' }].map((b) => (
          <div key={b.label}>
            <div className="mb-2 text-center text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>{b.label}</div>
            <Board fen={b.fen} interactive={b.team === 'Team 1'} className="max-w-[420px]" />
            <div className="mt-2 flex min-h-[24px] justify-center gap-1 text-lg">
              <span style={{ color: 'var(--ink-faint)' }}>drop pieces appear here</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-center gap-10 font-display text-lg font-bold">
        <div>Team 1 · 0</div>
        <div>Team 2 · 0</div>
      </div>
    </div>
  );
}
