import { useLocalStorage } from '../../hooks/useLocalStorage';
import Row from '../../components/common/Row';
import Panel from '../../components/common/Panel';

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-sm border px-2.5 py-1.5 text-xs font-semibold" style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function PrivacyPage() {
  const [profileVisibility, setProfileVisibility] = useLocalStorage('oc:privacy-profile', 'Everyone');
  const [onlineVisibility, setOnlineVisibility] = useLocalStorage('oc:privacy-online', 'Friends');
  const [challengePermission, setChallengePermission] = useLocalStorage('oc:privacy-challenge', 'Everyone');
  const [messagePermission, setMessagePermission] = useLocalStorage('oc:privacy-message', 'Friends');
  const [historyVisibility, setHistoryVisibility] = useLocalStorage('oc:privacy-history', 'Everyone');

  const OPTIONS = ['Everyone', 'Friends', 'Nobody'];

  return (
    <div className="px-4 pb-10 pt-2 md:px-0">
      <Panel>
        <Row><span className="text-sm font-semibold">Profile visibility</span><Select value={profileVisibility} onChange={setProfileVisibility} options={OPTIONS} /></Row>
        <Row><span className="text-sm font-semibold">Online status</span><Select value={onlineVisibility} onChange={setOnlineVisibility} options={OPTIONS} /></Row>
        <Row><span className="text-sm font-semibold">Who can challenge you</span><Select value={challengePermission} onChange={setChallengePermission} options={OPTIONS} /></Row>
        <Row><span className="text-sm font-semibold">Who can message you</span><Select value={messagePermission} onChange={setMessagePermission} options={OPTIONS} /></Row>
        <Row><span className="text-sm font-semibold">Game history visibility</span><Select value={historyVisibility} onChange={setHistoryVisibility} options={OPTIONS} /></Row>
      </Panel>
    </div>
  );
}
