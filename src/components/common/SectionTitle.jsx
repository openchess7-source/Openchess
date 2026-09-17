export default function SectionTitle({ children, className = '' }) {
  return (
    <div className={`px-4 py-2.5 font-display text-[13px] font-semibold ${className}`} style={{ color: 'var(--ink-soft)' }}>
      {children}
    </div>
  );
}
