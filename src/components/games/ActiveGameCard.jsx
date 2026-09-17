import MiniBoard from '../chess/MiniBoard';
import Button from '../common/Button';

export default function ActiveGameCard({ game, onContinue }) {
  return (
    <div className="flex items-center gap-3.5 p-3.5">
      <MiniBoard fen={game.fen} size={52} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
          {game.yourTurn ? 'Your turn' : "Opponent's turn"}
        </div>
        <div className="text-[13.5px] font-semibold">vs {game.opponent} · {game.opponentRating}</div>
        <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>
          {game.mode} {game.timeControl} · {game.timeRemaining} remaining
        </div>
        <Button variant="secondary" className="mt-2 !px-3.5 !py-1.5 text-xs" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
