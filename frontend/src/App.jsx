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
import FlaggedPunchesPage from './features/attendance/pages/FlaggedPunchesPage.jsx';
import WfhLocationsPage from './features/attendance/pages/WfhLocationsPage.jsx';
import PunchLocationsMapPage from './features/attendance/pages/PunchLocationsMapPage.jsx';
import { KiosksPage } from './features/attendance/pages/KiosksPage.jsx';
import { KioskQrPage } from './features/attendance/pages/KioskQrPage.jsx';
import FaceEnrollPage from './features/attendance/pages/FaceEnrollPage.jsx';
import FaceEnrollmentsPage from './features/attendance/pages/FaceEnrollmentsPage.jsx';
import AssetsPage from './features/assets/pages/AssetsPage.jsx';
import AssetDetailPage from './features/assets/pages/AssetDetailPage.jsx';
import AssetRequestsPage from './features/assets/pages/AssetRequestsPage.jsx';
import MyAssetsPage from './features/assets/pages/MyAssetsPage.jsx';
import { ChecklistTemplatesPage } from './features/onboarding/pages/ChecklistTemplatesPage.jsx';
import { OnboardingPage } from './features/onboarding/pages/OnboardingPage.jsx';
import { MyTasksPage } from './features/onboarding/pages/MyTasksPage.jsx';
import { ResignationPage } from './features/onboarding/pages/ResignationPage.jsx';
import { OffboardingPage } from './features/onboarding/pages/OffboardingPage.jsx';
import { KpiTemplatesPage } from './features/performance/pages/KpiTemplatesPage.jsx';
import { ReviewCyclesPage } from './features/performance/pages/ReviewCyclesPage.jsx';
import { CycleProgressPage } from './features/performance/pages/CycleProgressPage.jsx';
import { MyReviewPage } from './features/performance/pages/MyReviewPage.jsx';
import { TeamReviewsPage } from './features/performance/pages/TeamReviewsPage.jsx';
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
import { MyLoansPage } from './features/loans/pages/MyLoansPage.jsx';
import { LoanApprovalsPage } from './features/loans/pages/LoanApprovalsPage.jsx';
import { LoanLedgerPage } from './features/loans/pages/LoanLedgerPage.jsx';
import MyExpensesPage from './features/expenses/pages/MyExpensesPage.jsx';
import ExpenseApprovalsPage from './features/expenses/pages/ExpenseApprovalsPage.jsx';
import ExpenseCategoriesPage from './features/expenses/pages/ExpenseCategoriesPage.jsx';
import ExpenseReportsPage from './features/expenses/pages/ExpenseReportsPage.jsx';
import ReportsPage from './features/reports/pages/ReportsPage.jsx';
import AuditLogsPage from './features/audit/pages/AuditLogsPage.jsx';
import { ProjectsPage } from './features/projects/pages/ProjectsPage.jsx';
import { MyTimesheetPage } from './features/projects/pages/MyTimesheetPage.jsx';
import { TimesheetApprovalsPage } from './features/projects/pages/TimesheetApprovalsPage.jsx';
import { TimesheetCompliancePage } from './features/projects/pages/TimesheetCompliancePage.jsx';
import { UtilizationReportPage } from './features/projects/pages/UtilizationReportPage.jsx';
import { ProjectProfitabilityPage } from './features/projects/pages/ProjectProfitabilityPage.jsx';
import { JobsPage } from './features/recruitment/pages/JobsPage.jsx';
import { CandidatePipelinePage } from './features/recruitment/pages/CandidatePipelinePage.jsx';
import { CareersPublicPage } from './features/recruitment/pages/CareersPublicPage.jsx';
import { ApplyPage } from './features/recruitment/pages/ApplyPage.jsx';
import { InternalJobsPage } from './features/recruitment/pages/InternalJobsPage.jsx';
import { PolicyDocsPage } from './features/chatbot/pages/PolicyDocsPage.jsx';
import { UnansweredQuestionsPage } from './features/chatbot/pages/UnansweredQuestionsPage.jsx';
import { AttritionDashboardPage } from './features/attrition/pages/AttritionDashboardPage.jsx';
import { AwardsPage } from './features/rewards/pages/AwardsPage.jsx';
import { AppreciationWallPage } from './features/rewards/pages/AppreciationWallPage.jsx';
import { CelebrationsWallPage } from './features/rewards/pages/CelebrationsWallPage.jsx';
import { SurveysPage } from './features/rewards/pages/SurveysPage.jsx';
import { SubmitFeedbackPage } from './features/feedback/pages/SubmitFeedbackPage.jsx';
import { TrackFeedbackPage } from './features/feedback/pages/TrackFeedbackPage.jsx';
import { GrievanceAdminPage } from './features/feedback/pages/GrievanceAdminPage.jsx';
import { CommitteeDashboardPage } from './features/feedback/pages/CommitteeDashboardPage.jsx';
import { ChatbotWidget } from './features/chatbot/components/ChatbotWidget.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { useRefreshTokenMutation } from './features/auth/authApi.js';
import { setCredentials, setInitialized, logout } from './features/auth/authSlice.js';
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
            dispatch(setInitialized());
          }
        })
        .catch(() => {
          // If no active refresh cookie or expired, finalize initialization in unauthenticated state
          dispatch(setInitialized());
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
        <Route path="/careers" element={<CareersPublicPage />} />
        <Route path="/careers/:slug/apply" element={<ApplyPage />} />
        <Route path="/feedback/track" element={<TrackFeedbackPage />} />

        {/* Change Password (Accessible when authenticated, mandatory when mustChangePassword === true) */}
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

                {/* Dedicated Fullscreen Kiosk Attendance Display Terminal (M13) */}
        <Route
          path="/attendance/kiosks/:id/display"
          element={
            <ProtectedRoute>
              <KioskQrPage />
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
          <Route path="dashboard" element={<DashboardPage />} />
          <Route
            path="reports"
            element={
              <ProtectedRoute requiredPermission="report.view" managerOnly={true}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="audit-logs"
            element={
              <ProtectedRoute requiredPermission="audit.view">
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
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
              <ProtectedRoute requiredPermission="org.view" managerOnly={true}>
                <MyTeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="employees"
            element={
              <ProtectedRoute requiredPermission="employee.view" managerOnly={true}>
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
            path="attendance/flagged"
            element={
              <ProtectedRoute requiredPermission="attendance.approve">
                <FlaggedPunchesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendance/wfh-locations"
            element={
              <ProtectedRoute requiredPermission="attendance.wfh">
                <WfhLocationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendance/map"
            element={
              <ProtectedRoute requiredPermission="attendance.view" managerOnly={true}>
                <PunchLocationsMapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendance/kiosks"
            element={
              <ProtectedRoute requiredPermission="attendance.kiosk.manage">
                <KiosksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendance/face/enroll"
            element={
              <ProtectedRoute requiredPermission="attendance.mark">
                <FaceEnrollPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendance/face/enrollments"
            element={
              <ProtectedRoute requiredPermission="attendance.face.manage">
                <FaceEnrollmentsPage />
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
              <ProtectedRoute requiredPermission="payroll.view" hrOnly={true}>
                <PayrollReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="audit-logs"
            element={
              <ProtectedRoute requiredPermission="audit.view">
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="loans"
            element={
              <ProtectedRoute requiredPermission="loan.view">
                <MyLoansPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="loans/approvals"
            element={
              <ProtectedRoute requiredPermission="loan.recommend">
                <LoanApprovalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="loans/ledger"
            element={
              <ProtectedRoute requiredPermission="loan.prepay">
                <LoanLedgerPage />
              </ProtectedRoute>
            }
          />

          {/* Module M11: Expense Claims */}
          <Route
            path="expenses"
            element={
              <ProtectedRoute requiredPermission="expense.view">
                <MyExpensesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="expenses/approvals"
            element={
              <ProtectedRoute requiredPermission="expense.approve">
                <ExpenseApprovalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="expenses/categories"
            element={
              <ProtectedRoute requiredPermission="expense.settings">
                <ExpenseCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="expenses/reports"
            element={
              <ProtectedRoute requiredPermission="report.view" managerOnly={true}>
                <ExpenseReportsPage />
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
                  {/* Module M23: Asset Management (Slices 23.1 - 23.6) */}
          <Route
            path="assets"
            element={
              <ProtectedRoute requiredPermission="asset.view">
                <AssetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="assets/:id"
            element={
              <ProtectedRoute requiredPermission="asset.view">
                <AssetDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="assets/requests"
            element={
              <ProtectedRoute requiredPermission="asset.request">
                <AssetRequestsPage />
              </ProtectedRoute>
            }
          />
          {/* Module M18: Onboarding & Offboarding Lifecycle */}
          <Route
            path="onboarding/templates"
            element={
              <ProtectedRoute requiredPermission="onboard.manage">
                <ChecklistTemplatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="onboarding"
            element={
              <ProtectedRoute requiredPermission="onboard.view" hrOnly={true}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="onboarding/my-tasks"
            element={
              <ProtectedRoute requiredPermission="onboard.view">
                <MyTasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="resignations"
            element={
              <ProtectedRoute requiredPermission="resignation.submit">
                <ResignationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="offboarding"
            element={
              <ProtectedRoute requiredPermission="offboard.view" hrOnly={true}>
                <OffboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Module M19: Performance & Appraisal */}
          <Route
            path="performance/templates"
            element={
              <ProtectedRoute requiredPermission="performance.template.view">
                <KpiTemplatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="performance/cycles"
            element={
              <ProtectedRoute requiredPermission="performance.cycle.view" hrOnly={true}>
                <ReviewCyclesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="performance/cycles/:id/progress"
            element={
              <ProtectedRoute requiredPermission="performance.cycle.manage">
                <CycleProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="performance/my-review"
            element={
              <ProtectedRoute requiredPermission="performance.review.view">
                <MyReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="projects"
            element={
              <ProtectedRoute requiredPermission="project.view" managerOnly={true}>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="timesheets/my"
            element={
              <ProtectedRoute requiredPermission="timesheet.log">
                <MyTimesheetPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="timesheets/approvals"
            element={
              <ProtectedRoute requiredPermission="timesheet.approve">
                <TimesheetApprovalsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="timesheets/compliance"
            element={
              <ProtectedRoute requiredPermission="timesheet.compliance">
                <TimesheetCompliancePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="reports/utilization"
            element={
              <ProtectedRoute requiredPermission="report.utilization" managerOnly={true}>
                <UtilizationReportPage />
              </ProtectedRoute>
            }
          />

          {/* Recruitment & AI Resume Screening (Module M15) */}
          <Route
            path="recruitment/jobs"
            element={
              <ProtectedRoute requiredPermission="recruitment.job.view">
                <JobsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="recruitment/pipeline"
            element={
              <ProtectedRoute requiredPermission="recruitment.candidate.view">
                <CandidatePipelinePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="jobs/internal"
            element={
              <ProtectedRoute requiredPermission="recruitment.referral.submit">
                <InternalJobsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="reports/profitability"
            element={
              <ProtectedRoute requiredPermission="report.profitability">
                <ProjectProfitabilityPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="performance/team-reviews"
            element={
              <ProtectedRoute requiredPermission="performance.review.view" managerOnly={true}>
                <TeamReviewsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="assets/my"
            element={
              <ProtectedRoute requiredPermission="asset.view">
                <MyAssetsPage />
              </ProtectedRoute>
            }
          />

          {/* Module M16: HR Chatbot */}
          <Route
            path="chatbot/policies"
            element={
              <ProtectedRoute requiredPermission="chatbot.policy.manage">
                <PolicyDocsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="chatbot/unanswered"
            element={
              <ProtectedRoute requiredPermission="chatbot.unanswered.manage">
                <UnansweredQuestionsPage />
              </ProtectedRoute>
            }
          />

          {/* Module M17: Attrition Prediction */}
          <Route
            path="attrition"
            element={
              <ProtectedRoute requiredPermission="attrition.view">
                <AttritionDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Module M20: Rewards, Celebrations & Surveys */}
          <Route
            path="rewards/awards"
            element={
              <ProtectedRoute requiredPermission="rewards.view">
                <AwardsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="rewards/kudos"
            element={
              <ProtectedRoute requiredPermission="rewards.view">
                <AppreciationWallPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="rewards/celebrations"
            element={
              <ProtectedRoute requiredPermission="rewards.view">
                <CelebrationsWallPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="rewards/surveys"
            element={
              <ProtectedRoute requiredPermission="rewards.view">
                <SurveysPage />
              </ProtectedRoute>
            }
          />

          {/* Module M21: Anonymous Feedback & Grievance */}
          <Route
            path="feedback/submit"
            element={
              <ProtectedRoute requiredPermission="feedback.submit">
                <SubmitFeedbackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="feedback/track"
            element={
              <ProtectedRoute>
                <TrackFeedbackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="feedback/admin"
            element={
              <ProtectedRoute requiredPermission="feedback.manage">
                <GrievanceAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="feedback/committee"
            element={
              <ProtectedRoute requiredPermission="grievance.committee">
                <CommitteeDashboardPage />
              </ProtectedRoute>
            }
          />

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <ChatbotWidget />
    </>
  );
}
