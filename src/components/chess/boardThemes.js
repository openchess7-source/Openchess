// Board palette is deliberately independent from the UI accent (spec §13).
export const BOARD_THEMES = {
  classic: { name: 'Classic', light: '#EAF2FD', dark: '#1A3A5C' },
  slate: { name: 'Slate', light: '#E7E9EC', dark: '#5A6772' },
  midnight: { name: 'Midnight', light: '#AFC3E0', dark: '#0E1E33' },
  wood: { name: 'Wood', light: '#EBD5B0', dark: '#8A5A34' },
  ocean: { name: 'Ocean', light: '#DCEFF2', dark: '#0F5C66' },
  tournament: { name: 'Tournament', light: '#F0E4D3', dark: '#5B7674' },
};

export const PIECE_SETS = ['Classic', 'Modern', 'Staunton', 'Minimal', 'Neo'];
