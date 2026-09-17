import { useState } from 'react';
import { Chess } from 'chess.js';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { BOARD_THEMES, PIECE_SETS } from '../../components/chess/boardThemes';
import Board from '../../components/chess/Board';
import Row from '../../components/common/Row';
import Panel from '../../components/common/Panel';

function ToggleSwitch({ on, onClick }) {
  return (
    <button onClick={onClick} className="relative h-6 w-11 rounded-full" style={{ background: on ? 'var(--accent)' : 'var(--surface-alt)', border: '1px solid var(--line)' }}>
      <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform" style={{ left: on ? 22 : 2 }} />
    </button>
  );
}

export default function BoardSettingsPage() {
  const [boardTheme, setBoardTheme] = useLocalStorage('oc:board-theme', 'classic');
  const [pieceSet, setPieceSet] = useLocalStorage('oc:piece-set', 'Classic');
  const [showCoordinates, setShowCoordinates] = useLocalStorage('oc:coordinates', true);
  const [showLegalMoves, setShowLegalMoves] = useLocalStorage('oc:legal-moves', true);
  const [animation, setAnimation] = useLocalStorage('oc:board-animation', true);
  const [sound, setSound] = useLocalStorage('oc:board-sound', true);
  const [autoQueen, setAutoQueen] = useLocalStorage('oc:auto-queen', false);
  const [previewFen] = useState('r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 2 3');

  return (
    <div className="px-4 pb-10 pt-2 md:px-0">
      <Board fen={previewFen} interactive={false} theme={boardTheme} showCoordinates={showCoordinates} className="mx-auto mb-6 max-w-[300px]" />

      <div className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Board theme</div>
      <div className="mb-5 flex gap-2.5 overflow-x-auto pb-1">
        {Object.entries(BOARD_THEMES).map(([key, theme]) => (
          <button key={key} onClick={() => setBoardTheme(key)} className="shrink-0 text-center">
            <div
              className="grid h-13 w-13 overflow-hidden rounded-sm border-2"
              style={{ width: 52, height: 52, gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', borderColor: boardTheme === key ? 'var(--accent)' : 'transparent' }}
            >
              <div style={{ background: theme.light }} /><div style={{ background: theme.dark }} />
              <div style={{ background: theme.dark }} /><div style={{ background: theme.light }} />
            </div>
            <div className="mt-1 text-[10px] font-semibold" style={{ color: 'var(--ink-soft)' }}>{theme.name}</div>
          </button>
        ))}
      </div>

      <div className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Piece set</div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {PIECE_SETS.map((set) => (
          <button
            key={set}
            onClick={() => setPieceSet(set)}
            className="rounded-full border px-3 py-1.5 text-xs font-semibold"
            style={{ borderColor: pieceSet === set ? 'var(--accent)' : 'var(--line)', background: pieceSet === set ? 'var(--accent-tint)' : 'var(--surface)' }}
          >
            {set}
          </button>
        ))}
      </div>

      <Panel>
        <Row><span className="text-sm font-semibold">Show coordinates</span><ToggleSwitch on={showCoordinates} onClick={() => setShowCoordinates((v) => !v)} /></Row>
        <Row><span className="text-sm font-semibold">Show legal moves</span><ToggleSwitch on={showLegalMoves} onClick={() => setShowLegalMoves((v) => !v)} /></Row>
        <Row><span className="text-sm font-semibold">Move animation</span><ToggleSwitch on={animation} onClick={() => setAnimation((v) => !v)} /></Row>
        <Row><span className="text-sm font-semibold">Sound</span><ToggleSwitch on={sound} onClick={() => setSound((v) => !v)} /></Row>
        <Row><span className="text-sm font-semibold">Auto-queen promotion</span><ToggleSwitch on={autoQueen} onClick={() => setAutoQueen((v) => !v)} /></Row>
      </Panel>
    </div>
  );
}
