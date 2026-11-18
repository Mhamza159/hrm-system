---
phase: 27-work-shifts-module-complete-ui-overhaul-shift-scheduling-system-wide-integration-rbac-pbac-compliance-error-fixing
reviewed: 2026-11-18T17:30:00Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - backend/src/models/shift.model.js
  - backend/src/modules/departments/department.service.js
  - backend/src/modules/departments/department.controller.js
  - backend/src/modules/departments/department.validation.js
  - backend/src/modules/departments/shift.routes.js
  - backend/src/modules/employees/employee.service.js
  - backend/tests/shifts.overhaul.e2e.test.js
  - frontend/src/features/departments/departmentsApi.js
  - frontend/src/features/departments/pages/ShiftsPage.jsx
  - frontend/src/features/departments/components/ShiftStatsCards.jsx
  - frontend/src/features/departments/components/ShiftAnalyticsSection.jsx
  - frontend/src/features/departments/components/ShiftCardView.jsx
  - frontend/src/features/departments/components/ShiftFilterBar.jsx
  - frontend/src/features/departments/components/ShiftModal.jsx
  - frontend/src/features/departments/components/ShiftDetailModal.jsx
  - frontend/src/features/departments/components/ShiftAssignModal.jsx
  - frontend/src/features/departments/components/ShiftArchiveModal.jsx
  - frontend/src/features/departments/components/ShiftRestoreModal.jsx
  - frontend/src/features/departments/components/ShiftPermanentDeleteModal.jsx
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 27: Code Review & Quality Audit Report

**Reviewed:** 2026-11-18T17:30:00Z  
**Depth:** standard (per-file and cross-file analysis)  
**Files Reviewed:** 19  
**Status:** **issues_found (3 Warnings, 3 Info items)**  

---

## Findings Summary

| ID | Severity | File | Category | Description |
| :--- | :---: | :--- | :--- | :--- |
| **WR-01** | **Warning** | `backend/src/modules/departments/department.service.js` | Logic / Bug | In `assignEmployeesToShift`, when `action === 'clear'`, the switch logic falls into the default `add` branch instead of clearing all assigned employees from the shift. |
| **WR-02** | **Warning** | `frontend/src/features/departments/pages/ShiftsPage.jsx` | UI / Logic | Active table pagination reads `activeResponse?.pagination` instead of `activeResponse?.meta`. This causes `totalPages` to always default to `1`, locking users out of pages > 1 when total shifts exceed the page limit. |
| **WR-03** | **Warning** | `backend/src/modules/departments/department.service.js` | Security / Reliability | `getShiftById` and `getShiftEmployees` do not validate `mongoose.Types.ObjectId.isValid(id)`, resulting in unhandled Mongoose `CastError` (HTTP 500) on malformed route parameters. |
| **IN-01** | **Info** | `backend/src/modules/departments/department.service.js` | Data Integrity | `restoreShift` verifies if the linked department was deleted, but does not check if the department was archived while the shift was archived, allowing active shifts to link to archived departments. |
| **IN-02** | **Info** | `frontend/src/features/departments/components/ShiftCardView.jsx` | UI Polish | `Math.floor(shift.durationMinutes / 60)` does not guard against `undefined` / `null` duration on legacy records, which can display `NaNh NaNm`. |
| **IN-03** | **Info** | `frontend/src/features/departments/components/ShiftModal.jsx` | UX Guard | Department dropdown maps `departments.map(...)` without filtering out archived departments, allowing potential assignment of archived business units in create/edit modals. |

---

## Detailed Findings

