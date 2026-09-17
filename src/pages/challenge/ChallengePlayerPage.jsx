import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mock } from '../../services/mockService';
import { TIME_CONTROLS } from '../../hooks/useTimeControl';
import { useToast } from '../../app/providers/ToastProvider';
import Chip from '../../components/common/Chip';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';

export default function ChallengePlayerPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [opponent, setOpponent] = useState(null);
  const [category, setCategory] = useState('blitz');
  const [selected, setSelected] = useState(TIME_CONTROLS.blitz[0]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    mock.findPlayer(username).then(setOpponent);
  }, [username]);

  if (!opponent) return <LoadingState label="Loading player" />;

  function sendChallenge() {
    // No backend endpoint for challenges yet — mocked per spec §PAGE 34.
    setPending(true);
    toast(`Challenge sent to ${opponent.username}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10 pt-6 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border font-display text-xl font-bold" style={{ background: 'var(--surface-alt)', borderColor: 'var(--line)' }}>
        {opponent.username?.slice(0, 2).toUpperCase()}
      </div>
      <div className="font-display text-lg font-bold">{opponent.username}</div>
      <div className="mb-6 text-sm" style={{ color: 'var(--ink-soft)' }}>{opponent.rating ?? opponent.ratings?.blitz}</div>

      {pending ? (
        <div className="rounded-md border p-5" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
          <div className="mb-3 text-sm font-semibold">Waiting for {opponent.username} to accept…</div>
          <Button variant="secondary" onClick={() => setPending(false)}>Cancel challenge</Button>
        </div>
      ) : (
        <>
          <div className="mb-3 flex justify-center gap-1.5">
            {Object.keys(TIME_CONTROLS).map((cat) => (
              <Chip key={cat} active={cat === category} onClick={() => { setCategory(cat); setSelected(TIME_CONTROLS[cat][0]); }}>
                {cat[0].toUpperCase() + cat.slice(1)}
              </Chip>
            ))}
          </div>
          <div className="mb-6 flex flex-wrap justify-center gap-1.5">
            {TIME_CONTROLS[category].map((tc) => (
              <Chip key={tc.label} active={selected.label === tc.label} onClick={() => setSelected(tc)}>{tc.label}</Chip>
            ))}
          </div>
          <Button className="w-full !py-3" onClick={sendChallenge}>Send challenge</Button>
        </>
      )}
    </div>
  );
}
