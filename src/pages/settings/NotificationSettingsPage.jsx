import { useLocalStorage } from '../../hooks/useLocalStorage';
import Row from '../../components/common/Row';
import Panel from '../../components/common/Panel';

function ToggleSwitch({ on, onClick }) {
  return (
    <button onClick={onClick} className="relative h-6 w-11 rounded-full" style={{ background: on ? 'var(--accent)' : 'var(--surface-alt)', border: '1px solid var(--line)' }}>
      <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform" style={{ left: on ? 22 : 2 }} />
    </button>
  );
}

const TOGGLES = [
  ['gameInvites', 'Game invites'],
  ['friendRequests', 'Friend requests'],
  ['tournaments', 'Tournaments'],
  ['clubs', 'Clubs'],
  ['achievements', 'Achievements'],
  ['system', 'System'],
];

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useLocalStorage('oc:notification-prefs', {
    gameInvites: true, friendRequests: true, tournaments: true, clubs: false, achievements: true, system: true,
  });

  return (
    <div className="px-4 pb-10 pt-2 md:px-0">
      <Panel>
        {TOGGLES.map(([key, label]) => (
          <Row key={key}>
            <span className="text-sm font-semibold">{label}</span>
            <ToggleSwitch on={prefs[key]} onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />
          </Row>
        ))}
      </Panel>
    </div>
  );
}
