import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TIME_CONTROLS } from '../../hooks/useTimeControl';
import Chip from '../../components/common/Chip';
import Button from '../../components/common/Button';

const VARIANTS = ['Standard', 'Chess960', 'Crazyhouse', 'King of the Hill'];

export default function CustomGamePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('rapid');
  const [selected, setSelected] = useState(TIME_CONTROLS.rapid[0]);
  const [rated, setRated] = useState(true);
  const [color, setColor] = useState('random');
  const [variant, setVariant] = useState('Standard');
  const [ratingRange, setRatingRange] = useState(200);

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-5">
      <div className="mb-1 text-center font-display text-lg font-bold">Custom game</div>
      <p className="mb-6 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>Set the rules, then find an opponent</p>

      <div className="mb-1.5 px-0.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Time control</div>
      <div className="mb-4 flex gap-1.5 overflow-x-auto">
        {Object.keys(TIME_CONTROLS).map((cat) => (
          <Chip key={cat} active={cat === category} onClick={() => { setCategory(cat); setSelected(TIME_CONTROLS[cat][0]); }}>
            {cat[0].toUpperCase() + cat.slice(1)}
          </Chip>
        ))}
      </div>
      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border" style={{ borderColor: 'var(--line)', background: 'var(--line)' }}>
        {TIME_CONTROLS[category].map((tc) => (
          <button
            key={tc.label}
            onClick={() => setSelected(tc)}
            className="p-4 text-center"
            style={{ background: selected.label === tc.label ? 'var(--accent-tint)' : 'var(--surface)' }}
          >
            <div className="font-display text-xl font-bold" style={{ color: selected.label === tc.label ? 'var(--accent-dark)' : 'var(--ink)' }}>{tc.label}</div>
          </button>
        ))}
      </div>

      <div className="mb-1.5 px-0.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Rules</div>
      <div className="mb-4 flex gap-1.5">
        <Chip active={rated} onClick={() => setRated(true)}>Rated</Chip>
        <Chip active={!rated} onClick={() => setRated(false)}>Casual</Chip>
      </div>

      <div className="mb-1.5 px-0.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Your color</div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {[{ key: 'white', label: 'White', glyph: '♔' }, { key: 'random', label: 'Random', glyph: '⇄' }, { key: 'black', label: 'Black', glyph: '♚' }].map((c) => (
          <button
            key={c.key}
            onClick={() => setColor(c.key)}
            className="rounded-sm border py-3.5 text-center text-xl"
            style={{ borderColor: color === c.key ? 'var(--accent)' : 'var(--line)', background: color === c.key ? 'var(--accent-tint)' : 'var(--surface)' }}
          >
            {c.glyph}
            <div className="mt-1 text-[11px] font-bold" style={{ color: 'var(--ink-soft)' }}>{c.label}</div>
          </button>
        ))}
      </div>

      <div className="mb-1.5 px-0.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Rating range ± {ratingRange}</div>
      <input
        type="range"
        min="50"
        max="600"
        step="50"
        value={ratingRange}
        onChange={(e) => setRatingRange(Number(e.target.value))}
        className="mb-6 w-full accent-[var(--accent)]"
      />

      <div className="mb-1.5 px-0.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Variant</div>
      <div className="mb-7 flex flex-wrap gap-1.5">
        {VARIANTS.map((v) => (
          <Chip key={v} active={variant === v} onClick={() => setVariant(v)}>{v}</Chip>
        ))}
      </div>

      <Button className="w-full !py-3.5 text-base" onClick={() => navigate('/play/quick')}>Create game</Button>
    </div>
  );
}
