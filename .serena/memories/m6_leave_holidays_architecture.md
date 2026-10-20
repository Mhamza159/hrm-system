# Module M6: Leave & Holidays Completed Summary

## Implemented Collections & Models:
1. `LeaveType`: code, name, category, daysPerYear, isPaid, carryForwardMax, requiresAttachment, minDaysForAttachment, genderConstraint, approvalTierRequired.
2. `LeaveBalance`: employeeId, year, balances array (allocatedDays, carriedForwardDays, usedDays, pendingDays, encashedDays).
3. `Leave`: employeeId, leaveTypeId, startDate, endDate, days, halfDay ('none', 'first_half', 'second_half'), reason, attachmentUrl, status ('pending', 'approved', 'rejected', 'cancelled'), approvalChain.
4. `Holiday`: name, date, year, type ('gazetted', 'optional', 'restricted'), isLunar, description.
5. `LeaveEncashment`: employeeId, year, leaveTypeId, days, ratePerDayPaisa, totalAmountPaisa, status ('pending', 'approved', 'rejected'), payrollRunId.

## Key APIs & Endpoints:
- `/api/v1/leave-types`: CRUD (guarded by leave.settings / leave.view)
- `/api/v1/holidays`: CRUD & Pakistan Gazetted seed (guarded by leave.settings)
- `/api/v1/leaves`: POST apply, GET /my, GET /approvals, PATCH /:id/decide, PATCH /:id/cancel
- `/api/v1/leaves/balance`: live balance query & quota cards
- `/api/v1/leaves/calendar`: team conflict calendar & overlapping heatmap
- `/api/v1/leaves/encash`: request & decide year-end encashment
- `/api/v1/leaves/balance/:id`: HR manual quota adjustment with immutable AuditLog
- `/api/v1/reports/leaves` & `/api/v1/leaves/export`: streaming ExcelJS report with Linear Dark Craft styling (#1E2235 header)

## Cross-Module Contracts:
- M5 Attendance linkage: `syncLeaveToAttendance` writes status='on_leave' for each approved working date. Nightly auto-absent job skips 'on_leave'.
- M26.14 Approvals Delegation: peer managers with active delegation can approve Step 1 leaves.
- M9 Payroll integration: LeaveEncashment stores payouts in integer paisa.