# Feature Specification: Dynamic Module-Level Notification Badges & RBAC/PBAC Dashboards

**Feature Branch**: `22-dynamic-module-notifications`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Whenever a notification is received for anything—for example, leaves—a dot should appear on the leaves tab in the sidebar to reflect it. If a payroll notification arrives, that should appear as well, and similarly for every module. Across the entire software, whatever notification is received should be displayed in the sidebar dynamically, replacing the current fixed display of 3 notifications. Read all the files in the docs folder and structure them accordingly. Review the RBAC and PBAC rules and design three structures for each role and each dashboard."

---

## 1. Executive Summary & Architectural Scope

This specification addresses two deeply coupled enterprise requirements in the HRM system:

1. **Dynamic Module-Level Real-Time Notification Indicators in Navigation**:
   - Replaces static or global-only notification counters with module-scoped dynamic indicator badges and visual unread dots across the left sidebar.
   - Maps every inbound notification (via WebSocket `notification:new` or REST sync) to its target module (Attendance, Leaves, Payroll, Loans, Expenses, Assets, Projects, Performance, Lifecycle).
   - Renders intuitive indicators:
     - **Collapsed Group**: Glowing emerald dot / badge on the parent accordion header (e.g. `Leaves & Holidays (1)`).
     - **Expanded Group**: Pinpoint dot or count badge beside the specific action item (e.g. `Leave Approvals`).
   - Automatically synchronizes when items are read, approved, or dismissed.

2. **Enterprise RBAC & PBAC Structure Specification (Docs Alignment)**:
   - Formulates the permission boundaries, module navigation hierarchies, and dashboard widget layouts for the core user roles defined in `docs/BUILD-GUIDE.md` (Rows 26.1–26.17), `docs/FRD.md`, and `docs/TECH-SPEC.md`:
     1. **Super Admin** (Enterprise Executive & System Custodian)
     2. **HR Manager** (Workforce Operations & Policy Compliance Lead)
     3. **Department Manager** (Team-Scoped Operational Supervisor)
     4. **Employee** (Individual Self-Service Contributor)

---

## 2. User Scenarios & Prioritized User Journeys *(Mandatory)*

### User Story 1 - Module-Scoped Navigation Badges & Unread Dots (Priority: P1)

As an HR Manager or Super Admin, when a new employee request arrives (e.g., Leave application, Punch correction, Loan request, or Expense claim), I want to see an immediate unread notification dot on the corresponding module group in the sidebar, so that I immediately know which functional area requires my attention without having to open the global bell drawer.

**Why this priority**: Solves the primary user friction of missing actionable requests across 9+ deep modules. Eliminates the rigid global-only notification model and enables contextual triage.

**Independent Test**:
- Emit a `leave` notification via socket or API.
- Verify that a glowing notification dot immediately renders next to **"Leaves & Holidays"** in the sidebar.
- Expand the group; verify that the dot or count specifically highlights **"Leave Approvals"**.
- Navigate to the page; verify that acknowledging the request or notification clears the indicator.

**Acceptance Scenarios**:
1. **Given** an HR Manager is logged in and on the Dashboard, **When** an employee submits a leave request, **Then** the "Leaves & Holidays" sidebar group displays an unread notification indicator dot in real time without refreshing.
2. **Given** a user opens the "Loans & Advances" module dropdown, **When** there is a pending loan approval, **Then** the "Loan Approvals" sub-item displays an unread badge counter while other siblings remain unbadged.
3. **Given** the user navigates to the badged destination and acknowledges the notification, **Then** the notification badge for that module decrements and disappears when unread count reaches zero.

---

### User Story 2 - Replacing Fixed Notification Displays with Dynamic Real-Time Tally (Priority: P1)

As any logged-in user, I want all notification counters in the Topbar bell, drawer, and sidebar to dynamically reflect my exact unread count from the database rather than a static or hardcoded number (such as fixed 3 notifications), so that I can trust the alert indicators.

**Why this priority**: Restores data integrity and user trust in communication alerts.

**Independent Test**:
- Create 1 new notification &rarr; badge displays `1`.
- Mark all as read &rarr; badge clears completely (`0` / hidden).
- Receive 5 bulk notifications &rarr; badge displays `5`.

**Acceptance Scenarios**:
1. **Given** a user has 0 unread alerts, **When** the page loads, **Then** no static `3` or placeholder counter is visible in the Topbar bell or sidebar.
2. **Given** multiple alerts arrive across different modules (e.g., 1 Leave, 2 Loans), **Then** the Topbar bell displays `3`, while the sidebar reflects `1` on Leaves and `2` on Loans.

---

### User Story 3 - Role-Based Dashboard & Navigation Specialization (Priority: P2)

As a Super Admin, HR Manager, Department Manager, or Employee, I want my dashboard and sidebar navigation to strictly reflect my assigned PBAC permissions and operational responsibilities, so that I see only relevant metrics, action items, and navigation paths.

