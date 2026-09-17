import { Chess } from 'chess.js';
import { glyphFor } from './pieceGlyphs';
import { BOARD_THEMES } from './boardThemes';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export default function MiniBoard({ fen, size = 52, theme = 'classic' }) {
  let board;
  try {
    board = new Chess(fen).board();
  } catch {
    board = new Chess().board();
  }
  const palette = BOARD_THEMES[theme] || BOARD_THEMES.classic;

  return (
    <div
      className="grid shrink-0 overflow-hidden rounded-sm border"
      style={{ width: size, height: size, gridTemplateColumns: 'repeat(8,1fr)', gridTemplateRows: 'repeat(8,1fr)', borderColor: 'var(--line)' }}
      aria-hidden="true"
    >
      {board.map((row, r) =>
        row.map((piece, c) => {
          const isLight = (r + c) % 2 === 0;
          return (
            <div key={`${r}-${c}`} className="flex items-center justify-center" style={{ background: isLight ? palette.light : palette.dark }}>
              {piece && (
                <span
                  style={{
                    fontSize: size * 0.11,
                    lineHeight: 1,
                    color: piece.color === 'w' ? '#FBF3E7' : 'var(--ink)',
                    WebkitTextStroke: piece.color === 'w' ? '0.6px var(--ink)' : 'none',
                  }}
                >
                  {glyphFor(piece)}
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
