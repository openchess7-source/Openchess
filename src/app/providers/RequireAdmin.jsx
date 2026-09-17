import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import LoadingState from '../../components/common/LoadingState';

export default function RequireAdmin({ children }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <LoadingState label="Loading Openchess" />;
  if (status === 'guest') return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!user?.isAdmin) return <Navigate to="/403" replace />;
  return children;
}
