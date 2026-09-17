import { useEffect, useState } from 'react';
import { activateWaitingServiceWorker } from './registerServiceWorker';

export default function PwaUpdatePrompt() {
  const [registration, setRegistration] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function onUpdateAvailable(e) {
      setRegistration(e.detail.registration);
      setDismissed(false);
    }
    window.addEventListener('sw-update-available', onUpdateAvailable);
    return () => window.removeEventListener('sw-update-available', onUpdateAvailable);
  }, []);

  if (!registration || dismissed) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[200] flex items-center justify-between gap-3 border-t px-4 py-3 text-sm"
      style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}
      role="status"
    >
      <span className="font-medium">A new version of Openchess is ready.</span>
      <div className="flex shrink-0 gap-2">
        <button onClick={() => setDismissed(true)} className="px-2 py-1 text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>
          Later
        </button>
        <button
          onClick={() => activateWaitingServiceWorker(registration)}
          className="rounded-sm px-3 py-1.5 text-xs font-bold text-white"
          style={{ background: 'var(--accent)' }}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
