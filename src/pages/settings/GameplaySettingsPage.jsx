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

export default function GameplaySettingsPage() {
  const [confirmMoves, setConfirmMoves] = useLocalStorage('oc:confirm-moves', false);
  const [premoves, setPremoves] = useLocalStorage('oc:premoves', true);
  const [autoPromoteQueen, setAutoPromoteQueen] = useLocalStorage('oc:auto-promote', false);
  const [showEngineHints, setShowEngineHints] = useLocalStorage('oc:engine-hints', false);
  const [confirmResign, setConfirmResign] = useLocalStorage('oc:confirm-resign', true);

  return (
    <div className="px-4 pb-10 pt-2 md:px-0">
      <Panel>
        <Row><span className="text-sm font-semibold">Confirm moves before submitting</span><ToggleSwitch on={confirmMoves} onClick={() => setConfirmMoves((v) => !v)} /></Row>
        <Row><span className="text-sm font-semibold">Allow premoves</span><ToggleSwitch on={premoves} onClick={() => setPremoves((v) => !v)} /></Row>
        <Row><span className="text-sm font-semibold">Auto-promote to queen</span><ToggleSwitch on={autoPromoteQueen} onClick={() => setAutoPromoteQueen((v) => !v)} /></Row>
        <Row><span className="text-sm font-semibold">Show engine hints (casual games)</span><ToggleSwitch on={showEngineHints} onClick={() => setShowEngineHints((v) => !v)} /></Row>
        <Row><span className="text-sm font-semibold">Confirm before resigning</span><ToggleSwitch on={confirmResign} onClick={() => setConfirmResign((v) => !v)} /></Row>
      </Panel>
    </div>
  );
}
