import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const normalizeRole = (role) =>
  role ? String(role).trim().toLowerCase() : undefined;

const ALLOWED_ROLES = ['admin', 'superadmin', 'support'];

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/backend" replace />;
  }

  const roleName = normalizeRole(user?.role?.name) || normalizeRole(user?.role);
  if (!roleName || !ALLOWED_ROLES.includes(roleName)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
