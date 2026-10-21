# Development Tasks: Module M7 — Dashboard & Reports

**Feature Branch**: `feature/11-dashboard`  
**Created**: 2026-10-21  
**Status**: Ready for Sequential Execution  
**Module ID**: M7  
**Module Name**: Dashboard & Reports (Core HR Group · Launch Scope P1/P2)  
**Spec Reference**: [`.specify/specs/11-dashboard/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/11-dashboard/spec.md)  
**Plan Reference**: [`.specify/specs/11-dashboard/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/11-dashboard/plan.md)  
**Build Guide Section**: Section 13 (Rows 7.1 to 7.8)

---

## Task Execution Guidelines (Strict Vertical Slice Order)
1. **Vertical Slice Execution**: Complete Backend (`model/service/controller/route`) ➔ Frontend (`RTK Query hook/page/component/Can`) ➔ Test (`Vitest API / unit assertions`) for each row before moving to the next.
2. **Standard MERN Stack Rules**: Plain JavaScript only (`.js`, `.jsx`), standard envelope `{ success, data, message, meta }`, integer paisa for financials, and CASL PBAC scopes (`all`, `team`, `own`).
3. **Task Completion Marking**: Mark `[x]` upon passing tests and verifying end-to-end dataflow.

---

## Phase 1: Foundation & RBAC Setup

- [x] **7.0-BE**: Register `dashboard` and `reports` modules and actions in `backend/src/shared/permissions.js`
  - Register `dashboard.view` (allowedScopes: `['own', 'team', 'all']`, defaultScope: `'own'`)
  - Register `report.view` (allowedScopes: `['team', 'all']`, defaultScope: `'team'`)
  - Register `report.export` (allowedScopes: `['team', 'all']`, defaultScope: `'team'`)

---

## Phase 2: Modular KPI Widgets & Interactive Charts (Row 7.5 · P1)

- [x] **7.5-BE**: Implement core aggregation helpers in `backend/src/modules/dashboard/dashboard.service.js`
  - `getAttendanceTrendData(days)`: Daily present, late, absent, on_leave counts over last 7/30 days
  - `getPendingApprovalsQueue(scopeFilter)`: Pending leaves and pending attendance corrections
  - `getUpcomingBirthdays(daysWindow)`: Next 14 days active employee birthdays with avatar and department
  - `getDepartmentCostDistribution()`: Department-wise gross payroll and employee counts
- [x] **7.5-FE**: Build reusable visual widget components in `frontend/src/features/dashboard/components/widgets/`
  - `StatCard.jsx`: Metric display with percentage trend badge, icon, and colored accent bar
  - `AttendanceChart.jsx`: Recharts `AreaChart` with SVG linear gradients, responsive to mobile
  - `PendingList.jsx`: Tabbed pending approval items with direct action shortcuts
  - `BirthdaysCard.jsx`: Upcoming celebrations list with employee avatar and relative date pill
  - `DepartmentCostChart.jsx`: Recharts `BarChart` displaying departmental payroll distributions
- [x] **7.5-TEST**: Unit test widget aggregation helpers with mock Mongo collections
  - Assert trend query formats dates accurately in `YYYY-MM-DD`
  - Assert birthday calculation handles year-boundary rollover

---

## Phase 3: Super Admin Executive Dashboard (Row 7.1 · P1)

- [x] **7.1-BE**: Implement `GET /api/v1/dashboard/admin` in `dashboard.controller.js` and `dashboard.routes.js`
  - Guard route with `authenticate` and `checkPermission('dashboard.view', 'all')`
  - Aggregate total headcount, active departments, today's attendance rates, and monthly gross payroll cost
  - Return consolidated payload matching spec Section 4
- [x] **7.1-FE**: Implement `AdminDashboard.jsx` in `frontend/src/features/dashboard/components/`
  - Wire RTK Query hook `useGetAdminDashboardQuery`
  - Render executive KPI stat cards, Recharts 7-day attendance trend, and departmental cost chart
  - Ensure zero horizontal scroll on 390px mobile viewports
- [x] **7.1-TEST**: Integration test `GET /api/v1/dashboard/admin`
  - Verify 200 OK with full financial metrics for Super Admin
  - Verify 403 Forbidden for Department Manager and Employee

---

## Phase 4: HR Manager Operational Dashboard (Row 7.2 · P1)

- [x] **7.2-BE**: Implement `GET /api/v1/dashboard/hr` in `dashboard.controller.js` and `dashboard.routes.js`
  - Guard route with `authenticate` and `checkPermission('dashboard.view', 'all')`
  - Aggregate actionable queues: pending leaves count, pending punch corrections, today's on-leave roster, and probation reviews due
- [x] **7.2-FE**: Implement `HrDashboard.jsx` in `frontend/src/features/dashboard/components/`
  - Wire RTK Query hook `useGetHrDashboardQuery`
  - Display quick action cards, today's on-leave roster table, and upcoming celebrations
- [x] **7.2-TEST**: Integration test `GET /api/v1/dashboard/hr`
  - Verify 200 OK for HR Manager with action queue counts
  - Verify 403 Forbidden for Department Manager

---

## Phase 5: Department Manager Team Dashboard (Row 7.3 · P1)

- [x] **7.3-BE**: Implement `GET /api/v1/dashboard/manager` in `dashboard.controller.js` and `dashboard.routes.js`
  - Guard route with `authenticate` and `checkPermission('dashboard.view', 'team')`
  - Resolve manager's assigned department or direct reports
  - Query team presence (present, late, absent), pending team leave requests, and approved overtime hours
  - **Security Invariant**: Strictly strip all salary, base pay, and financial figures
