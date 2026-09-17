import { useEffect, useRef } from 'react';
import Button from './Button';

// Accessible modal: traps initial focus, closes on Escape, per spec §40.
export default function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger, onConfirm, onCancel }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    confirmRef.current?.focus();
    function onKey(e) {
      if (e.key === 'Escape') onCancel?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" className="fixed inset-0 z-[90] flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-sm rounded-md border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
        <h2 id="confirm-dialog-title" className="mb-1.5 font-display text-base font-bold">{title}</h2>
        {description && <p className="mb-5 text-sm" style={{ color: 'var(--ink-soft)' }}>{description}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
          <Button ref={confirmRef} variant={danger ? 'danger' : 'primary'} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
