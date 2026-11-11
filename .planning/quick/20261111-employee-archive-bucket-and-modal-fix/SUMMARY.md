---
task: employee-archive-bucket-and-modal-fix
date: 2026-11-11
status: complete
---

# Quick Task Summary: Employee Delete Modal Close Fix, Archive Bucket, Revert & Permanent Delete

## Changes Completed

1. **Delete Confirmation Modal Close Button Fix**:
   - In `ConfirmDialog.jsx`: Updated to accept both `onClose` and `onCancel` (`const handleClose = onCancel || onClose;`), and wired it to the close `X` button, backdrop click, and `Cancel` button.
   - Added support for `confirmVariant="danger"` and `isLoading` with a clean loading spinner.

2. **Backend Employee Archive Bucket & Permanent Delete**:
   - `getEmployees` service: Supports `archived=true` or `isDeleted=true` query parameters to retrieve soft-deleted employees in the archive bucket.
   - `restoreEmployee` service & controller (`POST /api/v1/employees/:id/restore`): Reverts an archived employee back to active workforce (`isDeleted = false`), reactivates linked user account (`isActive = true`), and records an audit log.
   - `permanentDeleteEmployee` service & controller (`DELETE /api/v1/employees/:id/permanent`): Asserts asset clearance, removes linked User and Employee documents from database, and records an audit log.
   - Added automated tests in `backend/tests/employees.api.test.js` validating the entire soft-delete, archive query, restore, and permanent delete lifecycle.

3. **Frontend Employee Directory Archive Bucket & Revert / Delete Actions**:
   - `EmployeeListPage.jsx`:
     - Added view switcher tabs: **Active Workforce** and **Archive Bucket** with live counts.
     - In Archive Bucket: displays archived employees with an informational banner.
     - Row actions in Archive Bucket:
       - **Revert**: Restores employee to active workforce.
       - **Delete**: Opens a danger confirmation modal with operational Close (`X` and Cancel) buttons for permanent deletion.
   - `EmployeeProfilePage.jsx`:
     - Displays Revert and Permanent Delete action buttons when viewing an archived employee.
     - Confirmation dialogs for both archive and permanent delete now close seamlessly.
   - `employeesApi.js`: Added and exported `useRestoreEmployeeMutation` and `usePermanentDeleteEmployeeMutation`.

## Verification
- Frontend production build (`npm --prefix frontend run build`): PASSED (0 errors).
- Backend employee API tests (`vitest run employees.api`): 19/19 PASSED.

