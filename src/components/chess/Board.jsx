import { useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { glyphFor } from './pieceGlyphs';
import { BOARD_THEMES } from './boardThemes';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

/**
 * Controlled-ish chess board.
 *
 * - `fen` seeds the position; the board keeps its own chess.js instance so
 *   local legal-move preview/highlighting works even before a server
 *   confirms anything (spec §18).
 * - `onLegalMove(moveResult)` fires only for moves chess.js accepts as
 *   legal. The parent (Game page / socket layer) decides whether to also
 *   emit `make_move` and/or wait for server confirmation.
 * - `serverFen` — when provided and different from internal state, forces
 *   the board to resync to the server's authoritative position, per
 *   "server is source of truth" (spec §18).
 */
export default function Board({
  fen,
  serverFen,
  orientation = 'white',
  interactive = true,
  theme = 'classic',
  showCoordinates = true,
  lastMove = null,
  onLegalMove,
  className = '',
}) {
  const gameRef = useRef(null);
  if (!gameRef.current) {
    gameRef.current = new Chess(fen);
  }
  const [, forceRender] = useState(0);
  const [selected, setSelected] = useState(null);
  const [legalTargets, setLegalTargets] = useState([]);
  const [pendingPromotion, setPendingPromotion] = useState(null); // { from, to }
  const [dragFrom, setDragFrom] = useState(null);

  // Resync when the server sends an authoritative FEN.
  useEffect(() => {
    if (serverFen && serverFen !== gameRef.current.fen()) {
      gameRef.current = new Chess(serverFen);
      setSelected(null);
      setLegalTargets([]);
      forceRender((n) => n + 1);
    }
  }, [serverFen]);

  const palette = BOARD_THEMES[theme] || BOARD_THEMES.classic;
  const board = gameRef.current.board(); // 8x8, [0]=rank8 ... [7]=rank1
  const inCheck = gameRef.current.inCheck();
  const turn = gameRef.current.turn();
  const kingSquare = useMemo(() => {
    if (!inCheck) return null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) return FILES[c] + RANKS[r];
      }
    }
    return null;
  }, [board, inCheck, turn]);

  const displayRanks = orientation === 'white' ? RANKS : [...RANKS].reverse();
  const displayFiles = orientation === 'white' ? FILES : [...FILES].reverse();

  function squareAt(rankChar, fileChar) {
    return fileChar + rankChar;
  }

  function pieceOn(square) {
    return gameRef.current.get(square);
  }

  function selectSquare(square) {
    if (!interactive) return;
    const piece = pieceOn(square);
    if (selected && legalTargets.some((m) => m.to === square)) {
      attemptMove(selected, square);
      return;
    }
    if (piece && piece.color === gameRef.current.turn()) {
      setSelected(square);
      setLegalTargets(gameRef.current.moves({ square, verbose: true }));
    } else {
      setSelected(null);
      setLegalTargets([]);
    }
  }

  function attemptMove(from, to) {
    const candidates = gameRef.current.moves({ square: from, verbose: true });
    const match = candidates.find((m) => m.to === to);
    if (!match) {
      setSelected(null);
      setLegalTargets([]);
      return;
    }
    if (match.flags.includes('p')) {
      setPendingPromotion({ from, to });
      return;
    }
    commitMove(from, to);
  }

  function commitMove(from, to, promotion) {
    const result = gameRef.current.move({ from, to, promotion });
    setSelected(null);
    setLegalTargets([]);
    setPendingPromotion(null);
    if (result) {
      forceRender((n) => n + 1);
      onLegalMove?.({
        from: result.from,
        to: result.to,
        san: result.san,
        promotion: result.promotion || null,
        flags: result.flags,
        captured: result.captured || null,
        fen: gameRef.current.fen(),
        pgn: gameRef.current.pgn(),
        turn: gameRef.current.turn() === 'w' ? 'white' : 'black',
        isCheck: gameRef.current.inCheck(),
        isCheckmate: gameRef.current.isCheckmate(),
        isGameOver: gameRef.current.isGameOver(),
      });
    }
  }

  function handlePromotionChoice(pieceType) {
    if (!pendingPromotion) return;
    commitMove(pendingPromotion.from, pendingPromotion.to, pieceType);
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className="mx-auto grid aspect-square w-full overflow-hidden rounded-md border"
        style={{ gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)', borderColor: 'var(--line)' }}
        role="grid"
        aria-label="Chess board"
      >
        {displayRanks.map((rankChar) =>
          displayFiles.map((fileChar) => {
            const square = squareAt(rankChar, fileChar);
            const isLight = (FILES.indexOf(fileChar) + RANKS.indexOf(rankChar)) % 2 === 0;
            const piece = pieceOn(square);
            const isSelected = selected === square;
            const isTarget = legalTargets.some((m) => m.to === square);
            const isLast = lastMove && (lastMove.from === square || lastMove.to === square);
            const isKingInCheck = kingSquare === square;

            return (
              <div
                key={square}
                role="gridcell"
                aria-label={square}
                onClick={() => selectSquare(square)}
                onDragOver={(e) => interactive && e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom) attemptMove(dragFrom, square);
                  setDragFrom(null);
                }}
                className="relative flex items-center justify-center select-none"
                style={{ background: isLight ? palette.light : palette.dark, cursor: interactive ? 'pointer' : 'default' }}
              >
                {isKingInCheck && <span className="absolute inset-0" style={{ background: 'var(--sq-check)' }} />}
                {isLast && !isKingInCheck && <span className="absolute inset-0" style={{ background: 'var(--sq-last)' }} />}
                {isSelected && <span className="absolute inset-0" style={{ background: 'var(--sq-select)' }} />}

                {showCoordinates && fileChar === displayFiles[0] && (
                  <span
                    className="absolute left-0.5 top-0.5 text-[9px] font-semibold"
                    style={{ color: isLight ? palette.dark : palette.light, opacity: 0.7 }}
                  >
                    {rankChar}
                  </span>
                )}
                {showCoordinates && rankChar === displayRanks[displayRanks.length - 1] && (
                  <span
                    className="absolute bottom-0.5 right-1 text-[9px] font-semibold"
                    style={{ color: isLight ? palette.dark : palette.light, opacity: 0.7 }}
                  >
                    {fileChar}
                  </span>
                )}

                {piece && (
                  <span
                    draggable={interactive}
                    onDragStart={() => {
                      setDragFrom(square);
                      selectSquare(square);
                    }}
                    className="relative z-[1] leading-none"
                    style={{
                      fontSize: 'clamp(20px, 6vw, 40px)',
                      color: piece.color === 'w' ? '#FBF3E7' : 'var(--ink)',
                      WebkitTextStroke: piece.color === 'w' ? '1.3px var(--ink)' : 'none',
                    }}
                  >
                    {glyphFor(piece)}
                  </span>
                )}

                {isTarget && !piece && <span className="absolute h-[22%] w-[22%] rounded-full" style={{ background: 'rgba(20,23,26,0.28)' }} />}
                {isTarget && piece && <span className="absolute inset-0 rounded-full ring-4 ring-inset" style={{ boxShadow: 'inset 0 0 0 4px rgba(20,23,26,0.28)' }} />}
              </div>
            );
          })
        )}
      </div>

      {pendingPromotion && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="flex gap-2 rounded-md p-3" style={{ background: 'var(--surface)' }}>
            {['q', 'r', 'b', 'n'].map((pt) => (
              <button
                key={pt}
                onClick={() => handlePromotionChoice(pt)}
                className="flex h-12 w-12 items-center justify-center rounded-sm text-3xl"
                style={{ background: 'var(--surface-alt)', color: 'var(--ink)' }}
              >
                {glyphFor({ type: pt, color: gameRef.current.turn() })}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function useLocalGame(initialFen) {
  const [game] = useState(() => new Chess(initialFen));
  return game;
}
