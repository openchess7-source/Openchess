import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { mock } from '../../services/mockService';
import Board from '../../components/chess/Board';
import Button from '../../components/common/Button';
import ProgressBar from '../../components/common/ProgressBar';
import LoadingState from '../../components/common/LoadingState';

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [fen] = useState(new Chess().fen());

  useEffect(() => {
    mock.lessonById(lessonId).then(setLesson);
  }, [lessonId]);

  if (!lesson) return <LoadingState label="Loading lesson" />;

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-4">
      <div className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>{lesson.topic}</div>
      <h1 className="mb-3 font-display text-lg font-bold">{lesson.title}</h1>
      <ProgressBar value={lesson.progress} />

      <Board fen={fen} interactive className="mx-auto my-5 max-w-[440px]" />

      <p className="mb-6 text-sm" style={{ color: 'var(--ink-soft)' }}>
        Play through the position above to practice the idea behind this lesson. Try the highlighted plan, then check
        your understanding against the explanation once you're ready to move on.
      </p>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => navigate('/learn')}>Previous</Button>
        <Button onClick={() => navigate('/learn')}>Mark complete & continue</Button>
      </div>
    </div>
  );
}
