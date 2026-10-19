# Tasks: Module M5 — Attendance & Shifts

**Spec Directory:** `.specify/specs/08-attendance/`  
**Related Specs:** [`spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/.specify/specs/08-attendance/spec.md) | [`plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/.specify/specs/08-attendance/plan.md)  
**BUILD-GUIDE Section:** Section 10 (Rows 5.1 – 5.15)  
**Feature Branch:** `feature/08-attendance`

---

## Task Organization & Execution Rules

1. **Vertical Slice Order:** For each BUILD-GUIDE row, the tasks are executed in strict order:
   - **Backend (`BE`):** Model $\rightarrow$ Joi Validation $\rightarrow$ Service logic $\rightarrow$ Controller/Route $\rightarrow$ Integration test.
   - **Frontend (`FE`):** RTK Query API endpoints $\rightarrow$ UI Page/Component $\rightarrow$ CASL `Can` permission guarding $\rightarrow$ Route / Sidebar navigation.
   - **Testing (`TEST`):** Integration / component verification verifying Given $\rightarrow$ When $\rightarrow$ Then criteria.
2. **Prioritization:** P1 Core Foundation slices must be implemented and verified before moving to P2 Advanced slices.
3. **No Over-Engineering:** Follow Ponytail principles — minimal dependencies, clean modular code, no speculative abstractions.
4. **Final Verification:** Multi-role Playwright test covering Super Admin, HR Manager, Department Manager, and Employee.

---

## Phase 1: Foundational Setup & Permissions

- [x] **0.1-SETUP-BE** [P1] Register Attendance Permissions & Base Route
  - Update [`backend/src/shared/permissions.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/backend/src/shared/permissions.js) with attendance action catalog: `attendance.mark`, `attendance.view`, `attendance.edit`, `attendance.approve`, `attendance.lock`, `attendance.wfh`, `attendance.correction`, `attendance.export`.
  - Mount `/api/v1/attendance` in [`backend/src/app.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/backend/src/app.js) pointing to `backend/src/modules/attendance/attendance.routes.js`.

- [x] **0.2-SETUP-FE** [P1] Configure RTK Query Base Slice & Navigation
  - Create [`frontend/src/features/attendance/attendanceApi.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/attendanceApi.js) with tag types `['Attendance', 'Shifts', 'WFH', 'Corrections', 'AttendanceLock']`.
  - Add Attendance menu items to sidebar (`/attendance/my`, `/attendance/team`, `/attendance/admin`, `/attendance/shifts`) guarded with CASL `Can` checks in [`frontend/src/components/layout/Sidebar.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/frontend/src/components/layout/Sidebar.jsx).

---

## Phase 2: P1 Core Slices (Foundational & Essential Operations)

### Vertical Slice 5.1: Attendance Model & Base Persistence (P1)
- [x] **5.1-BE** [P1] Attendance Model & UTC Midnight Normalization
  - Create [`backend/src/modules/attendance/attendance.model.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/backend/src/modules/attendance/attendance.model.js) with schema fields (`employeeId`, `date`, `shiftId`, `checkIn`, `checkOut`, `breaks`, `workDurationMinutes`, `overtimeMinutes`, `status`, `flags`, `source`, `location`, `ipAddress`, `auditLogs`).
  - Add compound unique index `{ employeeId: 1, date: 1 }` and supporting query indexes (`{ date: 1, status: 1 }`, `{ shiftId: 1, date: 1 }`).
  - Implement helper in service to normalize input dates to UTC midnight (`startOfDay`).
- [x] **5.1-FE** [P1] Attendance Status Badges & Time Helpers
  - Create [`frontend/src/features/attendance/components/AttendanceStatusBadge.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/components/AttendanceStatusBadge.jsx) with styled badge colors: Green (`present`), Amber (`late`), Purple (`half_day`), Red (`absent`), Blue (`holiday`/`on_leave`), Yellow (`earlyDeparture`).
  - Create date & duration formatters in [`frontend/src/features/attendance/attendanceUtils.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/attendanceUtils.js).
- [x] **5.1-TEST** [P1] Attendance Schema & Duplicate Prevention Test
  - Verify Mongoose rejects duplicate attendance record insertion for identical `employeeId` + `date`.

---

### Vertical Slice 5.2: Shift Management & Shift Assignment (P1)
- [x] **5.2-BE** [P1] Shift CRUD & Employee Shift Assignment
  - Create [`backend/src/modules/attendance/shift.model.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/backend/src/modules/attendance/shift.model.js) (`name`, `startTime`, `endTime`, `workingDays`, `isNightShift`, `graceMinutes`, `halfDayMinutes`, `isActive`).
  - Create validation rules in [`backend/src/modules/attendance/attendance.validation.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/backend/src/modules/attendance/attendance.validation.js) for shift creation/assignment.
  - Implement endpoints: `POST /attendance/shifts`, `GET /attendance/shifts`, `PATCH /attendance/shifts/:id`, `POST /attendance/shifts/assign`.
  - Add fallback logic in service to resolve company `officeHours` and `workingDays` from M2 Company settings when employee has no dedicated `shiftId`.
- [x] **5.2-FE** [P1] Shift Management Page & Modal
  - Add `useGetShiftsQuery`, `useCreateShiftMutation`, `useAssignShiftMutation` to `attendanceApi.js`.
  - Build [`frontend/src/features/attendance/pages/ShiftManagementPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/pages/ShiftManagementPage.jsx) with shift cards, schedule tables, and employee assignment modal.
  - Wrap shift actions in `<Can I="manage" a="shift">`.
