import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mock } from '../../services/mockService';
import Panel from '../../components/common/Panel';
import LoadingState from '../../components/common/LoadingState';

export default function OpeningExplorerPage() {
  const navigate = useNavigate();
  const [openings, setOpenings] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    mock.openings().then(setOpenings);
  }, []);

  if (!openings) return <LoadingState label="Loading openings" />;
  const filtered = openings.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-4">
      <h1 className="mb-4 font-display text-lg font-bold">Opening Explorer</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search openings"
        className="mb-4 w-full rounded-sm border px-3.5 py-2.5 text-sm"
        style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
      />
      <Panel>
        {filtered.map((o) => (
          <div key={o.id} onClick={() => navigate(`/openings/${o.id}`)} className="cursor-pointer border-b px-4 py-3 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{o.name}</span>
              <span className="text-xs" style={{ color: 'var(--ink-soft)' }}>{o.eco}</span>
            </div>
            <div className="mt-0.5 font-display text-xs" style={{ color: 'var(--ink-soft)' }}>{o.moves}</div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-alt)' }}>
              <div className="h-full rounded-full" style={{ width: `${o.popularity * 100}%`, background: 'var(--accent)' }} />
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
}
