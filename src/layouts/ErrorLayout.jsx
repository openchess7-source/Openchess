import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';

export default function ErrorLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--bg)' }}>
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </div>
  );
}
