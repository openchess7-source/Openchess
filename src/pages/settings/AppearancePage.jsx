import { useTheme } from '../../app/providers/ThemeProvider';
import Row from '../../components/common/Row';
import Panel from '../../components/common/Panel';

function ToggleSwitch({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative h-6 w-11 rounded-full transition-colors"
      style={{ background: on ? 'var(--accent)' : 'var(--surface-alt)', border: '1px solid var(--line)' }}
    >
      <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform" style={{ left: on ? 22 : 2 }} />
    </button>
  );
}

export default function AppearancePage() {
  const { mode, setMode, density, setDensity, reducedMotion, setReducedMotion, animationsEnabled, setAnimationsEnabled } = useTheme();

  return (
    <div className="px-4 pb-10 pt-2 md:px-0">
      <div className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Theme</div>
      <Panel className="mb-5">
        {['dark', 'light', 'system'].map((m) => (
          <Row key={m} onClick={() => setMode(m)}>
            <span className="text-sm font-semibold capitalize">{m}</span>
            {mode === m && <span style={{ color: 'var(--accent)' }}>✓</span>}
          </Row>
        ))}
      </Panel>

      <div className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Density</div>
      <Panel className="mb-5">
        {['comfortable', 'compact'].map((d) => (
          <Row key={d} onClick={() => setDensity(d)}>
            <span className="text-sm font-semibold capitalize">{d}</span>
            {density === d && <span style={{ color: 'var(--accent)' }}>✓</span>}
          </Row>
        ))}
      </Panel>

      <div className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Motion</div>
      <Panel>
        <Row>
          <span className="text-sm font-semibold">Animations</span>
          <ToggleSwitch on={animationsEnabled} onClick={() => setAnimationsEnabled((v) => !v)} />
        </Row>
        <Row>
          <span className="text-sm font-semibold">Reduce motion</span>
          <ToggleSwitch on={reducedMotion} onClick={() => setReducedMotion((v) => !v)} />
        </Row>
      </Panel>
    </div>
  );
}
