export default function Panel({ children, className = '', style = {} }) {
  return (
    <div
      className={`overflow-hidden rounded-md border ${className}`}
      style={{ background: 'var(--surface)', borderColor: 'var(--line)', ...style }}
    >
      {children}
    </div>
  );
}
