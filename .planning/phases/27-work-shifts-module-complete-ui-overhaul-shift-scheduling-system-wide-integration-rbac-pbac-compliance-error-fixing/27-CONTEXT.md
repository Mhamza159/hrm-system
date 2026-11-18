# Phase 27: Work Shifts Module — Complete UI Overhaul, Shift Scheduling, System-Wide Integration, RBAC/PBAC Compliance & Error Fixing

## 1. Executive Summary & Audit Findings

The **Work Shifts Module** (Module M4 / Slice 4.4 & Module M5 / Slice 5.2) governs work schedules, rotational shift rosters, cross-midnight overnight schedules, break rules, grace period tolerances, and employee roster assignments. It is directly integrated with Attendance Punch Evaluation (late arrival and half-day triggers), Employee Master records (`employee.shiftId`), Department Associations, Payroll Lock & Overtime Calculations, and the Organizational Chart reporting structures.

### Comprehensive Audit Analysis:

1. **Schema & Archival Lifecycle Gaps (`shift.model.js`)**:
   - **Current State**: Model contains `name`, `code`, `type` (`fixed`, `flexible`, `night`), `startTime`, `endTime`, `graceMinutes`, `breakMinutes`, `halfDayMinutes`, `workDays`, `isCrossMidnight`, `durationMinutes`, `isActive`, `isDeleted`, and `createdBy`.
   - **Gaps**:
     - Missing explicit archival tracking: `isArchived: { type: Boolean, default: false }`, `archivedAt`, and `archivedBy`.
     - Missing optional departmental scoping: `departmentId` (or associated department) to allow department-specific shift scheduling.
     - Missing roster capacity bounds: `capacity: { type: Number, default: 0 }` (0 = unlimited, otherwise maximum concurrent employees).
     - Missing styling & metadata: `description: { type: String }` and `color: { type: String, default: '#00C471' }` for visual calendar/roster tagging.
     - Lacks compound indexes for active/archived queries: `{ isArchived: 1, isDeleted: 1 }`, `{ type: 1, isArchived: 1 }`, `{ departmentId: 1, isArchived: 1 }`.
     - Legacy records lack `isArchived` property; queries must default to `{ isArchived: { $ne: true } }` with automatic schema defaults.

2. **Backend Services & Lifecycle Gaps (`department.service.js` & `shift.routes.js`)**:
   - **Current State**: Only provides baseline CRUD (`getAllShifts`, `getShiftById`, `createShift`, `updateShift`, `deleteShift`).
   - **Gaps**:
     - Missing archival endpoint (`PATCH /api/v1/shifts/:id/archive`).
     - Missing restore endpoint (`PATCH /api/v1/shifts/:id/restore`) with code uniqueness verification.
     - Missing permanent delete endpoint (`DELETE /api/v1/shifts/:id/permanent`).
     - **CRITICAL RESTRICTION GUARD**: A work shift must **NEVER** be permanently deleted while $\ge 1$ employee is currently assigned to it (`headcount > 0`). If linked employees exist (`shiftId == id`), permanent deletion must be rejected with HTTP 400 and an authoritative error message.
     - Missing Employee Assignment/Reassignment endpoint (`POST /api/v1/shifts/:id/assign`) allowing bulk assignment of employees to a shift.
     - Missing single shift assigned staff roster endpoint (`GET /api/v1/shifts/:id/employees`) supporting search and pagination.
     - Missing KPI aggregation (`GET /api/v1/shifts/stats`) for live 7-metric counters.
     - Missing workforce analytics (`GET /api/v1/shifts/analytics`) for shift type distribution, employee allocations, and department coverage.
     - Missing employee assignment guard in `employee.service.js`: Onboarding (`createEmployee`) and updates (`updateEmployee`) must verify that an employee cannot be assigned to an archived or deleted shift.

3. **Attendance Module Integration & Preservation Invariant (`attendance.service.js`)**:
   - `attendance.service.js` evaluates late arrivals against `employee.shiftId.startTime` + `graceMinutes`.
   - On clock-in (`checkIn`), the active `shiftId` is stored directly on the `Attendance` record (`shiftId: shift?._id || null`).
   - **Historical Invariant**: Modifying or archiving a shift must **NEVER** alter or invalidate historical attendance punch records. Past records retain their recorded timestamps, late flags, and associated shift snapshots.

