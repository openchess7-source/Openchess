import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mock } from '../../services/mockService';
import { data as realData } from '../../services/dataService';
import { useAsyncData } from '../../hooks/useAsyncData';
import Board from '../../components/chess/Board';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { useToast } from '../../app/providers/ToastProvider';
import { DEMO_MODE } from '../../config/env';

export default function PuzzleSolverPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const puzzleState = useAsyncData(() => mock.puzzleById(id), [id]);
  const [feedback, setFeedback] = useState(null);
  const [boardKey, setBoardKey] = useState(0);
  const [solved, setSolved] = useState(false);

  if (puzzleState.status === 'loading') return <LoadingState label="Loading puzzle" />;
  if (puzzleState.status === 'error') return <ErrorState message={puzzleState.error} onRetry={puzzleState.retry} />;

  const puzzle = puzzleState.data;

  function handleMove(move) {
    const isCorrect = puzzle.solution[0].replace('+', '').replace('#', '') === move.san.replace('+', '').replace('#', '');
    if (!DEMO_MODE) {
      realData.submitPuzzleSolve(puzzle._id || puzzle.id, isCorrect).catch(() => {
        // Solve tracking failing shouldn't block the player from seeing their result.
        toast('Could not save this attempt — check your connection', 'warning');
      });
    }
    if (isCorrect) {
      setFeedback('correct');
      setSolved(true);
    } else {
      setFeedback('incorrect');
    }
  }

  function retry() {
    setFeedback(null);
    setBoardKey((k) => k + 1);
  }

  if (solved) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-2xl" style={{ background: 'var(--win-tint)', color: 'var(--win)' }}>✓</div>
        <h1 className="mb-5 font-display text-lg font-bold">Puzzle complete</h1>
        <div className="mb-1 flex items-center justify-center gap-2 font-display text-2xl font-bold">
          <span>{puzzle.rating}</span>
          <span style={{ color: 'var(--ink-faint)' }}>→</span>
          <span style={{ color: 'var(--win)' }}>{puzzle.rating + 15}</span>
        </div>
        {puzzle.streak !== undefined && (
          <div className="mb-6 text-sm" style={{ color: 'var(--ink-soft)' }}>🔥 Streak extended to {puzzle.streak + 1} days</div>
        )}
        <div className="flex justify-center gap-2">
          <Button onClick={() => navigate('/puzzles')}>Next puzzle</Button>
          <Button variant="secondary" onClick={() => navigate(`/analysis/${id}`)}>Analyze</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-4">
      <div className="mb-1 text-center text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Puzzle</div>
      <h1 className="mb-4 text-center font-display text-lg font-bold">
        {puzzle.sideToMove === 'black' ? 'Black' : 'White'} to move
      </h1>

      <Board key={boardKey} fen={puzzle.fen} interactive={feedback !== 'incorrect'} onLegalMove={handleMove} className="mx-auto max-w-[480px]" />

      {feedback === 'incorrect' && (
        <div className="mx-auto mt-4 max-w-[480px] rounded-sm px-3 py-2.5 text-center text-sm font-semibold" style={{ background: 'var(--loss-tint)', color: 'var(--loss)' }}>
          Not quite — try again.
        </div>
      )}

      <div className="mx-auto mt-4 flex max-w-[480px] justify-center gap-2">
        <Button variant="secondary" onClick={() => toast(`Hint: ${puzzle.hint}`)}>Hint</Button>
        <Button variant="secondary" onClick={retry}>Retry</Button>
      </div>
    </div>
  );
}
