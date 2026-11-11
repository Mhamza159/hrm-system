---
task: employee-archive-bucket-and-modal-fix
date: 2026-11-11
status: in-progress
---

# Quick Task: Employee Delete Modal Close Fix, Archive Bucket, Revert & Permanent Delete

## Objectives
1. **Fix Modal Close Button**: Resolve root cause in `ConfirmDialog.jsx` where `onClose` was passed by callers instead of `onCancel`, and enhance `ConfirmDialog` to support both `onCancel` / `onClose`, `isLoading`, and `confirmVariant`.
2. **Backend Archive & Permanent Delete**:
   - Support `archived=true` in `getEmployees` query.
   - Implement `restoreEmployee` (`POST /api/v1/employees/:id/restore`) to revert an employee from archive back to active workforce.
   - Implement `permanentDeleteEmployee` (`DELETE /api/v1/employees/:id/permanent`) to permanently erase an employee record with asset clearance verification.
3. **Frontend Archive Bucket UI**:
   - Add "Active Workforce" and "Archive Bucket" tabs in `EmployeeListPage.jsx`.
   - In Archive Bucket: display archived employees with Revert (`RotateCcw`) and Permanent Delete (`Trash2`) actions.
   - For Permanent Delete: render a dedicated danger confirmation modal with operational Close (`X` and Cancel) buttons.
4. **Verification**: Run frontend build and backend tests to ensure zero regressions.
