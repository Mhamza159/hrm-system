/**
 * @file ProtectedRoute.jsx
 * @description Authentication & Authorization Route Guard for React Router.
 * 
 * GUARD LIFECYCLE:
 * 1. Checks Redux isAuthenticated status and active user object.
 * 2. Unauthenticated check: Redirects to /login, but preserves current route if session is expired
 *    so SessionExpiredModal (State 8) can perform in-place re-authentication without wiping draft inputs.
 * 3. Enforces Slice 1.9 First-Login Mandatory Password Reset.
 * 4. Role & PBAC Authorization: Renders State 7 PermissionDeniedState explaining policy requirements.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { usePermission } from '../hooks/usePermission.js';
import { PermissionDeniedState } from './common/PermissionDeniedState.jsx';

/**
 * Route protection wrapper
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Target protected route view
 * @param {string|string[]} [props.requiredRole] - Required user role (legacy fallback)
 * @param {string} [props.requiredPermission] - Required CASL permission action (e.g. 'login.history', 'org.view')
 * @param {boolean} [props.managerOnly=false] - Only accessible by Department Managers, HR Managers, or Super Admin
 * @param {boolean} [props.hrOnly=false] - Only accessible by HR Managers or Super Admin
 * @param {boolean} [props.adminOnly=false] - Only accessible by Super Admin
 */
export function ProtectedRoute({
  children,
  requiredRole = null,
  requiredPermission = null,
  managerOnly = false,
  hrOnly = false,
  adminOnly = false
}) {
  const { user, isAuthenticated, isInitialized, isSessionExpired, hasRole, isSuperAdmin, isHR, isDeptManager } = useAuth();
  const { can } = usePermission();
  const location = useLocation();

  // 1. Initial session hydration check (prevents premature redirect flicker)
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#0A110D] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // 2. Unauthenticated check (permits view if session is expired to allow in-place re-auth)
  if ((!isAuthenticated && !isSessionExpired) || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. First login mandatory password change guard (Slice 1.9)
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // 4. Role Hierarchy Check
  if (adminOnly && !isSuperAdmin) {
    return (
      <div className="p-8">
        <PermissionDeniedState
          requiredRoles="Super Admin"
          reason="This administrative module is strictly restricted to system administrators."
        />
      </div>
    );
  }

  if (hrOnly && !isHR && !isSuperAdmin) {
    return (
      <div className="p-8">
        <PermissionDeniedState
          requiredRoles={['HR Manager', 'Super Admin']}
          reason="This human resources management module is restricted to HR personnel."
        />
      </div>
    );
  }

  if (managerOnly && !isDeptManager && !isHR && !isSuperAdmin) {
    return (
      <div className="p-8">
        <PermissionDeniedState
          requiredRoles={['Department Manager', 'HR Manager', 'Super Admin']}
          reason="This managerial section requires departmental leadership or administrative privileges."
        />
      </div>
    );
  }

  // 5. Dynamic CASL permission check (Super Admin always has administrative pass)
  if (requiredPermission) {
    const isPermitted = isSuperAdmin || can(requiredPermission);
    if (!isPermitted) {
      return (
        <div className="p-8">
          <PermissionDeniedState
            permission={requiredPermission}
            reason={`Access to this resource requires the '${requiredPermission}' policy action privilege.`}
          />
        </div>
      );
    }
  }

  // 6. Granular role requirement check (Super Admin always has administrative pass)
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const isAuthorized = isSuperAdmin || roles.some((role) => hasRole(role));
    if (!isAuthorized) {
      return (
        <div className="p-8">
          <PermissionDeniedState
            requiredRoles={roles}
            reason={`Viewing this view requires one of the following assigned roles: ${roles.join(', ')}.`}
          />
        </div>
      );
    }
  }

  return children;
}