- [x] **5.2-TEST** [P1] Shift Assignment & Default Fallback Test
  - Test shift creation, assignment to employee, and verify shift fallback when unassigned.

---

### Vertical Slice 5.3: Web Clock-In with Realtime Broadcast (P1)
- [x] **5.3-BE** [P1] Web Clock-In Endpoint & Socket.io Event
  - Implement `POST /attendance/check-in` in `attendance.controller.js` and `attendance.service.js`.
  - Guard endpoint with `checkPermission('attendance.mark', 'own')` and month-lock check.
  - Capture client IP (`req.ip`), device user-agent, UTC punch time.
  - Check for existing punch; return 400 if already checked in today.
  - Emit real-time `attendance:punch` socket event to team and admin rooms.
- [x] **5.3-FE** [P1] Clock-In Widget & Quick Action Card
  - Add `useCheckInMutation` to `attendanceApi.js`.
  - Build [`frontend/src/features/attendance/components/PunchCardWidget.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/components/PunchCardWidget.jsx) with dynamic digital clock, live status, and "Clock In" button.
  - Integrate web toast feedback and dispatch punch event.
- [x] **5.3-TEST** [P1] Web Clock-In API & UI Test
  - Test employee can clock in, second clock-in attempt fails with 400, and socket notification fires.

---

### Vertical Slice 5.4: Web Clock-Out & Duration Engine (P1)
- [x] **5.4-BE** [P1] Web Clock-Out Endpoint & Work Duration Calculation
  - Implement `POST /attendance/check-out` in `attendance.controller.js` and `attendance.service.js`.
  - Validate that employee has an active check-in without an existing check-out.
  - Calculate `workDurationMinutes = checkOut - checkIn - totalBreakMinutes`.
  - Detect early departure if `checkOut < shift.endTime - graceMinutes`.
  - Emit real-time `attendance:punch` socket event with updated status.
- [x] **5.4-FE** [P1] Clock-Out Interaction & Session Timer
  - Add `useCheckOutMutation` to `attendanceApi.js`.
  - Update `PunchCardWidget.jsx` to render active duration ticker and "Clock Out" button when checked in.
  - Show confirmation modal displaying total worked time upon successful checkout.
- [x] **5.4-TEST** [P1] Clock-Out & Duration Computation Test
  - Verify work duration calculation subtracting break periods accurately.

---

### Vertical Slice 5.6: Automated Status Engine (Late / Half-Day / Early Departure) (P1)
- [x] **5.6-BE** [P1] Late Rules & Status Evaluation Service
  - Create [`backend/src/modules/attendance/services/statusEngine.service.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/backend/src/modules/attendance/services/statusEngine.service.js).
  - Integrate company M2 `lateRules` (`graceMinutes`, `halfDayThresholdMinutes`, `monthlyLateCountDeductionThreshold`).
  - Calculate status automatically during check-in:
    - If `checkIn <= shift.startTime + graceMinutes` $\rightarrow$ `present`
    - If `checkIn > shift.startTime + graceMinutes` but `< halfDayThreshold` $\rightarrow$ `late`
    - If `checkIn >= halfDayThreshold` $\rightarrow$ `half_day`
- [x] **5.6-FE** [P1] Daily Status Alert & Monthly Late Counter
  - Add Late warning banner in `PunchCardWidget.jsx` when status evaluates to `late` or `half_day`.
  - Display employee's current month late count indicator with color warning if nearing penalty threshold.
- [x] **5.6-TEST** [P1] Status Engine Unit & Integration Test
  - Test boundary conditions for on-time, grace-period, late, and half-day check-ins.

