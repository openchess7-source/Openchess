export default function TopicRow({ title, meta, progress, onClick }) {
  return (
    <div onClick={onClick} className="cursor-pointer border-b px-4 py-3 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-semibold">{title}</span>
        <span className="text-xs" style={{ color: 'var(--ink-soft)' }}>{meta}</span>
      </div>
      {typeof progress === 'number' && (
        <div className="mt-1.5 h-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-alt)' }}>
          <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, background: 'var(--accent)' }} />
        </div>
      )}
    </div>
  );
}
