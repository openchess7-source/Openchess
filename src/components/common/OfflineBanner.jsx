import { useOnlineStatus } from '../../hooks/useOnlineStatus';

// spec §70 — never pretend the player can make online moves offline
export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="sticky top-0 z-40 px-4 py-2 text-center text-xs font-bold" style={{ background: 'var(--warning-tint)', color: 'var(--warning)' }}>
      You're offline — some features are unavailable.{' '}
      <button onClick={() => window.location.reload()} className="underline">Retry</button>
    </div>
  );
}
