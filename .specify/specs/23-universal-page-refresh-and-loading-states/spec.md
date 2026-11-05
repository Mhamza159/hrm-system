# Feature Specification: Universal Page Refresh & Seamless Loading States

**Feature Branch**: `feature/23-universal-page-refresh-and-loading-states`  
**Created**: 2026-11-05  
**Status**: Draft  
**Input**: "In the software, add a refresh button to every page across every module in the sidebar so that data can be reloaded when refreshed, and while the data is loading, a loader should be shown on the page instead of a blank screen. Read the files in the docs folder and structure and design accordingly; read the design.md file and ui-reference file and design everything according to them. Avoid the pages where a refresh button is already present, and apply it to the rest."

---

## 1. Objectives & Design System Alignment

### Problem Statement
Currently, several critical sidebar pages (including Payroll, Loans & Advances, Expenses, Assets, Projects & Timesheets, Performance, Lifecycle, Departments, and Audit Logs) lack a dedicated refresh button in their header toolbar. Users have to rely on full browser reloads (`F5`) to fetch updated database records. Furthermore, some pages render empty or unstyled blank containers during data retrieval, violating the enterprise visual contract established in `DESIGN.md`.

### Solution Architecture
1. **Universal Refresh Button Component**:
   - Standardized, lightweight action button placed consistently in the top right header/toolbar of every page lacking one.
   - Adheres to `DESIGN.md` (Forest & Emerald craft):
     - Light Mode: `bg-white border-slate-200 text-slate-700 hover:bg-slate-50`
     - Dark Mode: `dark:bg-[#111D17] dark:border-[#1A3125] dark:text-slate-300 dark:hover:bg-[#162820]`
     - Icon: `RefreshCw` from `lucide-react` tinted with `--brand-primary` (`#00C471`).
     - Animation: Spin smoothly (`animate-spin`) while fetching or reloading.
     - Responsive: Compact icon-only button on mobile viewports (`< 640px`), expanding to icon + "Refresh" label on tablet/desktop.
2. **Standardized `ScreenSkeleton` Shimmer Loader**:
   - Zero blank screens: Whenever `isLoading` is true (initial load) or `isFetching` during manual refresh without cached data, render the specialized `<ScreenSkeleton />` component.
   - Screen variants mapped to page types:
     - `table`: Tabular registers, logs, approvals, runs, ledgers, categories.
     - `cards`: Overview portals, KPI templates, checklist templates.
     - `profile`: Profile views (My Profile).
     - `matrix`: Security matrices and compliance tabs.

---

## 2. Page Audit & Coverage Matrix

### Existing Pages (Already have Refresh button — DO NOT MODIFY)
- `Dashboard` (`/`)
- `Employees` (`/employees`)
- `Org Chart` (`/org-chart`)
- `My Team` (`/teams/my`)
- `Attendance` (All 9 pages: `My Attendance`, `Team Attendance`, `Attendance Lock`, `Flagged Punches`, `WFH Locations`, `Punch Map`, `Kiosks`, `Face Enrollment`, `Face Approvals`)
- `Leaves & Holidays` (All 6 pages: `My Leaves`, `Leave Approvals`, `Leave Calendar`, `Encashment`, `Holidays`, `Leave Types`)
- `Announcements` (`/announcements`)
- `Login History` (`/login-history`)
- `Admin`: `Work Shifts` (`/shifts`), `Roles & Permissions` (`/roles`), `User Access` (`/users`), `Settings` (`/settings`)

### Target Pages Requiring Refresh Button & Loader Upgrade

