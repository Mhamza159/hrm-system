# Module M4: Departments, Designations, Shifts & Org Chart Architecture

## 1. Overview & Verification Status
- **Governing Guide**: `docs/BUILD-GUIDE.md` Section 7 (Rows 4.1 to 4.7) — **All 7 rows marked ☑**.
- **Roadmap Position**: 
  - Phase 1, Step 5 (`5. M4 Departments, Designations, Shifts & Org Chart`)
  - Phase 25: Department Module Complete Overhaul & Archival Lifecycle
  - Phase 26: Designation Module Complete Overhaul & Hierarchy Taxonomy
  - Phase 27: Work Shifts Module Complete Overhaul, Shift Scheduling & Cross-Midnight Engine
- **Test Verification**:
  - Over 70+ automated backend Vitest integration tests passing across M4 (`departments.api.test.js`, `shifts.api.test.js`, `orgchart.api.test.js`, `teams.api.test.js`, `m4.orgchart.e2e.test.js`, `departments.archive-lifecycle.e2e.test.js`, `designations.overhaul.e2e.test.js`, `shifts.overhaul.e2e.test.js`).
  - Zero console errors / warnings, zero Oxlint errors, and clean Vite production builds.

## 2. Data Models
1. **`Department`** (`backend/src/models/department.model.js`):
   - Fields: `name`, `code` (unique, uppercase), `headId` (ref User), `parentId` (ref Department, self-referential hierarchy), `description`, `isArchived`, `archivedAt`, `archivedBy`, `isActive`, `isDeleted`.
   - Invariants: Cannot be permanently deleted if populated with active staff (`HTTP 400`). Self-parenting and circular reporting chains blocked by `detectCircularParent()`.
2. **`Designation`** (`backend/src/models/designation.model.js`):
   - Fields: `title`, `code` (unique per department, uppercase), `departmentId` (ref Department), `grade` ('Junior' | 'Mid' | 'Senior' | 'Lead' | 'Executive'), `description`, `isArchived`, `archivedAt`, `archivedBy`, `isActive`, `isDeleted`.
   - Invariants: Non-negotiable Employee Assignment Restriction Guard blocks permanent deletion if assigned to ≥1 employee (`HTTP 400`).
3. **`Shift`** (`backend/src/models/shift.model.js`):
   - Fields: `name`, `code` (uppercase), `type` ('fixed' | 'flexible' | 'night'), `startTime` (HH:mm), `endTime` (HH:mm), `isCrossMidnight` (Boolean), `graceMinutes`, `breakMinutes`, `halfDayMinutes`, `workDays` (Array), `durationMinutes`, `capacity`, `departmentId` (ref Department), `color`, `description`, `isArchived`, `archivedAt`, `archivedBy`, `isActive`, `isDeleted`.
   - Invariants: Non-negotiable Employee Assignment Restriction Guard blocks permanent deletion if ≥1 employee is assigned (`HTTP 400`). Real-time cross-midnight engine (`calculateShiftTiming`).

## 3. Endpoints & API Surface
- `CRUD /api/v1/departments`: Department directory, heads, parent hierarchy, stats (`GET /stats`), analytics (`GET /analytics`), archive (`PATCH /:id/archive`), restore (`PATCH /:id/restore`), permanent delete (`DELETE /:id/permanent`).
- `CRUD /api/v1/designations`: Designation directory, grades, stats (`GET /stats`), analytics (`GET /analytics`), staff roster (`GET /:id`), archive (`PATCH /:id/archive`), restore (`PATCH /:id/restore`), permanent delete (`DELETE /:id/permanent`).
- `CRUD /api/v1/shifts`: Shift directory, cross-midnight timings, stats (`GET /stats`), analytics (`GET /analytics`), staff roster (`GET /:id/employees`), roster assignment (`POST /:id/assign`), archive (`PATCH /:id/archive`), restore (`PATCH /:id/restore`), permanent delete (`DELETE /:id/permanent`).
- `GET /api/v1/org-chart`: Hierarchical organization chart tree (`org.view`). Highlights personal node (`isMe: true`, `<YOU>` badge) and vertical `reportingChain` (`<Chain>` badge). Guarded against recursive DAG cycles.
- `GET /api/v1/teams/my`: Direct subordinate list and active shift distribution for Department Managers (`org.view`). Sensitive fields (`salary`, `bankDetails`, `cnic`) stripped from payloads.

## 4. Key Architectural Decisions & Invariants
- **Non-Negotiable Employee Assignment Restriction Guard**: Enforced identically across Departments, Designations, and Work Shifts. Neither unit can be permanently purged while $\ge 1$ employee is assigned.
- **Attendance Preservation**: Modifying, archiving, or restoring shifts never mutates historical check-in/out records.
- **Forest & Emerald Enterprise Theme**: Uniform design system (`#061A14`, `#111D17`, `#1A3125`, `#00C471`) across all M4 pages (`DepartmentsPage.jsx`, `DesignationsPage.jsx`, `ShiftsPage.jsx`, `OrgChartPage.jsx`, `MyTeamPage.jsx`).
- **Interactive Analytics**: 7-KPI live stat cards with filter triggers and zero-dependency SVG Donut and flex-bar distribution charts.
- **Dual View Modes**: Seamless toggle between High-density Enterprise Table View and visual Card Grid View with shared pagination.
