# Module M14: GPS / Geo-fencing Attendance

## Overview
Module M14 extends M5 (Attendance & Shifts) with spatial geofence enforcement, mock GPS detection, field punch capability, approved remote residence registration, flagged punch review workflow, and Leaflet interactive map visualizations.

## Key Architecture & Data Models
- **Attendance Model Extension (`backend/src/models/attendance.model.js`)**:
  - `location`: `{ latitude, longitude, accuracy, address, isMock, isClientVisit, clientName, clientRemarks }`
  - `isFlagged`: Boolean (indexed)
  - `flagReason`: Enum (`['geofence_violation', 'low_accuracy', 'mock_gps', 'none', null]`)
  - `flagResolved`: Boolean (indexed)
  - `flagResolution`: `{ decision ('approved' | 'rejected'), actorId, comments, resolvedAt }`
  - Unique compound index: `{ employeeId: 1, date: 1 }`
- **WFH Location Model (`backend/src/models/wfhLocation.model.js`)**:
  - `employeeId`, `name`, `address`, `latitude`, `longitude`, `radiusMeters` (10-150m, default 100m)
  - `status`: Enum (`'pending'`, `'approved'`, `'rejected'`)
  - `decisionBy`, `decisionAt`, `decisionRemarks`
  - `isDeleted`: Boolean (soft delete)
  - Indexes: `{ employeeId: 1, status: 1 }`, `{ employeeId: 1, isDeleted: 1 }`
- **Haversine Distance Calculator (`backend/src/utils/haversine.js`)**:
  - Earth radius: 6,371,000 meters
  - Precision unit test verified against known benchmarks.

## New API Endpoints
- `POST /api/v1/attendance/check-in` & `POST /api/v1/attendance/check-out`: Enhanced with GPS coords, accuracy, mock flag, client visit metadata. Rate-limited by `punchLimiter`.
- `GET /api/v1/attendance/flagged`: Paginated flagged punch review queue with `status` filter ('pending' | 'resolved' | 'all') and horizontal manager scoping.
- `PATCH /api/v1/attendance/flagged/:id/review`: Approve or regularize flagged punches; rejection sets attendance status to 'absent'; logs to `attendance.auditLogs`; blocks self-approval.
- `GET /api/v1/attendance/locations?date=YYYY-MM-DD`: Returns employee punch markers (color-coded) and active office geofence circles; strips PII.
- `GET /api/v1/attendance/wfh-locations`: Returns registered residences (employees see self, HR/Admin see all).
- `POST /api/v1/attendance/wfh-locations`: Employee submits home coords + radius; rate-limited by `requestsLimiter`.
- `PATCH /api/v1/attendance/wfh-locations/:id/status`: Approve or reject registered residence with separation-of-duties check.
- `DELETE /api/v1/attendance/wfh-locations/:id`: Soft-delete WFH location (restricted to owner or HR).

## Permissions & RBAC
- `attendance.fieldCheckIn`: Allows sales/field agents to perform client-site visits without geofence violation flags.
- `attendance.geo.view`: Allows managers/HR to view punch locations on Leaflet map.
- `attendance.wfh`: Allows registering and viewing WFH residences.
- `attendance.approve`: Allows managers/HR to approve/reject flagged punches and WFH residences.

## Security Decisions & Hardening
- **Zero Continuous Polling**: Single-shot GPS capture on explicit punch button click only (Privacy Guarantee).
- **Separation of Duties (Dual Control)**: Explicit server-side guards block managers and HR from self-approving flagged punches or self-approving their own WFH locations.
- **Mock GPS & Zero Accuracy**: Coordinate payloads with `isMock: true` or synthetic `accuracy <= 0` are flagged as `mock_gps`.
- **Pre-Payroll Month Lock Integration**: `getMonthLockStatus` returns `pendingFlaggedPunches` to warn HR before locking attendance for payroll.
- **Cache Synchronization**: RTK Query tags `FlaggedAttendance` and `AttendanceLocations` invalidate on `checkIn`, `checkOut`, and `reviewFlaggedPunch`.
