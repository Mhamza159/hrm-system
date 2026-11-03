# Tasks Breakdown: Module M22 (Projects & Timesheets)

**Feature:** M22 Projects & Timesheets  
**Spec Directory:** `.specify/specs/21-projects-timesheets`  
**Source of Truth:** `docs/BUILD-GUIDE.md` Section 23 (Rows 22.1 – 22.7), `docs/FRD.md` (Sections 9.7 & 11), `docs/TECH-SPEC.md`  
**Execution Order:** Vertical Slice (Backend $\rightarrow$ Frontend $\rightarrow$ Test per row, P1 first, then P2, ending with multi-role E2E test).

---

## Phase P1: Core Project Setup, Roster, Timesheets & Approvals

### BUILD-GUIDE Row 22.1: Clients & Projects Portfolio Management
- [x] 22.1-BE: Implement Client and Project Mongoose models (`backend/src/models/client.model.js`, `backend/src/models/project.model.js`), Zod validation schemas in `project.validation.js`, service CRUD logic in `project.service.js`, controller endpoints in `project.controller.js`, and mount router at `/api/v1/projects` & `/api/v1/clients` in `project.routes.js`. Register permissions `project.view` and `project.manage` in `backend/src/shared/permissions.js`.
- [x] 22.1-FE: Create RTK Query endpoints for clients and projects in `frontend/src/features/projects/projectsApi.js`. Build `ProjectsPage.jsx`, `ProjectModal.jsx`, and `ClientModal.jsx` in `frontend/src/features/projects/`. Add navigation links in `Sidebar.jsx` wrapped in `Can` gate for `project.view`.
- [x] 22.1-TEST: Write integration tests in `backend/tests/m22.projects.e2e.test.js` validating client creation, project creation with unique code `PRJ-XXX`, pagination, update, and soft deletion.

---

### BUILD-GUIDE Row 22.2: Project Member Assignment & Roster Isolation
- [x] 22.2-BE: Implement member assignment endpoint `PUT /api/v1/projects/:id/members` with validation for employee IDs, project roles (`Developer`, `Lead`, `QA`, `Designer`), and optional custom hourly rates in minor paisa units. Enforce roster isolation logic in `project.service.js` that checks project membership before logging timesheets, returning **HTTP 403** for non-members.
- [x] 22.2-FE: Build `ProjectMembersModal.jsx` allowing Super Admin and Department Managers to assign team members to projects, specify project-specific roles, and configure billing overrides.
- [x] 22.2-TEST: Write integration tests verifying team member assignment to projects and validating that non-assigned employees receive **HTTP 403 Forbidden** when attempting to log hours against that project.

---

### BUILD-GUIDE Row 22.3: Weekly Timesheet Entry & Daily 24-Hour Cap
- [x] 22.3-BE: Implement Timesheet Mongoose model (`backend/src/models/timesheet.model.js`) with compound index `{ employeeId: 1, projectId: 1, date: 1, isDeleted: 1 }`. Add Zod schemas and service logic for `POST /api/v1/timesheets`, `PUT /api/v1/timesheets/:id`, and `GET /api/v1/timesheets/my-week`. Enforce race-condition-safe invariant: cumulative daily hours across all projects for an employee cannot exceed 24.0 hours (increments of 0.25h).
- [x] 22.3-FE: Build `MyTimesheetPage.jsx` and `TimesheetWeeklyGrid.jsx` providing a Monday-to-Sunday weekly grid, project selector filtered to assigned projects, billable checkboxes, task description inputs, and live daily hours tally with visual warnings as hours approach 24h.
- [x] 22.3-TEST: Write integration tests verifying timesheet creation, retrieval of weekly grid entries, and assert that attempting to log cumulative hours $> 24.0$ on a single calendar day returns **HTTP 400 Bad Request**.

---

