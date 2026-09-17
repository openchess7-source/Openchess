import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mock } from '../../services/mockService';
import { useAsyncData } from '../../hooks/useAsyncData';
import Chip from '../../components/common/Chip';
import Panel from '../../components/common/Panel';
import GameHistoryCard from '../../components/games/GameHistoryCard';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const RESULT_FILTERS = ['all', 'win', 'loss', 'draw'];

export default function GameHistoryPage() {
  const navigate = useNavigate();
  const gamesState = useAsyncData(() => mock.recentGames(), []);
  const [resultFilter, setResultFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');

  if (gamesState.status === 'loading') return <LoadingState label="Loading history" />;
  if (gamesState.status === 'error') return <ErrorState message={gamesState.error} onRetry={gamesState.retry} />;

  const games = gamesState.data;

  if (games.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-4">
        <h1 className="mb-4 font-display text-lg font-bold">Game history</h1>
        <EmptyState icon="♟" title="Your chess journey starts here" description="Play your first game and it'll show up right here." />
      </div>
    );
  }

  const modes = ['all', ...new Set(games.map((g) => g.mode))];
  const filtered = games.filter((g) => (resultFilter === 'all' || g.result === resultFilter) && (modeFilter === 'all' || g.mode === modeFilter));

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-4">
      <h1 className="mb-4 font-display text-lg font-bold">Game history</h1>

      <div className="mb-2 flex gap-1.5 overflow-x-auto">
        {RESULT_FILTERS.map((f) => (
          <Chip key={f} active={resultFilter === f} onClick={() => setResultFilter(f)}>
            {f[0].toUpperCase() + f.slice(1)}
          </Chip>
        ))}
      </div>
      <div className="mb-4 flex gap-1.5 overflow-x-auto">
        {modes.map((m) => (
          <Chip key={m} active={modeFilter === m} onClick={() => setModeFilter(m)}>
            {m}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="♟" title="No games match" description="Try a different filter combination." />
      ) : (
        <Panel>
          {filtered.map((g) => (
            <GameHistoryCard key={g.id} game={g} onClick={() => navigate(`/analysis/${g.id}`)} />
          ))}
        </Panel>
      )}
    </div>
  );
}
