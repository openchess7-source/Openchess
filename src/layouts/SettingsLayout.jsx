import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Suspense } from 'react';
import { ChevronIcon } from '../components/navigation/icons';
import LoadingState from '../components/common/LoadingState';
import { useAuth } from '../app/providers/AuthProvider';

const SETTINGS_NAV = [
  { to: '/settings/profile', label: 'Account' },
  { to: '/settings/appearance', label: 'Appearance' },
  { to: '/settings/board', label: 'Board & Pieces' },
  { to: '/settings/gameplay', label: 'Gameplay' },
  { to: '/settings/notifications', label: 'Notifications' },
  { to: '/settings/privacy', label: 'Privacy' },
  { to: '/settings/accessibility', label: 'Accessibility' },
];

export default function SettingsLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isIndex = location.pathname === '/settings';
  const navItems = user?.isAdmin ? [...SETTINGS_NAV, { to: '/admin/flagged-games', label: 'Admin: Flagged Games' }] : SETTINGS_NAV;

  return (
    <div className="mx-auto flex max-w-4xl gap-6 px-0 py-0 md:px-6 md:py-6">
      <div className={`w-full shrink-0 md:block md:w-64 ${isIndex ? 'block' : 'hidden'}`}>
        <div className="px-4 py-5 font-display text-xl font-bold md:px-0">Settings</div>
        <div className="mx-4 overflow-hidden rounded-md border md:mx-0" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex items-center justify-between border-b px-4 py-3.5 text-sm font-semibold last:border-b-0"
              style={({ isActive }) => ({ borderColor: 'var(--line)', background: isActive ? 'var(--accent-tint)' : undefined })}
            >
              {item.label}
              <ChevronIcon width={16} height={16} style={{ color: 'var(--ink-faint)' }} />
            </NavLink>
          ))}
        </div>
      </div>

      <div className={`min-w-0 flex-1 ${isIndex ? 'hidden md:block' : 'block'}`}>
        {!isIndex && (
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1.5 px-4 py-4 text-sm font-semibold md:hidden"
            style={{ color: 'var(--ink-soft)' }}
          >
            <ChevronIcon width={16} height={16} style={{ transform: 'rotate(180deg)' }} /> Settings
          </button>
        )}
        <Suspense fallback={<LoadingState label="Loading" />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
