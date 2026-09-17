export default function StandingsRow({ row }) {
  return (
    <div
      className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0"
      style={{ borderColor: 'var(--line)', background: row.isYou ? 'var(--accent-tint)' : undefined }}
    >
      <span className="w-9 font-display text-[13px] font-bold" style={{ color: row.isYou ? 'var(--accent-dark)' : 'var(--ink-soft)' }}>
        #{row.rank}
      </span>
      <span className="flex-1 truncate text-[13.5px] font-semibold">{row.name}</span>
      <span className="text-xs" style={{ color: 'var(--ink-soft)' }}>
        {row.wins}W {row.draws}D {row.losses}L
      </span>
      <span className="w-10 text-right font-display text-sm font-bold">{row.score}</span>
    </div>
  );
}
