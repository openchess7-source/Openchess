import { useLocalStorage } from './useLocalStorage';

export const TIME_CONTROLS = {
  bullet: [
    { label: '1+0', initial: 60, increment: 0 },
    { label: '2+1', initial: 120, increment: 1 },
  ],
  blitz: [
    { label: '3+0', initial: 180, increment: 0 },
    { label: '3+2', initial: 180, increment: 2 },
    { label: '5+0', initial: 300, increment: 0 },
    { label: '5+3', initial: 300, increment: 3 },
  ],
  rapid: [
    { label: '10+0', initial: 600, increment: 0 },
    { label: '10+5', initial: 600, increment: 5 },
    { label: '15+10', initial: 900, increment: 10 },
  ],
  classical: [
    { label: '30+0', initial: 1800, increment: 0 },
    { label: '30+20', initial: 1800, increment: 20 },
    { label: '60+0', initial: 3600, increment: 0 },
  ],
};

const DEFAULT_TC = { category: 'blitz', label: '5+0', initial: 300, increment: 0 };

export function useTimeControl() {
  const [lastUsed, setLastUsed] = useLocalStorage('oc:last-time-control', DEFAULT_TC);
  return [lastUsed, setLastUsed];
}
