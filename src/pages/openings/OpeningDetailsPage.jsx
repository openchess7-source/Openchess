import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { mock } from '../../services/mockService';
import { Chess } from 'chess.js';
import Board from '../../components/chess/Board';
import LoadingState from '../../components/common/LoadingState';

function fenFromMoves(sanLine) {
  const chess = new Chess();
  sanLine.replace(/\d+\./g, '').trim().split(/\s+/).forEach((m) => {
    try { chess.move(m); } catch { /* ignore incomplete tokens */ }
  });
  return chess.fen();
}

export default function OpeningDetailsPage() {
  const { openingId } = useParams();
  const [opening, setOpening] = useState(null);

  useEffect(() => {
    mock.openingById(openingId).then(setOpening);
  }, [openingId]);

  if (!opening) return <LoadingState label="Loading opening" />;
  const fen = fenFromMoves(opening.moves);

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-4">
      <div className="mb-1 text-center font-display text-lg font-bold">{opening.name}</div>
      <div className="mb-4 text-center text-xs" style={{ color: 'var(--ink-soft)' }}>{opening.eco} · {opening.moves}</div>

      <Board fen={fen} interactive={false} className="mx-auto mb-5 max-w-[420px]" />

      <div className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Results (mocked master-game data)</div>
      <div className="mb-5 flex h-3 overflow-hidden rounded-full">
        <div style={{ width: `${opening.whiteWinRate * 100}%`, background: '#FBF3E7', border: '1px solid var(--line)' }} />
        <div style={{ width: `${opening.drawRate * 100}%`, background: 'var(--draw)' }} />
        <div style={{ width: `${opening.blackWinRate * 100}%`, background: 'var(--ink)' }} />
      </div>
      <div className="flex justify-between text-xs" style={{ color: 'var(--ink-soft)' }}>
        <span>White {Math.round(opening.whiteWinRate * 100)}%</span>
        <span>Draw {Math.round(opening.drawRate * 100)}%</span>
        <span>Black {Math.round(opening.blackWinRate * 100)}%</span>
      </div>
    </div>
  );
}
