import { forwardRef } from 'react';

const VARIANTS = {
  primary: { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' },
  secondary: { background: 'var(--surface)', color: 'var(--ink)', borderColor: 'var(--line)' },
  danger: { background: 'var(--loss)', color: '#fff', borderColor: 'var(--loss)' },
  ghost: { background: 'transparent', color: 'var(--ink-soft)', borderColor: 'transparent' },
};

const Button = forwardRef(function Button({ children, variant = 'primary', className = '', style = {}, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={`rounded-sm border px-4 py-2.5 font-display text-sm font-bold transition-opacity active:opacity-80 disabled:opacity-50 ${className}`}
      style={{ ...VARIANTS[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
