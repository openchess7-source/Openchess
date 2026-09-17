import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mock } from '../../services/mockService';
import { useAsyncData } from '../../hooks/useAsyncData';
import TournamentCard from '../../components/tournaments/TournamentCard';
import Chip from '../../components/common/Chip';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const STATUS_FILTERS = ['live', 'upcoming', 'completed'];

export default function TournamentHubPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('upcoming');
  const tState = useAsyncData(() => mock.tournaments(), []);

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-4">
      <h1 className="mb-4 font-display text-lg font-bold">Tournaments</h1>
      <div className="mb-4 flex gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</Chip>
        ))}
      </div>

      {tState.status === 'loading' && <LoadingState label="Loading tournaments" />}
      {tState.status === 'error' && <ErrorState message={tState.error} onRetry={tState.retry} />}
      {tState.status === 'success' && (
        <div className="flex flex-col gap-4">
          {tState.data.filter((t) => t.status === filter).length === 0 ? (
            <EmptyState icon="🏆" title="No tournaments right now" description="Check back soon, or browse a different status." />
          ) : (
            tState.data
              .filter((t) => t.status === filter)
              .map((t) => (
                <TournamentCard key={t.id} tournament={t} onOpen={() => navigate(`/tournaments/${t.id}`)} onJoin={() => navigate(`/tournaments/${t.id}`)} />
              ))
          )}
        </div>
      )}
    </div>
  );
}
