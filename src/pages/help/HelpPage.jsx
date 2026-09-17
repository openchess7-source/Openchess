import { useState } from 'react';
import Panel from '../../components/common/Panel';

const TOPICS = [
  { category: 'Rules', items: [
    { q: 'How does castling work?', a: 'The king moves two squares toward a rook, and that rook moves to the square the king crossed. Neither piece may have moved before, the squares between them must be empty, and the king cannot castle out of, through, or into check.' },
    { q: 'What is en passant?', a: 'If an opponent\'s pawn moves two squares from its starting square and lands beside your pawn, you may capture it as if it had only moved one square — but only on your very next move.' },
  ]},
  { category: 'Variants', items: [
    { q: 'What is Chess960?', a: 'Also called Fischer Random, the back-rank pieces start in one of 960 randomized (but symmetric and legal) setups instead of the standard arrangement.' },
    { q: 'How does Bughouse scoring work?', a: 'Two boards, two teams. Pieces you capture are passed to your teammate, who can drop them onto their own board instead of moving.' },
  ]},
  { category: 'Ratings & matchmaking', items: [
    { q: 'How is my rating calculated?', a: 'Openchess uses a Glicko-style system: your rating moves based on the result and your opponent\'s rating, with larger swings early on while the system learns your strength.' },
    { q: 'How does matchmaking pick opponents?', a: 'The queue looks for players near your rating first, gradually widening the range the longer you wait so you\'re not stuck searching indefinitely.' },
  ]},
  { category: 'Fair play', items: [
    { q: 'What counts as engine assistance?', a: 'Using any chess engine, tablebase, or another person\'s move suggestions during a rated game is not allowed and can result in account restrictions.' },
  ]},
];

export default function HelpPage() {
  const [query, setQuery] = useState('');
  const filtered = TOPICS.map((t) => ({
    ...t,
    items: t.items.filter((i) => i.q.toLowerCase().includes(query.toLowerCase())),
  })).filter((t) => t.items.length > 0);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-4">
      <h1 className="mb-4 font-display text-lg font-bold">Help & rules</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search help articles"
        className="mb-5 w-full rounded-sm border px-3.5 py-2.5 text-sm"
        style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
      />
      {filtered.map((section) => (
        <div key={section.category} className="mb-5">
          <div className="mb-1.5 px-0.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>{section.category}</div>
          <Panel>
            {section.items.map((item) => (
              <details key={item.q} className="border-b px-4 py-3 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
                <summary className="cursor-pointer text-sm font-semibold">{item.q}</summary>
                <p className="mt-2 text-sm" style={{ color: 'var(--ink-soft)' }}>{item.a}</p>
              </details>
            ))}
          </Panel>
        </div>
      ))}
    </div>
  );
}
