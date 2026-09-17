import { useState } from 'react';
import { mock } from '../../services/mockService';
import { useAsyncData } from '../../hooks/useAsyncData';
import Chip from '../../components/common/Chip';
import Panel from '../../components/common/Panel';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const MODES = ['blitz', 'rapid', 'bullet', 'classical'];

export default function LeaderboardsPage() {
  const [mode, setMode] = useState('blitz');
  const board = useAsyncData(() => mock.leaderboard(mode), [mode]);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-4">
      <h1 className="mb-4 font-display text-lg font-bold">Leaderboards</h1>
      <div className="mb-4 flex gap-1.5 overflow-x-auto">
        {MODES.map((m) => <Chip key={m} active={mode === m} onClick={() => setMode(m)}>{m[0].toUpperCase() + m.slice(1)}</Chip>)}
      </div>

      {board.status === 'loading' && <LoadingState label="Loading leaderboard" />}
      {board.status === 'error' && <ErrorState message={board.error} onRetry={board.retry} />}
      {board.status === 'success' && (
        <Panel>
          {board.data.map((r) => (
            <div key={r.rank} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0" style={{ borderColor: 'var(--line)', background: r.isYou ? 'var(--accent-tint)' : undefined }}>
              <span className="w-10 font-display text-[13px] font-bold" style={{ color: r.isYou ? 'var(--accent-dark)' : 'var(--ink-soft)' }}>#{r.rank}</span>
              <span className="flex-1 truncate text-[13.5px] font-semibold">{r.title ? `${r.title} ` : ''}{r.name}</span>
              <span className="font-display text-sm font-bold">{r.rating.toLocaleString()}</span>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
