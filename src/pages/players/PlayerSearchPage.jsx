import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mock } from '../../services/mockService';
import { data as realData } from '../../services/dataService';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useToast } from '../../app/providers/ToastProvider';
import { TitleBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Panel from '../../components/common/Panel';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { DEMO_MODE } from '../../config/env';

export default function PlayerSearchPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const playersState = useAsyncData(() => mock.players(query), DEMO_MODE ? [] : [query]);

  async function addFriend(playerId) {
    if (DEMO_MODE) return toast('Demo mode — connect a real backend to send requests', 'info');
    try {
      const res = await realData.sendFriendRequest(playerId);
      toast(res.status === 'accepted' ? 'You are now friends' : 'Friend request sent', 'success');
    } catch (err) {
      toast(err.message || 'Something went wrong', 'error');
    }
  }

  if (playersState.status === 'loading') return <LoadingState label="Loading players" />;
  if (playersState.status === 'error') return <ErrorState message={playersState.error} onRetry={playersState.retry} />;

  const players = playersState.data;
  const filtered = DEMO_MODE ? players.filter((p) => p.username.toLowerCase().includes(query.toLowerCase())) : players;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-4">
      <h1 className="mb-4 font-display text-lg font-bold">Find players</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username"
        className="mb-4 w-full rounded-sm border px-3.5 py-2.5 text-sm"
        style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
      />
      <Panel>
        {filtered.map((p) => (
          <div key={p.id} className="flex items-center justify-between border-b px-4 py-3 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
            <div onClick={() => navigate(`/profile/${p.username}`)} className="flex cursor-pointer items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border font-display text-xs font-bold" style={{ background: 'var(--surface-alt)', borderColor: 'var(--line)' }}>
                {p.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[13.5px] font-semibold">
                  <TitleBadge title={p.title} /> {p.username}
                  {p.online && <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--win)' }} />}
                </div>
                <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>{p.rating ?? p.ratings?.blitz}</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => addFriend(p.id)}>Add</Button>
              <Button className="!px-3 !py-1.5 text-xs" onClick={() => navigate(`/challenge/${p.username}`)}>Challenge</Button>
            </div>
          </div>
        ))}
        {!DEMO_MODE && query && filtered.length === 0 && (
          <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--ink-faint)' }}>No players found</div>
        )}
      </Panel>
    </div>
  );
}