**Why this priority**: Enforces enterprise role isolation, prevents information leakage, and streamlines user productivity.

**Independent Test**:
- Log in as Employee: Dashboard shows personal attendance punch, remaining leave balances, latest payslip download, and active personal loans; sidebar hides administrative menus.
- Log in as Department Manager: Dashboard highlights team attendance today, pending team leave/overtime recommendations, and team timesheets; financial salaries are masked.
- Log in as HR Manager: Dashboard displays company-wide headcount, pending first-tier approvals across all departments, hiring/onboarding pipelines, and upcoming probations.
- Log in as Super Admin: Dashboard displays executive treasury outflow, pending executive disbursements, payroll approvals, security audit logs, and system health.

**Acceptance Scenarios**:
1. **Given** an Employee logs in, **When** viewing the sidebar, **Then** only self-service routes are visible, and modules like "Payroll Overview" or "Leave Approvals" are filtered out.
2. **Given** a Department Manager views the dashboard, **Then** team-scoped statistics are computed without exposing confidential salary amounts.
3. **Given** a Super Admin accesses the system, **Then** executive action cards (e.g. "Pending Disbursement Authorizations") are prioritized at the top.

---

## 3. Module-to-Notification Mapping Matrix

The notification subsystem (`Notification.model.js`) maps to sidebar navigation as follows:

| Notification `type` / `link` Pattern | Target Sidebar Module Group | Specific Child Route | Allowed Roles |
| :--- | :--- | :--- | :--- |
| `leave`, `/leaves/*` | **Leaves & Holidays** | `Leave Approvals` / `My Leaves` | HR Manager, Dept Manager, Employee |
| `payroll`, `/payroll/*` | **Payroll** | `Payroll Runs` / `My Payslips` | Super Admin, HR Manager, Employee |
| `loan`, `/loans/*` | **Loans & Advances** | `Loan Approvals` / `My Loans` | Super Admin, HR Manager, Employee |
| `attendance`, `/attendance/*` | **Attendance** | `Flagged Punches` / `Attendance Lock` | HR Manager, Dept Manager, Employee |
| `expense`, `/expenses/*` | **Expenses** | `Expense Approvals` / `My Expenses` | Super Admin, HR Manager, Employee |
| `asset`, `/assets/*` | **Assets** | `Requisitions` / `My Assets` | HR Manager, Employee |
| `project`, `timesheet`, `/timesheets/*` | **Projects & Timesheets** | `Timesheet Approvals` / `My Timesheet` | Dept Manager, Employee |
| `performance`, `/performance/*` | **Performance** | `Team Reviews` / `My Appraisal` | HR Manager, Dept Manager, Employee |
| `resignation`, `onboard`, `/onboarding/*` | **Lifecycle** | `Resignation` / `Exit Clearance` | Super Admin, HR Manager, Employee |
| `announcement`, `system` | **Topbar Bell / Announcements** | `/notifications` / `/announcements` | All Roles |

---

## 4. RBAC & PBAC Three-Tier Architectural Structure

In accordance with `docs/BUILD-GUIDE.md` (Module 26) and `docs/TECH-SPEC.md`, access control is governed by **Role-Based Access Control (RBAC)** layered with **Policy-Based Attribute Access Control (PBAC)**:

```
[User] ──assigned──▶ [Roles] ──composed of──▶ [Permissions { subject, action, scope }]
                                                      │
                                           ┌──────────┴──────────┐
                                           ▼                     ▼
                                    CASL UI Guard          Backend API Guard
                                 (Can / isItemVisible)    (checkPermission(s, a))
```

### 4.1 Structure 1: Super Admin (Executive & System Custodian)
* **Scope Authority**: `all` (System-wide unrestricted access).
* **Core Responsibilities**:
  - Executive disbursement authorizations for loans and salary advances.
  - Final approval and disbursement of monthly payroll runs.
  - Security configuration, custom role authoring, and immutable audit log inspection (`audit.view`).
  - System overrides for attendance month lock and company-wide policies.
* **Dashboard Structure (`AdminDashboard.jsx`)**:
  - **KPI Row**: Total Active Workforce, Monthly Payroll Outflow, Active Capital on Loan, System Compliance Health (FBR/EOBI).
  - **Executive Action Queue**: Borrowing Disbursement Authorizations, Final Payroll Approvals, High-Value Expense Claims.
  - **Security & Integrity Stream**: Real-time administrative audit logs, failed login attempts, privileged user changes.

### 4.2 Structure 2: HR Manager (Workforce Operations & Policy Lead)
* **Scope Authority**: `all` or `department` for operational subjects; restricted from Super Admin executive actions.
* **Core Responsibilities**:
  - First-tier review and recommendation of leaves, loan applications, attendance corrections, and asset requests.
  - Salary structure creation, revisions, and draft payroll batch calculation.
  - Onboarding pipelines, probationary performance monitoring, and exit clearances.
  - Statutory reporting (FBR Section 149 statements, EOBI/PESSI vouchers).
