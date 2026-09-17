export default function EmptyState({ icon = '♟', title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center gap-2 px-6 py-16 text-center ${className}`}>
      <div className="text-3xl" style={{ color: 'var(--ink-faint)' }}>{icon}</div>
      <div className="font-display text-base font-bold">{title}</div>
      {description && <p className="max-w-xs text-sm" style={{ color: 'var(--ink-soft)' }}>{description}</p>}
      {action}
    </div>
  );
}
