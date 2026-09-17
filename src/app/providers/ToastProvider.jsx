import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

const TYPE_STYLE = {
  success: { icon: '✓', color: 'var(--win)', bg: 'var(--win-tint)' },
  error: { icon: '✕', color: 'var(--loss)', bg: 'var(--loss-tint)' },
  warning: { icon: '!', color: 'var(--warning)', bg: 'var(--warning-tint)' },
  info: { icon: 'i', color: 'var(--info)', bg: 'var(--info-tint)' },
  game: { icon: '♟', color: 'var(--accent)', bg: 'var(--accent-tint)' },
  challenge: { icon: '⚔', color: 'var(--accent)', bg: 'var(--accent-tint)' },
  tournament: { icon: '🏆', color: 'var(--accent)', bg: 'var(--accent-tint)' },
  default: { icon: '', color: '#fff', bg: 'var(--ink)' },
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null); // { message, type }
  const timer = useRef(null);

  // Backward-compatible: showToast('text') or showToast('text', 'success')
  const showToast = useCallback((message, type = 'default') => {
    setToast({ message, type });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const style = TYPE_STYLE[toast?.type] || TYPE_STYLE.default;

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        aria-live="polite"
        className={`fixed left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          toast ? 'bottom-24 opacity-100' : 'bottom-16 pointer-events-none opacity-0'
        }`}
        style={
          toast?.type && toast.type !== 'default'
            ? { background: style.bg, color: style.color, border: `1px solid ${style.color}33` }
            : { background: 'var(--ink)', color: 'var(--bg)' }
        }
      >
        {toast?.type && toast.type !== 'default' && <span className="font-bold">{style.icon}</span>}
        {toast?.message}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