4. **Frontend UI/UX & Architecture Gaps (`ShiftsPage.jsx`)**:
   - **Current State**: Flat single-view table without an Archive tab, lacking visual analytics, dual view mode (Table vs Card Grid), employee assignment modal, and rich inspection.
   - **Gaps**:
     - Missing dual-tab switcher: **Active Shifts** vs **Archived Shifts** with live count badges.
     - Missing 7-KPI summary cards: Total Shifts, Active Shifts, Archived Shifts, Assigned Staff, Staffed Shifts, Empty Shifts, Night Shifts.
     - Missing visual analytics section (`ShiftAnalyticsSection.jsx`) with horizontal distribution bar chart (employees per shift) and native SVG Donut chart (shift type share: fixed vs flexible vs night, plus department coverage).
     - Missing Card Grid View (`ShiftCardView.jsx`) with timing clocks, overnight moon badges, capacity progress, and quick action menus.
     - Missing multi-dimensional filter bar (`ShiftFilterBar.jsx`) with search, shift type (`fixed`, `flexible`, `night`), status (`active`, `archived`), department selector, and active filter chips.
     - Missing detailed inspection modal (`ShiftDetailModal.jsx`) displaying full metadata, timing calculations, break configuration, work days badges, and the assigned staff roster with live search.
     - Missing employee assignment modal (`ShiftAssignModal.jsx`) using searchable `EmployeeSelectDropdown.jsx` to assign/reassign employees directly.
     - Redesigned Create & Edit modal (`ShiftModal.jsx`) with interactive start/end time pickers, overnight shift detection indicator, duration preview, break deduction, and work days checkboxes.
     - Missing Archive modal (`ShiftArchiveModal.jsx`), Restore modal (`ShiftRestoreModal.jsx`), and Permanent Delete modal (`ShiftPermanentDeleteModal.jsx`) with strict employee lock.

---

## 2. Critical Business Rules & Invariants

1. **Employee Assignment Restriction Guard (Non-Negotiable)**:
   - A shift must **NEVER** be permanently deleted while $\ge 1$ employee is assigned to it.
   - Backend enforcement in `department.service.js`:
     ```javascript
     const assignedCount = await Employee.countDocuments({ shiftId: id, isDeleted: false });
     if (assignedCount > 0) {
       throw new ApiError(
         400,
         `This shift cannot be permanently deleted because ${assignedCount} employee(s) are currently assigned to it. Please reassign all employees to another shift before proceeding.`
       );
     }
     ```
   - Zero cascading deletion of employee records; employee histories, attendance records, and profiles must remain completely intact.

2. **Archived Shift Assignment Guard**:
   - Employees already assigned to a shift when it is archived maintain their historical link until reassigned.
   - However, no new employee onboarding (`createEmployee`), profile update (`updateEmployee`), or shift assignment (`assignEmployeesToShift`) may assign an employee to an archived shift (`isArchived: true`).

3. **Overnight / Cross-Midnight Timing Calculations**:
   - If `endTime <= startTime` or `type === 'night'`, the shift crosses midnight (`isCrossMidnight = true`).
   - Duration calculation adds 24 hours ($1440$ minutes):
     $$\text{totalMinutes} = (\text{endH} \times 60 + \text{endM}) - (\text{startH} \times 60 + \text{startM}) + 1440$$
     $$\text{durationMinutes} = \text{totalMinutes} - \text{breakMinutes}$$
   - Break minutes cannot exceed or equal total shift duration (`breakMinutes < totalMinutes`).
   - Minimum shift duration after break must be at least 60 minutes.

4. **Attendance Historical Preservation**:
   - Attendance punch records (`Attendance` collection) store `shiftId` at time of check-in.
   - Modifying shift timings, grace minutes, or archiving a shift only affects future punch evaluations; historical records remain immutable.

5. **Shift Code Uniqueness**:
   - Shift code (`code`) is uppercase, alphanumeric, trimmed, and strictly unique across non-deleted shifts in the database.

---

## 3. RBAC & PBAC Permissions Matrix

Complies strictly with `backend/src/shared/permissions.js` under `module: 'organization'`:

| Action | Required Permission | Description | Allowed Roles |
| :--- | :--- | :--- | :--- |
| `org.view` | `checkPermission('org.view')` | View shift directory, details, KPI stats, analytics, assigned staff roster, and archive | Super Admin, HR Manager, Department Manager, Employee |
| `org.manage` | `checkPermission('org.manage')` | Create, edit, assign employees, archive, restore shifts | Super Admin, HR Manager |
| `org.manage` (Permanent Delete) | `checkPermission('org.manage')` | Permanently purge empty archived shift from database | Super Admin only |

---

## 4. API Endpoints Specification

| Method | Endpoint | Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/shifts` | `org.view` | Paginated query of active shifts with employee headcount, filters, and search |
| `GET` | `/api/v1/shifts/archived` | `org.view` | Paginated query of archived shifts with archive metadata and actor |
| `GET` | `/api/v1/shifts/stats` | `org.view` | 7-metric KPI aggregation (Total, Active, Archived, Staff, Staffed, Empty, Night) |
| `GET` | `/api/v1/shifts/analytics` | `org.view` | Shift type distribution, employee headcount per shift, and department coverage |
| `GET` | `/api/v1/shifts/:id` | `org.view` | Enriched single shift details with timing breakdown and headcount |
| `GET` | `/api/v1/shifts/:id/employees` | `org.view` | Paginated list of employees assigned to this shift with search filter |
| `POST` | `/api/v1/shifts` | `org.manage` | Create new shift with cross-midnight calculation and validation |
| `PATCH` | `/api/v1/shifts/:id` | `org.manage` | Update shift timings, break, work days, department, or active status |
| `POST` | `/api/v1/shifts/:id/assign` | `org.manage` | Bulk assign/reassign employees to this shift |
| `PATCH` | `/api/v1/shifts/:id/archive` | `org.manage` | Soft-archive shift (`isArchived: true, archivedAt, archivedBy`) |
| `PATCH` | `/api/v1/shifts/:id/restore` | `org.manage` | Restore archived shift back to active listing |
| `DELETE` | `/api/v1/shifts/:id/permanent` | `org.manage` | Permanently delete shift (strictly blocked if $\ge 1$ employee assigned) |
| `DELETE` | `/api/v1/shifts/:id` | `org.manage` | Soft-delete shift (guarded against assigned active employees) |

---

## 5. Frontend Architecture & Design Standard

1. **Design Theme & Color Palette**:
   - Strictly conforms to `Docs/design.md` and `Docs/UI-reference.md` using the **Forest & Emerald Enterprise** theme:
     - Background / Canvas: `#061A14` / `#0A1F18`
     - Card / Surface: `#111D17` / `#162720`
     - Borders / Hairlines: `#1A3125` / `#234233`
     - Brand Accent: `#00C471` (Emerald)
     - Night / Overnight Accent: `#818CF8` (Indigo) / `#38BDF8` (Sky)
     - Warning / Amber: `#F59E0B`
     - Error / Rose: `#F43F5E`
     - Muted Text: `#94A3B8` / `#6EE7B7`

2. **Component Directory Structure**:
   - `frontend/src/features/departments/pages/ShiftsPage.jsx` (Central Orchestrator)
   - `frontend/src/features/departments/components/`
     - `ShiftStatsCards.jsx` (7-metric live KPI summary cards)
     - `ShiftAnalyticsSection.jsx` (Visual distribution bar chart & SVG Donut chart)
     - `ShiftFilterBar.jsx` (Search, type filter, status filter, department selector, view toggle)
     - `ShiftCardView.jsx` (Grid cards with clock, moon indicator, work days pills, and action menu)
     - `ShiftModal.jsx` (Create & Edit modal with live timing duration calculation)
     - `ShiftDetailModal.jsx` (Deep inspection modal with assigned staff roster sub-table)
     - `ShiftAssignModal.jsx` (Employee assignment modal with searchable dropdown)
     - `ShiftArchiveModal.jsx` (Soft archive confirmation modal)
     - `ShiftRestoreModal.jsx` (Restore confirmation modal)
     - `ShiftPermanentDeleteModal.jsx` (Strictly guarded permanent delete modal)
     - `ArchivedShiftList.jsx` (Dedicated archived shifts view)