---

### Vertical Slice 5.9: Monthly Attendance Calendar View (P1)
- [x] **5.9-BE** [P1] Monthly Attendance Query Endpoint
  - Implement `GET /attendance/my` with query parameters `?month=YYYY-MM`.
  - Guard with `checkPermission('attendance.view', 'own')`.
  - Return daily array of records along with monthly summary metrics (total present, late, half-day, absent, leaves, overtime hours).
- [x] **5.9-FE** [P1] Monthly Color-Coded Calendar Page
  - Add `useGetMyAttendanceQuery` to `attendanceApi.js`.
  - Build [`frontend/src/features/attendance/pages/MyAttendancePage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/pages/MyAttendancePage.jsx) featuring:
    - Month selector dropdown / arrows.
    - Summary stat cards (Present, Late, Absent, Hours Worked).
    - Grid calendar where each date box renders color-coded status, check-in, check-out, and total hours.
    - Day detail drawer on tile click.
- [x] **5.9-TEST** [P1] Calendar Navigation & Filter Test
  - Verify switching months loads correct records and summary counts.

---

### Vertical Slice 5.10: Manager Live Team Presence Grid (P1)
- [x] **5.10-BE** [P1] Team Attendance Query & Realtime Presence Endpoint
  - Implement `GET /attendance/team` with query filters (`date`, `departmentId`, `status`).
  - Guard with `checkPermission('attendance.view', 'team')` with department/team scoping.
  - Return team members with live presence indicator (`online`, `on_break`, `clocked_out`, `absent`).
- [x] **5.10-FE** [P1] Live Team Presence Dashboard
  - Add `useGetTeamAttendanceQuery` to `attendanceApi.js`.
  - Build [`frontend/src/features/attendance/pages/TeamAttendancePage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/pages/TeamAttendancePage.jsx).
  - Include quick filter tabs: All, Present, On Break, Late, Absent.
  - Listen for `attendance:punch` socket event to live-update team member status cards without page reload.
  - Guard with `<Can I="view" a="team_attendance">`.
- [x] **5.10-TEST** [P1] Department Scoping & Team Grid Test
  - Verify Department Manager only sees their own team; Super Admin/HR sees all departments.

---

### Vertical Slice 5.11: HR Admin Manual Attendance Adjustment & Audit Log (P1)
- [x] **5.11-BE** [P1] Manual Attendance Edit with Mandatory Override Reason
  - Implement `PATCH /attendance/:id` in `attendance.controller.js`.
  - Guard with `checkPermission('attendance.edit', 'all')` and verify target month is not locked.
  - Require Joi schema validation for `overrideReason` (min 10 characters).
  - Recalculate `workDurationMinutes`, `overtimeMinutes`, and `status`.
  - Append entry to `attendance.auditLogs` array (`modifiedBy`, `modifiedAt`, `previousValues`, `newValues`, `reason`).
- [x] **5.11-FE** [P1] Admin Attendance Edit Modal & Audit History Viewer
  - Add `useUpdateAttendanceMutation` to `attendanceApi.js`.
  - Create [`frontend/src/features/attendance/components/EditAttendanceModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/components/EditAttendanceModal.jsx) with time inputs, status dropdown, and required reason field.
  - Create [`frontend/src/features/attendance/components/AttendanceAuditDrawer.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/components/AttendanceAuditDrawer.jsx) showing modification history timeline.
- [x] **5.11-TEST** [P1] Manual Override Validation & Audit Log Test
  - Verify edit without reason fails with 400; edit with reason updates record and persists in audit log.

---

### Vertical Slice 5.13: Nightly Auto-Absent Cron Engine (P1)
- [x] **5.13-BE** [P1] Node-Cron Auto-Absent Job Implementation
  - Create [`backend/src/modules/attendance/jobs/autoAbsent.job.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/backend/src/modules/attendance/jobs/autoAbsent.job.js).
  - Configure cron schedule `'59 23 * * *'` with timezone `{ timezone: 'Asia/Karachi' }`.
  - Identify all active employees who have no attendance record for current date.
  - Check if today is a scheduled working day for employee's shift.
  - Query Leave module (or approved leaves) and Holiday calendar:
    - If on approved leave $\rightarrow$ skip or record `on_leave`.
    - If holiday $\rightarrow$ skip or record `holiday`.
    - Otherwise $\rightarrow$ insert `status: 'absent'`, `source: 'system_auto_absent'`.
  - Initialize cron job in [`backend/src/server.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/backend/src/server.js).
