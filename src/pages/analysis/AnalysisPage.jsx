import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import Board from '../../components/chess/Board';
import EvalBar from '../../components/chess/EvalBar';
import MoveList from '../../components/chess/MoveList';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import { evaluatePosition } from '../../services/stockfishService';

// Demo game with a couple of intentionally suboptimal moves so the
// classification legend has something real to demonstrate against.
const DEMO_SAN = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3', 'Na5', 'Bc2', 'c5'];
const TAGS = ['best', 'good', 'best', 'good', 'best', 'good', 'good', 'good', 'best', 'good', 'good', 'mistake', 'good', 'good', 'good', 'good', 'good', 'blunder', 'good', 'good'];

function buildPliesWithTags(sanList, tagList) {
  const chess = new Chess();
  const plies = [{ ply: 0, fen: chess.fen(), san: null, tag: null }];
  sanList.forEach((san, i) => {
    chess.move(san);
    plies.push({ ply: i + 1, fen: chess.fen(), san, tag: tagList[i] });
  });
  return plies;
}

function buildPairs(plies) {
  const pairs = [];
  for (let i = 1; i < plies.length; i += 2) {
    pairs.push({
      no: Math.ceil(i / 2),
      white: plies[i]?.san,
      whiteTag: plies[i]?.tag,
      black: plies[i + 1]?.san,
      blackTag: plies[i + 1]?.tag,
    });
  }
  return pairs;
}

export default function AnalysisPage() {
  useParams(); // :id — reserved for wiring a real per-game fetch later
  const plies = useMemo(() => buildPliesWithTags(DEMO_SAN, TAGS), []);
  const pairs = useMemo(() => buildPairs(plies), [plies]);
  const [currentPly, setCurrentPly] = useState(plies.length - 1);
  const [evalData, setEvalData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setEvalData(null);
    evaluatePosition(plies[currentPly].fen).then((res) => {
      if (!cancelled) setEvalData(res);
    });
    return () => {
      cancelled = true;
    };
  }, [currentPly, plies]);

  const tagCounts = TAGS.reduce((acc, t) => ({ ...acc, [t]: (acc[t] || 0) + 1 }), {});
  const accuracyWhite = Math.round(100 - (tagCounts.blunder || 0) * 12 - (tagCounts.mistake || 0) * 6);
  const accuracyBlack = 91;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-4">
      <div className="mb-3">
        <Board fen={plies[currentPly].fen} interactive={false} lastMove={plies[currentPly].san ? { from: '', to: '' } : null} className="mx-auto max-w-[560px]" />
      </div>

      <div className="mx-auto mb-3 max-w-[560px]">
        {evalData ? <EvalBar scoreCp={evalData.scoreCp} mate={evalData.mate} /> : <LoadingState label="Evaluating position" />}
      </div>

      <div className="mx-auto mb-4 flex max-w-[560px] justify-center gap-2">
        <Button variant="secondary" className="!px-3.5 !py-2 text-xs" onClick={() => setCurrentPly(0)}>⏮</Button>
        <Button variant="secondary" className="!px-3.5 !py-2 text-xs" onClick={() => setCurrentPly((p) => Math.max(0, p - 1))}>◂</Button>
        <Button variant="secondary" className="!px-3.5 !py-2 text-xs" onClick={() => setCurrentPly((p) => Math.min(plies.length - 1, p + 1))}>▸</Button>
        <Button variant="secondary" className="!px-3.5 !py-2 text-xs" onClick={() => setCurrentPly(plies.length - 1)}>⏭</Button>
      </div>

      <div className="mx-auto mb-2 flex max-w-[560px] justify-around">
        <div className="text-center">
          <div className="font-display text-xl font-bold">{accuracyWhite}%</div>
          <div className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>You (White)</div>
        </div>
        <div className="text-center">
          <div className="font-display text-xl font-bold">{accuracyBlack}%</div>
          <div className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>Opponent (Black)</div>
        </div>
      </div>

      <div className="mx-auto mb-4 flex max-w-[560px] flex-wrap justify-center gap-1.5">
        {[
          ['best', 'Best'],
          ['good', 'Good'],
          ['mistake', 'Mistake'],
          ['blunder', 'Blunder'],
        ].map(([tag, label]) => (
          <span
            key={tag}
            className="rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{
              background: tag === 'best' ? 'var(--win-tint)' : tag === 'good' ? 'var(--info-tint)' : tag === 'mistake' ? 'var(--warning-tint)' : 'var(--loss-tint)',
              color: tag === 'best' ? 'var(--win)' : tag === 'good' ? 'var(--info)' : tag === 'mistake' ? 'var(--warning)' : 'var(--loss)',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="mx-auto max-w-[560px] rounded-md border py-1" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
        <div className="px-4 pb-1 pt-2 text-xs font-bold" style={{ color: 'var(--ink-soft)' }}>Ruy Lopez, Closed · C84</div>
        <div className="px-4">
          <MoveList pairs={pairs} currentPly={currentPly} onSelectPly={setCurrentPly} />
        </div>
      </div>
    </div>
  );
}
