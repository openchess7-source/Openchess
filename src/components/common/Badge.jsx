const RESULT_STYLE = {
  win: { background: 'var(--win-tint)', color: 'var(--win)' },
  loss: { background: 'var(--loss-tint)', color: 'var(--loss)' },
  draw: { background: 'var(--draw-tint)', color: 'var(--draw)' },
};

export function ResultBadge({ result }) {
  return (
    <span className="min-w-[38px] rounded-[4px] px-1.5 py-0.5 text-center text-[11px] font-bold" style={RESULT_STYLE[result]}>
      {result.toUpperCase()}
    </span>
  );
}

export function TitleBadge({ title }) {
  if (!title) return null;
  return (
    <span className="rounded-[4px] px-1 py-px text-[10px] font-bold" style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}>
      {title}
    </span>
  );
}
