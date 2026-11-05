---
description: "Granular implementation tasks for Universal Page Refresh Button & Seamless ScreenSkeleton Loading States"
---

# Tasks: Universal Page Refresh & Seamless Loading States

**Branch**: `feature/23-universal-page-refresh-and-loading-states`  
**Prerequisites**: [`.specify/specs/23-universal-page-refresh-and-loading-states/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/23-universal-page-refresh-and-loading-states/spec.md), [`.specify/specs/23-universal-page-refresh-and-loading-states/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/23-universal-page-refresh-and-loading-states/plan.md)  
**Organization**: Structured into sequential, independently verifiable waves mapped to User Stories (P1, P2).

---

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Parallelizable task (independent file / no blocking dependency)
- **[Story]**: Target user journey from `spec.md` (`US1`, `US2`, `US3`)

---

## Phase 1: Setup & Shared Infrastructure

**Purpose**: Build the single source of truth reusable RefreshButton component adhering to `DESIGN.md`.

- [X] **T001** [P] Create `frontend/src/components/common/RefreshButton.jsx` supporting `onRefresh`, `isFetching`, `className`, and `label` with Lucide `RefreshCw` icon (`#00C471`, `animate-spin`).

**Checkpoint**: `<RefreshButton />` available for universal import across all application pages.

---

## Phase 2: User Story 1 (P1) - Wave 1: Core Foundation & Personal Dossiers

**Goal**: Equip employee personal profile and notifications center with refresh actions and skeleton loading.

- [X] **T002** [P] [US1] Add `RefreshButton` and wire `refetch()` in `frontend/src/features/employees/pages/MyProfilePage.jsx`; ensure `ScreenSkeleton variant="profile"` displays during load/refresh.
- [X] **T003** [P] [US1] Add `RefreshButton` and wire `refetch()` in `frontend/src/features/notifications/pages/NotificationsPage.jsx`; render `ScreenSkeleton variant="table"` on initial fetch.

**Checkpoint**: Core self-service profile and notifications reflect manual refresh and zero blank screen behavior.

---

## Phase 3: User Story 1 (P1) - Wave 2: Financial Governance (Payroll, Loans, Expenses)

**Goal**: Equip all 14 financial and compensation pages with refresh capabilities and loading skeletons.

### Module 9: Payroll
- [X] **T004** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="cards"` to `frontend/src/features/payroll/pages/PayrollOverviewPage.jsx`.
- [X] **T005** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/payroll/pages/MyPayslipsPage.jsx`.
- [X] **T006** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/payroll/pages/SalaryStructuresPage.jsx`.
- [X] **T007** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/payroll/pages/PayrollRunsPage.jsx`.
- [X] **T008** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/payroll/pages/PayrollRunDetailPage.jsx`.
- [X] **T009** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/payroll/pages/FinalSettlementPage.jsx`.
- [X] **T010** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/payroll/pages/PayrollReportsPage.jsx`.

### Module 10: Loans & Salary Advances
- [X] **T011** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/loans/pages/MyLoansPage.jsx`.
- [X] **T012** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/loans/pages/LoanApprovalsPage.jsx`.
- [X] **T013** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/loans/pages/LoanLedgerPage.jsx`.

### Module 11: Expense Claims & Reimbursements
- [X] **T014** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/expenses/pages/MyExpensesPage.jsx`.
- [X] **T015** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/expenses/pages/ExpenseApprovalsPage.jsx`.
- [X] **T016** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="cards"` to `frontend/src/features/expenses/pages/ExpenseCategoriesPage.jsx`.
- [X] **T017** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/expenses/pages/ExpenseReportsPage.jsx`.

**Checkpoint**: All payroll runs, loans, and expense approvals can be re-fetched on demand with instant feedback.

---

## Phase 4: User Story 1 (P1) - Wave 3: Operational Logistics (Assets, Projects & Timesheets)

**Goal**: Equip asset management, projects portfolio, and timesheet workflows with refresh actions and loading states.

