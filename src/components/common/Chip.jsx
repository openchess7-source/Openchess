export default function Chip({ children, active, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold ${className}`}
      style={
        active
          ? { background: 'var(--ink)', color: 'var(--bg)', borderColor: 'var(--ink)' }
          : { background: 'var(--surface)', color: 'var(--ink-soft)', borderColor: 'var(--line)' }
      }
    >
      {children}
    </button>
  );
}
