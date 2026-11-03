# Functional Specification: Module M22 (Projects & Timesheets)

**Feature:** M22 Projects & Timesheets  
**Spec Directory:** `.specify/specs/21-projects-timesheets`  
**Roadmap Phase:** Phase 2 (Smart Operations) — Final Module  
**Sources of Truth:**  
- `docs/FRD.md` Section 9.7 (M22 Features & Role-wise access)  
- `docs/FRD.md` Section 11 (Permission Matrix Row: `M22 Projects & Timesheets | Full | View | Team | Own`)  
- `docs/BUILD-GUIDE.md` Section 23 (Rows 22.1 to 22.7)  
- `docs/MODULES.md` Section 600 (M22 Technical & Functional Definitions)  
- `design.md` (Elvara Forest & Emerald Enterprise Craft Design System)  

---

## 1. Module Overview & Functional Objectives

Module M22 establishes end-to-end client engagement and resource time allocation for the software house:
1. **Client & Project Registry:** Centralized portfolio of external clients and software delivery projects with budget caps, hourly billing rates, and statuses (`active`, `on_hold`, `completed`, `archived`).
2. **Project Team Membership Bounds:** Strict assignment of developers, designers, and managers to projects. Non-members cannot log hours against unassigned projects.
3. **Weekly Timesheet Logging Grid:** High-density weekly timesheet grid (Monday to Sunday) allowing employees to log hours per project and task, tagged as **Billable** or **Non-billable**, with strict daily validation capping total logged hours at $\le 24.0$ hours/day.
4. **Multi-State Timesheet Workflow:** Two-stage approval cycle (`draft` $\rightarrow$ `submitted` $\rightarrow$ `approved` / `rejected`). Once approved by the department manager, timesheets are permanently locked against alterations.
5. **Billable Utilization Analytics:** Visual breakdown of productive vs non-billable hours with interactive stacked bar charts and telemetry metrics.
6. **Project Cost & Profitability Engine:** Super Admin-only executive intelligence multiplying logged project hours by the employee's calculated hourly cost (derived from active `SalaryStructure`: $\text{Basic Salary} \div (22 \text{ workdays} \times 8 \text{ hours})$) against billable client revenue to compute gross margins and project ROI.
7. **HR Timesheet Compliance Monitoring:** Real-time tracking of active employees who have missed submitting weekly timesheets for past periods, with one-click reminder alerts.

---

## 2. Official Library Syntax & Patterns (Context7 Verified)

### A. `date-fns` (v4/v3) — Calendar Week Calculation
Used for week start/end calculations, week intervals, and ISO formatting:
```javascript
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO } from 'date-fns';

// In Pakistan corporate standard, weeks start on Monday (weekStartsOn: 1)
export const getWeekBounds = (date = new Date()) => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end }); // Array of 7 Date objects (Mon..Sun)
  const weekNumber = format(start, 'yyyy-II'); // e.g. "2026-W45"
  return { start, end, days, weekNumber };
};
```

