import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';

export default function PuzzleRushDuelPage() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(180);
  const [you, setYou] = useState(4);
  const [opponent, setOpponent] = useState(3);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
      if (Math.random() > 0.85) setOpponent((o) => o + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className="mx-auto max-w-md px-4 py-10 text-center">
      <div className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Puzzle Duel</div>
      <div className="mb-6 font-display text-3xl font-bold">{mm}:{ss}</div>

      <div className="mb-8 flex items-center justify-center gap-10">
        <div>
          <div className="font-display text-4xl font-bold">{you}</div>
          <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>You</div>
        </div>
        <div className="font-display text-lg" style={{ color: 'var(--ink-faint)' }}>vs</div>
        <div>
          <div className="font-display text-4xl font-bold">{opponent}</div>
          <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>KnightStorm</div>
        </div>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full" style={{ background: 'var(--surface-alt)' }}>
        <div className="h-full rounded-full" style={{ width: `${(you / (you + opponent)) * 100}%`, background: 'var(--accent)' }} />
      </div>

      <Button onClick={() => setYou((y) => y + 1)}>Solve next puzzle</Button>
      <div className="mt-3">
        <Button variant="ghost" onClick={() => navigate('/puzzles')}>Exit duel</Button>
      </div>
    </div>
  );
}