### Module 23: Asset Management
- [X] **T018** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="cards"` to `frontend/src/features/assets/pages/MyAssetsPage.jsx`.
- [X] **T019** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/assets/pages/AssetsPage.jsx`.
- [X] **T020** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/assets/pages/AssetRequestsPage.jsx`.

### Module 22: Projects & Timesheets
- [X] **T021** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="cards"` to `frontend/src/features/projects/pages/ProjectsPage.jsx`.
- [X] **T022** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/projects/pages/MyTimesheetPage.jsx`.
- [X] **T023** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/projects/pages/TimesheetApprovalsPage.jsx`.
- [X] **T024** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/projects/pages/TimesheetCompliancePage.jsx`.
- [X] **T025** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/projects/pages/UtilizationReportPage.jsx`.
- [X] **T026** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/projects/pages/ProfitabilityReportPage.jsx`.

**Checkpoint**: Assets inventory and project billing/timesheets support instant reload and zero blank screens.

---

## Phase 5: User Story 1 (P1) - Wave 4: People & Org Governance (Performance, Lifecycle, Policies, Admin)

**Goal**: Equip performance appraisal, employee onboarding/offboarding, organizational directories, and audit logging with refresh buttons.

### Module 19: Performance Appraisals
- [X] **T027** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/performance/pages/MyReviewPage.jsx`.
- [X] **T028** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/performance/pages/TeamReviewsPage.jsx`.
- [X] **T029** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/performance/pages/ReviewCyclesPage.jsx`.
- [X] **T030** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="cards"` to `frontend/src/features/performance/pages/KpiTemplatesPage.jsx`.

### Module 18: Lifecycle & Onboarding
- [X] **T031** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/lifecycle/pages/OnboardingListPage.jsx`.
- [X] **T032** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/lifecycle/pages/MyLifecycleTasksPage.jsx`.
- [X] **T033** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/lifecycle/pages/ResignationsPage.jsx`.
- [X] **T034** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/lifecycle/pages/OffboardingPage.jsx`.
- [X] **T035** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="cards"` to `frontend/src/features/lifecycle/pages/ChecklistTemplatesPage.jsx`.

### Module 7: Master Reports & Policies
- [X] **T036** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/reports/pages/ReportsPage.jsx`.
- [X] **T037** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="cards"` to `frontend/src/features/settings/pages/PublicPoliciesPage.jsx`.

### Admin Modules
- [X] **T038** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/departments/pages/DepartmentsPage.jsx`.
- [X] **T039** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/departments/pages/DesignationsPage.jsx`.
- [X] **T040** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/audit/pages/AuditLogsPage.jsx`.
- [X] **T041** [P] [US1] Add `RefreshButton` and `ScreenSkeleton variant="table"` to `frontend/src/features/employees/pages/ChangeRequestsPage.jsx`.

**Checkpoint**: 100% of sidebar-accessible pages now feature a top-right refresh button and loading skeleton.

---

## Phase 6: User Story 2 (P1) & User Story 3 (P2) - Loading State Hardening & Mobile/Dark Mode Check

**Goal**: Guarantee zero layout flicker, zero blank screen states, and verified dark mode / mobile responsive appearance.

- [X] **T042** [US2] Audit all 40 updated pages ensuring no unhandled `if (isLoading) return null;` or blank white container remains.
- [X] **T043** [US3] Verify that `<RefreshButton />` renders icon-only on mobile viewports (< 640px) without causing header overflow.
- [X] **T044** [US3] Verify dark mode contrast: background `#111D17`, border `#1A3125`, and emerald icon `#00C471`.

---

## Phase 7: Verification & Build Quality Gate

**Purpose**: Ensure the entire frontend application compiles cleanly with zero syntax, import, or bundling errors.

- [X] **T045** Run `npm run build --prefix frontend` and verify exit code 0.
- [X] **T046** Perform manual sanity check across 3 distinct module tiers (e.g. `MyProfilePage`, `PayrollRunsPage`, `AuditLogsPage`).
- [X] **T047** Commit and push all changes with a clean git status.

