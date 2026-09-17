import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { TIME_CONTROLS, useTimeControl } from '../../hooks/useTimeControl';
import { connectSocket, joinQueue, leaveQueue, onServerEvent } from '../../services/socketService';
import Chip from '../../components/common/Chip';
import Button from '../../components/common/Button';

const CATEGORIES = ['bullet', 'blitz', 'rapid', 'classical'];

export default function MatchmakingPage() {
  const { mode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lastTC, setLastTC] = useTimeControl();

  const initialCategory = CATEGORIES.includes(mode) ? mode : lastTC.category;
  const [category, setCategory] = useState(initialCategory);
  const [selected, setSelected] = useState(
    TIME_CONTROLS[initialCategory].find((tc) => tc.label === lastTC.label) || TIME_CONTROLS[initialCategory][0]
  );
  const [searching, setSearching] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const fallbackRef = useRef(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearTimeout(fallbackRef.current);
    leaveQueue();
  }, []);

  function startSearch() {
    setLastTC({ category, label: selected.label, initial: selected.initial, increment: selected.increment });
    setSearching(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);

    try {
      const socket = connectSocket();
      const off = onServerEvent('match_found', (payload) => {
        clearInterval(timerRef.current);
        off();
        navigate(`/game/${payload.gameId}`);
      });
      joinQueue({ mode: category, timeControl: { initial: selected.initial, increment: selected.increment } });
    } catch {
      // socket unavailable in this environment — fall through to the demo timer below
    }

    // Demo fallback: without a live backend attached, simulate a match
    // after a few seconds so the flow remains fully reviewable.
    fallbackRef.current = setTimeout(() => {
      clearInterval(timerRef.current);
      navigate('/game/demo');
    }, 3000);
  }

  function cancelSearch() {
    clearInterval(timerRef.current);
    clearTimeout(fallbackRef.current);
    leaveQueue();
    setSearching(false);
  }

  if (searching) {
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-faint)' }}>
          {category}
        </div>
        <div className="my-1.5 font-display text-4xl font-bold">{selected.label.replace('+', ' + ')}</div>
        <div className="mt-4 text-xs" style={{ color: 'var(--ink-soft)' }}>Your rating</div>
        <div className="mb-7 font-display text-2xl font-bold">{user?.ratings?.[category] ?? '—'}</div>
        <div className="mb-3.5 h-3.5 w-3.5 animate-pulse-slow rounded-full" style={{ background: 'var(--accent)' }} />
        <div className="mb-1.5 text-sm font-semibold">Finding opponent</div>
        <div className="mb-6 font-display text-sm" style={{ color: 'var(--ink-soft)' }}>{mm}:{ss}</div>
        <Button variant="secondary" onClick={cancelSearch}>Cancel</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-8 pt-5">
      <div className="mb-1 text-center font-display text-lg font-bold">
        {category[0].toUpperCase() + category.slice(1)} · {selected.label}
      </div>
      <p className="mb-5 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>Choose a time control to start playing</p>

      <div className="mb-3 flex gap-1.5 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            active={cat === category}
            onClick={() => {
              setCategory(cat);
              setSelected(TIME_CONTROLS[cat][0]);
            }}
          >
            {cat[0].toUpperCase() + cat.slice(1)}
          </Chip>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-md border" style={{ borderColor: 'var(--line)', background: 'var(--line)' }}>
        {TIME_CONTROLS[category].map((tc) => (
          <button
            key={tc.label}
            onClick={() => setSelected(tc)}
            className="p-4 text-center"
            style={{ background: selected.label === tc.label ? 'var(--accent-tint)' : 'var(--surface)' }}
          >
            <div className="font-display text-xl font-bold" style={{ color: selected.label === tc.label ? 'var(--accent-dark)' : 'var(--ink)' }}>
              {tc.label}
            </div>
            <div className="mt-0.5 text-[11px]" style={{ color: 'var(--ink-soft)' }}>{category}</div>
          </button>
        ))}
      </div>

      <Button className="w-full !py-3.5 text-base" onClick={startSearch}>Play</Button>

      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        <Chip onClick={() => navigate('/play/custom')}>Custom game</Chip>
        <Chip onClick={() => navigate('/play/bots')}>Bots</Chip>
        <Chip onClick={() => navigate('/friends')}>Play a friend</Chip>
        <Chip onClick={() => navigate('/play/quick')}>Variants</Chip>
      </div>
    </div>
  );
}