### WR-01: `assignEmployeesToShift` Fails to Unassign on `action === 'clear'`
- **Location:** `backend/src/modules/departments/department.service.js` (lines 1837–1877)
- **Problem:** `assignShiftEmployeesSchema` permits `action: z.enum(['add', 'set', 'remove', 'clear'])`. Line 1831 correctly relaxes `validIds.length === 0` for `clear`. However, the conditional logic only branches on `action === 'remove'` and `action === 'set'`, with the `else` branch assuming `add`. When `action === 'clear'` is passed, `Employee.updateMany` executes with an empty `validIds` array, leaving existing staff assignments unchanged.
- **Remediation:** Add an explicit `if (action === 'clear')` branch:
  ```javascript
  if (action === 'clear') {
    const res = await Employee.updateMany(
      { shiftId: shift._id, isDeleted: false },
      { $set: { shiftId: null } }
    );
    modifiedCount = res.modifiedCount;
  }
  ```

---

### WR-02: Active Shifts Pagination Disconnect in `ShiftsPage.jsx`
- **Location:** `frontend/src/features/departments/pages/ShiftsPage.jsx` (line 123)
- **Problem:** `departmentController.getShifts` sends pagination metadata via the standard `apiResponse(200, result.shifts, '...', result.pagination)` envelope, placing pagination details under `response.meta`. `ShiftsPage.jsx` extracts `activeResponse?.pagination`, which is `undefined`. Consequently, `activePagination` falls back to `{ page: 1, limit: activeLimit, total: activeShiftsRaw.length, totalPages: 1 }`. When more than 20 shifts exist, users are unable to navigate beyond page 1.
- **Remediation:** Coalesce from `activeResponse?.meta || activeResponse?.pagination`:
  ```javascript
  const activePagination = activeResponse?.meta || activeResponse?.pagination || {
    page: activePage,
    limit: activeLimit,
    total: activeShiftsRaw.length,
    totalPages: Math.ceil(activeShiftsRaw.length / activeLimit) || 1
  };
  ```

---

### WR-03: Missing ObjectId Validation in Single Shift Service Queries
- **Location:** `backend/src/modules/departments/department.service.js` (lines 1759, 1776)
- **Problem:** `getShiftById` and `getShiftEmployees` accept an unvalidated `id` parameter directly from route parameters. Passing a non-ObjectId string (e.g., `GET /api/v1/shifts/undefined` or invalid slug) triggers a Mongoose `CastError`, causing an unexpected HTTP 500 error instead of a clean HTTP 404 response.
- **Remediation:** Add ObjectId validation at the start of both methods:
  ```javascript
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(404, 'Shift not found');
  }
  ```

---

### IN-01: Department Archival Status Check in `restoreShift`
- **Location:** `backend/src/modules/departments/department.service.js` (line 1961)
- **Problem:** When restoring an archived shift, `restoreShift` clears `shift.departmentId = null` if the department was deleted, but leaves it intact if the department was archived in the interim. This can create an orphaned state where an active shift remains linked to an archived department.
- **Remediation:** Check both `!dept || dept.isArchived` and unlink gracefully:
  ```javascript
  if (shift.departmentId) {
    const dept = await Department.findOne({ _id: shift.departmentId, isDeleted: false });
    if (!dept || dept.isArchived) {
      shift.departmentId = null;
    }
  }
  ```

---

### IN-02: Fallback for `durationMinutes` in `ShiftCardView.jsx`
- **Location:** `frontend/src/features/departments/components/ShiftCardView.jsx` (lines 71–72)
- **Problem:** If a legacy record is missing `durationMinutes`, `Math.floor(shift.durationMinutes / 60)` calculates `NaN`, displaying `NaNh NaNm` in the UI card header.
- **Remediation:** Guard calculation with fallback:
  ```javascript
  const netHours = Math.floor((shift.durationMinutes || 0) / 60);
  const netMins = (shift.durationMinutes || 0) % 60;
  ```

---

### IN-03: Filter Out Archived Departments in `ShiftModal.jsx`
- **Location:** `frontend/src/features/departments/components/ShiftModal.jsx` (line 342)
- **Problem:** `departments.map(...)` renders all departments returned by `useGetDepartmentsQuery`. If an archived department is present in the cache, it can be selected in the modal, triggering an avoidable API 400 rejection on submit.
- **Remediation:** Filter out archived options:
  ```javascript
  {departments.filter((dept) => !dept.isArchived).map((dept) => (
  ```
