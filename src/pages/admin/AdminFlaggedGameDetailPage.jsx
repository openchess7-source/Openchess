import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mock } from '../../services/mockService';
import { useAsyncData } from '../../hooks/useAsyncData';
import Panel from '../../components/common/Panel';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

export default function AdminFlaggedGameDetailPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const gState = useAsyncData(() => mock.adminFlaggedGameDetail(gameId), [gameId]);
  const [banUserId, setBanUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  if (gState.status === 'loading') return <LoadingState label="Loading game" />;
  if (gState.status === 'error') return <ErrorState message={gState.error} onRetry={gState.retry} />;
  if (!gState.data) return <ErrorState message="This game wasn't found, or isn't flagged." onRetry={gState.retry} />;

  const g = gState.data;
  const alreadyReviewed = g.reviewStatus !== 'pending';

  async function review(decision) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await mock.adminReviewGame(gameId, { decision, banUserId: banUserId || undefined });
      navigate('/admin/flagged-games');
    } catch (err) {
      setSubmitError(err?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-4">
      <h1 className="mb-1 font-display text-lg font-bold">
        {g.white?.username ?? 'Unknown'} vs {g.black?.username ?? 'Unknown'}
      </h1>
      <p className="mb-4 text-xs" style={{ color: 'var(--ink-soft)' }}>
        {g.mode} · {new Date(g.createdAt).toLocaleString()} · result: {g.result ?? 'in progress'} ({g.reason})
      </p>

      <Panel className="mb-4 p-4">
        <div className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>
          Anti-cheat flag
        </div>
        <p className="text-sm">{g.flaggedReason}</p>
        {alreadyReviewed && (
          <p className="mt-2 text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>
            Already reviewed: {g.reviewStatus} {g.reviewedAt ? `on ${new Date(g.reviewedAt).toLocaleString()}` : ''}
          </p>
        )}
      </Panel>

      <Panel className="mb-4 max-h-72 overflow-y-auto p-4">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>
          Moves
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {(g.moves || []).map((m) => (
            <div key={m.ply} className="flex items-center justify-between">
              <span>{m.ply}. {m.san}</span>
              <span
                className="text-xs"
                style={{ color: m.think_time_ms < 400 ? 'var(--loss)' : 'var(--ink-faint)' }}
              >
                {m.think_time_ms}ms
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {!alreadyReviewed && (
        <Panel className="p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>
            Ban a player? (optional, independent of the decision below)
          </div>
          <div className="mb-4 flex gap-2 text-sm">
            {[g.white, g.black].filter(Boolean).map((p) => (
              <label key={p.id} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="banUser"
                  checked={banUserId === p.id}
                  onChange={() => setBanUserId(p.id)}
                />
                {p.username}
              </label>
            ))}
            <label className="flex items-center gap-1.5">
              <input type="radio" name="banUser" checked={banUserId === ''} onChange={() => setBanUserId('')} />
              Nobody
            </label>
          </div>

          {submitError && <p className="mb-3 text-xs" style={{ color: 'var(--loss)' }}>{submitError}</p>}

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" disabled={submitting} onClick={() => review('cleared')}>
              Clear flag
            </Button>
            <Button variant="danger" className="flex-1" disabled={submitting} onClick={() => review('confirmed')}>
              Confirm flag
            </Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
