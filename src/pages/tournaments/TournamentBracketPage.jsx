import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mock } from '../../services/mockService';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useAuth } from '../../app/providers/AuthProvider';
import BracketNode from '../../components/tournaments/BracketNode';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const POLL_MS = 5000;

export default function TournamentBracketPage() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const bState = useAsyncData(() => mock.bracket(tournamentId), [tournamentId]);
  const pollRef = useRef(null);

  // The bracket changes whenever a game finishes elsewhere, so poll
  // gently while anything is still undecided — same trade-off the rest
  // of this app makes (REST + polling, no dedicated push channel for
  // anything outside an open game's own socket room).
  useEffect(() => {
    clearInterval(pollRef.current);
    if (bState.status === 'success' && bState.data.status === 'in_progress') {
      pollRef.current = setInterval(bState.retry, POLL_MS);
    }
    return () => clearInterval(pollRef.current);
  }, [bState.status, bState.data?.status, bState.retry]);

  if (bState.status === 'loading') return <LoadingState label="Loading bracket" />;
  if (bState.status === 'error') return <ErrorState message={bState.error} onRetry={bState.retry} />;

  const { status, rounds, winner } = bState.data;

  if (status === 'upcoming') {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-10 pt-4 text-center">
        <h1 className="mb-2 font-display text-lg font-bold">Bracket</h1>
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          The bracket is drawn once the tournament starts. Check back then.
        </p>
      </div>
    );
  }

  if (status === 'insufficient_players') {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-10 pt-4 text-center">
        <h1 className="mb-2 font-display text-lg font-bold">Bracket</h1>
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          Waiting for at least 2 registered players before the bracket can be drawn.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-4">
      <h1 className="mb-1 font-display text-lg font-bold">Bracket</h1>
      {status === 'completed' && winner && (
        <p className="mb-4 text-sm font-semibold" style={{ color: 'var(--win)' }}>
          🏆 {winner.username} won the tournament
        </p>
      )}
      <div className="flex gap-8 overflow-x-auto pb-4">
        {rounds.map((round, i) => (
          <div key={i} className="flex flex-col justify-around">
            <div className="mb-2 text-center text-xs font-bold" style={{ color: 'var(--ink-soft)' }}>
              {i === rounds.length - 1 ? 'Final' : `Round ${i + 1}`}
            </div>
            {round.map((match) => (
              <BracketNode
                key={match.slot}
                match={match}
                currentUserId={user?.id}
                onPlay={(gameId) => navigate(`/game/${gameId}`)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
