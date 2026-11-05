# Implementation Plan: Universal Page Refresh & Seamless Loading States

**Branch**: `feature/23-universal-page-refresh-and-loading-states`  
**Date**: 2026-11-05  
**Spec**: [`.specify/specs/23-universal-page-refresh-and-loading-states/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/23-universal-page-refresh-and-loading-states/spec.md)  
**Status**: Ready for Task Breakdown  

---

## 1. Summary & Architecture Overview

This plan defines the end-to-end implementation for embedding a standardized **Refresh Button** across all remaining sidebar pages in the HRM Enterprise system and ensuring that every page displays a shimmer `<ScreenSkeleton />` during initial load and manual re-fetching instead of an unstyled blank screen.

### Architectural Core Principles (Ponytail & DESIGN.md)
1. **DRY & Single Source of Truth**: Instead of writing separate button markup in 40 different files, create one reusable component:
   `frontend/src/components/common/RefreshButton.jsx`.
2. **Predictable Query Invalidation / Refetch**: Every target page already uses RTK Query hooks (e.g. `const { data, isLoading, isFetching, refetch } = useGet...Query(...)`). The `<RefreshButton />` binds directly to `refetch` and `isFetching`.
3. **Graceful Loading Fallbacks**: Where pages currently render `if (isLoading) return null;` or a blank layout, replace with `<ScreenSkeleton variant="..." title="..." message="..." />`.
4. **Strict Theme Adherence**: Matches `DESIGN.md` and `docs/ui-reference.png`:
   - Button styling: Hairline 1px border (`border-slate-200 dark:border-[#1A3125]`), Forest card canvas (`bg-white dark:bg-[#111D17]`), emerald icon `#00C471`.
   - Responsive behavior: Mobile screens render icon-only (`p-2`); desktop views render icon + "Refresh" text (`sm:px-3 sm:py-2`).

---

## 2. Technical Context

- **Platform**: React 18, Vite 6, Tailwind CSS, Redux Toolkit Query (RTK Query), Lucide React.
- **Design Archetype**: Forest & Emerald Craft (`#00C471`, Dark canvas `#111D17`, hairline `#1A3125`).
- **Target Files**:
  - New Component: `frontend/src/components/common/RefreshButton.jsx`
  - Existing Skeletons: `frontend/src/components/common/ScreenSkeleton.jsx` (already contains `table`, `cards`, `profile`, `orgchart`, `matrix` variants).
  - Target Pages: 40 pages across Payroll, Loans, Expenses, Assets, Projects, Performance, Lifecycle, Admin, and Core profiles.

---

## 3. Reusable Component Blueprint

### `frontend/src/components/common/RefreshButton.jsx`
```jsx
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils.js';

/**
 * Universal Refresh Button for Page Toolbars
 * 
 * @param {Object} props
 * @param {Function} props.onRefresh - Function to call on click (e.g. refetch)
 * @param {boolean} props.isFetching - Whether a background fetch is active
 * @param {string} props.className - Additional Tailwind classes
 * @param {string} props.label - Button label text (defaults to 'Refresh')
 */
export function RefreshButton({
  onRefresh,
  isFetching = false,
  className = '',
  label = 'Refresh'
}) {
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
      title="Refresh page records"
      aria-label="Refresh page records"
    >
      <RefreshCw
        className={cn(
          "w-3.5 h-3.5 text-[#00C471] transition-transform",
          isFetching && "animate-spin"
        )}
      />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
```

---

## 4. Implementation Waves (40 Pages)

To guarantee incremental verification, zero regressions, and fast progress, changes are sequenced into 4 wave batches:

### Wave 1: Core Foundation & Personal Dossiers (2 pages)
1. **Component**: Create `frontend/src/components/common/RefreshButton.jsx`.
2. **`MyProfilePage.jsx`**: Add `RefreshButton` to profile header; verify `ScreenSkeleton variant="profile"` displays on load and manual refresh.
3. **`NotificationsPage.jsx`**: Add `RefreshButton` alongside "Mark All as Read"; wrap table/list in `ScreenSkeleton variant="table"`.

### Wave 2: Financial Governance (Payroll, Loans, Expenses - 14 pages)
- **Payroll**:
  - `PayrollOverviewPage.jsx`: Add `RefreshButton` to top action bar; display `ScreenSkeleton variant="cards"`.
  - `MyPayslipsPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `SalaryStructuresPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `PayrollRunsPage.jsx`: Add `RefreshButton` next to "Generate Payroll Run"; render `ScreenSkeleton variant="table"`.
  - `PayrollRunDetailPage.jsx`: Add `RefreshButton` to detail header; render `ScreenSkeleton variant="table"`.
  - `FinalSettlementPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `PayrollReportsPage.jsx`: Add `RefreshButton` to compliance header; render `ScreenSkeleton variant="table"`.
- **Loans & Advances**:
  - `MyLoansPage.jsx`: Add `RefreshButton` next to "Apply for Loan"; render `ScreenSkeleton variant="table"`.
  - `LoanApprovalsPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `LoanLedgerPage.jsx`: Add `RefreshButton` next to "Export Ledger"; render `ScreenSkeleton variant="table"`.
- **Expenses**:
  - `MyExpensesPage.jsx`: Add `RefreshButton` next to "Submit Claim"; render `ScreenSkeleton variant="table"`.
  - `ExpenseApprovalsPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `ExpenseCategoriesPage.jsx`: Add `RefreshButton` next to "New Category"; render `ScreenSkeleton variant="cards"`.
  - `ExpenseReportsPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.

### Wave 3: Operational Logistics (Assets, Projects & Timesheets - 9 pages)
- **Assets**:
  - `MyAssetsPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="cards"`.
  - `AssetsPage.jsx`: Add `RefreshButton` next to "Register Asset"; render `ScreenSkeleton variant="table"`.
  - `AssetRequestsPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
- **Projects & Timesheets**:
  - `ProjectsPage.jsx`: Add `RefreshButton` next to "New Project"; render `ScreenSkeleton variant="cards"`.
  - `MyTimesheetPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `TimesheetApprovalsPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `TimesheetCompliancePage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `UtilizationReportPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `ProfitabilityReportPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.

### Wave 4: People & Org Governance (Performance, Lifecycle, Policies, Admin - 15 pages)
- **Performance**:
  - `MyReviewPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `TeamReviewsPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `ReviewCyclesPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `KpiTemplatesPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="cards"`.
- **Lifecycle (Onboarding / Offboarding)**:
  - `OnboardingListPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `MyLifecycleTasksPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `ResignationsPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `OffboardingPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `ChecklistTemplatesPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="cards"`.
- **Reports & Policies**:
  - `ReportsPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `PublicPoliciesPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="cards"`.
- **Admin**:
  - `DepartmentsPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `DesignationsPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `AuditLogsPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.
  - `ChangeRequestsPage.jsx`: Add `RefreshButton`; render `ScreenSkeleton variant="table"`.

---

## 5. Verification & Quality Gates

1. **Compilation Check**: `npm run build --prefix frontend` after each wave to ensure zero JSX syntax, import, or typing errors.
2. **Visual & Responsive Verification**:
   - Verify on desktop: Icon + "Refresh" label renders in `#00C471` / `#111D17` theme.
   - Verify on mobile (<640px): Label collapses cleanly into an icon-only square button without overlapping page title or action buttons.
3. **Functional Click Test**:
   - Clicking button triggers `refetch()` or cache invalidation.
   - Icon spins (`animate-spin`) while `isFetching` is true and button is disabled.
   - Initial load displays `<ScreenSkeleton />` with shimmering light reflections.

---

## 6. Next Steps

Review this architectural plan. To generate granular, ordered execution tasks, run:

**/speckit-tasks**

