import { useState } from 'react';
import { Chess } from 'chess.js';
import Board from '../../components/chess/Board';

export default function BountyPage() {
  const [fen] = useState(new Chess().fen());
  const [score, setScore] = useState({ you: 0, opponent: 0 });
  const bounty = { square: 'e5', value: 5 };

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-lg font-bold">Bounty</div>
        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}>Variant</span>
      </div>
      <p className="mb-4 text-sm" style={{ color: 'var(--ink-soft)' }}>
        A random square is marked each round. Capture on it for bonus points on top of the normal game.
      </p>
      <div className="mb-4 flex items-center justify-between rounded-md border p-3.5" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
        <div>
          <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>Bounty target</div>
          <div className="font-display text-xl font-bold">{bounty.square}</div>
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>Reward</div>
          <div className="font-display text-xl font-bold" style={{ color: 'var(--win)' }}>+{bounty.value}</div>
        </div>
      </div>
      <Board fen={fen} interactive={false} className="max-w-[520px]" />
      <div className="mt-4 flex justify-center gap-8">
        <div className="text-center">
          <div className="font-display text-2xl font-bold">{score.you}</div>
          <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>You</div>
        </div>
        <div className="text-center">
          <div className="font-display text-2xl font-bold">{score.opponent}</div>
          <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>Opponent</div>
        </div>
      </div>
      <button onClick={() => setScore((s) => ({ ...s, you: s.you + bounty.value }))} className="mt-4 w-full rounded-sm py-2.5 text-sm font-bold" style={{ background: 'var(--accent)', color: '#fff' }}>
        Simulate bounty capture
      </button>
    </div>
  );
}
