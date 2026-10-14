# Feature Specification: Module M4 — Departments, Designations, Shifts & Org Chart

**Feature Branch**: `feature/05-departments-orgchart`  
**Created**: 2026-10-14  
**Status**: Ready for Planning & Implementation  
**Module ID**: M4  
**Module Name**: Departments, Designations, Shifts & Org Chart  
**Spec Folder**: `.specify/specs/05-departments-orgchart`  
**Governing Documents**:
- [`docs/FRD.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/FRD.md) Section 5 (M4. Department, Designation & Org Chart) & Section 11 (Permission Matrix M4 Row)
- [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 7 (Rows 4.1 to 4.7)
- [`docs/TECH-SPEC.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/TECH-SPEC.md) Section 1, 2, 4 & 5

---

## 1. Executive Summary & Architecture Integration

Module M4 establishes the organizational spine and work scheduling taxonomy for the entire HRM system. It structures the enterprise hierarchy into operational units (**Departments**), role classifications (**Designations & Grade Tiers**), working rosters (**Shifts: Fixed, Flexible, and Cross-Midnight Night Shifts**), and interactive visual hierarchy trees (**Organizational Chart & Manager Team Views**).

Subsequent modules strictly depend on M4:
- **M3 (Employee Management)**: Associates employees with `departmentId`, `designationId`, `shiftId`, and `managerId`.
- **M5 (Attendance & Shifts)**: Evaluates daily check-ins against assigned shift timings, calculating late minutes and night shifts across midnight.
- **M6 (Leave & Holidays)**: Builds approval chains using the Department Head and Manager hierarchy established in M4.
- **M7 (Dashboard & Reports)**: Aggregates workforce metrics, headcount, and budget costs per department.

### Dual-Layer Security & RBAC Boundary Alignment
- **Super Admin (`manage:all`)**: Complete administrative authority across all departments, designations, shifts, head assignments, and org chart structures.
- **HR Manager (`org.manage`, `org.view`)**: Full management of departments, designations, grade tiers, shift patterns, and reporting lines. Protected against deleting departments populated with active personnel.
- **Department Manager (`org.view`, scope: `team` / `department`)**: Read-only visualization of company org chart, department structure, and dedicated access to own team members via `GET /api/v1/teams/my`. Cannot create or alter departments, designations, or company shift master records.
- **Employee (`org.view`, scope: `own`)**: Self-service visualization of company org chart with interactive "Me" highlight and breadcrumb reporting chain (`Me` $\rightarrow$ `Manager` $\rightarrow$ `Department Head` $\rightarrow$ `CEO`). Cannot mutate organizational structures.

### Layer Flow Invariant
`routes` $\rightarrow$ `validate` (Zod) $\rightarrow$ `checkPermission('org.manage' | 'org.view')` (CASL) $\rightarrow$ `controller` $\rightarrow$ `service` $\rightarrow$ `model` (`Department`, `Designation`, `Shift`).

---

## 2. Context7 Verified Library Syntax Patterns

### 2.1 Mongoose Self-Referencing Parent-Child Tree & Deletion Guard
*Source: Mongoose official documentation via Context7 (`/websites/mongoosejs`)*
```javascript
import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      maxlength: 100
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      trim: true,
      uppercase: true,
      maxlength: 20
    },
    description: { type: String, default: '' },
    // Self-referencing tree for hierarchical parent/child departments
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true
    },
    // Department Head / Primary Manager (References User or Employee)
    headId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

departmentSchema.index({ code: 1, isDeleted: 1 }, { unique: true });
```

### 2.2 Zod Cross-Midnight Shift Time Validation with Custom Refinement
*Source: Zod official documentation via Context7 (`/colinhacks/zod`)*
```javascript
import { z } from 'zod';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const shiftValidationSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(['fixed', 'flexible', 'night']).default('fixed'),
  startTime: z.string().regex(timeRegex, 'Format must be HH:mm (24-hour)'),
  endTime: z.string().regex(timeRegex, 'Format must be HH:mm (24-hour)'),
  graceMinutes: z.number().int().min(0).max(120).default(15),
  breakMinutes: z.number().int().min(0).max(240).default(60),
  halfDayMinutes: z.number().int().min(60).max(480).default(240),
  workDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).min(1),
  isCrossMidnight: z.boolean().default(false)
}).superRefine((data, ctx) => {
  // Parse hours and minutes
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  // If night shift or end time is before start time, flag cross midnight
  if (data.type === 'night' || endTotal < startTotal) {
    if (!data.isCrossMidnight) {
      data.isCrossMidnight = true;
    }
  }
});
```

