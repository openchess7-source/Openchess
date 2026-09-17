import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mock } from '../../services/mockService';
import Panel from '../../components/common/Panel';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';

export default function BotsPage() {
  const navigate = useNavigate();
  const [bots, setBots] = useState(null);

  useEffect(() => {
    mock.bots().then(setBots);
  }, []);

  if (!bots) return <LoadingState label="Loading bots" />;

  return (
    <div className="mx-auto max-w-xl px-4 pb-8 pt-5">
      <div className="mb-1 text-center font-display text-lg font-bold">Play a bot</div>
      <p className="mb-6 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>Practice against a range of playing strengths</p>
      <Panel>
        {bots.map((bot) => (
          <div key={bot.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-lg" style={{ background: 'var(--surface-alt)', borderColor: 'var(--line)' }}>
              🤖
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{bot.name}</div>
              <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>Rating {bot.rating}</div>
            </div>
            <Button className="!px-3.5 !py-1.5 text-xs" onClick={() => navigate('/game/demo')}>Play</Button>
          </div>
        ))}
      </Panel>
    </div>
  );
}