- [x] **7.3-FE**: Implement `ManagerDashboard.jsx` in `frontend/src/features/dashboard/components/`
  - Wire RTK Query hook `useGetManagerDashboardQuery`
  - Render Team Status card, Pending Team Approvals list, and Overtime Hours tracker
- [x] **7.3-TEST**: Integration test `GET /api/v1/dashboard/manager`
  - Verify 200 OK for Department Manager with team-scoped data
  - Verify zero financial fields exist in JSON response payload
  - Verify employees outside manager's department are excluded

---

## Phase 6: Employee Personal Dashboard & Smart Gateway (Row 7.4 · P1)

- [x] **7.4-BE**: Implement `GET /api/v1/dashboard/employee` in `dashboard.controller.js` and `dashboard.routes.js`
  - Guard route with `authenticate` and `checkPermission('dashboard.view', 'own')`
  - Query caller's today attendance punch status, leave quota balances, and latest paid payslip
- [x] **7.4-FE**: Implement `EmployeeDashboard.jsx` in `frontend/src/features/dashboard/components/`
  - Wire RTK Query hook `useGetEmployeeDashboardQuery`
  - Display Today's Attendance Punch Card (with check-in/out quick action), Leave Balance Cards, and Latest Payslip Card
- [x] **7.0-FE**: Update `DashboardPage.jsx` gateway dispatcher in `frontend/src/features/dashboard/`
  - Inspect `user.roles` and dynamically render `AdminDashboard`, `HrDashboard`, `ManagerDashboard`, or `EmployeeDashboard`
  - Provide fallback loading skeleton and error states
- [x] **7.4-TEST**: Integration test `GET /api/v1/dashboard/employee`
  - Verify 200 OK for authenticated employee with isolated personal data
  - Verify unauthorized employee cannot view peer's personal metrics

---

## Phase 7: Multi-Axis Organizational Reports Console (Row 7.6 · P1)

- [x] **7.6-BE**: Implement `GET /api/v1/reports/:type` in `reports.controller.js` and `reports.routes.js`
  - Validate `:type` enum: `attendance`, `leave`, `payroll`, `headcount`, `turnover`, `department-cost`
  - Enforce permission scopes: `report.view: all` for HR/Admin, `report.view: team` for Manager (attendance & leave only)
  - Execute indexed aggregations and return paginated data with `{ items, total, page, limit }`
- [x] **7.6-FE**: Implement `ReportsPage.jsx` and `ReportDataTable.jsx` in `frontend/src/features/reports/`
  - Create `reportsApi.js` with `useGetReportDataQuery`
  - Build report navigation tabs with role-based visibility gating
  - Render report-specific columns with sortable headers and pagination controls
- [x] **7.6-TEST**: Integration test `GET /api/v1/reports/:type`
  - Test all 6 report types return valid tabular structures
  - Assert Department Manager receives 403 on `payroll`, `turnover`, and `department-cost`

---

## Phase 8: Dynamic Multi-Parameter Report Filters (Row 7.7 · P2)

- [x] **7.7-BE**: Implement query filter validation and extraction in `reports.validation.js` and `reports.service.js`
  - Support `from`, `to`, `departmentId`, `employeeId`, `status`
  - Validate `from <= to` date range invariant
  - Restrict Department Manager's `departmentId` filter to their own department
- [x] **7.7-FE**: Implement `ReportFilterToolbar.jsx` in `frontend/src/features/reports/components/`
  - Include date range inputs with quick preset pills ("This Month", "Last Month", "YTD")
  - Include Department selector (M4) and Employee autocomplete input
  - Wire instant filter updates to `ReportsPage` state
- [x] **7.7-TEST**: Test filter logic and edge cases
  - Verify invalid date range (`from > to`) returns 400 Bad Request
  - Verify filtered query results strictly match requested boundaries

---

## Phase 9: Streaming Multi-Format Excel & PDF Exporter (Row 7.8 · P2)

- [x] **7.8-BE**: Implement `reportExport.service.js` and export routes in `reports.routes.js`
  - `GET /api/v1/reports/:type/export?format=xlsx`: Build styled Excel workbook with ExcelJS (slate header, auto widths, zebra stripes)
  - `GET /api/v1/reports/:type/export?format=pdf`: Build formatted tabular PDF with PDFKit (company branding, header, timestamps)
  - Stream binary buffer directly with appropriate `Content-Disposition` attachment headers
  - Record audit log entry in `auditLogs` collection upon export
- [x] **7.8-FE**: Implement `ExportButtons.jsx` in `frontend/src/features/reports/components/`
  - Add "Export to Excel" and "Export to PDF" action buttons
  - Stream download using Redux `accessToken` and `credentials: 'include'`
  - Show loading spinner and Sonner toast notification on completion
- [x] **7.8-TEST**: Integration test report exports
  - Verify `.xlsx` export returns `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - Verify `.pdf` export returns `application/pdf`
  - Assert audit log record created for export action

---

## Phase 10: Multi-Role End-to-End Verification (Row 7.9 · E2E)

- [x] **7.9-E2E**: Module M7 end-to-end Playwright test, chaaron roles se
  - Super Admin: Verify executive dashboard, live KPI stat cards, Recharts attendance trend, and full report exports
  - HR Manager: Verify operational workforce dashboard, pending approval queues, and turnover report
  - Department Manager: Verify team-scoped dashboard (no salary leaks) and team reports access (403 on payroll)
  - Employee: Verify self-service punch card, leave balance cards, and latest payslip download
  - Responsive Viewport (390px): Confirm all dashboard views and widgets render cleanly without layout breaks
