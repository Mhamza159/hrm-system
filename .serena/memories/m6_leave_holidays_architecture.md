# Module M6: Leave & Holidays (Fully Verified)

## Overview
Module M6 handles statutory leave policies, Pakistan gazetted & lunar holidays, multi-tier approval workflows, leave encashment, live quota balance management, and attendance synchronization.
Status: Fully Verified & Passed (36/36 Vitest Unit/Integration Tests + Playwright MCP Multi-Role Browser Tests).

## Models
- `LeaveType` (`backend/src/models/leaveType.model.js`): Leave category master with isPaid, daysPerYear, carryForwardMax, requiresAttachment, allowHalfDay, encashable, and genderConstraint.
- `LeaveBalance` (`backend/src/models/leaveBalance.model.js`): Annual quota balance per employee per year (`employeeId + year` compound unique index) with nested balances for allocated, used, pending, carriedForward, and encashed days.
- `Leave` (`backend/src/models/leave.model.js`): Leave application with dates, deductible days, half-day tag, reason, attachmentUrl, overall status, and dynamic `approvalChain`.
- `Holiday` (`backend/src/models/holiday.model.js`): Public and lunar holidays with date, type (gazetted/optional), and lunar flag.
- `LeaveEncashment` (`backend/src/models/leaveEncashment.model.js`): Annual unutilized leave monetization linked to payroll.

## Key APIs
- `GET/POST /api/v1/leave-types`, `GET/PATCH/DELETE /api/v1/leave-types/:id`
- `GET/POST /api/v1/holidays`, `POST /api/v1/holidays/seed-official`, `PATCH /api/v1/holidays/sync-lunar`
- `POST /api/v1/leaves` (Apply leave with quota validation & conflict checks)
- `GET /api/v1/leaves/my` (Self-service leave history)
- `GET /api/v1/leaves/balance` (Live balance query)
- `GET /api/v1/leaves/approvals` (Role-scoped pending queue)
- `PATCH /api/v1/leaves/:id/decide` (Approve/Reject step in approval chain)
- `PATCH /api/v1/leaves/:id/cancel` (Cancel application and restore balance)
- `GET /api/v1/leaves/calendar` (Team conflict calendar)
- `POST /api/v1/leaves/encash` (Leave encashment request)
- `PATCH /api/v1/leave-balances/:id` (HR balance manual adjustment with audit trail)
- `GET /api/v1/reports/leaves` (ExcelJS styled report download)

## Permissions & RBAC
- **Employee**: `leave.apply` (own), `leave.view` (own), `leave.encash` (own).
- **Department Manager**: `leave.view` (team), `leave.approve` (team, limit: 3 days), `report.export` (team).
- **HR Manager**: `leave.settings` (all), `leave.approve` (all), `leave.encash` (all), `holiday.manage` (all), `report.export` (all).
- **Super Admin**: Unrestricted bypass (`manage all`).

## Key Architectural Decisions & Fixes Verified
1. **Multi-tier Approval Progression**: Leaves > 5 days dynamically require 3 levels: Department Manager -> HR Manager -> Super Admin.
2. **Approval Limits Enforcement**: Department Manager has a limit of 3 days. Intermediate chain approvers can endorse/approve their step; final approval strictly checks `checkApprovalLimit` or requires Super Admin bypass.
3. **Rollback & Cancellation**: Cancelling an approved leave prior to start date restores used quota to available and deletes linked `on_leave` records in M5 Attendance.
4. **Sandwich Rule**: Implemented in `leaveCalculator.js`; when `leavePolicy.sandwichRule: true`, weekends falling between leave days are counted as deductible.
5. **Excel Bulk Import**: Bulk employee import (`importEmployeesFromExcel`) automatically initializes annual leave balances for all active leave types.
