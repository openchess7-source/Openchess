import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mock } from '../../services/mockService';
import { data as realData } from '../../services/dataService';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useToast } from '../../app/providers/ToastProvider';
import { DEMO_MODE } from '../../config/env';
import Button from '../../components/common/Button';
import Panel from '../../components/common/Panel';
import Row from '../../components/common/Row';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { ChevronIcon } from '../../components/navigation/icons';

export default function ClubDetailsPage() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const clubState = useAsyncData(() => mock.clubById(clubId), [clubId]);

  if (clubState.status === 'loading') return <LoadingState label="Loading club" />;
  if (clubState.status === 'error') return <ErrorState message={clubState.error} onRetry={clubState.retry} />;

  const club = clubState.data;

  async function handleJoin() {
    if (DEMO_MODE) return toast('Demo mode — connect a real backend to join', 'info');
    try {
      await realData.joinClub(clubId);
      toast('Joined the club', 'success');
      clubState.retry();
    } catch (err) {
      toast(err.message || 'Could not join', 'error');
    }
  }

  async function handleLeave() {
    setLeaveConfirmOpen(false);
    if (DEMO_MODE) return toast('Demo mode — connect a real backend to leave', 'info');
    try {
      await realData.leaveClub(clubId);
      toast('Left the club', 'info');
      navigate('/clubs');
    } catch (err) {
      toast(err.message || 'Could not leave', 'error');
    }
  }

  return (
    <div className="pb-10">
      <div className="border-b px-4 py-9 text-center" style={{ background: 'var(--surface-alt)', borderColor: 'var(--line)' }}>
        <div className="font-display text-xl font-bold">♞ {club.name}</div>
        <div className="mt-1 text-sm" style={{ color: 'var(--ink-soft)' }}>{club.members.toLocaleString()} members</div>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold" style={{ color: 'var(--win)' }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--win)' }} /> {club.online} online now
        </div>
        {!club.joined && <Button className="mt-4" onClick={handleJoin}>Join</Button>}
      </div>

      <div className="mx-auto max-w-xl px-4 pt-5">
        <Panel>
          <Row onClick={() => toast('Club activity feed coming soon', 'info')}>
            <span className="text-sm font-semibold">Recent activity</span>
            <ChevronIcon width={16} height={16} style={{ color: 'var(--ink-faint)' }} />
          </Row>
          <Row onClick={() => navigate(`/clubs/${clubId}/tournament`)}>
            <span className="text-sm font-semibold">Club tournament</span>
            <ChevronIcon width={16} height={16} style={{ color: 'var(--ink-faint)' }} />
          </Row>
          <Row onClick={() => navigate(`/clubs/${clubId}/members`)}>
            <span className="text-sm font-semibold">Members</span>
            <ChevronIcon width={16} height={16} style={{ color: 'var(--ink-faint)' }} />
          </Row>
          <Row onClick={() => toast('Club games feed coming soon', 'info')}>
            <span className="text-sm font-semibold">Games</span>
            <ChevronIcon width={16} height={16} style={{ color: 'var(--ink-faint)' }} />
          </Row>
          {club.joined && (
            <Row onClick={() => setLeaveConfirmOpen(true)}>
              <span className="text-sm font-semibold" style={{ color: 'var(--loss)' }}>Leave club</span>
            </Row>
          )}
        </Panel>
      </div>

      <ConfirmDialog
        open={leaveConfirmOpen}
        title="Leave this club?"
        description="You can rejoin later if it's a public club."
        confirmLabel="Leave"
        danger
        onConfirm={handleLeave}
        onCancel={() => setLeaveConfirmOpen(false)}
      />
    </div>
  );
}