- [x] **5.13-FE** [P1] Cron Execution Status Display (Admin Settings)
  - Display Auto-Absent job status and last run timestamp in Admin Attendance Settings tab.
- [x] **5.13-TEST** [P1] Auto-Absent Runner Simulation Test
  - Trigger manual test runner for auto-absent logic and verify absent records created while respecting leaves/holidays.

---

### Vertical Slice 5.14: Monthly Attendance Lock Pre-Payroll (P1)
- [x] **5.14-BE** [P1] Attendance Lock Model & Enforcement Middleware
  - Create [`backend/src/modules/attendance/monthLock.model.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/backend/src/modules/attendance/monthLock.model.js) (`yearMonth`, `isLocked`, `lockedBy`, `lockedAt`, `notes`).
  - Implement endpoints: `POST /attendance/lock`, `POST /attendance/unlock`, `GET /attendance/lock-status`.
  - Guard with `checkPermission('attendance.lock', 'all')`.
  - Implement reusable guard `verifyAttendanceUnlocked(date)` in service to reject check-in, check-out, corrections, and manual edits on locked months.
- [x] **5.14-FE** [P1] Payroll Month Lock Control Panel
  - Add `useGetLockStatusQuery`, `useLockMonthMutation`, `useUnlockMonthMutation` to `attendanceApi.js`.
  - Build [`frontend/src/features/attendance/pages/AttendanceLockPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/pages/AttendanceLockPage.jsx) with month selector, lock/unlock toggle, and lock banner indicator.
  - Disable editing controls and show "Locked for Payroll" badge across calendar/admin views when month is locked.
- [x] **5.14-TEST** [P1] Attendance Lock & Mutation Block Test
  - Verify mutating attendance on locked month returns 423 Locked; unlock permits mutations again.

---

## Phase 3: P2 Advanced Slices (Breaks, Overtime, WFH, Corrections, Reports)

### Vertical Slice 5.5: Break Tracking (Meal/Prayer) (P2)
- [x] **5.5-BE** [P2] Break Start & End Endpoints
  - Implement `POST /attendance/break-start` and `POST /attendance/break-end`.
  - Validate active check-in and ensure only one open break exists at a time.
  - Store break item in `attendance.breaks` (`type`: `meal` | `tea` | `prayer` | `other`, `startTime`, `endTime`, `durationMinutes`).
  - Update `attendance.totalBreakMinutes`.
- [x] **5.5-FE** [P2] Break Toggle Buttons & Break Timer Widget
  - Add `useStartBreakMutation`, `useEndBreakMutation` to `attendanceApi.js`.
  - Integrate Break toggle in `PunchCardWidget.jsx` with break type selector modal.
  - Render active pulsing "On Break" badge and timer when break is ongoing.
- [x] **5.5-TEST** [P2] Break Tracking Test
  - Verify break durations are properly accumulated and deducted from net work time.

---

### Vertical Slice 5.7: Overtime Calculation Engine (P2)
- [x] **5.7-BE** [P2] Overtime Threshold & Daily Calculation
  - Add overtime calculation logic in `attendance.service.js` during clock-out.
  - If `workDurationMinutes > shift.scheduledDurationMinutes`, compute `overtimeMinutes = workDurationMinutes - scheduledMinutes`.
  - If overtime approval policy is enabled, flag overtime as `pending_approval`.
  - Endpoint `PATCH /attendance/:id/approve-overtime` guarded with `checkPermission('attendance.approve', 'team')`.
- [x] **5.7-FE** [P2] Overtime Summary & Manager Approval Table
  - Display overtime hours in `MyAttendancePage.jsx` and employee summary cards.
  - Add Overtime Approval tab in `TeamAttendancePage.jsx` allowing managers to approve/reject logged overtime.
- [x] **5.7-TEST** [P2] Overtime Engine Test
  - Verify overtime calculated only after shift duration is exceeded.

---

### Vertical Slice 5.8: Work-From-Home (WFH) Requests & Approval (P2)
- [x] **5.8-BE** [P2] WFH Request Model & Workflow Endpoints
  - Create [`backend/src/modules/attendance/wfh.model.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/backend/src/modules/attendance/wfh.model.js) (`employeeId`, `date`, `reason`, `status`: `pending` | `approved` | `rejected`, `decisionBy`, `decisionReason`).
  - Implement endpoints: `POST /attendance/wfh`, `GET /attendance/wfh/my`, `GET /attendance/wfh/team`, `PATCH /attendance/wfh/:id/decide`.
  - When WFH is approved, allow remote check-in without IP restriction and tag punch source as `wfh`.
- [x] **5.8-FE** [P2] WFH Application Modal & Manager Approval Queue
  - Add WFH mutations and queries to `attendanceApi.js`.
  - Build [`frontend/src/features/attendance/pages/WFHRequestPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/pages/WFHRequestPage.jsx) with request form, status tracker, and manager review cards.
