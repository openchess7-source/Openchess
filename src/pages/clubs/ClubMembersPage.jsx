import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { mock } from '../../services/mockService';
import { useAsyncData } from '../../hooks/useAsyncData';
import Panel from '../../components/common/Panel';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

export default function ClubMembersPage() {
  const { clubId } = useParams();
  const [query, setQuery] = useState('');
  const membersState = useAsyncData(() => mock.clubMembers(clubId), [clubId]);

  if (membersState.status === 'loading') return <LoadingState label="Loading members" />;
  if (membersState.status === 'error') return <ErrorState message={membersState.error} onRetry={membersState.retry} />;

  const filtered = membersState.data.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-4">
      <h1 className="mb-4 font-display text-lg font-bold">Members</h1>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members" className="mb-4 w-full rounded-sm border px-3.5 py-2.5 text-sm" style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' }} />
      <Panel>
        {filtered.map((m) => (
          <div key={m.id} className="flex items-center justify-between border-b px-4 py-3 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border font-display text-xs font-bold" style={{ background: 'var(--surface-alt)', borderColor: 'var(--line)' }}>
                {m.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[13.5px] font-semibold">
                  {m.name}
                  {m.online && <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--win)' }} />}
                </div>
                <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>{m.rating}</div>
              </div>
            </div>
            <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}>{m.role}</span>
          </div>
        ))}
      </Panel>
    </div>
  );
}
