import { useEffect } from 'react';

// Reusable bottom sheet (spec §71) — moves, chat, actions, settings, etc.
export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[80] md:hidden ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className="absolute inset-0 transition-opacity"
        style={{ background: 'rgba(0,0,0,0.45)', opacity: open ? 1 : 0 }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-lg border-t transition-transform"
        style={{ background: 'var(--surface)', borderColor: 'var(--line)', transform: open ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div className="mx-auto mt-2.5 h-1 w-9 rounded-full" style={{ background: 'var(--line)' }} />
        {title && <div className="px-4 pb-1 pt-3 font-display text-sm font-bold">{title}</div>}
        <div className="px-4 pb-6 pt-2">{children}</div>
      </div>
    </div>
  );
}
