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
import SettingsPage from './features/settings/pages/SettingsPage.jsx';
import PoliciesPage from './features/settings/pages/PoliciesPage.jsx';
import DepartmentsPage from './features/departments/pages/DepartmentsPage.jsx';
import DesignationsPage from './features/departments/pages/DesignationsPage.jsx';
import ShiftsPage from './features/departments/pages/ShiftsPage.jsx';
import { OrgChartPage } from './features/departments/pages/OrgChartPage.jsx';
import { MyTeamPage } from './features/departments/pages/MyTeamPage.jsx';
import EmployeeFormPage from './features/employees/pages/EmployeeFormPage.jsx';
import EmployeeListPage from './features/employees/pages/EmployeeListPage.jsx';
import EmployeeProfilePage from './features/employees/pages/EmployeeProfilePage.jsx';
import EmployeeImportPage from './features/employees/pages/EmployeeImportPage.jsx';
import MyProfilePage from './features/employees/pages/MyProfilePage.jsx';
import ChangeRequestsPage from './features/employees/pages/ChangeRequestsPage.jsx';
import { NotificationsPage } from './features/notifications/pages/NotificationsPage.jsx';
import { NotificationSettingsPage } from './features/notifications/pages/NotificationSettingsPage.jsx';
import { AnnouncementsPage } from './features/announcements/pages/AnnouncementsPage.jsx';
import { MyAttendancePage } from './features/attendance/pages/MyAttendancePage.jsx';
import { TeamAttendancePage } from './features/attendance/pages/TeamAttendancePage.jsx';
import { AttendanceLockPage } from './features/attendance/pages/AttendanceLockPage.jsx';
import LeaveTypesPage from './features/leaves/pages/LeaveTypesPage.jsx';
import HolidaysPage from './features/leaves/pages/HolidaysPage.jsx';
import MyLeavesPage from './features/leaves/pages/MyLeavesPage.jsx';
import LeaveApprovalsPage from './features/leaves/pages/LeaveApprovalsPage.jsx';
import TeamLeaveCalendarPage from './features/leaves/pages/TeamLeaveCalendarPage.jsx';
import EncashmentPage from './features/leaves/pages/EncashmentPage.jsx';
import { SalaryStructuresPage } from './features/payroll/pages/SalaryStructuresPage.jsx';
import { PayrollRunsPage } from './features/payroll/pages/PayrollRunsPage.jsx';
import { PayrollRunDetailPage } from './features/payroll/pages/PayrollRunDetailPage.jsx';
import { MyPayslipsPage } from './features/payroll/pages/MyPayslipsPage.jsx';
import { FinalSettlementPage } from './features/payroll/pages/FinalSettlementPage.jsx';
import { PayrollReportsPage } from './features/payroll/pages/PayrollReportsPage.jsx';
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
              <ProtectedRoute requiredPermission="user.manage">
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles"
            element={
              <ProtectedRoute requiredPermission="role.view">
                <RolesListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles/new"
            element={
              <ProtectedRoute requiredPermission="role.manage">
                <RoleFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles/:id"
            element={
              <ProtectedRoute requiredPermission="role.view">
                <RoleFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="delegations"
            element={
              <ProtectedRoute requiredPermission="delegation.view">
                <DelegationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute requiredPermission="settings.manage">
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="policies"
            element={
              <ProtectedRoute requiredPermission="settings.view">
                <PoliciesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="departments"
            element={
              <ProtectedRoute requiredPermission="org.view">
                <DepartmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="designations"
            element={
              <ProtectedRoute requiredPermission="org.view">
                <DesignationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="shifts"
            element={
              <ProtectedRoute requiredPermission="org.view">
                <ShiftsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="org-chart"
            element={
              <ProtectedRoute requiredPermission="org.view">
                <OrgChartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="teams/my"
            element={
              <ProtectedRoute requiredPermission="org.view">
                <MyTeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="employees"
            element={
              <ProtectedRoute requiredPermission="employee.view">
                <EmployeeListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="employees/new"
            element={
              <ProtectedRoute requiredPermission="employee.create">
                <EmployeeFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="employees/import"
            element={
              <ProtectedRoute requiredPermission="employee.create">
                <EmployeeImportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="employees/:id/edit"
            element={
              <ProtectedRoute requiredPermission="employee.edit">
                <EmployeeFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="employees/:id"
            element={
              <ProtectedRoute requiredPermission="employee.view">
                <EmployeeProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="me"
            element={
              <ProtectedRoute>
                <MyProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="change-requests"
            element={
              <ProtectedRoute requiredPermission="employee.edit">
                <ChangeRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="login-history"
            element={
              <ProtectedRoute requiredPermission="login.history">
                <LoginHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <ProtectedRoute requiredPermission="notification.view">
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings/notifications"
            element={
              <ProtectedRoute requiredPermission="notification.view">
                <NotificationSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="announcements"
            element={
              <ProtectedRoute requiredPermission="announcement.view">
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendance"
            element={<Navigate to="/attendance/my" replace />}
          />
          <Route
            path="attendance/my"
            element={
              <ProtectedRoute requiredPermission="attendance.view">
                <MyAttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendance/team"
            element={
              <ProtectedRoute requiredPermission="attendance.approve">
                <TeamAttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendance/lock"
            element={
              <ProtectedRoute requiredPermission="attendance.lock">
                <AttendanceLockPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="leave-types"
            element={
              <ProtectedRoute requiredPermission="leave.view">
                <LeaveTypesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="holidays"
            element={
              <ProtectedRoute>
                <HolidaysPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="leaves"
            element={<Navigate to="/leaves/my" replace />}
          />
          <Route
            path="leaves/my"
            element={
              <ProtectedRoute requiredPermission="leave.view">
                <MyLeavesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="leaves/approvals"
            element={
              <ProtectedRoute requiredPermission="leave.approve">
                <LeaveApprovalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="leaves/calendar"
            element={
              <ProtectedRoute requiredPermission="leave.view">
                <TeamLeaveCalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="leave-calendar"
            element={<Navigate to="/leaves/calendar" replace />}
          />
          <Route
            path="leaves/encashment"
            element={
              <ProtectedRoute requiredPermission="leave.view">
                <EncashmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="leave-encashment"
            element={<Navigate to="/leaves/encashment" replace />}
          />
          <Route
            path="payroll/salary-structures"
            element={
              <ProtectedRoute requiredPermission="payroll.manage">
                <SalaryStructuresPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="salary-structures"
            element={<Navigate to="/payroll/salary-structures" replace />}
          />
          <Route
            path="payroll/runs"
            element={
              <ProtectedRoute requiredPermission="payroll.view">
                <PayrollRunsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="payroll/runs/:id"
            element={
              <ProtectedRoute requiredPermission="payroll.view">
                <PayrollRunDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="payroll/my-payslips"
            element={
              <ProtectedRoute requiredPermission="payroll.view">
                <MyPayslipsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="payroll/settlement"
            element={
              <ProtectedRoute requiredPermission="payroll.manage">
                <FinalSettlementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="payroll/reports"
            element={
              <ProtectedRoute requiredPermission="payroll.view">
                <PayrollReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-payslips"
            element={<Navigate to="/payroll/my-payslips" replace />}
          />
          <Route
            path="payroll"
            element={<Navigate to="/payroll/runs" replace />}
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
