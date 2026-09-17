import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import LoadingState from '../components/common/LoadingState';

export default function GameLayout() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Suspense fallback={<LoadingState label="Loading" />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
