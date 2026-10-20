# Tasks: Module M6 — Leave & Holidays

**Feature Branch**: `feature/09-leave`  
**Created**: 2026-10-19  
**Status**: Ready for Vertical Slice Implementation  
**Module ID**: M6  
**Module Name**: Leave & Holidays (Core HR Group · Launch Scope P1)  
**Spec Reference**: [`.specify/specs/09-leave/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/09-leave/spec.md)  
**Plan Reference**: [`.specify/specs/09-leave/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/09-leave/plan.md)  
**Governing Documents**:
- [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 11 (Rows 6.1 to 6.15)
- [`docs/FRD.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/FRD.md) Section M6 & Section 11 (Permission Matrix M6 Row)
- [`docs/TECH-SPEC.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/TECH-SPEC.md) Section 1, 2, 3, 4, 7 & 8

---

## Execution Philosophy (Strict Invariants)
1. **Vertical Slice Order**: Complete the Backend (BE), Frontend (FE), and Integration/Unit Test (TEST) of each BUILD-GUIDE row before proceeding to the next row.
2. **Standard Layer Flow**: `routes` $\rightarrow$ `validate` (Zod) $\rightarrow$ `checkPermission` (CASL) $\rightarrow$ `controller` $\rightarrow$ `service` $\rightarrow$ `model`.
3. **Response Envelope**: Every API responds with `{ success, statusCode, data, message, meta }`.
4. **JavaScript Only**: All code in `.js` and `.jsx` (Strictly ZERO `.ts` / `.tsx`).
5. **No Placeholders**: Production-ready, exhaustive, clean code with explanatory docstrings.

---

## Phase 1: Foundational Master Data & Quota Infrastructure (Priority P1)

### Slice 6.1: Leave Types Definition & Configuration (BUILD-GUIDE Row 6.1 · Priority: P1)
- [x] **6.1-BE**: Create `leaveType.model.js` (name, unique code, daysPerYear, isPaid, carryForwardMax, requiresAttachment, minDaysForAttachment, genderConstraint, isActive), Zod validation in `leave.validation.js`, service CRUD methods in `leave.service.js`, controller endpoints, and routes (`/api/v1/leave-types`) guarded by `authenticate` and `checkPermission('leave.settings', 'all')` for mutations, and `checkPermission('leave.view', 'own')` for reads.
- [x] **6.1-FE**: Create RTK Query endpoints (`getLeaveTypes`, `createLeaveType`, `updateLeaveType`, `deleteLeaveType`) in `frontend/src/features/leaves/leavesApi.js`, build `LeaveTypesPage.jsx` and `LeaveTypeModal.jsx` with Linear Dark styling, mount route `/leave-types` with CASL `Can` guarding, and add navigation link in `Sidebar.jsx`.
- [x] **6.1-TEST**: Write backend test suite `backend/tests/leave.types.test.js` verifying CRUD operations, unique uppercase code constraint, and role access permissions (Super Admin/HR allowed; Dept Manager/Employee 403 on mutations).

---

### Slice 6.11: Pakistan Gazetted Holiday Calendar & Seed (BUILD-GUIDE Row 6.11 · Priority: P1)
- [x] **6.11-BE**: Create `holiday.model.js` (name, date normalized to UTC midnight, year, type, isLunar, description, isActive with compound unique index `{ date: 1, name: 1 }`), Zod validation, service methods in `leave.service.js`, controller endpoints, and routes (`/api/v1/holidays`) guarded by `leave.settings:all` for mutations. Implement `seed/holidays.seed.js` with 10+ official Pakistan gazetted holidays (Kashmir Day, Pakistan Day, Labour Day, Eid-ul-Fitr, Eid-ul-Adha, Ashura, Independence Day, Eid Milad-un-Nabi, Quaid Day / Christmas).
- [x] **6.11-FE**: Create RTK Query endpoints (`getHolidays`, `createHoliday`, `updateHoliday`, `deleteHoliday`) in `leavesApi.js`, build `HolidaysPage.jsx` and `HolidayModal.jsx` displaying upcoming holidays with lunar date badge and edit triggers, mount route `/holidays`, and wire into navigation.
- [x] **6.11-TEST**: Write `backend/tests/holidays.test.js` verifying seed execution, date-shifting for lunar Eid holidays, duplicate prevention on same calendar date, and public read / admin edit permissions.

---

### Slice 6.2: Salana Quota Allocation & Carry-Forward Engine (BUILD-GUIDE Row 6.2 · Priority: P1)
- [x] **6.2-BE**: Create `leaveBalance.model.js` with compound unique index `{ employeeId: 1, year: 1 }` storing quota subdocuments (`allocatedDays`, `carriedForwardDays`, `usedDays`, `pendingDays`, `encashedDays`), implement `initializeEmployeeLeaveBalances(employeeId, year)` in `leave.service.js` for new hires, and create `jobs/yearlyLeave.job.js` running at fiscal year boundary to evaluate unused annual leave and carry forward up to `leaveType.carryForwardMax` / `leavePolicy.carryForwardLimit`.
- [x] **6.2-FE**: Hook into employee onboarding and profile viewing to ensure newly onboarded employees display initialized balances without errors.
- [x] **6.2-TEST**: Write `backend/tests/leave.balance-allocation.test.js` verifying automated balance creation upon employee onboarding, yearly rollover carrying forward capped days, and expiring excess unused quota.

---

### Slice 6.9: Live Leave Balance Cards & Quota Inspector (BUILD-GUIDE Row 6.9 · Priority: P1)
- [x] **6.9-BE**: Implement `GET /api/v1/leaves/balance` in `leave.controller.js` and `leave.service.js` supporting self-service queries (`resolveEmployeeId(req.user)`) and scoped queries by `employeeId` query parameter (`checkPermission('leave.view', 'team' | 'all')`).
- [x] **6.9-FE**: Create `LeaveBalanceCards.jsx` with category-wise color-coded progress bars (Annual, Casual, Sick, Unpaid) showing Quota, Carried Over, Used, Pending, and Available days, and mount in `MyLeavesPage.jsx`.
- [x] **6.9-TEST**: Write `backend/tests/leave.balance-query.test.js` verifying accurate calculation of available quota, self-service scoping for Employees, and team-scoped balance queries for Department Managers.

---

## Phase 2: Leave Application, Validation & Medical Proof (Priority P1 & P2)

### Slice 6.3: Leave Application & Working Days Validation (BUILD-GUIDE Row 6.3 · Priority: P1)
- [x] **6.3-BE**: Create `leave.model.js` (employeeId, leaveTypeId, startDate, endDate, days, halfDay, reason, attachmentUrl, status: 'pending', approvalChain), create `leaveCalculator.js` to compute net working days by querying `workingDays` (from M2 `SettingService`) and active `Holiday` records, check overlapping pending/approved leaves, verify available balance, atomically reserve `pendingDays += netDays`, and route `POST /api/v1/leaves` guarded by `checkPermission('leave.apply', 'own')`.
- [x] **6.3-FE**: Build `ApplyLeaveModal.jsx` in `frontend/src/features/leaves/components/` with date picker, category dropdown, dynamic deductible days counter, reason textarea, and balance check indicator. Wire submission mutation in `MyLeavesPage.jsx`.
- [x] **6.3-TEST**: Write `backend/tests/leave.apply.test.js` verifying exclusion of weekends (Sat/Sun) and gazetted holidays from deductible days, rejection of overlapping dates (`409 Conflict`), rejection when balance is insufficient (`400 Bad Request`), and atomic increment of `pendingDays`.

---

### Slice 6.4: Half-Day Leave Support (BUILD-GUIDE Row 6.4 · Priority: P1)
- [x] **6.4-BE**: Extend `leave.validation.js` and `leave.service.js` with `halfDay` support (`'none'`, `'first_half'`, `'second_half'`). Enforce single-calendar-date constraint when `halfDay !== 'none'`, deduct exactly 0.5 days from available balance, and save half-day tag in `leave.model.js`.
- [x] **6.4-FE**: Add interactive Half-Day toggle switch and dropdown (First Half / Second Half) to `ApplyLeaveModal.jsx` that locks `endDate` to `startDate` and displays "0.5 Day" deduction badge.
- [x] **6.4-TEST**: Write `backend/tests/leave.halfday.test.js` verifying 0.5 day deduction, multi-day rejection with half-day flag enabled, and weekend/holiday rejection for half-day requests.

---

### Slice 6.5: Sick Leave Medical Certificate Attachment (BUILD-GUIDE Row 6.5 · Priority: P2)
- [x] **6.5-BE**: Configure Multer memory upload middleware with 5MB ceiling and MIME validation (`application/pdf`, `image/jpeg`, `image/png`). In `leave.service.js`, enforce `requiresAttachment` rule (mandatory upload when sick leave exceeds `minDaysForAttachment`, e.g. $\ge 2$ days). Stream file to storage and persist `attachmentUrl`.
- [x] **6.5-FE**: Add medical certificate file uploader with preview and remove button in `ApplyLeaveModal.jsx` when Sick Leave is selected for $>2$ days. Display clickable attachment preview link in approval views.
- [x] **6.5-TEST**: Write `backend/tests/leave.attachment.test.js` verifying rejection of sick leave $>2$ days without attachment, rejection of invalid file extensions, and acceptance of valid PDF/PNG medical proofs.

---

## Phase 3: Multi-Level Approval Chain & Governance (Priority P1)

### Slice 6.6: Multi-Level Approval Chain & M26.14 Delegation (BUILD-GUIDE Row 6.6 · Priority: P1)
- [x] **6.6-BE**: Implement `buildApprovalChain(employeeId, days)` in `leave.service.js` dynamically creating sequential steps: Level 1 (Department Manager / Reporting Lead) $\rightarrow$ Level 2 (HR Manager) $\rightarrow$ Level 3 (Super Admin if duration $> 5$ days). Integrate M26.14 `delegation.model.js` check: if primary approver has an active approval delegation, allow the designated delegate to inspect and act on the request.
- [x] **6.6-FE**: Build `LeaveApprovalsPage.jsx` displaying pending requests with multi-tier progress stepper, applicant department, leave type, days, reason, and delegation badge ("Acting on behalf of [Manager Name]"). Mount route `/leave-approvals` guarded by `checkPermission('leave.approve', 'team')`.
- [x] **6.6-TEST**: Write `backend/tests/leave.approval-chain.test.js` verifying correct multi-level chain generation based on duration limits and verifying that an active delegated substitute possesses full approval authority.

---

### Slice 6.7: Leave Decision Workflow (Approve / Reject with Reason) (BUILD-GUIDE Row 6.7 · Priority: P1)
- [x] **6.7-BE**: Implement `PATCH /api/v1/leaves/:id/decide` accepting `{ action: 'approve' | 'reject', reason?: string }` guarded by `checkPermission('leave.approve', 'team' | 'all')`. If approved at intermediate level, advance to next step in chain. If approved at final step, mark `status: 'approved'`, atomically move `pendingDays` to `usedDays`, and invoke `notify.service.js`. If rejected, require mandatory `reason`, mark `status: 'rejected'`, atomically release `pendingDays`, and notify applicant.
- [x] **6.7-FE**: Create `LeaveDecideModal.jsx` in `LeaveApprovalsPage.jsx` with Approve and Reject actions, mandatory comment textarea on rejection, and toast feedback.
- [x] **6.7-TEST**: Write `backend/tests/leave.decision.test.js` verifying step advancement, final status transition, balance adjustments (`pendingDays` $\rightarrow$ `usedDays` on approve; revert `pendingDays` on reject), and notification dispatch.

---

### Slice 6.8: Leave Cancellation & Balance Restoration (BUILD-GUIDE Row 6.8 · Priority: P1)
- [x] **6.8-BE**: Implement `PATCH /api/v1/leaves/:id/cancel` guarded by `checkPermission('leave.apply', 'own')` (or `leave.settings:all` for HR). If status is `'pending'`, mark `'cancelled'` and restore `pendingDays`. If status is `'approved'` and start date is in the future, mark `'cancelled'`, restore `usedDays`, and clear linked Attendance records. Reject cancellation requests for past leaves.
- [x] **6.8-FE**: Add "Cancel Request" button with confirmation alert in `MyLeavesPage.jsx` for pending and future approved leaves, updating UI state immediately.
- [x] **6.8-TEST**: Write `backend/tests/leave.cancellation.test.js` verifying immediate quota restoration for pending cancellations, quota restoration and attendance clearance for future approved cancellations, and 400 rejection for past leave cancellations.

---

## Phase 4: Cross-Module Integrations, Encashment & Reports (Priority P1 & P2)

### Slice 6.12: Attendance Linkage & Auto-Leave Synchronization (BUILD-GUIDE Row 6.12 · Priority: P1)
- [x] **6.12-BE**: In `leave.service.js`, on final approval of any leave, invoke `AttendanceService.markLeaveAttendance(employeeId, startDate, endDate, leaveTypeName)` to upsert `Attendance` records for every working date in the range with `status: 'on_leave'`. Ensure `jobs/autoAbsent.job.js` checks for `on_leave` status and skips marking absent.
- [x] **6.12-FE**: Verify that `AttendanceCalendar.jsx` in M5 displays blue/purple "On Leave" badges for approved leave days and updates month summary statistics.
- [x] **6.12-TEST**: Write `backend/tests/leave.attendance-sync.test.js` verifying that approved leaves create corresponding `Attendance` documents with `status: 'on_leave'`, and executing `runNightlyAutoAbsent()` confirms zero false absences for staff on approved leave.

---

### Slice 6.10: Team Leave Conflict Calendar (BUILD-GUIDE Row 6.10 · Priority: P2)
- [x] **6.10-BE**: Implement `GET /api/v1/leaves/calendar` accepting `month=YYYY-MM` and optional `departmentId` parameter, returning all approved team leaves scoped by actor role (`own` team for Manager/Employee; all company for HR/Super Admin).
- [x] **6.10-FE**: Build `TeamLeaveCalendarPage.jsx` with interactive monthly grid rendering overlapping employee leaves, department filter, and conflict warning banners when multiple team members are away on identical dates. Mount route `/leave-calendar` with CASL guarding.
- [x] **6.10-TEST**: Write `backend/tests/leave.calendar.test.js` verifying department-scoped data isolation for Department Managers and team members, and verifying accurate return of overlapping date ranges.

---

### Slice 6.13: Year-End Leave Encashment Engine (BUILD-GUIDE Row 6.13 · Priority: P2)
- [x] **6.13-BE**: Create `leaveEncashment.model.js` (employeeId, year, leaveTypeId, days, ratePerDayPaisa, totalAmountPaisa, status, payrollRunId, approvedBy). Add `leave.encash` permission to `backend/src/shared/permissions.js`. Implement `POST /api/v1/leaves/encash` verifying `leavePolicy.encashmentAllowed`, validating unused annual leave days, calculating daily rate in integer paisa, atomically updating `LeaveBalance.encashedDays`, and creating an `Encashment` record for M9 Payroll processing.
- [x] **6.13-FE**: Build `EncashmentPage.jsx` (HR/Admin view) and "Request Encashment" modal on `MyLeavesPage.jsx` displaying eligible unutilized annual leave days, calculated payout preview in PKR, and submission workflow. Mount route `/leave-encashment`.
- [x] **6.13-TEST**: Write `backend/tests/leave.encashment.test.js` verifying policy enforcement (`encashmentAllowed: true/false`), quota deduction from available balance, accurate integer paisa payout math, and permission checks.

---

### Slice 6.14: HR Manual Leave Balance Adjustment & Audit Trail (BUILD-GUIDE Row 6.14 · Priority: P2)
- [x] **6.14-BE**: Implement `PATCH /api/v1/leave-balances/:id` guarded by `checkPermission('leave.settings', 'all')`. Require mandatory `overrideReason`, adjust balance numbers, and create an immutable audit record in `auditLogs` with actor ID, timestamp, before state, and after state.
- [x] **6.14-FE**: Build `BalanceAdjustmentModal.jsx` accessible from `LeaveTypesPage.jsx` or employee profile tabs with category balance inputs, adjustment reason textarea, and validation.
- [x] **6.14-TEST**: Write `backend/tests/leave.balance-override.test.js` verifying balance updating, rejection when `overrideReason` is missing, immutable entry generation in `auditLogs`, and 403 Forbidden for Department Managers and Employees.

---

### Slice 6.15: Leave Analytics & ExcelJS Report Export (BUILD-GUIDE Row 6.15 · Priority: P2)
- [x] **6.15-BE**: Implement `GET /api/v1/reports/leaves` guarded by `checkPermission('report.export', 'team' | 'all')`. Use ExcelJS streaming workbook with Dark Linear Craft styled headers (`#1E2235`), auto-fitted columns, employee metadata, leave types, start/end dates, total days, half-day tags, approval statuses, and reasons.
- [x] **6.15-FE**: Add "Export Leave Report" button on Reports dashboard and `TeamLeaveCalendarPage.jsx` triggering download with date range and department filters.
- [x] **6.15-TEST**: Write `backend/tests/leave.report.test.js` verifying `.xlsx` header content-type, accurate row streaming, and department-level data scoping for Department Managers.

---

## Phase 5: Multi-Role End-to-End Verification

### Slice E2E-M6: Playwright Automated Verification across All 4 Roles
- [x] **E2E-M6**: Create and execute `backend/tests/m6.leave.e2e.test.js` verifying all user flows in real Chrome browser via Playwright:
  1. **Super Admin**: Configure leave types, seed Pakistan holidays, execute annual encashment, perform manual balance adjustments with audit verification.
  2. **HR Manager**: Review company-wide leave calendar, edit lunar holiday dates, review multi-tier leave approval queue, export Excel reports.
  3. **Department Manager**: Review team leave requests, approve team absence within approval limits, verify delegated approval on behalf of absent manager, inspect team conflict calendar.
  4. **Employee**: Inspect live balance cards, submit full-day and half-day leave applications, attach medical certificate, verify weekend/holiday exclusion, cancel pending request, observe live `on_leave` attendance status.
