import { useSelector } from 'react-redux';
import {
  selectCurrentUser,
  selectCurrentToken,
  selectIsAuthenticated
} from '../features/auth/authSlice.js';

export function useAuth() {
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector((state) => state.auth.isInitialized);

  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    return user.roles.some((r) =>
      typeof r === 'string' ? r === role : r.name === role
    );
  };

  const isSuperAdmin = hasRole('Super Admin');
  const isHR = isSuperAdmin || hasRole('HR Manager');
  const isDeptManager = isHR || hasRole('Department Manager');

  return {
    user,
    token,
    isAuthenticated,
    isInitialized,
    isSuperAdmin,
    isHR,
    isDeptManager,
    hasRole
  };
}
