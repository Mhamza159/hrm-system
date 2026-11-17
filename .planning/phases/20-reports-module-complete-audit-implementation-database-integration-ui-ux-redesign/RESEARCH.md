# Phase 20 Research: Reports Module Complete Audit, Implementation, Database Integration & UI/UX Redesign

## 1. Executive Summary & Audit Findings

The **Reports Module** (Module M7 / Features 7.6 to 7.8) provides multi-axis organizational intelligence and analytics across 6 critical operational domains:
1. **Attendance**
2. **Leaves**
3. **HeadCount**
4. **Payroll**
5. **Turnover**
6. **Department Cost**

### Current Architecture Audit
- **Backend Route**: `GET /api/v1/reports/:type` in `backend/src/modules/reports/reports.routes.js`.
- **Backend Controller**: `getReport` in `backend/src/modules/reports/reports.controller.js` parses query params using Zod schema, verifies PBAC/RBAC, calls `reports.service.js`, and supports streaming XLSX/PDF exports.
- **Backend Service**: `backend/src/modules/reports/reports.service.js` has aggregations for the 6 report types, but contains critical gaps:
  1. **Headcount**: Queries `Employee.find({ isDeleted: false })` statically without date boundaries. Fails to calculate new hires in the reporting period or exits in the period.
  2. **Turnover**: Merely finds employees with `status: Resigned | Terminated` without computing the period turnover rate formula:
     $$\text{Turnover Rate} = \left(\frac{\text{Separations during period}}{\text{Average headcount during period}}\right) \times 100$$
  3. **Department Cost**: Aggregates only the single latest `PayrollRun` regardless of `from` and `to` query parameters, ignoring date-range selections.
  4. **KPI Summaries**: Only `attendance` and `leave` return a `summary` object. `headcount`, `payroll`, `turnover`, and `department-cost` return null or partial summaries, leading to missing KPI cards in the UI.
  5. **Visual Charts Data**: No chart datasets or breakdown distributions (e.g. monthly trends, department stacked bars) are provided in the API response.
  6. **Inspection APIs**: No dedicated endpoint exists to fetch deep inspection dossier data for an individual employee or department across the active report date range.
- **Frontend State & Components**:
  - `ReportsPage.jsx` hosts the 6 tabs.
  - KPI cards only render for `attendance` and `leave`. The other 4 reports show empty header areas above the table.
  - ZERO charts are rendered for any report.
  - `ReportFilterToolbar.jsx` has only 4 basic date presets instead of the required 8+ presets (Today, Yesterday, This Week, Last Week, This Month, Last Month, This Quarter, This Year, Custom Range).
  - `ReportDataTable.jsx` uses generic slate colors instead of the Forest & Emerald Enterprise theme (`#061A14`, `#111D17`, `#1A3125`, `#00C471`).
  - Inspection is limited to a basic inline accordion for attendance/leaves. No standalone modal inspection sheets exist for employee attendance, leaves, payroll breakdown, or department cost analysis.

---

## 2. Target Deliverables by Report Domain

### 1. Attendance Report
- **Filters**: Full 8+ date presets, custom start/end dates, single-day selection, department dropdown.
- **KPI Summary Cards**: Attendance Rate (%), Total Productive Floor Hours, Total Overtime Recorded, Incidents (Late Arrivals / Absences).
- **Visual Analytics**: Punch Distribution Donut / Status Stacked Bar chart (Present, Late, Half-Day, Absent).
- **Views**:
  - Daily Transactional Log Timeline (chronological punch events with check-in, check-out, duration, late minutes, overtime).
  - Employee-Wise Aggregation (total working days, present, late, half-day, absent, worked hours, attendance %).
- **Inspection Sheet**: `EmployeeAttendanceInspectionModal.jsx` displaying period metrics, daily punch logs, and punctuality rate.

### 2. Leaves Report
- **Filters**: 8+ date presets, custom date range, department selector, leave status filter.
- **KPI Summary Cards**: Total Applications Submitted, Approved Leave Days, Paid Leaves Quota Taken, Pending Approvals.
- **Visual Analytics**: Leave Type Distribution Chart (Casual, Annual, Sick, Unpaid) & Status breakdown.
- **Views**:
  - Chronological Leave Activity Log (application dates, duration, leave type, reason, status).
  - Employee-Wise Utilization Ledger (casual used, annual used, sick used, unpaid LWP, total approved, pending).
