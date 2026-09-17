import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTheme } from '../../app/providers/ThemeProvider';
import Row from '../../components/common/Row';
import Panel from '../../components/common/Panel';

function ToggleSwitch({ on, onClick }) {
  return (
    <button onClick={onClick} className="relative h-6 w-11 rounded-full" style={{ background: on ? 'var(--accent)' : 'var(--surface-alt)', border: '1px solid var(--line)' }}>
      <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform" style={{ left: on ? 22 : 2 }} />
    </button>
  );
}

export default function AccessibilityPage() {
  const { reducedMotion, setReducedMotion } = useTheme();
  const [highContrast, setHighContrast] = useLocalStorage('oc:high-contrast', false);
  const [largeText, setLargeText] = useLocalStorage('oc:large-text', false);
  const [colorBlindMode, setColorBlindMode] = useLocalStorage('oc:colorblind', false);
  const [screenReaderMoves, setScreenReaderMoves] = useLocalStorage('oc:sr-moves', true);

  return (
    <div className="px-4 pb-10 pt-2 md:px-0">
      <Panel>
        <Row><span className="text-sm font-semibold">Reduce motion</span><ToggleSwitch on={reducedMotion} onClick={() => setReducedMotion((v) => !v)} /></Row>
        <Row><span className="text-sm font-semibold">High contrast</span><ToggleSwitch on={highContrast} onClick={() => setHighContrast((v) => !v)} /></Row>
        <Row><span className="text-sm font-semibold">Large text</span><ToggleSwitch on={largeText} onClick={() => setLargeText((v) => !v)} /></Row>
        <Row><span className="text-sm font-semibold">Color-blind friendly indicators</span><ToggleSwitch on={colorBlindMode} onClick={() => setColorBlindMode((v) => !v)} /></Row>
        <Row><span className="text-sm font-semibold">Announce moves for screen readers</span><ToggleSwitch on={screenReaderMoves} onClick={() => setScreenReaderMoves((v) => !v)} /></Row>
      </Panel>
    </div>
  );
}
