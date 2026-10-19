# Module M5: Attendance & Shifts Architecture & Decisions Record

## 1. Domain Models
- **Attendance**: Compound unique index `{ employeeId: 1, date: 1 }`. Stores checkIn, checkOut, breaks array, totalBreakMinutes, workDurationMinutes, overtimeMinutes, status ('present', 'late', 'half_day', 'absent', 'on_leave'), flags (e.g. 'late', 'wfh', 'earlyDeparture'), auditLogs.
- **Shift**: Timings (startTime, endTime), graceMinutes, halfDayMinutes, breakMinutes, workDays, crossMidnight support, isActive.
- **MonthLock**: yearMonth ('YYYY-MM'), isLocked, lockedBy, lockedAt, unlockedBy, unlockedAt, notes.
- **WFHRequest**: employeeId, date, reason, status ('pending', 'approved', 'rejected'), decisionBy, decisionAt, decisionReason.
- **AttendanceCorrection**: employeeId, attendanceId, date, requestedCheckIn, requestedCheckOut, reason, status ('pending', 'approved', 'rejected'), decisionBy, decisionAt, decisionNotes.

## 2. API Endpoints & RBAC/PBAC Matrix
- `POST /api/v1/attendance/check-in`: attendance.mark:own (rate limited: 30/min, server system time strictly enforced, no employeeId spoofing)
- `POST /api/v1/attendance/check-out`: attendance.mark:own (rate limited: 30/min, calculateWorkMetrics auto computes workDuration, overtime, earlyDeparture)
- `POST /api/v1/attendance/break-start`: attendance.mark:own (rate limited: 30/min, requires active check-in, blocks double breaks)
- `POST /api/v1/attendance/break-end`: attendance.mark:own (rate limited: 30/min, requires active break)
- `GET /api/v1/attendance/my`: attendance.view:own (strictly resolves actor's employeeId, rejects peer snooping)
- `GET /api/v1/attendance/team`: attendance.view:team (enforced via checkPermission scope hierarchy; Dept Manager scoped strictly to their department)
- `POST /api/v1/attendance/wfh`: attendance.wfh:own (rate limited: 30/15min)
- `GET /api/v1/attendance/wfh/my`: attendance.wfh:own
- `GET /api/v1/attendance/wfh/team`: attendance.approve:team (Dept Manager scoped to own dept; HR/Super Admin company-wide)
- `PATCH /api/v1/attendance/wfh/:id/decide`: attendance.approve:team
- `POST /api/v1/attendance/corrections`: attendance.correction:own (rate limited: 30/15min)
- `GET /api/v1/attendance/corrections/my`: attendance.correction:own
- `GET /api/v1/attendance/corrections/team`: attendance.approve:team (scoped to manager's dept)
- `PATCH /api/v1/attendance/corrections/:id/decide`: attendance.approve:team
- `POST /api/v1/attendance/lock`: attendance.lock:all (Super Admin & HR Manager only)
- `POST /api/v1/attendance/unlock`: attendance.lock:all
- `GET /api/v1/attendance/lock-status`: attendance.view:own
- `PATCH /api/v1/attendance/:id`: attendance.edit:all (Super Admin & HR Manager only, mandatory overrideReason and audit log)
- `GET /api/v1/attendance/export`: attendance.export:team (ExcelJS streaming; scoped to dept for Dept Manager)
- `POST /api/v1/attendance/trigger-auto-absent`: attendance.lock:all (Nightly cron trigger)

## 3. Key Architecture & Security Decisions
1. **No Client Clock Trust**: Server UTC clock is authoritative; any client-supplied timestamp is discarded.
2. **Impersonation Prevention**: Controller and Service strip external employeeId from checkIn, checkOut, breaks, and myAttendance; actor is strictly derived from verified JWT user session.
3. **Double-Click Race Safety**: Database unique compound index `{ employeeId: 1, date: 1 }` prevents duplicate records during concurrent bursts (tested with 10 parallel requests).
4. **Middleware Scope Hierarchy**: `checkPermission.js` enforces that actor's scope priority (`all: 4 > department: 3 > team: 2 > own: 1`) meets or exceeds route's minimum scope requirement.
5. **Nightly Cron Job**: Auto-absent sweep identifies unrecorded active staff and marks them absent with source `system_auto_absent`.
