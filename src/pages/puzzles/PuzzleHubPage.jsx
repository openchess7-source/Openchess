import { useNavigate } from 'react-router-dom';
import { mock } from '../../services/mockService';
import { useAsyncData } from '../../hooks/useAsyncData';
import MiniBoard from '../../components/chess/MiniBoard';
import Panel from '../../components/common/Panel';
import Row from '../../components/common/Row';
import SectionTitle from '../../components/common/SectionTitle';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

export default function PuzzleHubPage() {
  const navigate = useNavigate();
  const daily = useAsyncData(() => mock.dailyPuzzle(), []);
  const categories = useAsyncData(() => mock.puzzleCategories(), []);

  if (daily.status === 'loading' || categories.status === 'loading') return <LoadingState label="Loading puzzles" />;
  if (daily.status === 'error') return <ErrorState message={daily.error} onRetry={daily.retry} />;
  if (categories.status === 'error') return <ErrorState message={categories.error} onRetry={categories.retry} />;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-4">
      <div className="mb-1 text-center text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Daily puzzle</div>
      <h1 className="mb-4 text-center font-display text-xl font-bold">Find the best move</h1>

      <div className="mb-4 flex justify-center gap-8">
        <div className="text-center">
          <div className="font-display text-2xl font-bold">{daily.data.rating}</div>
          <div className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>Puzzle rating</div>
        </div>
        <div className="text-center">
          <div className="font-display text-2xl font-bold">🔥 {daily.data.streak ?? 0}</div>
          <div className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>Day streak</div>
        </div>
      </div>

      <div className="mb-3 flex justify-center">
        <MiniBoard fen={daily.data.fen} size={220} />
      </div>
      <Button className="mx-auto mb-8 block !w-fit !px-8" onClick={() => navigate(`/puzzles/${daily.data._id || daily.data.id}`)}>Solve</Button>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button onClick={() => navigate('/puzzles/rush')} className="rounded-md border p-4 text-left" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
          <div className="font-display text-base font-bold">Puzzle Rush</div>
          <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>Race the clock</div>
        </button>
        <button onClick={() => navigate('/puzzles/duel')} className="rounded-md border p-4 text-left" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
          <div className="font-display text-base font-bold">Puzzle Duel</div>
          <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>Head-to-head</div>
        </button>
      </div>

      <SectionTitle className="!px-0">Categories</SectionTitle>
      {categories.data.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--ink-faint)' }}>No puzzle categories yet</div>
      ) : (
        <Panel>
          {categories.data.map((c) => (
            <Row key={c.id} onClick={() => navigate(`/puzzles/${c.id}`)}>
              <span className="text-sm font-semibold capitalize">{c.name.replace(/-/g, ' ')}</span>
              <span className="text-xs" style={{ color: 'var(--ink-soft)' }}>{c.count} puzzles</span>
            </Row>
          ))}
        </Panel>
      )}
    </div>
  );
}
