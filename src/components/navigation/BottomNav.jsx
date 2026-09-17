import { NavLink, useNavigate } from 'react-router-dom';
import { BellIcon, HomeIcon, LearnIcon, PlayIcon, ProfileIcon, PuzzleIcon } from './icons';

const BOTTOM_NAV = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/play/quick', label: 'Play', icon: PlayIcon },
  { to: '/puzzles', label: 'Puzzles', icon: PuzzleIcon },
  { to: '/learn', label: 'Learn', icon: LearnIcon },
  { to: '/profile/me', label: 'Profile', icon: ProfileIcon },
];

export function MobileTopBar() {
  const navigate = useNavigate();
  return (
    <div
      className="sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3.5 md:hidden"
      style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}
    >
      <div className="flex items-center gap-1.5 font-display text-[17px] font-bold">
        <span style={{ color: 'var(--accent)' }}>♞</span>Openchess
      </div>
      <button onClick={() => navigate('/notifications')} className="flex h-8 w-8 items-center justify-center" style={{ color: 'var(--ink-soft)' }} aria-label="Notifications">
        <BellIcon width={20} height={20} />
      </button>
    </div>
  );
}

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t px-1 pb-2 pt-1.5 md:hidden"
      style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}
    >
      {BOTTOM_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className="flex flex-1 flex-col items-center gap-0.5 rounded-sm px-1 py-1.5 text-[11px] font-semibold"
          style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--ink-faint)' })}
        >
          <item.icon width={21} height={21} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
