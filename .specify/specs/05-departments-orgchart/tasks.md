# Tasks Breakdown: M4 Departments, Designations, Shifts & Org Chart

**Feature Identifier**: `05-departments-orgchart`  
**Feature Branch**: `feature/05-departments-orgchart`  
**Target Module**: Module M4 (Core HR Group · Priority P1 Launch Scope)  
**Spec Document**: [`.specify/specs/05-departments-orgchart/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/05-departments-orgchart/spec.md)  
**Plan Document**: [`.specify/specs/05-departments-orgchart/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/05-departments-orgchart/plan.md)  
**Governing Guide**: [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 7 (Rows 4.1–4.7)  
**Architecture Rules**: Plain JavaScript only (`.js` / `.jsx`), Vertical Slice order (BE $\rightarrow$ FE $\rightarrow$ Row Test), P1 first then P2.

---

## Phase 1: Core Organization Master (Priority P1)

### Slice 4.1: Departments Master & Active Employee Deletion Guard (BUILD-GUIDE ID 4.1)
- [x] **4.1-BE**: Register `organization` permissions (`org.view`, `org.manage`) in `backend/src/shared/permissions.js` and `backend/src/seed/roles.seed.js`. Create `backend/src/models/department.model.js` with schema `{ name: String, code: String (unique), description: String, parentId: ObjectId (ref: Department), headId: ObjectId (ref: User), isActive: Boolean, isDeleted: Boolean }`. In `backend/src/modules/departments/`, create `department.validation.js` with department schemas, `department.service.js` with CRUD methods and an active employee deletion guard (`Employee.countDocuments({ departmentId, isDeleted: false }) > 0`), `department.controller.js`, and `department.routes.js` implementing `GET /api/v1/departments`, `POST /api/v1/departments`, `PATCH /api/v1/departments/:id`, and `DELETE /api/v1/departments/:id` guarded by `authenticate` and `checkPermission('org.manage' | 'org.view')`. Mount routes in `backend/src/app.js`.
- [x] **4.1-FE**: Create `frontend/src/features/departments/departmentsApi.js` with RTK Query endpoints (`getDepartments`, `createDepartment`, `updateDepartment`, `deleteDepartment`). Create `frontend/src/features/departments/components/DepartmentModal.jsx` for creating/editing departments with parent department selector. Create `frontend/src/features/departments/pages/DepartmentsPage.jsx` featuring a data table of departments, code pills, parent badges, headcount counts, and add/edit/delete actions protected by `<Can I="org.manage" a="Organization">`. Register `/departments` route in `frontend/src/App.jsx` and add navigation link in `frontend/src/components/layout/Sidebar.jsx`.
- [x] **4.1-TEST**: Vitest integration test in `backend/tests/departments.api.test.js`: verify Super Admin and HR Manager can create, list, and update departments (HTTP 200/201); verify Department Manager and Employee receive HTTP 403 Forbidden on mutations; verify deleting a department populated with active employees is blocked with HTTP 400 Bad Request; verify deleting an empty department succeeds (soft delete).

---

### Slice 4.2: Department Head & Manager Assignment (BUILD-GUIDE ID 4.2)
- [x] **4.2-BE**: In `department.validation.js`, add `assignHeadSchema` validating `headId` as a valid ObjectId string. In `department.service.js`, implement `assignDepartmentHead(departmentId, headId, actor)`: verify target user exists, is active, update `headId`, and record before/after state in `auditLogs`. Update `GET /api/v1/departments` to populate `headId` with `{ _id, email, name, avatarUrl }`.
- [x] **4.2-FE**: In `DepartmentModal.jsx`, add an interactive searchable dropdown / select component to designate the Department Head from active company staff. In `DepartmentsPage.jsx`, display the assigned Department Head with avatar, name, and designation capsule.
- [x] **4.2-TEST**: Test department head assignment: verify HR Manager updates `headId` to an active staff member (HTTP 200); verify invalid or non-existent `headId` returns HTTP 400; verify Department Manager cannot reassign department head (HTTP 403); verify audit log is captured.

---

### Slice 4.3: Designations & Grade Tiers Master (BUILD-GUIDE ID 4.3)
- [x] **4.3-BE**: Create `backend/src/models/designation.model.js` with schema `{ title: String, code: String, grade: String (enum: ['Junior', 'Mid', 'Senior', 'Lead', 'Executive']), departmentId: ObjectId (ref: Department), description: String, isActive: Boolean, isDeleted: Boolean }`. In `department.validation.js`, define `designationValidationSchema`. In `department.service.js`, implement CRUD methods for designations with active employee deletion guard. In `department.controller.js` and `department.routes.js`, implement `GET /api/v1/designations`, `POST /api/v1/designations`, `PATCH /api/v1/designations/:id`, and `DELETE /api/v1/designations/:id`.
- [x] **4.3-FE**: Add RTK Query endpoints (`getDesignations`, `createDesignation`, `updateDesignation`, `deleteDesignation`) in `departmentsApi.js`. Create `frontend/src/features/departments/components/DesignationModal.jsx` with title, code, department selector, and grade dropdown. Create `frontend/src/features/departments/pages/DesignationsPage.jsx` with department filter tabs, grade tier badges, and manage controls. Register `/designations` in `App.jsx` and `Sidebar.jsx`.
- [x] **4.3-TEST**: Test designations management: verify HR Manager creates designations across all 5 grade tiers (Junior through Executive) (HTTP 201); verify duplicate code within the same department returns HTTP 409 or 400; verify deleting designation with active staff is blocked with HTTP 400; verify Employee receives HTTP 403 on mutations.

---

### Slice 4.4: Shifts Master & Cross-Midnight Night Shift Support (BUILD-GUIDE ID 4.4)
- [x] **4.4-BE**: Create `backend/src/models/shift.model.js` with schema `{ name: String, code: String, type: String (enum: ['fixed', 'flexible', 'night']), startTime: String, endTime: String, graceMinutes: Number, breakMinutes: Number, halfDayMinutes: Number, workDays: [String], isCrossMidnight: Boolean, isActive: Boolean, isDeleted: Boolean }`. In `department.validation.js`, define `shiftValidationSchema` with custom Zod refinement detecting cross-midnight schedules (where `endTime < startTime` or `type === 'night'`). In `department.service.js`, implement shift CRUD with overnight duration calculations. Mount `GET /api/v1/shifts`, `POST /api/v1/shifts`, `PATCH /api/v1/shifts/:id`, `DELETE /api/v1/shifts/:id` in `department.routes.js`.
- [x] **4.4-FE**: Add RTK Query endpoints (`getShifts`, `createShift`, `updateShift`, `deleteShift`) in `departmentsApi.js`. Create `frontend/src/features/departments/components/ShiftModal.jsx` with shift type selector, 24-hour time pickers (`startTime`, `endTime`), grace period inputs, and interactive weekly work-day pills. Create `frontend/src/features/departments/pages/ShiftsPage.jsx` displaying shift roster cards with timing chips, moon icons for cross-midnight night shifts, and duration calculations. Register `/shifts` in `App.jsx` and `Sidebar.jsx`.
- [x] **4.4-TEST**: Test shift management: verify HR Manager creates a standard fixed shift (09:00–18:00) and an overnight night shift (20:00–05:00 next day) with `isCrossMidnight: true` (HTTP 201); verify invalid time format or break minutes exceeding duration returns HTTP 400; verify non-admin roles receive HTTP 403.

---

## Phase 2: Visual Hierarchy & Team Views (Priority P1 / P2)

### Slice 4.5: Interactive Visual Organizational Chart (BUILD-GUIDE ID 4.5)
- [x] **4.5-BE**: In `department.service.js`, implement `getOrgChart(requestingUserId)`: query active employees, departments, and designations. Construct a recursive Directed Acyclic Graph (DAG) tree starting from root executives (`managerId: null`), maintaining a visited Set to prevent circular reference infinite loops. Tag each node with `id`, `name`, `designation`, `department`, `avatarUrl`, `directReportsCount`, `children[]`, and mark `isMe: true` if `node.userId === requestingUserId`. In `department.routes.js`, implement `GET /api/v1/org-chart` guarded by `authenticate` and `checkPermission('org.view')`.
- [x] **4.5-FE**: Add `getOrgChart` in `departmentsApi.js`. Create `frontend/src/features/departments/components/OrgChartNode.jsx` representing a visual hierarchical card with avatar, role, expandable/collapsible direct reports count toggle, and connecting SVG lines. Create `frontend/src/features/departments/pages/OrgChartPage.jsx` featuring zoom in/out, pan controls, fullscreen toggle, search input to auto-center nodes, and department filter pills. Register `/org-chart` in `App.jsx` and `Sidebar.jsx`.
- [x] **4.5-TEST**: Test org chart generation: verify `GET /api/v1/org-chart` returns a valid hierarchical tree for all 4 roles (HTTP 200); verify circular reporting chains do not cause server stack overflow; verify response returns sanitized employee public cards without leaking sensitive salary, CNIC, or bank information.

---

### Slice 4.6: Manager "My Team" View (BUILD-GUIDE ID 4.6)
- [x] **4.6-BE**: In `department.service.js`, implement `getMyTeam(managerUserId)`: query direct reports where `managerId = managerUserId` (or department head matching `managerUserId`). Return list of team members with title, department, assigned shift timings, email, phone, and joining date. In `department.routes.js`, implement `GET /api/v1/teams/my` guarded by `authenticate` and `checkPermission('org.view')`.
- [x] **4.6-FE**: Add `getMyTeam` in `departmentsApi.js`. Create `frontend/src/features/departments/components/TeamMemberCard.jsx` displaying subordinate avatar, designation, current shift timing pill, and contact buttons. Create `frontend/src/features/departments/pages/MyTeamPage.jsx` showing team headcount metrics, shift distribution, and member cards. Register `/teams/my` in `App.jsx` and `Sidebar.jsx` (visible to Department Managers and Admins).
- [x] **4.6-TEST**: Test manager team view: verify Department Manager queries `GET /api/v1/teams/my` and receives only their direct subordinates (HTTP 200); verify an employee with zero direct reports receives `{ directReports: [], totalCount: 0 }`; verify sensitive financial fields are omitted.

---

### Slice 4.7: Employee Self-Service Reporting Line Highlight (BUILD-GUIDE ID 4.7)
- [x] **4.7-BE**: In `getOrgChart` service, compute the vertical ancestral reporting chain for the requesting user (`user -> manager -> department head -> CEO`) and return an array of ancestor IDs in `reportingChain: [String]`.
- [x] **4.7-FE**: In `OrgChartPage.jsx`, add a prominent "Find My Position" action button. When clicked, the viewport smoothly pans and zooms directly to the current user's card (highlighted with an emerald glowing border and "You" badge) and visually accents the vertical connectors leading up to their manager and department head.
- [x] **4.7-TEST**: Test employee reporting line: verify an authenticated employee queries `GET /api/v1/org-chart` and their node has `isMe: true` and `reportingChain` populated (HTTP 200); verify unauthenticated requests are rejected with HTTP 401.

---

## Phase 3: Multi-Role End-to-End Verification (`E2E-M4`)

### Slice E2E-M4: Multi-Role Live End-to-End Playwright Verification (All 4 Default Roles)
- [x] **E2E-M4**: Create automated test `backend/tests/m4.orgchart.e2e.test.js` verifying complete end-to-end user journeys:
  1. **Super Admin Flow**: Log in $\rightarrow$ navigate to `/departments` $\rightarrow$ create department "Core Engineering" $\rightarrow$ assign Department Head $\rightarrow$ create designation "Senior QA Lead" (Lead grade) $\rightarrow$ create Night Shift (20:00–05:00) $\rightarrow$ inspect `/org-chart` $\rightarrow$ verify full company tree renders.
  2. **HR Manager Flow**: Log in $\rightarrow$ create department and designations $\rightarrow$ verify attempt to delete a department with active staff is rejected with 400 $\rightarrow$ update shift grace periods $\rightarrow$ verify audit log is written.
  3. **Department Manager Flow**: Log in $\rightarrow$ verify `/departments` edit controls are hidden/disabled and direct API mutation returns 403 $\rightarrow$ navigate to `/teams/my` and verify direct subordinates are listed $\rightarrow$ navigate to `/org-chart` and verify team structure renders without financial leaks.
  4. **Employee Flow**: Log in $\rightarrow$ verify `/departments` and `/shifts` links are hidden $\rightarrow$ navigate to `/org-chart` $\rightarrow$ verify personal node is highlighted with "You" badge $\rightarrow$ click "Find My Position" and verify reporting line is highlighted.
