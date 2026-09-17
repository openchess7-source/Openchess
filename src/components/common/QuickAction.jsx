// Reusable quick-action tile (spec §73) — PLAY 5+0, DAILY PUZZLE, CONTINUE GAME, CHALLENGE FRIEND
export default function QuickAction({ eyebrow, title, subtitle, actionLabel, onAction, accent = true, icon }) {
  return (
    <div
      className="rounded-md p-4"
      style={accent ? { background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: '#fff' } : { border: '1px solid var(--line)', background: 'var(--surface)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[11px] font-bold uppercase tracking-wide" style={{ opacity: accent ? 0.85 : 1, color: accent ? undefined : 'var(--accent)' }}>
              {eyebrow}
            </div>
          )}
          <div className="mt-0.5 truncate font-display text-base font-bold">{title}</div>
          {subtitle && <div className="mt-0.5 truncate text-xs" style={{ opacity: accent ? 0.85 : undefined, color: accent ? undefined : 'var(--ink-soft)' }}>{subtitle}</div>}
        </div>
        {icon && <span className="shrink-0 text-2xl">{icon}</span>}
      </div>
      <button
        onClick={onAction}
        className="mt-3 w-full rounded-sm py-2.5 font-display text-sm font-bold"
        style={accent ? { background: '#fff', color: 'var(--accent-dark)' } : { background: 'var(--accent)', color: '#fff' }}
      >
        {actionLabel}
      </button>
    </div>
  );
}