| Module | Route | File Path | Component Type | Skeleton Variant |
|---|---|---|---|---|
| **Core** | `/me` | `frontend/src/features/employees/pages/MyProfilePage.jsx` | Profile | `profile` |
| **Payroll** | `/payroll` | `frontend/src/features/payroll/pages/PayrollOverviewPage.jsx` | Overview | `cards` |
| **Payroll** | `/payroll/my-payslips` | `frontend/src/features/payroll/pages/MyPayslipsPage.jsx` | Table | `table` |
| **Payroll** | `/payroll/salary-structures` | `frontend/src/features/payroll/pages/SalaryStructuresPage.jsx` | Table | `table` |
| **Payroll** | `/payroll/runs` | `frontend/src/features/payroll/pages/PayrollRunsPage.jsx` | Table | `table` |
| **Payroll** | `/payroll/runs/:id` | `frontend/src/features/payroll/pages/PayrollRunDetailPage.jsx` | Table/Detail | `table` |
| **Payroll** | `/payroll/settlement` | `frontend/src/features/payroll/pages/FinalSettlementPage.jsx` | Table | `table` |
| **Payroll** | `/payroll/reports` | `frontend/src/features/payroll/pages/PayrollReportsPage.jsx` | Table/Tabs | `table` |
| **Loans** | `/loans` | `frontend/src/features/loans/pages/MyLoansPage.jsx` | Table | `table` |
| **Loans** | `/loans/approvals` | `frontend/src/features/loans/pages/LoanApprovalsPage.jsx` | Table | `table` |
| **Loans** | `/loans/ledger` | `frontend/src/features/loans/pages/LoanLedgerPage.jsx` | Table | `table` |
| **Expenses** | `/expenses` | `frontend/src/features/expenses/pages/MyExpensesPage.jsx` | Table | `table` |
| **Expenses** | `/expenses/approvals` | `frontend/src/features/expenses/pages/ExpenseApprovalsPage.jsx` | Table | `table` |
| **Expenses** | `/expenses/categories` | `frontend/src/features/expenses/pages/ExpenseCategoriesPage.jsx` | Table | `table` |
| **Expenses** | `/expenses/reports` | `frontend/src/features/expenses/pages/ExpenseReportsPage.jsx` | Table | `table` |
| **Assets** | `/assets/my` | `frontend/src/features/assets/pages/MyAssetsPage.jsx` | Table/Cards | `cards` |
| **Assets** | `/assets` | `frontend/src/features/assets/pages/AssetsPage.jsx` | Table | `table` |
| **Assets** | `/assets/requests` | `frontend/src/features/assets/pages/AssetRequestsPage.jsx` | Table | `table` |
| **Projects** | `/projects` | `frontend/src/features/projects/pages/ProjectsPage.jsx` | Table/Cards | `cards` |
| **Projects** | `/timesheets/my` | `frontend/src/features/projects/pages/MyTimesheetPage.jsx` | Table | `table` |
| **Projects** | `/timesheets/approvals` | `frontend/src/features/projects/pages/TimesheetApprovalsPage.jsx` | Table | `table` |
| **Projects** | `/timesheets/compliance` | `frontend/src/features/projects/pages/TimesheetCompliancePage.jsx` | Table | `table` |
| **Projects** | `/reports/utilization` | `frontend/src/features/projects/pages/UtilizationReportPage.jsx` | Table | `table` |
| **Projects** | `/reports/profitability` | `frontend/src/features/projects/pages/ProfitabilityReportPage.jsx` | Table | `table` |
| **Performance** | `/performance/my-review` | `frontend/src/features/performance/pages/MyReviewPage.jsx` | Form/Table | `table` |
| **Performance** | `/performance/team-reviews` | `frontend/src/features/performance/pages/TeamReviewsPage.jsx` | Table | `table` |
| **Performance** | `/performance/cycles` | `frontend/src/features/performance/pages/ReviewCyclesPage.jsx` | Table | `table` |
| **Performance** | `/performance/templates` | `frontend/src/features/performance/pages/KpiTemplatesPage.jsx` | Cards | `cards` |
| **Lifecycle** | `/onboarding` | `frontend/src/features/lifecycle/pages/OnboardingListPage.jsx` | Table | `table` |
| **Lifecycle** | `/onboarding/my-tasks` | `frontend/src/features/lifecycle/pages/MyLifecycleTasksPage.jsx` | Table | `table` |
| **Lifecycle** | `/resignations` | `frontend/src/features/lifecycle/pages/ResignationsPage.jsx` | Table | `table` |
| **Lifecycle** | `/offboarding` | `frontend/src/features/lifecycle/pages/OffboardingPage.jsx` | Table | `table` |
| **Lifecycle** | `/onboarding/templates` | `frontend/src/features/lifecycle/pages/ChecklistTemplatesPage.jsx` | Cards | `cards` |
| **Reports** | `/reports` | `frontend/src/features/reports/pages/ReportsPage.jsx` | Table | `table` |
| **Policies** | `/policies` | `frontend/src/features/settings/pages/PublicPoliciesPage.jsx` | Cards/Text | `cards` |
| **Notifications** | `/notifications` | `frontend/src/features/notifications/pages/NotificationsPage.jsx` | Table/List | `table` |
| **Admin** | `/departments` | `frontend/src/features/departments/pages/DepartmentsPage.jsx` | Table | `table` |
| **Admin** | `/designations` | `frontend/src/features/departments/pages/DesignationsPage.jsx` | Table | `table` |
| **Admin** | `/audit-logs` | `frontend/src/features/audit/pages/AuditLogsPage.jsx` | Table | `table` |
| **Admin** | `/change-requests` | `frontend/src/features/employees/pages/ChangeRequestsPage.jsx` | Table | `table` |

