import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mock } from '../../services/mockService';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useAuth } from '../../app/providers/AuthProvider';
import StandingsRow from '../../components/tournaments/StandingsRow';
import BracketNode from '../../components/tournaments/BracketNode';
import Panel from '../../components/common/Panel';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const POLL_MS = 5000;

function ArenaStandings({ tournamentId }) {
  const standingsState = useAsyncData(() => mock.standings(tournamentId), [tournamentId]);

  if (standingsState.status === 'loading') return <LoadingState label="Loading standings" />;
  if (standingsState.status === 'error') return <ErrorState message={standingsState.error} onRetry={standingsState.retry} />;
  if (standingsState.data.length === 0) {
    return <EmptyState icon="🏆" title="No one has registered yet" description="Be the first to join this tournament." />;
  }
  return (
    <Panel>
      {standingsState.data.map((s) => <StandingsRow key={s.rank} row={s} />)}
    </Panel>
  );
}

function SwissView({ tournamentId }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const sState = useAsyncData(() => mock.swiss(tournamentId), [tournamentId]);
  const pollRef = useRef(null);

  useEffect(() => {
    clearInterval(pollRef.current);
    if (sState.status === 'success' && sState.data.status === 'in_progress') {
      pollRef.current = setInterval(sState.retry, POLL_MS);
    }
    return () => clearInterval(pollRef.current);
  }, [sState.status, sState.data?.status, sState.retry]);

  if (sState.status === 'loading') return <LoadingState label="Loading standings" />;
  if (sState.status === 'error') return <ErrorState message={sState.error} onRetry={sState.retry} />;

  const { status, currentRound, totalRounds, pairings, standings } = sState.data;

  if (status === 'upcoming') {
    return <EmptyState icon="⏳" title="Not started yet" description="Pairings appear once the tournament starts." />;
  }
  if (status === 'insufficient_players') {
    return <EmptyState icon="🏆" title="Waiting for players" description="At least 2 registered players are needed to pair round 1." />;
  }

  return (
    <>
      <p className="mb-3 text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>
        {status === 'completed' ? `Final standings — ${totalRounds} rounds complete` : `Round ${currentRound} of ${totalRounds}`}
      </p>

      {pairings.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-3">
          {pairings.map((m) => (
            <BracketNode key={m.id} match={m} currentUserId={user?.id} onPlay={(gameId) => navigate(`/game/${gameId}`)} />
          ))}
        </div>
      )}

      {standings.length === 0 ? (
        <EmptyState icon="🏆" title="No one has registered yet" description="Be the first to join this tournament." />
      ) : (
        <Panel>
          {standings.map((s) => <StandingsRow key={s.rank} row={s} />)}
        </Panel>
      )}
    </>
  );
}

export default function TournamentStandingsPage() {
  const { tournamentId } = useParams();
  const tState = useAsyncData(() => mock.tournamentById(tournamentId), [tournamentId]);

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-4">
      <h1 className="mb-4 font-display text-lg font-bold">Standings</h1>
      {tState.status === 'loading' && <LoadingState label="Loading tournament" />}
      {tState.status === 'error' && <ErrorState message={tState.error} onRetry={tState.retry} />}
      {tState.status === 'success' && tState.data.formatType === 'swiss' && <SwissView tournamentId={tournamentId} />}
      {tState.status === 'success' && tState.data.formatType !== 'swiss' && <ArenaStandings tournamentId={tournamentId} />}
    </div>
  );
}
