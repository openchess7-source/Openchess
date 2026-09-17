import { useNavigate, useParams } from 'react-router-dom';
import { mock } from '../../services/mockService';
import { data as realData } from '../../services/dataService';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useToast } from '../../app/providers/ToastProvider';
import { DEMO_MODE } from '../../config/env';
import TournamentCard from '../../components/tournaments/TournamentCard';
import Panel from '../../components/common/Panel';
import Row from '../../components/common/Row';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { ChevronIcon } from '../../components/navigation/icons';

export default function TournamentDetailsPage() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const tState = useAsyncData(() => mock.tournamentById(tournamentId), [tournamentId]);

  if (tState.status === 'loading') return <LoadingState label="Loading tournament" />;
  if (tState.status === 'error') return <ErrorState message={tState.error} onRetry={tState.retry} />;

  const tournament = tState.data;

  async function handleJoin() {
    if (DEMO_MODE) return toast('Demo mode — connect a real backend to register', 'info');
    try {
      await realData.joinTournament(tournamentId);
      toast('You\'re registered', 'success');
      tState.retry();
    } catch (err) {
      toast(err.message || 'Could not join', 'error');
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-4">
      <TournamentCard tournament={tournament} onJoin={handleJoin} />
      <Panel className="mt-5">
        {tournament.formatType === 'elimination' ? (
          <Row onClick={() => navigate(`/tournaments/${tournamentId}/bracket`)}>
            <span className="text-sm font-semibold">Bracket</span>
            <ChevronIcon width={16} height={16} style={{ color: 'var(--ink-faint)' }} />
          </Row>
        ) : (
          <Row onClick={() => navigate(`/tournaments/${tournamentId}/standings`)}>
            <span className="text-sm font-semibold">Standings</span>
            <ChevronIcon width={16} height={16} style={{ color: 'var(--ink-faint)' }} />
          </Row>
        )}
        <Row>
          <span className="text-sm font-semibold">Format</span>
          <span className="text-xs" style={{ color: 'var(--ink-soft)' }}>{tournament.format}</span>
        </Row>
        {tournament.isRegistered !== undefined && (
          <Row>
            <span className="text-sm font-semibold">Your registration</span>
            <span className="text-xs" style={{ color: tournament.isRegistered ? 'var(--win)' : 'var(--ink-soft)' }}>
              {tournament.isRegistered ? 'Registered' : 'Not registered'}
            </span>
          </Row>
        )}
      </Panel>
    </div>
  );
}
