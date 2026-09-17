// spec §68-69 — opponent disconnect / reconnect states
export default function ReconnectBanner({ status, countdown }) {
  if (status === 'disconnected') {
    return (
      <div className="mx-4 mt-3 flex items-center justify-between rounded-sm px-3.5 py-2.5 text-xs font-semibold md:mx-1" style={{ background: 'var(--warning-tint)', color: 'var(--warning)' }}>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse-slow rounded-full" style={{ background: 'var(--warning)' }} />
          Opponent disconnected — waiting for reconnection…
        </span>
        <span className="font-display tabular-nums">{countdown}</span>
      </div>
    );
  }
  if (status === 'reconnected') {
    return (
      <div className="mx-4 mt-3 rounded-sm px-3.5 py-2.5 text-center text-xs font-semibold md:mx-1" style={{ background: 'var(--win-tint)', color: 'var(--win)' }}>
        Opponent reconnected
      </div>
    );
  }
  return null;
}
