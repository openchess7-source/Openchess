import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { DEMO_MODE } from '../../config/env';

export default function GuestRoute({ children }) {
  const { status } = useAuth();
  // In demo mode everyone is auto-authenticated, which would make /login and
  // /register permanently unreachable for review — only enforce once real
  // auth is active (VITE_DEMO_MODE unset/false, the production default).
  if (!DEMO_MODE && status === 'authenticated') return <Navigate to="/" replace />;
  return children;
}