---

## 3. Prioritized User Stories & Acceptance Criteria

### User Story 1 (BUILD-GUIDE ID 4.1 · Priority P1): Department Master Register & Deletion Protection
**As an** HR Manager or Super Admin,  
**I want to** create, update, list, and soft-delete company departments with active personnel dependency guards,  
**So that** the organization's business units (Development, QA, Design, Sales, HR, Admin) are maintained accurately without accidental orphaned employees.

#### Acceptance Criteria
1. **Given** an authenticated user with `org.manage` (Super Admin or HR Manager),  
   **When** they submit `POST /api/v1/departments` with valid `{ name: "Software Engineering", code: "ENG", description: "Core product dev", parentId: null }`,  
   **Then** the system creates the department record, returns HTTP 201 with standard envelope, and logs the action in `auditLogs`.
2. **Given** an authenticated user with `org.manage`,  
   **When** they attempt to delete a department (`DELETE /api/v1/departments/:id`) that currently has active employees assigned (`Employee.countDocuments({ departmentId, isDeleted: false }) > 0`),  
   **Then** the request is rejected with HTTP 400 Bad Request with message `"Cannot delete department with active employees. Please reassign staff first."`
3. **Given** an authenticated Department Manager or Employee,  
   **When** they attempt to create, edit, or delete a department via `POST`, `PATCH`, or `DELETE /api/v1/departments`,  
   **Then** the request is rejected with HTTP 403 Forbidden.
4. **Given** an authenticated user with `org.view`,  
   **When** they send `GET /api/v1/departments`,  
   **Then** the system returns HTTP 200 with an array of active departments including headcount stats (`employeeCount`).

---

### User Story 2 (BUILD-GUIDE ID 4.2 · Priority P1): Department Head & Manager Assignment
**As an** HR Manager or Super Admin,  
**I want to** assign or change the Department Head (`headId`) for any department,  
**So that** managerial approval workflows, leave escalations, and organizational charts reflect the correct leadership.

#### Acceptance Criteria
1. **Given** an authenticated user with `org.manage`,  
   **When** they update a department via `PATCH /api/v1/departments/:id` with `{ headId: "65f..." }` referencing an active staff member,  
   **Then** the department updates with HTTP 200, populating head details (`name`, `email`, `designation`), and writes an audit log with before/after state.
2. **Given** an invalid or inactive user ID provided for `headId`,  
   **When** the update request is processed,  
   **Then** the system rejects with HTTP 400 Bad Request `"Selected department head is invalid or inactive"`.
3. **Given** an authenticated Department Manager or Employee,  
   **When** they view `DepartmentsPage.jsx` or department details,  
   **Then** the Department Head is clearly displayed with avatar, title, and contact badge, but edit controls remain inaccessible/hidden.

---

### User Story 3 (BUILD-GUIDE ID 4.3 · Priority P1): Designations & Grade Tiers Master
**As an** HR Manager,  
**I want to** define designations associated with departments and standardized grade tiers (Junior, Mid, Senior, Lead, Executive),  
**So that** employee titles and career progressions are consistent across departments.

#### Acceptance Criteria
1. **Given** an authenticated user with `org.manage`,  
   **When** they send `POST /api/v1/designations` with `{ title: "Senior Full Stack Engineer", code: "SR-FSE", grade: "Senior", departmentId: "..." }`,  
   **Then** the designation is created with HTTP 201, indexed uniquely by `code` within the department.
2. **Given** a designation with active employees assigned,  
   **When** `DELETE /api/v1/designations/:id` is requested,  
   **Then** the deletion is blocked with HTTP 400 `"Cannot delete designation currently assigned to active employees"`.
