import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mock } from '../../services/mockService';
import { data as realData } from '../../services/dataService';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useToast } from '../../app/providers/ToastProvider';
import Panel from '../../components/common/Panel';
import SectionTitle from '../../components/common/SectionTitle';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { DEMO_MODE } from '../../config/env';

export default function FriendsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const friendsState = useAsyncData(() => mock.friends(), []);
  const requestsState = useAsyncData(() => mock.friendRequests(), []);

  if (friendsState.status === 'loading' || requestsState.status === 'loading') return <LoadingState label="Loading friends" />;
  if (friendsState.status === 'error') return <ErrorState message={friendsState.error} onRetry={friendsState.retry} />;
  if (requestsState.status === 'error') return <ErrorState message={requestsState.error} onRetry={requestsState.retry} />;

  const friends = friendsState.data;
  const requests = requestsState.data;

  async function respond(userId, accept) {
    if (DEMO_MODE) return toast('Demo mode — connect a real backend to accept requests', 'info');
    try {
      await (accept ? realData.acceptFriendRequest(userId) : realData.declineFriendRequest(userId));
      requestsState.retry();
      friendsState.retry();
    } catch (err) {
      toast(err.message || 'Something went wrong', 'error');
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-4">
      <h1 className="mb-4 font-display text-lg font-bold">Friends</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search friends"
        className="mb-5 w-full rounded-sm border px-3.5 py-2.5 text-sm"
        style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
      />

      {requests.length > 0 && (
        <>
          <SectionTitle className="!px-0">Requests</SectionTitle>
          <Panel className="mb-5">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b px-4 py-3 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
                <div>
                  <div className="text-sm font-semibold">{r.username || r.name}</div>
                  <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>{r.ratings?.blitz ?? r.rating}</div>
                </div>
                <div className="flex gap-1.5">
                  <Button className="!px-3 !py-1.5 text-xs" onClick={() => respond(r.id, true)}>Accept</Button>
                  <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => respond(r.id, false)}>Decline</Button>
                </div>
              </div>
            ))}
          </Panel>
        </>
      )}

      <SectionTitle className="!px-0">All friends</SectionTitle>
      {friends.length === 0 ? (
        <EmptyState icon="♟" title="Find your next opponent" description="Search for players or accept a challenge to add your first friend." />
      ) : (
        <Panel>
          {friends
            .filter((f) => (f.username || f.name).toLowerCase().includes(query.toLowerCase()))
            .map((f) => (
              <div key={f.id} className="flex items-center justify-between border-b px-4 py-3 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border font-display text-xs font-bold" style={{ background: 'var(--surface-alt)', borderColor: 'var(--line)' }}>
                    {(f.username || f.name).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[13.5px] font-semibold">
                      {f.username || f.name}
                      {f.online && <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--win)' }} />}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>{f.ratings?.blitz ?? f.rating}</div>
                  </div>
                </div>
                <Button className="!px-3 !py-1.5 text-xs" onClick={() => navigate(`/challenge/${f.username || f.name}`)}>Challenge</Button>
              </div>
            ))}
        </Panel>
      )}
    </div>
  );
}
