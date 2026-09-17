// Unicode glyphs, keyed by chess.js piece type ('p','n','b','r','q','k')
export const WHITE_GLYPH = { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' };
export const BLACK_GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };

export function glyphFor(piece) {
  if (!piece) return null;
  return piece.color === 'w' ? WHITE_GLYPH[piece.type] : BLACK_GLYPH[piece.type];
}
