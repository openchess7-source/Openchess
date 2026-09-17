export default function ProgressBar({ value, color = 'var(--accent)', height = 8 }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="w-full overflow-hidden rounded-full" style={{ height, background: 'var(--surface-alt)' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
