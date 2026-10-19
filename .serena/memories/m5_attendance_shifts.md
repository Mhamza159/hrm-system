# Module M5 — Attendance & Shifts

## Models & Schemas
- `Attendance`: Compound index `{ employeeId: 1, date: 1 }` (normalized to UTC midnight). Fields: `checkIn`, `checkOut`, `breaks`, `workDurationMinutes`, `overtimeMinutes`, `status`, `flags`, `source`, `location`, `ipAddress`, `auditLogs`.
- `MonthLock`: Unique index on `yearMonth` (`YYYY-MM`). Pre-payroll lock mechanism.
- `WFHRequest`: Employee date-specific WFH applications with status (`pending`, `approved`, `rejected`).
- `AttendanceCorrection`: Missed punch correction requests with workflow and automated attendance record update.

## Services & Engines
- `statusEngine.service.js`: Automatic evaluation of `present`, `late`, `half_day`, and `earlyDeparture` using shift schedule and company `lateRules`.
- `attendance.service.js`: Domain operations for check-in/out, breaks, monthly calendar query, manager floor presence, manual adjustments with mandatory audit reason, month lock, ExcelJS export.
- `autoAbsent.job.js`: Nightly cron at 23:59 PKT (`Asia/Karachi`) to mark unpunched employees as absent, skipping holidays and approved leaves.

## Endpoints
- Mounted at `/api/v1/attendance` and `/api/v1/reports/attendance`.
- Protected by permissions: `attendance.mark`, `attendance.view`, `attendance.edit`, `attendance.approve`, `attendance.lock`, `attendance.wfh`, `attendance.correction`, `attendance.export`.

## Frontend
- RTK Query slice `attendanceApi.js`.
- Pages: `MyAttendancePage`, `TeamAttendancePage`, `ShiftManagementPage`, `AttendanceLockPage`.
- Components: `PunchCardWidget`, `AttendanceStatusBadge`, `EditAttendanceModal`, `RequestCorrectionModal`, `ApplyWFHModal`, `ExportAttendanceModal`.
