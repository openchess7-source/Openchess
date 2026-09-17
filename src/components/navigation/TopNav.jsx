import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../app/providers/AuthProvider';
import { BellIcon, ChevronIcon, ClubIcon, FriendsIcon, HomeIcon, LearnIcon, LeaderboardIcon, PlayIcon, ProfileIcon, PuzzleIcon, SearchIcon, SettingsIcon, TrophyIcon } from './icons';
import SearchOverlay from './SearchOverlay';

const PRIMARY_NAV = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/play/quick', label: 'Play', icon: PlayIcon },
  { to: '/puzzles', label: 'Puzzles', icon: PuzzleIcon },
  { to: '/learn', label: 'Learn', icon: LearnIcon },
  { to: '/tournaments', label: 'Watch', icon: TrophyIcon },
];

const SIDEBAR_NAV = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/play/quick', label: 'Play', icon: PlayIcon },
  { to: '/puzzles', label: 'Puzzles', icon: PuzzleIcon },
  { to: '/learn', label: 'Learn', icon: LearnIcon },
  { to: '/tournaments', label: 'Tournaments', icon: TrophyIcon },
  { to: '/clubs', label: 'Clubs', icon: ClubIcon },
  { to: '/leaderboards', label: 'Leaderboard', icon: LeaderboardIcon },
  { to: '/friends', label: 'Friends', icon: FriendsIcon },
  { to: '/profile/me', label: 'Profile', icon: ProfileIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function TopNav() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-20 hidden h-[58px] items-center justify-between border-b px-7 md:flex"
      style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}
    >
      <div className="flex items-center gap-9">
        <div className="flex items-center gap-1.5 font-display text-[17px] font-bold">
          <span style={{ color: 'var(--accent)' }}>♞</span>Openchess
        </div>
        <nav className="flex gap-6">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `border-b-2 pb-1.5 pt-1 text-sm font-semibold ${isActive ? '' : 'border-transparent'}`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
                borderColor: isActive ? 'var(--accent)' : 'transparent',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => setSearchOpen(true)} className="flex h-8 w-8 items-center justify-center rounded-sm" style={{ color: 'var(--ink-soft)' }} aria-label="Search">
          <SearchIcon width={18} height={18} />
        </button>
        <button
          onClick={() => navigate('/notifications')}
          className="flex h-8 w-8 items-center justify-center rounded-sm"
          style={{ color: 'var(--ink-soft)' }}
          aria-label="Notifications"
        >
          <BellIcon width={19} height={19} />
        </button>
        <button
          onClick={() => navigate('/profile/me')}
          className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-display text-[13px] font-bold"
          style={{ background: 'var(--surface-alt)', borderColor: 'var(--line)' }}
        >
          ♟ {user?.ratings?.blitz ?? '—'}
        </button>
        <div
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full border font-display text-xs font-bold"
          style={{ background: 'var(--surface-alt)', borderColor: 'var(--line)' }}
        >
          {user?.avatarInitials ?? 'GU'}
        </div>
      </div>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="sticky top-[58px] hidden h-[calc(100vh-58px)] shrink-0 flex-col border-r py-4 md:flex"
      style={{ width: collapsed ? 64 : 208, borderColor: 'var(--line)', transition: 'width .18s ease' }}
    >
      <nav className="flex flex-1 flex-col gap-1 px-2.5">
        {SIDEBAR_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 rounded-sm px-2.5 py-2 text-sm font-semibold"
            style={({ isActive }) => ({
              color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
              background: isActive ? 'var(--accent-tint)' : 'transparent',
            })}
            title={collapsed ? item.label : undefined}
          >
            <item.icon width={18} height={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="mx-2.5 flex items-center justify-center rounded-sm border py-2"
        style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)' }}
        aria-label="Toggle sidebar"
      >
        <ChevronIcon width={16} height={16} style={{ transform: collapsed ? 'none' : 'rotate(180deg)' }} />
      </button>
    </aside>
  );
}
