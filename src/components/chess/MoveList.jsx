const TAG_STYLE = {
  best: { background: 'var(--win-tint)', color: 'var(--win)' },
  good: { background: 'var(--info-tint)', color: 'var(--info)' },
  inaccuracy: { background: 'var(--draw-tint)', color: 'var(--ink-soft)' },
  mistake: { background: 'var(--warning-tint)', color: 'var(--warning)' },
  blunder: { background: 'var(--loss-tint)', color: 'var(--loss)' },
};

/**
 * pairs: [{ no, white, black, whiteTag?, blackTag? }]
 */
export default function MoveList({ pairs, currentPly = null, onSelectPly }) {
  if (!pairs?.length) {
    return <div className="py-8 text-center text-sm" style={{ color: 'var(--ink-faint)' }}>No moves yet</div>;
  }

  return (
    <div className="font-display text-sm">
      {pairs.map((pair) => (
        <div key={pair.no} className="flex gap-2.5 border-b py-1.5" style={{ borderColor: 'var(--line)' }}>
          <span className="w-5" style={{ color: 'var(--ink-faint)' }}>
            {pair.no}
          </span>
          {['white', 'black'].map((side) => {
            const san = pair[side];
            if (!san) return <span key={side} />;
            const ply = pair.no * 2 - (side === 'white' ? 1 : 0);
            const tag = pair[`${side}Tag`];
            const isCurrent = currentPly === ply;
            return (
              <button
                key={side}
                onClick={() => onSelectPly?.(ply)}
                className="rounded-sm px-1.5 py-0.5 font-semibold"
                style={tag ? TAG_STYLE[tag] : isCurrent ? { background: 'var(--accent-tint)', color: 'var(--accent-dark)' } : undefined}
              >
                {san}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