3. **Given** any authenticated user with `org.view`,  
   **When** they query `GET /api/v1/designations?departmentId=...`,  
   **Then** the system returns HTTP 200 with filtered designations and grade badges.
4. **Given** non-admin roles (Department Manager, Employee),  
   **When** they attempt mutation on `/api/v1/designations`,  
   **Then** the server responds with HTTP 403 Forbidden.

---

### User Story 4 (BUILD-GUIDE ID 4.4 · Priority P1): Shifts Master & Cross-Midnight Night Shift Support
**As an** HR Manager,  
**I want to** configure fixed, flexible, and night shifts with custom start/end times, grace periods, and break durations,  
**So that** attendance calculations in Module M5 accurately identify late arrivals, half days, and overnight working hours.

#### Acceptance Criteria
1. **Given** an authenticated user with `org.manage`,  
   **When** they create a night shift with `{ name: "Night Shift", type: "night", startTime: "20:00", endTime: "05:00", graceMinutes: 15, breakMinutes: 60, workDays: ["monday","tuesday","wednesday","thursday","friday"] }`,  
   **Then** the system sets `isCrossMidnight: true`, validates overnight duration (9 hours gross, 8 hours net), and responds with HTTP 201.
2. **Given** an invalid shift where `startTime` or `endTime` violates `HH:mm` 24-hour format, or `breakMinutes` exceeds shift duration,  
   **When** submitted to `POST /api/v1/shifts`,  
   **Then** the request is rejected with HTTP 400 validation error.
3. **Given** an authenticated user with `org.view`,  
   **When** they query `GET /api/v1/shifts`,  
   **Then** all active shifts are returned with timing capsules, type badges (`Fixed`, `Flexible`, `Night`), and active employee allocation counts.
4. **Given** an Employee or Department Manager,  
   **When** they attempt `POST`, `PATCH`, or `DELETE /api/v1/shifts`,  
   **Then** the server returns HTTP 403 Forbidden.

---

### User Story 5 (BUILD-GUIDE ID 4.5 · Priority P1): Interactive Visual Organizational Chart
**As any** authenticated staff member (Super Admin, HR, Manager, Employee),  
**I want to** explore an interactive visual org chart displaying the company tree from the CEO down through departments and reporting lines,  
**So that** team hierarchy, direct reports, and leadership chains are transparent.

#### Acceptance Criteria
1. **Given** any authenticated user,  
   **When** they navigate to `/org-chart` and send `GET /api/v1/org-chart`,  
   **Then** the server constructs a hierarchical tree rooted at executive leadership, populating node attributes: `id`, `name`, `email`, `designation`, `department`, `avatarUrl`, `directReportsCount`, and nested `children[]`.
2. **Given** `OrgChartPage.jsx`,  
   **When** rendered in the browser,  
   **Then** users can expand/collapse department and manager branches, zoom in/out with pan controls, and search for specific employees to automatically expand and center their node.
3. **Given** circular reporting relationships (e.g. employee reporting to subordinate),  
   **When** the server builds the tree,  
   **Then** cycle detection prevents infinite recursion and returns clean DAG hierarchy.

---

### User Story 6 (BUILD-GUIDE ID 4.6 · Priority P1): Manager Team View ("My Team")
**As a** Department Manager or Team Lead,  
**I want to** view a dedicated "My Team" page listing all direct and indirect subordinates,  
**So that** I can monitor my team's designations, shift assignments, and current statuses in one consolidated screen.

#### Acceptance Criteria
1. **Given** an authenticated Department Manager,  
   **When** they navigate to `/teams/my` and query `GET /api/v1/teams/my`,  
   **Then** the system resolves the manager's team members (`managerId = req.userId` or department head scope), returning HTTP 200 with member cards displaying role, designation, assigned shift, email, and contact number.
2. **Given** an authenticated Employee who has no subordinates,  
   **When** they query `GET /api/v1/teams/my`,  
   **Then** the system returns an empty list `{ directReports: [], totalCount: 0 }` with a friendly empty state `"You do not manage any direct reports"`.
