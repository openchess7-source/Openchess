import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import LoadingState from '../../components/common/LoadingState';

export default function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <LoadingState label="Loading Openchess" />;
  if (status === 'guest') return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}
