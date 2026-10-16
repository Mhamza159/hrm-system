# Module M4: Departments, Designations, Shifts & Org Chart Architecture

## 1. Overview & Verification Status
- **Governing Guide**: `docs/BUILD-GUIDE.md` Section 7 (Rows 4.1 to 4.7) — **All 7 rows marked ☑**.
- **Roadmap Position**: Phase 1, Step 5 (`5. M4 Departments, Designations, Shifts & Org Chart` in `.planning/ROADMAP.md`).
- **Test Verification**:
  - 43 automated backend Vitest integration tests passed (`departments.api.test.js`, `shifts.api.test.js`, `orgchart.api.test.js`, `teams.api.test.js`, `m4.orgchart.e2e.test.js`).
  - 16 dedicated security & stress-testing tests passed (`m4.security.stress.test.js`).
  - Real browser verification via Playwright MCP & DevTools:
    - Super Admin, HR Manager, Department Manager, and Employee journeys tested.
    - Active employee deletion guard verified (`Cannot delete department 'Engineering'... HTTP 400`).
    - Mobile viewport (390px) responsive layout verified.
    - Zero console errors / warnings.

## 2. Data Models
1. **`Department`** (`backend/src/models/department.model.js`):
   - Fields: `name`, `code` (unique, uppercase), `headId` (ref User), `parentId` (ref Department, self-referential hierarchy), `description`, `isActive`, `isDeleted`.
   - Invariant: Cannot be deleted if populated with active staff or child sub-departments (`HTTP 400`). Self-parenting and circular reporting chains blocked by `detectCircularParent()`.
2. **`Designation`** (`backend/src/models/designation.model.js`):
   - Fields: `title`, `code` (unique per department, uppercase), `departmentId` (ref Department), `grade` ('Junior' | 'Mid' | 'Senior' | 'Lead' | 'Executive'), `description`, `isActive`, `isDeleted`.
   - Invariant: Cannot be deleted if assigned to active employees (`HTTP 400`).
3. **`Shift`** (`backend/src/models/shift.model.js`):
   - Fields: `name`, `code` (unique), `type` ('fixed' | 'flexible' | 'night'), `startTime` (HH:mm), `endTime` (HH:mm), `isCrossMidnight` (Boolean), `graceMinutes`, `breakMinutes`, `halfDayMinutes`, `workDays` (Array), `durationMinutes`, `isActive`, `isDeleted`.
   - Invariant: Cannot be deleted if assigned to active employees (`HTTP 400`). Validates that break minutes do not exceed total shift duration. Cross-midnight night shifts compute duration with modular arithmetic across midnight.

## 3. Endpoints & API Surface
- `CRUD /api/v1/departments`: Department management (`org.manage`).
- `PATCH /api/v1/departments/:id/head`: Assign department head user (`org.manage`).
- `GET /api/v1/departments/heads/candidates`: Eligible active users for head role (`org.view`).
- `CRUD /api/v1/designations`: Designation management with grade tiers (`org.manage`).
- `CRUD /api/v1/shifts`: Shift configurations, night shifts, and grace periods (`org.manage`).
- `GET /api/v1/org-chart`: Hierarchical organization chart tree (`org.view`). Highlights personal node (`isMe: true`, `<YOU>` badge) and vertical `reportingChain` (`<Chain>` badge). Guarded against recursive DAG cycles.
- `GET /api/v1/teams/my`: Direct subordinate list and active shift distribution for Department Managers (`org.view`). Sensitive fields (`salary`, `bankDetails`, `cnic`) stripped from payloads.

## 4. Key Architectural Decisions & Security Hardening
- **NoSQL / ReDoS Hardening**: Implemented `escapeRegex()` utility in `department.service.js` to sanitize text search terms against metacharacters and Catastrophic Backtracking before `$regex` queries.
- **Relational Integrity Invariants**: Populated departments, designations, and shifts cannot be deleted until staff are reassigned.
- **Hierarchical Cycle Defense**: The department updater uses `detectCircularParent()` to traverse ancestors and reject circular structures (`HTTP 400`).
- **Overnight Shifts**: Automatic `isCrossMidnight: true` detection and modular duration calculation for schedules spanning midnight (e.g. 20:00 to 05:00 next day).
- **Frontend Quality**: Fixed `DataTable.jsx` column aliasing and unique keys (`${fieldKey}-${cIdx}`); updated `DepartmentModal.jsx` to stringify ObjectIds in parent dropdown filtering.
