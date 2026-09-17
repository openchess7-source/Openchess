/**
 * scoreCp: centipawns from White's perspective. Clamped to +/-8 pawns
 * for the bar fill so mid-game swings stay readable.
 */
export default function EvalBar({ scoreCp = 0, mate = null, orientation = 'white' }) {
  const clamped = Math.max(-800, Math.min(800, scoreCp));
  let whitePct = 50 + (clamped / 800) * 50;
  if (mate !== null) whitePct = mate > 0 ? 97 : 3;
  const display = mate !== null ? `M${Math.abs(mate)}` : (scoreCp / 100).toFixed(1);

  const barWhitePct = orientation === 'white' ? whitePct : 100 - whitePct;

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--ink)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${barWhitePct}%`, background: '#FBF3E7' }} />
      </div>
      <span className="w-12 text-right font-display text-sm font-bold" style={{ color: scoreCp >= 0 ? 'var(--ink)' : 'var(--ink-soft)' }}>
        {scoreCp >= 0 ? '+' : ''}
        {display}
      </span>
    </div>
  );
}
