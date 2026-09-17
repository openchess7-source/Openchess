export const openings = [
  { id: 'ruy-lopez', name: 'Ruy Lopez', eco: 'C60–C99', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5', popularity: 0.86, whiteWinRate: 0.38, drawRate: 0.34, blackWinRate: 0.28 },
  { id: 'sicilian', name: 'Sicilian Defense', eco: 'B20–B99', moves: '1.e4 c5', popularity: 0.94, whiteWinRate: 0.35, drawRate: 0.28, blackWinRate: 0.37 },
  { id: 'italian', name: 'Italian Game', eco: 'C50–C59', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4', popularity: 0.71, whiteWinRate: 0.37, drawRate: 0.35, blackWinRate: 0.28 },
  { id: 'french', name: 'French Defense', eco: 'C00–C19', moves: '1.e4 e6', popularity: 0.52, whiteWinRate: 0.36, drawRate: 0.33, blackWinRate: 0.31 },
  { id: 'queens-gambit', name: "Queen's Gambit", eco: 'D06–D69', moves: '1.d4 d5 2.c4', popularity: 0.68, whiteWinRate: 0.39, drawRate: 0.36, blackWinRate: 0.25 },
  { id: 'kings-indian', name: "King's Indian Defense", eco: 'E60–E99', moves: '1.d4 Nf6 2.c4 g6', popularity: 0.58, whiteWinRate: 0.36, drawRate: 0.29, blackWinRate: 0.35 },
  { id: 'caro-kann', name: 'Caro-Kann Defense', eco: 'B10–B19', moves: '1.e4 c6', popularity: 0.44, whiteWinRate: 0.35, drawRate: 0.37, blackWinRate: 0.28 },
  { id: 'english', name: 'English Opening', eco: 'A10–A39', moves: '1.c4', popularity: 0.49, whiteWinRate: 0.37, drawRate: 0.34, blackWinRate: 0.29 },
];

export function getOpening(id) {
  return openings.find((o) => o.id === id) || openings[0];
}
