import MiniBoard from '../chess/MiniBoard';
import { ResultBadge } from '../common/Badge';

export default function GameHistoryCard({ game, onClick }) {
  const deltaClass = game.delta > 0 ? 'var(--win)' : game.delta < 0 ? 'var(--loss)' : 'var(--ink-soft)';
  const deltaText = game.delta > 0 ? `+${game.delta}` : String(game.delta);
  return (
    <div onClick={onClick} className="flex cursor-pointer items-center gap-3 border-b px-4 py-3 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
      <MiniBoard fen={game.fen} size={48} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <ResultBadge result={game.result} />
          <span className="truncate text-[13.5px] font-semibold">vs {game.opponent}</span>
        </div>
        <div className="mt-0.5 text-[11.5px]" style={{ color: 'var(--ink-soft)' }}>
          {game.mode} • {game.timeControl} • {game.moves} moves · {game.endedAt}
        </div>
      </div>
      <div className="font-display text-sm font-bold" style={{ color: deltaClass }}>
        {deltaText}
      </div>
    </div>
  );
}
