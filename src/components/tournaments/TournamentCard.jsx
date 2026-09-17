import Button from '../common/Button';

function formatCountdown(totalSeconds) {
  if (totalSeconds === null) return null;
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function TournamentCard({ tournament, countdown, onJoin, onOpen }) {
  return (
    <div
      onClick={onOpen}
      className={`rounded-md p-5 text-center text-white ${onOpen ? 'cursor-pointer' : ''}`}
      style={{ background: `linear-gradient(135deg, var(--accent), var(--accent-dark))` }}
    >
      <div className="font-display text-base font-bold">{tournament.name}</div>
      <div className="my-1.5 font-display text-3xl font-bold">{tournament.timeControl}</div>
      <div className="mb-4 text-xs opacity-85">{tournament.players.toLocaleString()} players · {tournament.format}</div>
      {tournament.status === 'live' ? (
        <div className="mb-4 text-sm font-bold uppercase tracking-wide opacity-90">● Live now</div>
      ) : tournament.status === 'upcoming' ? (
        <>
          <div className="text-[11px] uppercase tracking-wide opacity-75">Starting in</div>
          <div className="mb-4 font-display text-xl font-bold">{formatCountdown(countdown ?? tournament.startsInSeconds)}</div>
        </>
      ) : (
        <div className="mb-4 text-sm opacity-80">Completed</div>
      )}
      {onJoin && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onJoin();
          }}
          className="!border-0 !bg-white !text-[color:var(--accent-dark)]"
        >
          {tournament.status === 'completed' ? 'View results' : 'Join'}
        </Button>
      )}
    </div>
  );
}