### BUILD-GUIDE Row 22.4: Weekly Timesheet Submission & Manager Approval Workflow
- [x] 22.4-BE: Implement weekly submission endpoint `POST /api/v1/timesheets/submit` (batch transitions draft entries of a week to `submitted`) and manager review endpoints `GET /api/v1/timesheets/pending` and `PATCH /api/v1/timesheets/:id/decide` (`approved` or `rejected` with mandatory reason). Enforce approval immutability: approved timesheets are locked against modifications or deletion (**HTTP 400**).
- [x] 22.4-FE: Build `TimesheetApprovalsPage.jsx` with department/team scoped submission queues, aggregate total hours review, and `TimesheetDecisionModal.jsx` with one-click approve and reject with mandatory comment dialog.
- [x] 22.4-TEST: Write integration tests for submission lifecycle: employee submits weekly timesheet, manager approves, and verify that subsequent edit or delete attempts on approved timesheets are rejected with **HTTP 400**. Also test rejection flow allowing re-editing.

---

## Phase P2: Utilization Analytics, Profitability & Compliance

### BUILD-GUIDE Row 22.5: Utilization Report & Telemetry
- [x] 22.5-BE: Implement utilization telemetry endpoint `GET /api/v1/reports/utilization` with date range and department filters. Compute billable hours, non-billable hours, total capacity (standard 40h/week), and billable utilization percentage (`(Billable Hours / Total Hours) * 100`).
- [x] 22.5-FE: Build `UtilizationReportPage.jsx` featuring visual stacked bar distribution (Billable vs Non-Billable), summary KPI metric cards, and a detailed tabular breakdown by employee and department.
- [x] 22.5-TEST: Write integration tests verifying correct calculation of utilization metrics, billable percentage accuracy, and department scope filters.

---

### BUILD-GUIDE Row 22.6: Project Cost & Profitability Intelligence (Super Admin Only)
- [x] 22.6-BE: Implement project profitability endpoint `GET /api/v1/reports/project-profitability`. Derive internal employee hourly cost from active `SalaryStructure`: $\text{Hourly Cost} = \text{Basic Salary} \div (22 \times 8)$. Calculate project revenue from billable hours $\times$ billing rate, labor cost from hours $\times$ hourly cost, and gross profit margin percentage. Enforce strict **Super Admin ONLY** access control (**HTTP 403 Forbidden** for Department Manager, HR Manager, and Employee).
- [x] 22.6-FE: Build `ProjectProfitabilityPage.jsx` restricted via `Can` gate for Super Admin, displaying revenue, labor costs, gross profit, and margin percentages per project with budget burn progress indicators.
- [x] 22.6-TEST: Write integration tests verifying financial calculations against active salary structures, and assert that non-Super Admin roles (Department Manager, HR Manager, Employee) receive **HTTP 403 Forbidden**.

---

### BUILD-GUIDE Row 22.7: HR Timesheet Compliance & Automated Reminders
- [x] 22.7-BE: Implement missing timesheet compliance endpoint `GET /api/v1/timesheets/missing` (identifies active employees with $< 40$ logged hours or unsubmitted timesheets for a given week) and reminder trigger endpoint `POST /api/v1/timesheets/remind-missing`.
- [x] 22.7-FE: Build `TimesheetCompliancePage.jsx` for HR Managers and Super Admins displaying missing submissions list by department, submission rate gauges, and a "Send Reminders" bulk action button.
- [x] 22.7-TEST: Write integration tests verifying detection of delinquent employees for specific calendar weeks and validating notification trigger invocation.

---

## Module End-to-End Test Suite

- [x] 22-E2E: Module M22 end-to-end multi-role test suite (`backend/tests/m22.projects.e2e.test.js`) verifying end-to-end workflow: Client $\rightarrow$ Project $\rightarrow$ Member Assignment $\rightarrow$ Timesheet Logging $\rightarrow$ Daily 24h Cap Rejection $\rightarrow$ Week Submission $\rightarrow$ Manager Approval Lock $\rightarrow$ Utilization Chart $\rightarrow$ Profitability 403 Security Check $\rightarrow$ Compliance Reminder (18/18 tests passing).
