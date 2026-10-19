/**
 * @file ProtectedRoute.jsx
 * @description Authentication & Authorization Route Guard for React Router.
 * 
 * GUARD LIFECYCLE:
 * 1. Checks Redux isAuthenticated status and active user object.
 * 2. If unauthenticated, redirects to /login preserving the requested path in location state.
 * 3. Enforces Slice 1.9 First-Login Mandatory Password Reset:
 *    - If user.mustChangePassword === true, user is forcibly intercepted and redirected to /change-password.
 *    - All other application paths remain locked until new password is saved.
 * 4. Role Authorization: Blocks unauthorized users from privileged route segments.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { usePermission } from '../hooks/usePermission.js';

/**
 * Route protection wrapper
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Target protected route view
 * @param {string|string[]} [props.requiredRole] - Required user role (legacy fallback)
 * @param {string} [props.requiredPermission] - Required CASL permission action (e.g. 'login.history', 'org.view')
 */
export function ProtectedRoute({ children, requiredRole = null, requiredPermission = null }) {
  const { user, isAuthenticated, isInitialized, hasRole, isSuperAdmin } = useAuth();
  const { can } = usePermission();
  const location = useLocation();

  // 1. Initial session hydration check (prevents premature redirect flicker)
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#090A0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#5E6AD2] border-t-transparent animate-spin" />
      </div>
    );
  }

  // 2. Unauthenticated check
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. First login mandatory password change guard (Slice 1.9)
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // 4. Dynamic CASL permission check (Super Admin always has administrative pass)
  if (requiredPermission) {
    const isPermitted = isSuperAdmin || can(requiredPermission);
    if (!isPermitted) {
      return <Navigate to="/" replace />;
    }
  }

  // 5. Granular role requirement check (Super Admin always has administrative pass)
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const isAuthorized = isSuperAdmin || roles.some((role) => hasRole(role));
    if (!isAuthorized) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
