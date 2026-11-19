# Module M4: Work Shifts & Scheduling (Phase 27 Overhaul)

## 1. Overview & Architectural Role
- **Module Identifier**: M4 (Departments, Designations, Shifts & Org Chart · Slice 4.4)
- **Phase**: Phase 27 (Work Shifts Module — Complete UI Overhaul, Shift Scheduling, System-Wide Integration, RBAC/PBAC Compliance & Error Fixing)
- **Theme**: Forest & Emerald Enterprise theme (`#061A14`, `#111D17`, `#1A3125`, `#00C471`)
- **Key Files**:
  - Model: `backend/src/models/shift.model.js`
  - Routes: `backend/src/modules/departments/shift.routes.js`
  - Controller: `backend/src/modules/departments/department.controller.js`
  - Service: `backend/src/modules/departments/department.service.js`
  - Validation: `backend/src/modules/departments/department.validation.js`
  - Integration: `backend/src/modules/employees/employee.service.js`, `backend/src/modules/attendance/attendance.service.js`
  - Master Page: `frontend/src/features/departments/pages/ShiftsPage.jsx`
  - Components: `ShiftStatsCards.jsx`, `ShiftAnalyticsSection.jsx`, `ShiftFilterBar.jsx`, `ShiftCardView.jsx`, `ShiftModal.jsx`, `ShiftDetailModal.jsx`, `ShiftAssignModal.jsx`, `ShiftArchiveModal.jsx`, `ShiftRestoreModal.jsx`, `ShiftPermanentDeleteModal.jsx`
  - RTK Query API: `frontend/src/features/departments/departmentsApi.js`

## 2. Data Model (Shift)
- `name`: String (required, max 100)
- `code`: String (required, uppercase, max 20)
- `type`: Enum `['fixed', 'flexible', 'night']` (default `'fixed'`)
- `startTime`: String (`HH:mm` 24h format)
- `endTime`: String (`HH:mm` 24h format)
- `graceMinutes`: Number (default 15, min 0, max 120)
- `breakMinutes`: Number (default 60, min 0, max 240)
- `halfDayMinutes`: Number (default 240, min 0, max 480)
- `workDays`: Array of Strings (default `['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']`)
- `isCrossMidnight`: Boolean (computed automatically: true when `endTime < startTime` or `type === 'night'`)
- `durationMinutes`: Number (net working minutes after break deduction)
- `capacity`: Number (0 = unlimited capacity)
- `departmentId`: ObjectId ref `Department` (nullable, represents department restriction or global)
- `color`: String (hex color code for UI cards and badges, default `#00C471`)
- `description`: String (max 500)
- `isArchived`: Boolean (default false)
- `archivedAt`: Date (nullable)
- `archivedBy`: ObjectId ref `User` (nullable)
- `isActive`: Boolean (default true)
- `isDeleted`: Boolean (default false)
- `createdBy`: ObjectId ref `User` (nullable)

## 3. API Contract & Permissions
All routes are mounted under `/api/v1/shifts` and require active JWT authentication (`authenticate` middleware).
- `GET /`: List active shifts with pagination and multi-filtering (Permission: `org.view`)
- `GET /archived`: List archived shifts in cold storage (Permission: `org.view`)
- `GET /stats`: 7 aggregated KPIs (`total`, `active`, `archived`, `totalAssignedEmployees`, `unassignedEmployees`, `withEmployees`, `withoutEmployees`, `nightShifts`, `departmentsCount`) (Permission: `org.view`)
- `GET /analytics`: Workforce allocation, shift type share, day/night ratio, and headcounts (Permission: `org.view`)
- `GET /:id/employees`: Searchable and paginated roster assigned to shift (Permission: `org.view`, validates `shiftIdParamSchema`)
- `GET /:id`: Detailed shift inspection profile with headcount (Permission: `org.view`, validates `shiftIdParamSchema`)
- `POST /`: Create shift with cross-midnight and break validations (Permission: `org.manage`, validates `createShiftSchema`)
- `POST /:id/assign`: Bulk employee assignment supporting actions `add`, `set`, `remove`, `clear` with capacity enforcement (Permission: `org.manage`, validates `assignShiftEmployeesSchema`)
- `PATCH /:id`: Update shift details and recalculate timing (Permission: `org.manage`, validates `updateShiftSchema`)
- `PATCH /:id/archive`: Soft-archive shift (Permission: `org.manage`, validates `shiftIdParamSchema`)
- `PATCH /:id/restore`: Restore archived shift with active code conflict guard and parent department archival verification (Permission: `org.manage`, validates `shiftIdParamSchema`)
- `DELETE /:id/permanent`: Permanently delete shift from DB (Permission: `org.manage`, validates `shiftIdParamSchema`) — **Strictly blocked with HTTP 400 if ≥1 employee is assigned**
- `DELETE /:id`: Soft delete shift (Permission: `org.manage`, validates `shiftIdParamSchema`) — Blocked if active employees are assigned

## 4. Key Architectural Decisions & Invariants
1. **Non-Negotiable Employee Guard**: A work shift cannot be permanently deleted while any employee is rostered to it. The system throws HTTP 400 Bad Request with instructions to reassign staff.
2. **Attendance Integrity Preservation**: Modifying, archiving, or restoring a shift only affects future schedule evaluations. Historical attendance records (`Attendance` collection) and punch evaluation logs remain immutable.
3. **Cross-Midnight Calculation Engine**: The helper `calculateShiftTiming` detects when `endTime < startTime` or `type === 'night'`, adjusts total duration by +1440 minutes (+24h), checks that break duration does not exceed total duration, and computes net duration in minutes.
4. **Archival Integrity**: Employee mutations (`createEmployee`, `updateEmployee`) are guarded to prevent assigning employees to archived shifts. When restoring an archived shift, if the linked department was archived or deleted, `shift.departmentId` is unlinked (`null`) gracefully to avoid invalid state.
5. **Interactive UI Architecture**:
   - 7 live KPI metric cards with click-to-filter triggers (Archived, Active, Night, Staffed, Empty, Total).
   - Horizontal flex-bars for staff allocation per shift and native SVG Donut chart for schedule types.
   - Dual View Switcher (High-density Enterprise Table View vs Shift Cards Grid View).
   - Multi-dimensional filter toolbar with query search, shift type, department, schedule window, staffing threshold, and status.
   - Shared pagination controls across both Table View and Card Grid View.
