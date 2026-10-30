# Tasks Checklist: M14 — GPS / Geo-fencing Attendance

**Feature**: M14 GPS / Geo-fencing Smart Attendance  
**Spec Reference**: [`.specify/specs/15-geofence/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/15-geofence/spec.md)  
**Plan Reference**: [`.specify/specs/15-geofence/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/15-geofence/plan.md)  
**Target Branch**: `feature/15-geofence`  
**Status**: Ready for Implementation  

---

## Foundation & RBAC Setup

- [x] 14.0-CONFIG Add new permission actions (`attendance.fieldCheckIn`, `attendance.geo.view`) to [`backend/src/shared/permissions.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/shared/permissions.js) and seed them across the 4 core roles in [`backend/src/seed/roles.seed.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/seed/roles.seed.js).

---

## Slice 14.1: Haversine Distance Engine (Priority: P1 · BUILD-GUIDE ID 14.1)

- [x] 14.1-BE Create server-side distance calculation utility [`backend/src/utils/haversine.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/utils/haversine.js) using the Haversine spherical trigonometric formula ($R = 6,371,000 \text{ m}$), returning precise distance between two coordinate pairs in meters.
- [x] 14.1-TEST Create unit test suite [`backend/tests/haversine.test.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/tests/haversine.test.js) asserting that identical coordinates return 0.00 meters and known benchmark coordinates (Karachi Head Office to Clifton Branch) calculate accurately within $\pm 1 \text{ m}$.

---

## Slice 14.2: Location-Enforced Geofenced Check-In (Priority: P1 · BUILD-GUIDE ID 14.2)

- [x] 14.2-BE-1 Extend [`backend/src/models/attendance.model.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/models/attendance.model.js) to store spatial metadata: `accuracy`, `distanceFromOfficeMeters`, `isFlagged` (boolean, indexed), and `flagReason`.
- [x] 14.2-BE-2 Update `checkInSchema` in [`backend/src/modules/attendance/attendance.validation.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/attendance/attendance.validation.js) to validate `latitude` (-90 to 90), `longitude` (-180 to 180), `accuracy` (positive number), `isMock` (boolean), and optional `isClientVisit`.
- [x] 14.2-BE-3 Implement geofence proximity evaluation in `checkIn` within [`backend/src/modules/attendance/attendance.service.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/attendance/attendance.service.js): load active office boundaries from `settings.geoFences` (Row 2.8), compute distance via `haversine.js`, reject or flag punches exceeding geofence radius.
- [x] 14.2-FE-1 Create custom React hook [`frontend/src/hooks/useGeolocation.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/hooks/useGeolocation.js) wrapping `navigator.geolocation.getCurrentPosition` with high accuracy options (`enableHighAccuracy: true`, `timeout: 10000`), error handling (permission denied, position unavailable), and accuracy warnings.
- [x] 14.2-FE-2 Create [`frontend/src/features/attendance/components/GeoLocationBadge.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/components/GeoLocationBadge.jsx) to visually render proximity status (Inside Office Fence / Out of Bounds / Weak Signal) with live distance indicators.
- [x] 14.2-FE-3 Integrate `useGeolocation` and `GeoLocationBadge` into [`frontend/src/features/attendance/components/PunchCardWidget.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/components/PunchCardWidget.jsx), sending coordinates with the check-in mutation payload.
- [x] 14.2-TEST Add integration tests verifying geofence validation: clock-in inside office perimeter succeeds normally; clock-in outside perimeter is flagged or rejected.

---

## Slice 14.3: Accuracy & Mock GPS Spoofing Detection (Priority: P1 · BUILD-GUIDE ID 14.3)

- [x] 14.3-BE Extend `attendance.service.js` check-in validation to inspect GPS `accuracy` against threshold (default $> 100 \text{ m}$) or `isMock: true`, flagging suspicious check-ins with `isFlagged: true` and `flagReason: 'low_accuracy'` or `'mock_gps'`.
- [x] 14.3-FE Update `useGeolocation.js` and `PunchCardWidget.jsx` to alert users when their device GPS signal is weak ($> 100 \text{ m}$), warning them that attendance will be recorded with a flag for manager verification.
- [x] 14.3-TEST Add test cases asserting that check-in requests with `accuracy: 150` or `isMock: true` persist with `isFlagged: true`.

---

## Slice 14.8: Employee Privacy Guarantee & Zero Continuous Tracking (Priority: P1 · BUILD-GUIDE ID 14.8)

