# Module M14 — GPS / Geo-fencing Smart Attendance Architecture

## 1. Overview
- **Module**: M14 GPS / Geo-fencing Smart Attendance (BUILD-GUIDE Section 17 · Rows 14.1 to 14.8)
- **Domain**: Spatial attendance verification, geofenced boundaries, WFH registered residences, outdoor client-site visits, and spatial analytics.

## 2. Models & Data Structures
- **`WfhLocation` (`backend/src/models/wfhLocation.model.js`)**:
  - `employeeId` (Ref: Employee, required, index: true)
  - `name`: String (e.g. "Primary Residence - Gulshan")
  - `address`: String (complete physical address)
  - `latitude`: Number (-90 to 90)
  - `longitude`: Number (-180 to 180)
  - `radiusMeters`: Number (10 to 150m, default 100m)
  - `status`: Enum `['pending', 'approved', 'rejected']` (default: `'pending'`)
  - `decisionRemarks`: String
  - Compound Index: `{ employeeId: 1, status: 1 }`, `{ status: 1 }`
- **`Attendance` model spatial extensions (`backend/src/models/attendance.model.js`)**:
  - `location`: `{ latitude, longitude, accuracy, address, isMock, isClientVisit, clientName, clientRemarks }`
  - `isFlagged`: Boolean (indexed)
  - `flagReason`: Enum `['geofence_violation', 'low_accuracy', 'mock_gps', null]`
  - `distanceFromOfficeMeters`: Number
  - `flagResolved`: Boolean
  - `flagResolution`: `{ decision: 'approved' | 'rejected', actorId, comments, resolvedAt }`

## 3. Utilities & Mathematical Algorithms
- **Haversine Distance Engine (`backend/src/utils/haversine.js`)**:
  - Computes exact great-circle spherical distance: $R = 6,371,000\text{ m}$.
  - Accuracy: $\pm 1\text{ m}$ verified against real coordinates.

## 4. API Endpoints Surface
- `POST /api/v1/attendance/check-in`: Validates proximity against `Setting.geoFences` (Row 2.8) and approved `WfhLocation`. Flags out-of-bounds or weak GPS signals.
- `GET /api/v1/attendance/flagged`: Queue of flagged punches (scoped to team for Department Managers; company-wide for HR/Super Admin).
- `PATCH /api/v1/attendance/flagged/:id/review`: Approve/reject flagged punch.
- `GET /api/v1/attendance/locations?date=YYYY-MM-DD`: Spatial punch coordinates and active office geofence perimeters for Leaflet map.
- `GET /api/v1/attendance/wfh-locations`: List registered remote residences.
- `POST /api/v1/attendance/wfh-locations`: Employee registration of home residence.
- `PATCH /api/v1/attendance/wfh-locations/:id/status`: HR/Admin approval or rejection of WFH residence.
- `DELETE /api/v1/attendance/wfh-locations/:id`: Remove WFH residence.

## 5. Security & RBAC Permissions
- `attendance.fieldCheckIn`: Enables outdoor client visits without geofence penalties.
- `attendance.geo.view`: Grants access to spatial map views.
- `attendance.wfh`: Access to register and manage WFH locations.
- `attendance.approve`: Review flagged punches queue and decide resolutions.

## 6. Privacy Mandate (Row 14.8)
- Zero continuous tracking: GPS is captured strictly on the user click event of the punch action.
- No background location polling or tracking daemons.
