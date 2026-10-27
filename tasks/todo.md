# Task List: Pre-Payroll Attendance & Leave Audit Console

- [x] Task 1: Backend Pre-Audit Endpoint Implementation
  - Acceptance: `GET /api/v1/payroll/pre-audit?month=X&year=Y` returns monthLock status, projected totals, and itemized employee audit evidence (lates, unpaid leaves, approved OT, absents) without creating database records.
  - Verify: Automated test `npx vitest run tests/payroll.preaudit.test.js` passes.
  - Files:
    - `backend/src/modules/payroll/payroll.validation.js`
    - `backend/src/modules/payroll/payroll.service.js`
    - `backend/src/modules/payroll/payroll.controller.js`
    - `backend/src/modules/payroll/payroll.routes.js`
    - `backend/tests/payroll.preaudit.test.js`

- [x] Task 2: Frontend RTK Query API Hook
  - Acceptance: `useGetPrePayrollAuditQuery` hook available in `payrollApi.js` with proper caching and tag invalidation.
  - Verify: Hook exports cleanly with no TypeScript/ESLint warnings.
  - Files:
    - `frontend/src/features/payroll/payrollApi.js`

- [x] Task 3: Build PrePayrollAuditModal Component
  - Acceptance: 2-step modal with month/year picker, summary metrics strip, searchable audit table with color-coded badges, and expandable rows showing date-by-date punch details (lates, unpaid leaves, overtime, absents).
  - Verify: Component compiles cleanly with no JSX/rendering errors.
  - Files:
    - `frontend/src/features/payroll/components/PrePayrollAuditModal.jsx`

- [x] Task 4: Integrate PrePayrollAuditModal in PayrollRunsPage
  - Acceptance: Clicking "+ Generate Payroll Run" opens `PrePayrollAuditModal`. Confirmed generation dispatches run and redirects to detail page.
  - Verify: `npm run build` succeeds in frontend with 0 errors.
  - Files:
    - `frontend/src/features/payroll/pages/PayrollRunsPage.jsx`

- [x] Task 5: End-to-End Verification & July Pre-Audit Validation
  - Acceptance: Pre-audit preview for July 2026 accurately reflects all seeded attendance factors (Hamza: 3 lates/1d cut; Sajwar: 3d unpaid/5h OT; Basit: 6 lates/4h OT; Bilawal: 2d paid/1 absent; Huzaifa: 6h OT; Noman: 1d unpaid/1d sick/3 lates). Full frontend build passes with 0 errors.
  - Verify: `npm run build` and vitest suite green.
  - Files:
    - `tasks/todo.md`

# Task List: Dedicated Overtime Approval Flow & UI Actions
- [x] Task 6: Backend Overtime Approval API & Query Endpoint
  - Acceptance: `PATCH /api/v1/attendance/:id/overtime-decide` (approves or revokes OT with audit trail and notification) and `GET /api/v1/attendance/overtime/team` (queries team overtime punches with status filter).
  - Verify: Integration test suite passes.
  - Files:
    - `backend/src/modules/attendance/attendance.validation.js`
    - `backend/src/modules/attendance/attendance.service.js`
    - `backend/src/modules/attendance/attendance.controller.js`
    - `backend/src/modules/attendance/attendance.routes.js`
    - `backend/tests/attendance.overtime.test.js`

- [x] Task 7: Frontend RTK Query Hooks for Overtime Approvals
  - Acceptance: `useGetTeamOvertimeRecordsQuery` and `useDecideOvertimeMutation` added to `attendanceApi.js` with tag invalidation.
  - Files:
    - `frontend/src/features/attendance/attendanceApi.js`

- [x] Task 8: Dedicated Overtime UI in TeamAttendancePage
  - Acceptance: 1-Click "Approve OT" button & badge on Live Attendance Cards + 5th Tab "Overtime Approvals" with pending/approved filter, stats strip, and 1-click approvals.
  - Verify: `npm run build` passes with 0 errors.
  - Files:
    - `frontend/src/features/attendance/pages/TeamAttendancePage.jsx`
    - `frontend/src/features/attendance/components/EditAttendanceModal.jsx`