* **Dashboard Structure (`HrDashboard.jsx`)**:
  - **KPI Row**: Present Staff Today, On Leave Today, Attendance Flagged Punches, Open Recruitment & Probations.
  - **Operational Approval Queue**: Leave Applications awaiting verification, Loan requests awaiting Admin forwarding, Expense claim audits.
  - **Workforce Lifecycle Feed**: Upcoming probations ending this week, upcoming employee birthdays/anniversaries, contract renewals.

### 4.3 Structure 3: Department Manager (Team Operational Supervisor)
* **Scope Authority**: `department` / `team` (Strictly scoped to directly reporting subordinates or departmental members).
* **Core Responsibilities**:
  - Team attendance monitoring, late punch recommendations, and shift scheduling.
  - Team leave recommendations and shift overlap conflict checks.
  - Team weekly timesheet audits and utilization approvals.
  - Team KPI evaluation reviews during annual appraisal cycles.
  - **Privacy Guard Constraint**: Compensation figures, bank details, and net salaries of team members are strictly masked.
* **Dashboard Structure (`ManagerDashboard.jsx`)**:
  - **KPI Row**: Team Members Present, Team Late Punches, Pending Team Leave Requests, Weekly Logged Timesheet Hours.
  - **Team Triage Queue**: Subordinate leave applications, overtime hour verifications, timesheet submissions.
  - **Resource Roster**: Today's active team roster with live attendance status (In Office / WFH / Field / On Leave).

### 4.4 Structure 4: Employee (Individual Self-Service Contributor)
* **Scope Authority**: `own` (Strictly scoped to the authenticated caller's own employee profile).
* **Core Responsibilities**:
  - Web/Mobile attendance check-in, geofenced/face punches, and missed punch correction requests.
  - Leave balance tracking and time-off applications.
  - Borrowing applications (emergency advances and loans) and repayment schedule tracking.
  - Monthly payslip PDF download and FBR Form IT-3 annual tax certificates.
* **Dashboard Structure (`EmployeeDashboard.jsx`)**:
  - **Attendance Widget**: Live digital clock with "Punch In / Punch Out" quick-action button, daily punch history.
  - **Leave Balances**: Casual, Annual, and Sick leave remaining allowance circular progress bars.
  - **Financial Summary**: Latest disbursed payslip download button, active borrowing remaining balance.
  - **My Action Tasks**: Onboarding/offboarding task checklist, assigned company assets.

---

## 5. Functional Requirements *(Mandatory)*

- **FR-001**: The notification query API (`GET /api/v1/notifications`) MUST support returning an aggregate breakdown of unread notifications grouped by `module` / `type`.
- **FR-002**: The `Sidebar.jsx` component MUST dynamically compute unread indicator counts for each module group using live notifications state from Redux / RTK Query.
- **FR-003**: When a module group in the sidebar has &ge; 1 unread notification and the group is collapsed, the parent item MUST display a visual unread indicator (an emerald/red dot or count capsule).
- **FR-004**: When a module group is expanded, the specific child item corresponding to the notification target MUST display the unread indicator dot or count badge.
- **FR-005**: All hardcoded notification counts (such as static `3` badges) in the UI MUST be eliminated and replaced with dynamic values sourced from the user's unread notification store.
- **FR-006**: The WebSocket client (`useSocket.js`) MUST dispatch real-time cache updates on `notification:new` and `notification:read` events so navigation badges update without requiring manual page refresh.
- **FR-007**: Navigating to a notification's target route or opening the notification in the drawer MUST mark it as read and immediately dismiss the corresponding module indicator.
- **FR-008**: The sidebar navigation items MUST continue to honor CASL PBAC visibility filters (`isItemVisible`), ensuring users only see indicators for modules they have permission to access.

---

## 6. Success Criteria *(Mandatory)*

- **SC-001**: 100% of inbound real-time notifications render their corresponding module indicator in the sidebar within &lt; 500ms of WebSocket receipt.
- **SC-002**: Opening or resolving a notification dismisses the module badge immediately (0s perceived lag, zero manual refresh required).
- **SC-003**: Zero hardcoded notification counters exist across the entire application codebase.
- **SC-004**: Users belonging to any of the 4 roles see only their authorized routes and contextual dashboard widgets with zero data leakage across departmental or executive boundaries.

---

## 7. Assumptions & Technical Dependencies

1. **Existing Infrastructure**: The backend Socket.io infrastructure (`socket.service.js`) and Notification model (`notification.model.js`) are fully functional and will be leveraged.
2. **Category Standardization**: Notifications emitted across modules must specify a valid `type` (e.g. `'leave'`, `'loan'`, `'payroll'`, `'attendance'`, `'expense'`, `'asset'`, `'project'`) and optional target `link`.
3. **Badge Visual Design**: In accordance with `DESIGN.md` (Forest & Emerald theme), unread indicators will feature `#00C471` (Emerald) or `#F43F5E` (Rose) accents with subtle pulse animations for urgent approvals.