- [x] 14.8-BE Enforce architectural invariant: backend exposes no continuous GPS tracking or background location streaming endpoints; coordinates are stored strictly inside the `Attendance` document at the discrete punch timestamp.
- [x] 14.8-FE Add Attendance Privacy Notice component / alert banner in [`frontend/src/features/attendance/components/PunchCardWidget.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/components/PunchCardWidget.jsx) explicitly notifying the employee that location is accessed only upon pressing the punch button.
- [x] 14.8-TEST Verify audit log generated at check-in confirms location was logged only as a discrete event without recurring background queries.

---

## Slice 14.6: Flagged Punches Review & Resolution Queue (Priority: P1 · BUILD-GUIDE ID 14.6)

- [x] 14.6-BE-1 Add `flagResolved` (boolean), `flagResolution` (`decision`, `actorId`, `comments`, `resolvedAt`) fields to `attendance.model.js`.
- [x] 14.6-BE-2 Create `flaggedReviewSchema` in `attendance.validation.js` validating `decision` (`approved`, `rejected`) and mandatory `comments` (min 5 characters).
- [x] 14.6-BE-3 Implement `getFlaggedPunches` and `reviewFlaggedPunch` in `attendance.service.js` scoped by role (Managers review team direct reports; HR/Super Admin review company-wide). Expose `GET /api/v1/attendance/flagged` and `PATCH /api/v1/attendance/flagged/:id/review` protected by `checkPermission('attendance.approve', 'Attendance')`.
- [x] 14.6-FE-1 Add `useGetFlaggedPunchesQuery` and `useReviewFlaggedPunchMutation` in [`frontend/src/features/attendance/attendanceApi.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/attendanceApi.js).
- [x] 14.6-FE-2 Build [`frontend/src/features/attendance/pages/FlaggedPunchesPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/pages/FlaggedPunchesPage.jsx) rendering table of flagged punches with distance, flag reasons, interactive review modal, and decision actions.
- [x] 14.6-FE-3 Register `/attendance/flagged` route in [`frontend/src/App.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/App.jsx) and add navigation entry to [`frontend/src/components/layout/Sidebar.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/components/layout/Sidebar.jsx) gated by `<Can I="attendance.approve">`.
- [x] 14.6-TEST Add integration tests: Manager resolves direct report's flagged punch; unauthorized employee is blocked from accessing flagged queue (HTTP 403).

---

## Slice 14.4: Approved WFH Locations Management (Priority: P2 · BUILD-GUIDE ID 14.4)

- [x] 14.4-BE-1 Create Mongoose model [`backend/src/models/wfhLocation.model.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/models/wfhLocation.model.js) with `employeeId`, `name`, `address`, `latitude`, `longitude`, `radiusMeters` (default 100m, max 150m), `status` (`pending`, `approved`, `rejected`), `decisionBy`, `decisionAt`, and compound index on `{ employeeId: 1, status: 1 }`.
- [x] 14.4-BE-2 Create `createWfhLocationSchema` and `updateWfhLocationStatusSchema` in `attendance.validation.js`.
- [x] 14.4-BE-3 Implement WFH location CRUD & status update in `attendance.service.js`. In `checkIn`, check if user is within any approved WFH location for this employee, clearing geofence violation flags. Expose routes under `/api/v1/attendance/wfh-locations`.
- [x] 14.4-FE-1 Add WFH location RTK Query endpoints (`useGetWfhLocationsQuery`, `useCreateWfhLocationMutation`, `useUpdateWfhLocationStatusMutation`) in `attendanceApi.js`.
- [x] 14.4-FE-2 Build [`frontend/src/features/attendance/components/WfhLocationModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/components/WfhLocationModal.jsx) with address input, auto-detect location button, radius selector, and map preview.
- [x] 14.4-FE-3 Build [`frontend/src/features/attendance/pages/WfhLocationsPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/pages/WfhLocationsPage.jsx) showing employee's own registered remote locations and HR management approval table.
- [x] 14.4-TEST Add integration tests: employee submits home location (`status: pending`); HR approves; employee checks in from home coordinates successfully without flags.

---

## Slice 14.5: Client-Site Field Visit Check-In (Priority: P2 · BUILD-GUIDE ID 14.5)

- [x] 14.5-BE Update `checkIn` service logic to verify `attendance.fieldCheckIn` permission when `isClientVisit: true`: allow check-in anywhere, tag `flags: ['field']` and `source: 'field'`, and store client visit details in attendance record without geofence penalties.
- [x] 14.5-FE In `PunchCardWidget.jsx`, display "Client Visit / On-Field Punch" checkbox (visible only if user holds `attendance.fieldCheckIn` permission) with client name input field.
- [x] 14.5-TEST Add integration test asserting field sales staff with `attendance.fieldCheckIn` can check in 50km away from office with client visit notes without being flagged.

---

## Slice 14.7: Interactive Punch Map (Priority: P2 · BUILD-GUIDE ID 14.7)

- [x] 14.7-BE Implement `getPunchLocations` in `attendance.service.js` aggregating daily attendance records with coordinates, employee details, and active office geofences. Expose `GET /api/v1/attendance/locations?date=YYYY-MM-DD` scoped to user permissions.
- [x] 14.7-FE-1 Build [`frontend/src/features/attendance/components/PunchMap.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/components/PunchMap.jsx) using Leaflet (v1.9.4) rendering circular office geofence overlays (`L.circle`) and color-coded punch pins (`L.marker`) with informative popups.
- [x] 14.7-FE-2 Build [`frontend/src/features/attendance/pages/PunchLocationsMapPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/pages/PunchLocationsMapPage.jsx) with date picker, department filter, attendance status badges, and full-screen map view.
- [x] 14.7-TEST Add integration test verifying `GET /api/v1/attendance/locations` returns valid coordinate objects and office geofence metadata with proper team/department scoping.

---

## Module Verification & End-to-End System Tests

- [x] 14.E2E-TEST Module M14 end-to-end Playwright test, chaaron roles se: Super Admin, HR Manager, Department Manager, and Employee verifying geofenced check-in, out-of-bounds punch flagging, WFH remote location registration & HR approval, client site field check-in, flagged punches review, and Leaflet punch map rendering ([`tests/e2e/m14-geofence.spec.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/tests/e2e/m14-geofence.spec.js)).
