import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Component to redirect users to appropriate default page based on role
 */
const DefaultRedirect = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const userRole = user?.role?.name?.toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/" replace />;
};

export default DefaultRedirect;