- **Inspection Sheet**: `EmployeeLeaveInspectionModal.jsx` displaying leave balances, full application history, and approval audit trails.

### 3. HeadCount Report
- **Filters**: Date presets, department filter, employment status filter, employment type filter.
- **KPI Summary Cards**: Total Headcount, Active Staff, On-Leave Staff, Period Joins vs Exits.
- **Visual Analytics**: Department Headcount Distribution Bar Chart & Employment Type breakdown (Permanent, Contract, Probation, Intern).
- **Historical Accuracy**: Distinguishes current active roster from period joins (`joiningDate` within range) and exits (`status: Resigned | Terminated` within range).
- **Data Table**: Employee code, name, department, designation, gender, employment type, status, joining date.

### 4. Payroll Report
- **Filters**: Payroll period/month range, department filter, payment status filter.
- **KPI Summary Cards**: Total Gross Payroll, Total Net Payable, Statutory Tax Withheld, Total Deductions (Loans/Advances/Penalties).
- **Visual Analytics**: Gross vs Net vs Tax distribution & Department-wise payroll expenditure chart.
- **Data Table**: Monthly payroll runs with headcount, gross PKR, tax withheld PKR, deductions PKR, net payable PKR, and status badge.
- **Inspection Sheet**: `PayrollInspectionModal.jsx` breaking down employee earnings, allowances, statutory deductions, tax slabs, and net pay.
- **Security Barrier**: Strictly prohibited for regular employees and department managers (HTTP 403 / UI hidden).

### 5. Turnover Report
- **Filters**: Date presets, date range, department selector.
- **KPI Summary Cards**: Total Separations, Voluntary Resignations, Involuntary Terminations, Calculated Period Turnover Rate (%).
- **Calculation Formula**:
  $$\text{Turnover Rate} = \left(\frac{\text{Separations (Resigned + Terminated) in period}}{\text{Average Headcount during period}}\right) \times 100$$
- **Visual Analytics**: Separation Type breakdown & Monthly turnover trend chart.
- **Data Table**: Separated employees with code, name, department, designation, separation status, reason, tenure, exit recorded date.
- **Security Barrier**: Strictly restricted to Super Admin & HR Manager.

### 6. Department Cost Report
- **Filters**: Date range across payroll cycles, department filter.
- **KPI Summary Cards**: Total Company Workforce Expenditure, Average Cost per Employee, Highest Cost Department, Total Tax/Statutory Component.
- **Visual Analytics**: Department Cost Comparison Bar Chart & Cost-per-Employee metric.
- **Data Table**: Department name, active headcount, total gross payroll PKR, tax component PKR, net payout PKR, average cost per staff.
- **Inspection Sheet**: `DepartmentCostInspectionModal.jsx` listing department workforce roster, salary expenditure, and cost distribution.
- **Security Barrier**: Strictly restricted to Super Admin & HR Manager.

---

## 3. RBAC & PBAC Security Matrix

| Role | Attendance | Leaves | Headcount | Payroll | Turnover | Dept Cost | Export XLSX/PDF |
|---|---|---|---|---|---|---|---|
| **Super Admin** | Company-wide | Company-wide | Company-wide | Company-wide | Company-wide | Company-wide | Allowed |
| **HR Manager** | Company-wide | Company-wide | Company-wide | Company-wide | Company-wide | Company-wide | Allowed |
| **Department Manager** | Team/Managed Depts only | Team/Managed Depts only | Team/Managed Depts only | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | Team only |
| **Employee** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** |

---

## 4. UI/UX & Design Standard (Forest & Emerald Enterprise)
- **Background**: `#061A14` Deep Emerald Dark Canvas.
- **Cards & Surfaces**: `#111D17` High-Density Panels with `#1A3125` hairline borders.
- **Accents**: `#00C471` Emerald Accent, `#F59E0B` Amber Warning, `#EF4444` Crimson Alert.
- **Typography**: Clean tabular monospace numbers (`font-mono tabular-nums`), uppercase tracking badges.
- **Controls**: Strict `h-9` height normalization across all inputs, date pickers, dropdowns, and button controls.
- **Modals**: Standardized modal shells (`max-w-3xl max-h-[90vh] overflow-hidden`) with smooth entry animation, dark backdrop blur, and structured headers/footers.
- **Zero Prop-Types & Zero Oxlint Warnings**: 100% clean frontend build with no legacy imports.
