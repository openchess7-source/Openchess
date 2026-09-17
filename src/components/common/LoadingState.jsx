export default function LoadingState({ label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16" role="status" aria-live="polite">
      <div
        className="h-3.5 w-3.5 animate-pulse-slow rounded-full"
        style={{ background: 'var(--accent)' }}
      />
      <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>{label}</span>
    </div>
  );
}
