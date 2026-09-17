import { TitleBadge } from '../common/Badge';

export default function PlayerCard({ player, subtitle, onClick }) {
  if (!player) return null;
  return (
    <div onClick={onClick} className={`flex items-center gap-2.5 ${onClick ? 'cursor-pointer' : ''}`}>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-xs font-bold"
        style={{ background: 'var(--surface-alt)', borderColor: 'var(--line)', color: 'var(--ink-soft)' }}
      >
        {player.username?.slice(0, 2).toUpperCase() || player.avatarInitials}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <TitleBadge title={player.title} />
          <span className="truncate text-[13.5px] font-semibold">{player.username}</span>
          {player.online && <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--win)' }} />}
        </div>
        {subtitle && <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>{subtitle}</div>}
      </div>
    </div>
  );
}
