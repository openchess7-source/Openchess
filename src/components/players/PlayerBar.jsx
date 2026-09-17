import Clock from '../chess/Clock';

export default function PlayerBar({ name, rating, avatarInitials, seconds, isRunning, onTimeout }) {
  return (
    <div className="flex items-center justify-between px-1 py-2.5">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full border font-display text-xs font-bold"
          style={{ background: 'var(--surface-alt)', borderColor: 'var(--line)', color: 'var(--ink-soft)' }}
        >
          {avatarInitials}
        </div>
        <div>
          <span className="text-[13.5px] font-semibold">{name}</span>
          <span className="ml-1.5 text-xs" style={{ color: 'var(--ink-soft)' }}>{rating}</span>
        </div>
      </div>
      <Clock seconds={seconds} isRunning={isRunning} onTimeout={onTimeout} />
    </div>
  );
}
