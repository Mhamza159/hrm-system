# Phase 20 Context: Reports Module Complete Audit, Implementation, Database Integration & UI/UX Redesign

## 1. Objectives & Boundaries
- Perform an end-to-end audit, backend aggregation completion, and full UI/UX redesign of the **Reports Module** across all six sections:
  1. Attendance Report
  2. Leaves Report
  3. HeadCounts Report
  4. Payroll Report
  5. Turnover Report
  6. Department Cost Report
- Connect 100% of reporting metrics to live MongoDB database records via backend aggregation services with zero dummy or hardcoded mock data.
- Implement rich native SVG analytics charts, 8+ date presets, dynamic department filtering, and detailed inspection modal sheets across all domains.
- Enforce strict PBAC/RBAC: Department Managers horizontally scoped to their team/department; strictly block financial reports (`payroll`, `turnover`, `department-cost`) for non-HR/Admin roles with HTTP 403.
- Meet all quality gates: zero `prop-types`, zero Oxlint warnings/errors, backend test suite passes, and clean Vite production build.

---

## 2. Plan Breakdown (4 Plans)

### Plan 20-01: Backend Analytics Engine & Aggregation Overhaul
- **File**: `.planning/phases/20-reports-module-complete-audit-implementation-database-integration-ui-ux-redesign/20-01-PLAN.md`
- **Scope**:
  - Overhaul `backend/src/modules/reports/reports.service.js` to compute complete KPI summaries, monthly trends, breakdown distributions, and detailed records for all 6 reports.
  - Implement period-aware Headcount calculation (active, new hires in period, exits in period).
  - Implement accurate Turnover Rate formula: `(Total Separations / Average Headcount) * 100`.
  - Wire date-range (`from` and `to`) awareness into `department-cost` across all relevant payroll runs.
  - Add backend inspection query helper for single-employee and single-department deep drilldown.
  - Verify strict PBAC/RBAC authorization boundaries.

### Plan 20-02: Core Reports Console, Comprehensive Date Presets & Filter Architecture
- **File**: `.planning/phases/20-reports-module-complete-audit-implementation-database-integration-ui-ux-redesign/20-02-PLAN.md`
- **Scope**:
  - Redesign `ReportsPage.jsx` and `ReportFilterToolbar.jsx` in Forest & Emerald Enterprise theme (`#061A14`, `#111D17`, `#1A3125`, `#00C471`).
  - Implement all 8+ quick date presets: Today, Yesterday, This Week, Last Week, This Month, Last Month, This Quarter, This Year, Custom Range.
  - Standardize all toolbar controls to `h-9` height with synchronized date range pickers.
  - Create standardized executive KPI summary cards across ALL 6 reports.
  - Wire live refresh button with loading state preserving all active filter selections.

### Plan 20-03: Interactive Visual Analytics Suite & Charts for All 6 Reports
- **File**: `.planning/phases/20-reports-module-complete-audit-implementation-database-integration-ui-ux-redesign/20-03-PLAN.md`
- **Scope**:
  - Build responsive native SVG analytical charts matching the theme:
    - Attendance: Punch status distribution & daily attendance trajectory.
    - Leaves: Leave type breakdown (Casual, Annual, Sick, Unpaid) & approval status distribution.
    - Headcount: Department-wise headcount distribution & employment type breakdown.
    - Payroll: Gross vs Net vs Tax distribution & department-wise expenditure chart.
    - Turnover: Monthly turnover trend & voluntary vs involuntary separation breakdown.
    - Department Cost: Department cost comparison bar chart & cost-per-employee metric.
  - Implement elevated dark glassmorphic hover tooltips and interactive click-to-filter drilldowns.

### Plan 20-04: Enhanced Data Tables, Chronological Timelines & Comprehensive Inspection Sheets
- **File**: `.planning/phases/20-reports-module-complete-audit-implementation-database-integration-ui-ux-redesign/20-04-PLAN.md`
- **Scope**:
  - Overhaul `ReportDataTable.jsx` with `min-w-[1050px]` fixed table constraints, status pills, and responsive pagination.
  - Implement Daily Attendance Log Timeline & Leave Activity Timeline with event badges.
  - Build detailed inspection modals/sheets:
    - `EmployeeAttendanceInspectionModal.jsx` (period punches, late minutes, overtime, attendance rate).
    - `EmployeeLeaveInspectionModal.jsx` (leave balances, days consumed, approval history).
    - `PayrollInspectionModal.jsx` (earnings, allowances, deductions, tax, net pay breakdown).
    - `DepartmentCostInspectionModal.jsx` (department salary costs, staff roster, cost distribution).
  - Run complete verification gate (zero `prop-types`, zero Oxlint warnings, backend tests pass, clean Vite production build).

---

## 3. Invariants & Commitments
- **Zero Mock Data**: 100% real database data fetched via backend aggregation.
- **Strict Height & Width Constraints**: No layout shifting or table column crushing.
- **Design Tokens**: `#061A14` canvas, `#111D17` surface, `#1A3125` border, `#00C471` emerald accent.
- **Zero Prop-Types**: Ban all `prop-types` imports.
- **Zero Oxlint Warnings**: 100% clean linter output.
