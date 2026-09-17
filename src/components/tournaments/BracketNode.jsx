function PlayerRow({ player, isWinner, isBottom }) {
  return (
    <div
      className="flex items-center justify-between px-2.5 py-2 text-[12.5px] font-semibold"
      style={{
        background: isWinner ? 'var(--win-tint)' : 'var(--surface)',
        color: isWinner ? 'var(--win)' : player ? 'var(--ink)' : 'var(--ink-faint)',
        borderBottom: isBottom ? undefined : '1px solid var(--line)',
      }}
    >
      <span>{player ? player.username : 'TBD'}</span>
    </div>
  );
}

// `match` matches the shape served by GET /api/tournaments/:id/bracket:
// { player1, player2, status: 'pending'|'active'|'completed'|'bye', winnerId, gameId }
export default function BracketNode({ match, currentUserId, onPlay }) {
  const isYourMatch =
    match.status === 'active' && (match.player1?.id === currentUserId || match.player2?.id === currentUserId);

  return (
    <div className="mb-3 w-40">
      <div className="overflow-hidden rounded-sm border" style={{ borderColor: 'var(--line)' }}>
        <PlayerRow player={match.player1} isWinner={match.status !== 'pending' && match.winnerId === match.player1?.id} />
        <PlayerRow player={match.player2} isWinner={match.status !== 'pending' && match.winnerId === match.player2?.id} isBottom />
      </div>
      {match.status === 'bye' && (
        <div className="mt-1 text-center text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>
          Bye
        </div>
      )}
      {match.status === 'active' && !isYourMatch && (
        <div className="mt-1 text-center text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
          ● Live
        </div>
      )}
      {isYourMatch && (
        <button
          onClick={() => onPlay(match.gameId)}
          className="mt-1 w-full rounded-sm py-1 text-[11px] font-bold text-white"
          style={{ background: 'var(--accent)' }}
        >
          Play now
        </button>
      )}
    </div>
  );
}
