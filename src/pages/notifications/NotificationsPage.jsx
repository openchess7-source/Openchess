import { mock } from '../../services/mockService';
import { data as realData } from '../../services/dataService';
import { useAsyncData } from '../../hooks/useAsyncData';
import { DEMO_MODE } from '../../config/env';
import Panel from '../../components/common/Panel';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const ICONS = { challenge: '⚔️', friend_request: '🤝', friend_accept: '🤝', tournament: '🏆', club: '♞', achievement: '🏅', system: '🔧' };

export default function NotificationsPage() {
  const notifState = useAsyncData(() => mock.notifications(), []);

  if (notifState.status === 'loading') return <LoadingState label="Loading notifications" />;
  if (notifState.status === 'error') return <ErrorState message={notifState.error} onRetry={notifState.retry} />;

  const items = notifState.data;

  async function markRead(id) {
    if (!DEMO_MODE) {
      try {
        await realData.markNotificationRead(id);
      } catch {
        return; // leave it as-is in the UI if persistence failed
      }
    }
    notifState.retry();
  }

  async function markAllRead() {
    if (!DEMO_MODE) {
      try {
        await realData.markAllNotificationsRead();
      } catch {
        return;
      }
    }
    notifState.retry();
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-lg font-bold">Notifications</h1>
        <Button variant="ghost" className="!px-0 text-xs" onClick={markAllRead}>Mark all read</Button>
      </div>
      {items.length === 0 ? (
        <EmptyState icon="🔔" title="You're all caught up" />
      ) : (
        <Panel>
          {items.map((n) => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className="flex cursor-pointer items-start gap-3 border-b px-4 py-3 last:border-b-0"
              style={{ borderColor: 'var(--line)', background: n.read ? undefined : 'var(--accent-tint)' }}
            >
              <span className="text-lg">{ICONS[n.type] || '🔔'}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{n.text}</div>
                <div className="mt-0.5 text-xs" style={{ color: 'var(--ink-soft)' }}>
                  {typeof n.time === 'string' && n.time.includes('ago') ? n.time : new Date(n.time).toLocaleString()}
                </div>
              </div>
              {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--accent)' }} />}
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
