import { useEffect, useRef, useState } from 'react';

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * Client-side countdown, isolated so it can be swapped for real
 * server-synced clock events later without touching call sites (spec §19).
 */
export default function Clock({ seconds, isRunning, onTimeout }) {
  const [remaining, setRemaining] = useState(seconds);
  const lastTick = useRef(Date.now());
  const firedTimeout = useRef(false);

  useEffect(() => {
    setRemaining(seconds);
    firedTimeout.current = false;
  }, [seconds]);

  useEffect(() => {
    if (!isRunning) return undefined;
    lastTick.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTick.current) / 1000;
      lastTick.current = now;
      setRemaining((prev) => {
        const next = Math.max(0, prev - elapsed);
        if (next === 0 && !firedTimeout.current) {
          firedTimeout.current = true;
          onTimeout?.();
        }
        return next;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [isRunning, onTimeout]);

  const state = remaining === 0 ? 'timeout' : remaining <= 10 ? 'critical' : remaining <= 30 ? 'low' : 'active';

  const color =
    state === 'timeout' || state === 'critical' ? 'var(--loss)' : state === 'low' ? 'var(--warning)' : 'var(--ink)';

  return (
    <div
      className="rounded-sm border px-3 py-1.5 font-display text-lg font-bold tabular-nums"
      style={{ borderColor: 'var(--line)', background: 'var(--surface-alt)', color }}
    >
      {formatTime(remaining)}
    </div>
  );
}
