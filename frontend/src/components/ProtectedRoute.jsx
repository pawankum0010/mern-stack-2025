import { Navigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const normalizeRole = (role) =>
  role ? String(role).trim().toLowerCase() : undefined;

const ProtectedRoute = ({ roles, children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0) {
    const roleName =
      normalizeRole(user?.role?.name) || normalizeRole(user?.role);

    if (!roles.map(normalizeRole).includes(roleName)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

