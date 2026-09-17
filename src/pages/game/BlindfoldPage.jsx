import { Chess } from 'chess.js';
import { useState } from 'react';
import Board from '../../components/chess/Board';
import Button from '../../components/common/Button';

export default function BlindfoldPage() {
  const [fen] = useState(new Chess().fen());
  const [blindfolded, setBlindfolded] = useState(false);
  const [notation, setNotation] = useState('');

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-lg font-bold">Blindfold</div>
        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}>Variant</span>
      </div>
      <p className="mb-4 text-sm" style={{ color: 'var(--ink-soft)' }}>
        The position disappears after the opening. Play the rest of the game from memory using algebraic notation.
      </p>

      {blindfolded ? (
        <div className="flex aspect-square max-w-[520px] flex-col items-center justify-center gap-3 rounded-md border" style={{ borderColor: 'var(--line)', background: 'var(--surface-alt)' }}>
          <div className="text-3xl" style={{ color: 'var(--ink-faint)' }}>♟</div>
          <div className="text-sm font-semibold" style={{ color: 'var(--ink-soft)' }}>Board hidden</div>
        </div>
      ) : (
        <Board fen={fen} interactive={false} className="max-w-[520px]" />
      )}

      <div className="mt-4 flex gap-2">
        <input
          value={notation}
          onChange={(e) => setNotation(e.target.value)}
          placeholder="Enter your move, e.g. Nf3"
          className="flex-1 rounded-sm border px-3 py-2.5 text-sm"
          style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
        />
        <Button onClick={() => setNotation('')}>Submit</Button>
      </div>
      <Button variant="secondary" className="mt-3 w-full" onClick={() => setBlindfolded((b) => !b)}>
        {blindfolded ? 'Reveal position' : 'Start blindfold transition'}
      </Button>
    </div>
  );
}
