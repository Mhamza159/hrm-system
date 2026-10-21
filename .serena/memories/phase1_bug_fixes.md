# Phase 1 Bug Fixes & Integration Finalization

All 5 assessed integration and PBAC issues have been resolved across Phase 1:
1. BUG-01 (Horizontal Privilege Escalation on Salary Structure): In `payroll.service.js` and `payroll.controller.js`, `getEmployeeSalaryStructure` now checks if the caller is Super Admin / HR Manager, or matches the employee's own record (403 otherwise).
2. BUG-02 (Delegation Routes PBAC): Added `checkPermission('delegation.view')`, `checkPermission('delegation.create')`, and `checkPermission('delegation.cancel')` to `delegation.routes.js`.
3. BUG-03 (Leave Encashment Stranded on Draft Run Delete): `deletePayrollRun` in `payroll.service.js` now resets `LeaveEncashment` records to `{ status: 'approved', payrollRunId: null }` when deleting an unapproved payroll run.
4. BUG-04 (Attendance Notifications): Added `notify()` triggers to `applyWFH`, `decideWFH`, `applyCorrection`, and `decideCorrection` in `attendance.service.js` notifying managers on application and applicants on decision.
5. BUG-05 (ScopeFilter Transactional Support): Enhanced `buildScopeQuery` in `scopeFilter.js` to support `{ [employeeField]: { $in: options.teamEmployeeIds } }` when scoping team queries for transactional records.