### B. `recharts` — Stacked Utilization Bar Chart
Used in `UtilizationReportPage.jsx` for billable vs non-billable telemetry:
```jsx
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

<ResponsiveContainer width="100%" height={320}>
  <BarChart data={utilizationData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" className="dark:stroke-[#1A3125]" />
    <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 11 }} />
    <YAxis stroke="#64748B" tick={{ fontSize: 11 }} unit="h" />
    <Tooltip 
      contentStyle={{ backgroundColor: '#111D17', borderColor: '#1A3125', borderRadius: '12px', color: '#fff' }}
      cursor={{ fill: 'rgba(0, 196, 113, 0.05)' }}
    />
    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
    <Bar dataKey="billableHours" name="Billable Hours" stackId="a" fill="#00C471" radius={[0, 0, 0, 0]} />
    <Bar dataKey="nonBillableHours" name="Non-Billable Hours" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

---

## 3. Prioritized User Stories & Acceptance Criteria

### P1 User Story 1: Client & Project Portfolio Registry (BUILD-GUIDE Row 22.1)
*As an authorized Department Manager or Super Admin,*  
*I want to register corporate clients and create deliverable projects with client links, code identifiers, budgets, and billing rates,*  
*So that organizational work is cleanly segmented and accounted for.*

#### Acceptance Criteria
- **Given** an authenticated user with `project.create` permission:
  - **When** submitting `POST /api/v1/projects` with `name`, `code` (e.g. `PRJ-ELVARA`), `clientId`, `billingType` (`hourly`, `fixed`, `non_billable`), and `hourlyRate`:
  - **Then** the project is stored with status `active` and returned with HTTP 201.
- **Given** a request to create a project with a duplicate `code` within the company:
  - **When** validated by the uniqueness index:
  - **Then** the API rejects the request with HTTP 409 (`Project code already in use`).
- **Role-Wise Matrix:**
  - **Super Admin:** Unrestricted CRUD on all clients and projects; can archive or permanently delete projects.
  - **HR Manager:** Read-only access to client and project listings for compliance auditing.
  - **Department Manager:** Create and update projects for their department; edit project budgets and milestones.
  - **Employee:** View only active projects where they are currently assigned as a team member.

---

### P1 User Story 2: Project Membership Assignment & Time Log Isolation (BUILD-GUIDE Row 22.2)
*As a Project Manager / Department Manager,*  
*I want to assign specific employees to a project's roster with designated project roles,*  
*So that unassigned staff are restricted from logging hours against the project.*

#### Acceptance Criteria
- **Given** an existing active project:
  - **When** an authorized manager sends `PUT /api/v1/projects/:id/members` with an array of `employeeId`s and roles:
  - **Then** `project.members[]` is updated and audit logged.
- **Given** an employee attempting to log timesheet hours via `POST /api/v1/timesheets`:
  - **When** the employee's ID is not present in `project.members[].employeeId` and user is not Super Admin:
  - **Then** the request is rejected with HTTP 403 (`Forbidden: You are not an assigned member of this project`).
- **Role-Wise Matrix:**
  - **Super Admin:** Manage members across all projects.
  - **HR Manager:** View project roster allocations.
  - **Department Manager:** Add or remove members from department projects; view team capacity.
  - **Employee:** Read-only view of their assigned projects; blocked from assigning other members (HTTP 403).

---

### P1 User Story 3: Weekly Grid Timesheet Entry & Daily 24-Hour Cap (BUILD-GUIDE Row 22.3)
*As a Company Employee,*  
*I want to log daily hours across assigned projects and tasks in a weekly grid (Monday to Sunday) with billable toggles,*  
*So that my time allocations are recorded accurately without exceeding physical day bounds.*

#### Acceptance Criteria
- **Given** an active employee on `MyTimesheetPage.jsx`:
  - **When** viewing a calendar week (e.g., `2026-W45`), the system displays a matrix of assigned projects rows $\times$ 7 day columns (Mon–Sun).
- **Given** an employee submitting `POST /api/v1/timesheets` with `date`, `projectId`, `hours`, `taskDescription`, and `isBillable`:
  - **When** the total logged hours for any single calendar day exceeds 24.0 hours:
  - **Then** the system rejects the entry with HTTP 400 (`Daily time log cannot exceed 24 hours`).
- **Given** hours logged with negative numbers or non-numeric values:
  - **When** validated by Zod schema:
  - **Then** the API rejects with HTTP 400 (`Hours must be between 0.25 and 24.0`).
- **Role-Wise Matrix:**
  - **Super Admin:** View and manage any timesheet entry.
  - **HR Manager:** View timesheet grid across all employees.
  - **Department Manager:** View timesheet entries for department team members; cannot log on behalf of others.
  - **Employee:** Log, edit, and delete own timesheet entries in `draft` status for the active week.

---

### P1 User Story 4: Timesheet Submission & Manager Approval Workflow (BUILD-GUIDE Row 22.4)
*As an Employee and Department Manager,*  
*I want a formal submission and approval workflow with state locking,*  
*So that once timesheets are approved, entries cannot be silently altered or backdated.*

#### Acceptance Criteria
- **Given** an employee with draft entries for a week:
  - **When** the employee clicks "Submit Week for Approval" (`POST /api/v1/timesheets/submit` with `weekStartDate`):
  - **Then** all draft entries for that week transition to `submitted` status and a notification is dispatched to their reporting manager.
- **Given** a Department Manager reviewing `TimesheetApprovalsPage.jsx`:
  - **When** the manager approves (`PATCH /api/v1/timesheets/:id/decide` with `decision: 'approved'`):
  - **Then** the timesheet transitions to `approved`, stamps `approvedBy` and `approvedAt`, and becomes permanently read-only.
- **Given** a manager rejecting with a rejection reason (`decision: 'rejected'`, `rejectionReason: '...'`):
  - **When** processed:
  - **Then** the entries revert to `draft` status, allowing the employee to correct hours and re-submit.
- **Role-Wise Matrix:**
  - **Super Admin:** Approve or unlock any timesheet across the company.
  - **HR Manager:** View approval queues and audit decisions.
  - **Department Manager:** Approve or reject timesheets strictly for subordinates in their department/team.
  - **Employee:** Submit own weekly timesheets; blocked from approving own timesheets (HTTP 403).

---

### P2 User Story 5: Billable Resource Utilization Analytics (BUILD-GUIDE Row 22.5)
*As an HR Manager or Department Manager,*  
*I want visual utilization reports showing billable vs non-billable percentages over time,*  
*So that organizational productivity and bench time can be monitored.*

#### Acceptance Criteria
- **Given** authorized managers querying `GET /api/v1/reports/utilization`:
  - **When** parameters `startDate`, `endDate`, and `departmentId` are provided:
  - **Then** the API aggregates:
    $$\text{Utilization \%} = \frac{\text{Total Billable Hours}}{\text{Total Logged Hours}} \times 100$$
  - And returns daily/weekly trend arrays for Recharts rendering.
- **Role-Wise Matrix:**
  - **Super Admin & HR Manager:** Organization-wide utilization telemetry across all departments.
  - **Department Manager:** Scoped to subordinates within their department.
  - **Employee:** Scoped to personal utilization statistics on `MyTimesheetPage.jsx`.

---

### P2 User Story 6: Project Cost & Profitability Intelligence (BUILD-GUIDE Row 22.6)
*As a Super Admin,*  
*I want to calculate project costs using employee hourly rates derived from active salary structures and compare against billable revenue,*  
*So that client project profitability, margins, and cost overruns are visible strictly to executive leadership.*

#### Acceptance Criteria
- **Given** an authenticated user requesting `GET /api/v1/reports/project-profitability`:
  - **When** the user has role `Super Admin`:
  - **Then** for each project, the service queries approved timesheets and links employee `SalaryStructure` to compute:
    $$\text{Hourly Cost (paisa)} = \frac{\text{Employee Basic Salary (paisa)}}{22 \text{ workdays} \times 8 \text{ hours}}$$
    $$\text{Project Cost} = \sum (\text{Logged Hours} \times \text{Hourly Cost})$$
    $$\text{Revenue} = \sum (\text{Billable Hours} \times \text{Project Hourly Billing Rate})$$
    $$\text{Profit Margin \%} = \frac{\text{Revenue} - \text{Project Cost}}{\text{Revenue}} \times 100$$
- **Given** any non-Super Admin (HR Manager, Department Manager, Employee) attempting to access `GET /api/v1/reports/project-profitability`:
  - **When** intercepted by `checkPermission('report.profitability', { role: 'Super Admin' })`:
  - **Then** the request is strictly blocked with HTTP 403 (`Forbidden: Profitability reports are restricted to Super Admin`).
- **Role-Wise Matrix:**
  - **Super Admin:** Exclusive access to project cost and profitability dashboard and Excel export.
  - **HR Manager:** HTTP 403 Forbidden.
  - **Department Manager:** HTTP 403 Forbidden.
  - **Employee:** HTTP 403 Forbidden.

---

### P2 User Story 7: HR Missing Timesheet Compliance Tracker (BUILD-GUIDE Row 22.7)
*As an HR Manager,*  
*I want to identify employees who have not submitted their required weekly timesheets,*  
*So that time tracking compliance is enforced before payroll runs.*

#### Acceptance Criteria
- **Given** an HR Manager requesting `GET /api/v1/timesheets/missing` with `weekStartDate`:
  - **When** evaluated against all active employees:
  - **Then** the system returns a list of employees who have $< 35$ hours logged or no `submitted`/`approved` timesheet for that week.
- **Given** an HR Manager clicking "Send Compliance Reminder":
  - **When** calling `POST /api/v1/timesheets/remind-missing`:
  - **Then** in-app notifications and email alerts are queued via BullMQ for all delinquent employees.
- **Role-Wise Matrix:**
  - **Super Admin & HR Manager:** View missing compliance lists company-wide and dispatch bulk reminders.
  - **Department Manager:** View missing submissions for direct department team members.
  - **Employee:** Blocked from compliance tracker API (HTTP 403).

---

## 4. Traceability Coverage Matrix

| BUILD-GUIDE ID | Feature Description | User Story | Priority | Target Endpoints | Target Frontend Components |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **22.1** | Clients aur projects master register | US-1 | **P1** | `GET/POST /projects`, `GET/PUT/DELETE /projects/:id`, `GET/POST /clients` | `ProjectsPage.jsx`, `ProjectModal.jsx`, `ClientModal.jsx` |
| **22.2** | Members assign & logging restriction | US-2 | **P1** | `PUT /projects/:id/members`, `GET /projects/:id/members` | `ProjectMembersModal.jsx` |
| **22.3** | Timesheet entry (weekly grid, 24h cap) | US-3 | **P1** | `GET /timesheets/my-week`, `POST /timesheets`, `PUT/DELETE /timesheets/:id` | `MyTimesheetPage.jsx`, `TimesheetWeeklyGrid.jsx` |
| **22.4** | Submit + manager approval workflow | US-4 | **P1** | `POST /timesheets/submit`, `PATCH /timesheets/:id/decide` | `TimesheetApprovalsPage.jsx`, `TimesheetDecisionModal.jsx` |
| **22.5** | Utilization report & chart telemetry | US-5 | **P2** | `GET /reports/utilization` | `UtilizationReportPage.jsx`, Recharts Stacked Bar |
| **22.6** | Project cost & profitability (Super Admin only) | US-6 | **P2** | `GET /reports/project-profitability` | `ProjectProfitabilityPage.jsx` (Super Admin restricted) |
| **22.7** | HR missing timesheet compliance tracker | US-7 | **P2** | `GET /timesheets/missing`, `POST /timesheets/remind-missing` | `TimesheetCompliancePage.jsx` |