---

## 3. Prioritized User Scenarios & Acceptance Criteria

### User Story 1 - Instant Data Refresh on Financial & Operational Modules (Priority: P1)

As an HR Manager, Finance Auditor, or Employee,  
I want to click a refresh button on any module page (e.g. Payroll Runs, Loan Approvals, Expense Claims, Asset Register, Departments),  
So that I can immediately pull the latest database changes without performing a full browser reload.

**Why this priority**: Directly solves user friction in operational approval chains (loans, leaves, expenses, payroll) where immediate state updates are essential.

**Independent Test**: Navigate to `/payroll/runs`, click the "Refresh" button, observe the spinning icon, and verify network query refetches data without page flicker.

**Acceptance Scenarios**:
1. **Given** the user is viewing any target module page, **When** they click the "Refresh" button in the top action toolbar, **Then** the RTK Query `refetch()` function is invoked, the `RefreshCw` icon animates with `animate-spin`, and a light feedback toast optionally confirms data update.
2. **Given** a query is actively fetching, **When** the refresh button is in progress, **Then** the button is disabled to prevent rapid multiple clicks (`disabled={isFetching}`).

---

### User Story 2 - Zero Blank Screen Loading Experience with ScreenSkeleton (Priority: P1)

As any authenticated user,  
I want to see an elegant, shimmering placeholder skeleton whenever a page is loading or refetching data,  
So that the UI feels responsive, modern, and trustworthy rather than flashing a blank screen or plain text.

**Why this priority**: Blank screens break perceived performance and undermine the high-density enterprise feel specified in `DESIGN.md`.

**Independent Test**: Throttle network connection to "Slow 3G" in DevTools and load `/payroll/runs` or `/loans/approvals`; verify the Forest & Emerald `ScreenSkeleton` renders with shimmering telemetry until data loads.

**Acceptance Scenarios**:
1. **Given** a user navigates to a table-based screen (e.g., `SalaryStructuresPage`, `LoanApprovalsPage`, `AuditLogsPage`), **When** data is initially loading (`isLoading === true`), **Then** `<ScreenSkeleton variant="table" />` renders with column headers and animated placeholder rows.
2. **Given** a user navigates to a card or dashboard-like screen (e.g., `PayrollOverviewPage`, `KpiTemplatesPage`, `ChecklistTemplatesPage`), **When** data is loading, **Then** `<ScreenSkeleton variant="cards" />` renders responsive grid placeholder cards.
3. **Given** data has finished loading, **When** the response is received, **Then** the skeleton smoothly transitions into the actual data view with zero layout jumps.

---

### User Story 3 - Visual Consistency with DESIGN.md & Responsive Toolbars (Priority: P2)

As a mobile or desktop user,  
I want the refresh button and loader to seamlessly conform to both Dark Mode and Light Mode with proper mobile responsive collapsing,  
So that the interface looks clean and unified regardless of device size.

**Why this priority**: Guarantees visual polish and prevents layout overflows on tablet and mobile viewports.

**Independent Test**: Shrink screen width below 640px; verify that the Refresh button compresses to an icon-only button without overflowing the page header.

**Acceptance Scenarios**:
1. **Given** viewport width is under `640px` (mobile), **When** viewing the header, **Then** the refresh button renders as a square icon button (`p-2 rounded-xl`), hiding the text label.
2. **Given** dark mode is active (`dark` class on root), **When** viewing the refresh button, **Then** its surface is `#111D17`, border is `#1A3125`, and hover state is `#162820`.

---

## 4. Reusable RefreshButton Component Spec

To ensure strict DRY and zero boilerplate across all 40 target pages, we will provide a standardized reusable component:
`frontend/src/components/common/RefreshButton.jsx`

```jsx
export function RefreshButton({ onRefresh, isFetching = false, className = '' }) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isFetching}
      className={cn(
        "inline-flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer select-none shadow-xs disabled:opacity-50",
        "bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300",
        "border border-slate-200 dark:border-[#1A3125] hover:bg-slate-50 dark:hover:bg-[#162820]",
        className
      )}
      title="Refresh data"
      aria-label="Refresh page data"
    >
      <RefreshCw className={cn("w-3.5 h-3.5 text-[#00C471]", isFetching && "animate-spin")} />
      <span className="hidden sm:inline">Refresh</span>
    </button>
  );
}
```

---

## 5. Next Steps

Review this specification. When ready to proceed with architectural breakdown and task generation, run:

**/speckit-plan**

