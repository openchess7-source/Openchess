export default function Row({ children, className = '', onClick, as: As = 'div' }) {
  return (
    <As
      onClick={onClick}
      className={`flex items-center justify-between border-b px-4 last:border-b-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ borderColor: 'var(--line)', paddingTop: 'var(--row-py)', paddingBottom: 'var(--row-py)' }}
    >
      {children}
    </As>
  );
}