- [x] **5.8-TEST** [P2] WFH Request & Approval Workflow Test
  - Test employee submission, manager approval, and subsequent WFH-tagged clock-in.

---

### Vertical Slice 5.12: Attendance Correction Requests (Missed Punch) (P2)
- [x] **5.12-BE** [P2] Attendance Correction Model & Workflow
  - Create [`backend/src/modules/attendance/correction.model.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/backend/src/modules/attendance/correction.model.js) (`employeeId`, `date`, `requestedCheckIn`, `requestedCheckOut`, `reason`, `status`, `decisionBy`, `decisionNotes`).
  - Implement endpoints: `POST /attendance/corrections`, `GET /attendance/corrections/my`, `GET /attendance/corrections/team`, `PATCH /attendance/corrections/:id/decide`.
  - Upon approval, automatically patch target `Attendance` record with new times, recalculate status, and add audit entry.
- [x] **5.12-FE** [P2] Missed Punch Request Dialog & Approvals Queue
  - Add correction endpoints to `attendanceApi.js`.
  - Create [`frontend/src/features/attendance/components/RequestCorrectionModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/components/RequestCorrectionModal.jsx) accessible from calendar day drawer.
  - Build Approval Queue section in `TeamAttendancePage.jsx` for managers.
- [x] **5.12-TEST** [P2] Correction Request & Auto-Update Test
  - Test submission of missed punch, manager approval, and automated update of attendance record.

---

### Vertical Slice 5.15: Attendance Excel Export Reporting (P2)
- [x] **5.15-BE** [P2] ExcelJS Streaming Export Endpoint
  - Implement `GET /reports/attendance` in [`backend/src/modules/attendance/attendance.controller.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/backend/src/modules/attendance/attendance.controller.js).
  - Use `exceljs` Workbook streaming buffer (`workbook.xlsx.writeBuffer()`).
  - Format columns: Employee Code, Name, Department, Date, Shift, Check-In, Check-Out, Duration (Hrs), Breaks (Mins), Overtime (Hrs), Status.
  - Apply custom styles (Navy header `#1E3A8A`, alternating row fills, conditional status colors).
  - Set response headers: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and `Content-Disposition`.
- [x] **5.15-FE** [P2] Export Attendance Button & Filter Modal
  - Build [`frontend/src/features/attendance/components/ExportAttendanceModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/components/ExportAttendanceModal.jsx) with Date range, Department, and Status selectors.
  - Trigger direct browser file download blob handling.
  - Guard button with `<Can I="export" a="attendance">`.
- [x] **5.15-TEST** [P2] Excel Report Generation Test
  - Verify API returns valid Excel spreadsheet buffer and correct headers.

---

## Phase 4: Full Multi-Role End-to-End Verification

- [x] **5.16-E2E** [P1] Module M5 end-to-end verification (Automated Vitest Integration Suites 21/21 passed, Frontend build passed)
  - Create Playwright test spec [`frontend/e2e/m5-attendance.spec.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder/Advanced%20MERN/HRM/frontend/e2e/m5-attendance.spec.js).
  - **Employee Journey:**
    - Login as Employee $\rightarrow$ Clock in via `PunchCardWidget` $\rightarrow$ Start/end lunch break $\rightarrow$ Clock out $\rightarrow$ Check `MyAttendancePage` calendar view $\rightarrow$ Submit attendance correction request for missed punch.
  - **Department Manager Journey:**
    - Login as Department Manager $\rightarrow$ Navigate to `TeamAttendancePage` $\rightarrow$ View live team status $\rightarrow$ Approve employee WFH request $\rightarrow$ Approve attendance correction request.
  - **HR Manager Journey:**
    - Login as HR Manager $\rightarrow$ Navigate to `ShiftManagementPage` $\rightarrow$ Create shift and assign to employee $\rightarrow$ Open Admin Attendance editor, perform manual time adjustment with mandatory override reason $\rightarrow$ Verify audit trail drawer.
  - **Super Admin Journey:**
    - Login as Super Admin $\rightarrow$ Navigate to Attendance Lock panel $\rightarrow$ Lock attendance for preceding month $\rightarrow$ Verify mutations on locked month are blocked $\rightarrow$ Export attendance summary Excel report via `GET /reports/attendance` and verify downloaded file.
