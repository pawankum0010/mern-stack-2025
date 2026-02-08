import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Component to redirect admin/superadmin users away from customer-facing pages
 */
const AdminRedirect = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return children;
  }

  const userRole = user?.role?.name?.toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  if (isAdmin) {
    // Redirect admin users to product management page
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default AdminRedirect;