3. **Given** a Department Manager viewing their team,  
   **When** inspecting member records,  
   **Then** sensitive financial and national identity data (salary, bank account, CNIC) are strictly omitted via CASL data-scoping and field-filtering.

---

### User Story 7 (BUILD-GUIDE ID 4.7 · Priority P2): Employee Self-Service Reporting Line Highlight
**As a** standard Employee,  
**I want to** see my exact reporting line on the Org Chart with a distinct "Me" indicator,  
**So that** I clearly understand who I report to and who heads my department.

#### Acceptance Criteria
1. **Given** an authenticated Employee viewing `/org-chart`,  
   **When** the org chart loads,  
   **Then** the employee's personal node is visibly highlighted with an emerald glow badge `"You / Me"`.
2. **Given** an Employee on the org chart screen,  
   **When** they click `"Find My Position"`,  
   **Then** the chart automatically pans and zooms directly to their node and highlights the vertical chain connecting them to their manager and department head.
3. **Given** an Employee inspecting their reporting chain,  
   **When** viewing manager cards in their branch,  
   **Then** only public professional details (name, title, department, work email) are displayed, preventing data leakage.

---

## 4. Multi-Role Permission & Security Matrix

| Endpoint / Operation | Super Admin | HR Manager | Department Manager | Employee |
| :--- | :---: | :---: | :---: | :---: |
| `POST /api/v1/departments` | ✅ 201 | ✅ 201 | ❌ 403 | ❌ 403 |
| `PATCH /api/v1/departments/:id` | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 403 |
| `DELETE /api/v1/departments/:id` (Protected) | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 403 |
| `GET /api/v1/departments` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `POST /api/v1/designations` | ✅ 201 | ✅ 201 | ❌ 403 | ❌ 403 |
| `PATCH /api/v1/designations/:id` | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 403 |
| `DELETE /api/v1/designations/:id` (Protected) | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 403 |
| `GET /api/v1/designations` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `POST /api/v1/shifts` | ✅ 201 | ✅ 201 | ❌ 403 | ❌ 403 |
| `PATCH /api/v1/shifts/:id` | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 403 |
| `DELETE /api/v1/shifts/:id` | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 403 |
| `GET /api/v1/shifts` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /api/v1/org-chart` | ✅ 200 (All) | ✅ 200 (All) | ✅ 200 (All) | ✅ 200 (All + "Me") |
| `GET /api/v1/teams/my` | ✅ 200 (All) | ✅ 200 (All) | ✅ 200 (Own Team) | ✅ 200 (Own Reports) |

---

## 5. BUILD-GUIDE Coverage Traceability Matrix

| BUILD-GUIDE ID | Feature Description | Assigned User Story | Scope Priority |
| :---: | :--- | :---: | :---: |
| **4.1** | Departments CRUD & active employee deletion protection | **User Story 1** | **P1 (Launch)** |
| **4.2** | Department head / manager assignment (`headId`) | **User Story 2** | **P1 (Launch)** |
| **4.3** | Designations + Grade Tiers (Junior, Mid, Senior, Lead, Exec) | **User Story 3** | **P1 (Launch)** |
| **4.4** | Shifts Master (Fixed, Flexible, Cross-Midnight Night Shift) | **User Story 4** | **P1 (Launch)** |
| **4.5** | Interactive Org Chart (Recursive tree, pan, zoom, expand) | **User Story 5** | **P1 (Launch)** |
| **4.6** | Manager "My Team" View (`GET /teams/my`) | **User Story 6** | **P1 (Launch)** |
| **4.7** | Employee Reporting Line View & "Me" Highlight | **User Story 7** | **P2 (Enhanced)** |

---

## 6. Implementation Readiness & Recommendations

1. **Next Step**: Run `/speckit-plan` to generate `.specify/specs/05-departments-orgchart/plan.md` defining schema blueprints, API route mappings, and component architectures.
2. **Follow-up Step**: Run `/speckit-tasks` to generate sequential vertical-slice micro-tasks for implementation.
