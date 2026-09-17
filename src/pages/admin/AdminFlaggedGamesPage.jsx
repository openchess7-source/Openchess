import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mock } from '../../services/mockService';
import { useAsyncData } from '../../hooks/useAsyncData';
import Panel from '../../components/common/Panel';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

function StatusTabs({ value, onChange }) {
  return (
    <div className="mb-4 flex gap-1 rounded-sm border p-1" style={{ borderColor: 'var(--line)' }}>
      {['pending', 'reviewed'].map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className="flex-1 rounded-sm py-1.5 text-xs font-bold capitalize"
          style={{
            background: value === s ? 'var(--accent)' : 'transparent',
            color: value === s ? '#fff' : 'var(--ink-soft)',
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

export default function AdminFlaggedGamesPage() {
  const [status, setStatus] = useState('pending');
  const navigate = useNavigate();
  const gState = useAsyncData(() => mock.adminFlaggedGames(status), [status]);

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-4">
      <h1 className="mb-1 font-display text-lg font-bold">Flagged games</h1>
      <p className="mb-4 text-xs" style={{ color: 'var(--ink-soft)' }}>
        Surfaced by the move-timing anti-cheat heuristic. Treat every flag as worth a look, never as proof.
      </p>
      <StatusTabs value={status} onChange={setStatus} />

      {gState.status === 'loading' && <LoadingState label="Loading flagged games" />}
      {gState.status === 'error' && <ErrorState message={gState.error} onRetry={gState.retry} />}
      {gState.status === 'success' && gState.data.length === 0 && (
        <EmptyState icon="✅" title={status === 'pending' ? 'Nothing waiting on review' : 'No reviewed games yet'} />
      )}
      {gState.status === 'success' && gState.data.length > 0 && (
        <Panel>
          {gState.data.map((g) => (
            <div
              key={g.id}
              onClick={() => navigate(`/admin/flagged-games/${g.id}`)}
              className="cursor-pointer border-b px-4 py-3 last:border-b-0"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>{g.white?.username ?? 'Unknown'} vs {g.black?.username ?? 'Unknown'}</span>
                <span className="text-xs font-normal uppercase" style={{ color: 'var(--ink-faint)' }}>{g.mode}</span>
              </div>
              <div className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--ink-soft)' }}>
                {g.flaggedReason}
              </div>
              <div className="mt-1 text-[11px]" style={{ color: 'var(--ink-faint)' }}>
                {new Date(g.createdAt).toLocaleString()}
                {g.reviewStatus !== 'pending' && ` · ${g.reviewStatus}`}
              </div>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
