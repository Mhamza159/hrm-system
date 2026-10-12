import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Toaster } from 'sonner';
import LoginPage from './features/auth/pages/LoginPage.jsx';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage.jsx';
import OtpPage from './features/auth/pages/OtpPage.jsx';
import ChangePasswordPage from './features/auth/pages/ChangePasswordPage.jsx';
import LoginHistoryPage from './features/auth/pages/LoginHistoryPage.jsx';
import UsersPage from './features/users/pages/UsersPage.jsx';
import DashboardPage from './features/dashboard/DashboardPage.jsx';
import RolesListPage from './features/roles/pages/RolesListPage.jsx';
import RoleFormPage from './features/roles/pages/RoleFormPage.jsx';
import DelegationPage from './features/roles/pages/DelegationPage.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { useRefreshTokenMutation } from './features/auth/authApi.js';
import { setCredentials, logout } from './features/auth/authSlice.js';
import { useAuth } from './hooks/useAuth.js';

export default function App() {
  const dispatch = useDispatch();
  const { isInitialized } = useAuth();
  const [triggerRefresh] = useRefreshTokenMutation();

  // Automatic session hydration on app mount (Slice 1.6)
  useEffect(() => {
    if (!isInitialized) {
      triggerRefresh()
        .unwrap()
        .then((res) => {
          if (res?.data?.accessToken && res?.data?.user) {
            dispatch(
              setCredentials({
                user: res.data.user,
                accessToken: res.data.accessToken
              })
            );
          } else {
            dispatch(logout());
          }
        })
        .catch(() => {
          // If no active refresh cookie or expired, finalize initialization in unauthenticated state
          dispatch(logout());
        });
    }
  }, [isInitialized, triggerRefresh, dispatch]);

  return (
    <>
      <Toaster position="top-right" richColors closeButton toastOptions={{ className: 'rounded-xl shadow-lg text-xs font-medium' }} />
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-otp" element={<OtpPage />} />

        {/* Change Password (Accessible when authenticated, mandatory when mustChangePassword === true) */}
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

        {/* Protected App Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route
            path="users"
            element={
              <ProtectedRoute requiredRole="HR Manager">
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles"
            element={
              <ProtectedRoute requiredRole={['Super Admin', 'HR Manager']}>
                <RolesListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles/new"
            element={
              <ProtectedRoute requiredRole={['Super Admin', 'HR Manager']}>
                <RoleFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles/:id"
            element={
              <ProtectedRoute requiredRole={['Super Admin', 'HR Manager']}>
                <RoleFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="delegations"
            element={
              <ProtectedRoute>
                <DelegationPage />
              </ProtectedRoute>
            }
          />
          <Route path="login-history" element={<LoginHistoryPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
