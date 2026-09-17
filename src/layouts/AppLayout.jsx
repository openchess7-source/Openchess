import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { TopNav, Sidebar } from '../components/navigation/TopNav';
import { MobileTopBar, BottomNav } from '../components/navigation/BottomNav';
import OfflineBanner from '../components/common/OfflineBanner';
import LoadingState from '../components/common/LoadingState';

export default function AppLayout() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <TopNav />
      <MobileTopBar />
      <OfflineBanner />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 pb-20 md:pb-0">
          <div className="animate-fade-in">
            <Suspense fallback={<LoadingState label="Loading" />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
