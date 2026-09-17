import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mock } from '../../services/mockService';

export default function SearchOverlay({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open) return;
    Promise.all([mock.players(), mock.featuredClubs(), mock.tournaments(), mock.openings()]).then(
      ([players, clubs, tournaments, openings]) => setData({ players, clubs, tournaments, openings })
    );
  }, [open]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!data || query.trim().length === 0) return null;
    const q = query.toLowerCase();
    return {
      Players: data.players.filter((p) => p.username.toLowerCase().includes(q)).slice(0, 4),
      Clubs: data.clubs.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 4),
      Tournaments: data.tournaments.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 4),
      Openings: data.openings.filter((o) => o.name.toLowerCase().includes(q)).slice(0, 4),
    };
  }, [data, query]);

  if (!open) return null;

  function go(path) {
    onClose();
    setQuery('');
    navigate(path);
  }

  return (
    <div className="fixed inset-0 z-[95] px-4 pt-16 md:pt-24" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto max-w-lg overflow-hidden rounded-md border"
        style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players, clubs, tournaments, openings…"
          className="w-full border-b px-4 py-3.5 text-sm outline-none"
          style={{ borderColor: 'var(--line)', background: 'transparent', color: 'var(--ink)' }}
        />
        <div className="max-h-[60vh] overflow-y-auto">
          {!results && <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--ink-faint)' }}>Start typing to search</div>}
          {results &&
            Object.entries(results).map(([category, items]) =>
              items.length === 0 ? null : (
                <div key={category}>
                  <div className="px-4 pt-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>{category}</div>
                  {items.map((item) => (
                    <button
                      key={item.id || item.username}
                      onClick={() =>
                        go(
                          category === 'Players'
                            ? `/profile/${item.username}`
                            : category === 'Clubs'
                            ? `/clubs/${item.id}`
                            : category === 'Tournaments'
                            ? `/tournaments/${item.id}`
                            : `/openings/${item.id}`
                        )
                      }
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold"
                    >
                      {item.username || item.name}
                      <span className="text-xs font-normal" style={{ color: 'var(--ink-soft)' }}>
                        {item.rating || item.members || item.players || item.eco || ''}
                      </span>
                    </button>
                  ))}
                </div>
              )
            )}
          {results && Object.values(results).every((arr) => arr.length === 0) && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--ink-faint)' }}>No results for "{query}"</div>
          )}
        </div>
      </div>
    </div>
  );
}
