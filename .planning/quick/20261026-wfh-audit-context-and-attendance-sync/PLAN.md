# Quick Task: WFH Audit Context & Complete Attendance Integration

## Objective
Implement complete Audit Context for Work-From-Home (WFH) requests identical to Punch Correction Audit, synchronize approved WFH requests directly into Attendance records with 'wfh' flags, and prominently display WFH status across My Attendance and Team Attendance calendars and history grids.

## Task Breakdown
1. **Backend**:
   - Add `getWFHAuditContext` in `attendance.service.js` with employee profile, shift timings, monthly attendance metrics, WFH request counts, and recent attendance records.
   - Synchronize approved WFH requests directly into `Attendance` records in `decideWFH` with `status: 'present'`, `flags: ['wfh']`, `source: 'wfh'`.
   - Revert or cleanup placeholder attendance records on WFH rejection.
   - Add `getWFHAuditContext` controller and route `GET /api/v1/attendance/wfh/:id/audit-context` with `checkPermission('attendance.approve', 'team')`.
2. **Frontend**:
   - Add `getWFHAuditContext` query in `attendanceApi.js`.
   - Build `WFHReviewModal.jsx` modeled with the same comprehensive audit capabilities as `PunchCorrectionReviewModal.jsx`.
   - Connect "Review & Audit" button in `TeamAttendancePage.jsx` for WFH requests.
   - Update `AttendanceStatusBadge.jsx`, `MyAttendancePage.jsx`, and `TeamAttendancePage.jsx` to render distinctive `🏠 WFH` badges, calendar indicators, and tooltips.
3. **Verification**:
   - Run vitest tests for attendance api and security.
   - Run frontend build.
