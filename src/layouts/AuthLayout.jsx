import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import LoadingState from '../components/common/LoadingState';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-[360px]">
        <Suspense fallback={<LoadingState label="Loading" />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
