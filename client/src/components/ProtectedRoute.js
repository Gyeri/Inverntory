import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAdmin, isManager, isCashier } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    let hasAccess = false;

    if (typeof requiredRole === 'string') {
      // Single role check
      switch (requiredRole) {
        case 'admin':
          hasAccess = isAdmin();
          break;
        case 'manager':
          hasAccess = isManager();
          break;
        case 'cashier':
          hasAccess = isCashier();
          break;
        default:
          hasAccess = user.role === requiredRole;
      }
    } else if (Array.isArray(requiredRole)) {
      // Multiple roles check
      hasAccess = requiredRole.some(role => {
        switch (role) {
          case 'admin':
            return isAdmin();
          case 'manager':
            return isManager();
          case 'cashier':
            return isCashier();
          default:
            return user.role === role;
        }
      });
    }

    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
