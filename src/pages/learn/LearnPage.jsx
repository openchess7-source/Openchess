import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mock } from '../../services/mockService';
import ProgressBar from '../../components/common/ProgressBar';
import Panel from '../../components/common/Panel';
import SectionTitle from '../../components/common/SectionTitle';
import TopicRow from '../../components/learning/TopicRow';
import LoadingState from '../../components/common/LoadingState';

const TOPICS = ['tactics', 'endgames', 'openings', 'strategy', 'checkmates'];

export default function LearnPage() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState(null);

  useEffect(() => {
    mock.lessons().then(setLessons);
  }, []);

  if (!lessons) return <LoadingState label="Loading training" />;
  const overallProgress = lessons.reduce((sum, l) => sum + l.progress, 0) / lessons.length;
  const inProgress = lessons.find((l) => l.progress > 0 && l.progress < 1) || lessons[0];

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-4">
      <SectionTitle className="!px-0">Your training</SectionTitle>
      <ProgressBar value={overallProgress} />
      <div className="mb-5 mt-1.5 text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>{Math.round(overallProgress * 100)}% through this week's plan</div>

      <Panel className="mb-6 flex items-center justify-between p-4">
        <div>
          <div className="mb-0.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Continue</div>
          <div className="font-display text-base font-bold">{inProgress.title}</div>
        </div>
        <button onClick={() => navigate(`/learn/${inProgress.id}`)} className="rounded-sm px-4 py-2 font-display text-sm font-bold" style={{ background: 'var(--accent)', color: '#fff' }}>
          Resume
        </button>
      </Panel>

      {TOPICS.map((topic) => (
        <div key={topic} className="mb-5">
          <SectionTitle className="!px-0 capitalize">{topic}</SectionTitle>
          <Panel>
            {lessons.filter((l) => l.topic === topic).map((l) => (
              <TopicRow key={l.id} title={l.title} meta={l.progress === 1 ? 'Complete' : l.progress > 0 ? `${Math.round(l.progress * 100)}%` : 'Start'} progress={l.progress} onClick={() => navigate(`/learn/${l.id}`)} />
            ))}
            {lessons.filter((l) => l.topic === topic).length === 0 && (
              <div className="px-4 py-3 text-xs" style={{ color: 'var(--ink-faint)' }}>More lessons coming soon</div>
            )}
          </Panel>
        </div>
      ))}
    </div>
  );
}
