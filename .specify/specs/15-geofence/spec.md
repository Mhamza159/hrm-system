# Feature Specification: Module M14 — GPS / Geo-Fencing Attendance

**Module Code**: `M14`  
**Feature Name**: GPS / Geo-fencing Attendance  
**Specification Directory**: `.specify/specs/15-geofence`  
**Source of Truth**: 
- `docs/FRD.md`: Section M14 (GPS / Geo-fencing), Section 11 (Permission Matrix Row M14)
- `docs/BUILD-GUIDE.md`: Section 17 (Rows 14.1 to 14.8)
- `docs/TECH-SPEC.md`: Sections 3, 4, 5, 6, 8

---

## 1. Executive Summary & Domain Scope

Module M14 extends the HRM smart attendance engine with geographical boundaries, spatial proximity validation, approved remote locations, and spoofing defenses:
1. **Mathematical Spatial Engine**: Server-side spherical distance calculation via the Haversine formula ($R = 6,371,000 \text{ m}$), eliminating client-side trust boundaries.
2. **Geofenced Check-In & Check-Out**: Validation of punch coordinates (`latitude`, `longitude`, `accuracy`) against configured company office boundaries (`settings.geoFences` per BUILD-GUIDE Row 2.8) and approved WFH coordinates. Out-of-bounds punches are blocked or marked `flagged`.
3. **Accuracy & Mock GPS Defense**: Detection of low GPS precision (`accuracy > 100m`) and mock location flags. Suspicious punches are marked `flagged` for administrative review.
4. **Approved WFH Locations**: Pre-approval workflow for remote employees' residences or co-working spaces with customized radius allowances.
5. **Client-Site / Field-Visit Attendance**: Special capability for on-duty sales and field agents holding `attendance.fieldCheckIn` permission to check in at client premises with mandatory visit notes.
6. **Flagged Punch Management**: Centralized queue for managers and HR to audit and approve or reject suspicious check-ins.
7. **Spatial Visualization (Punch Map)**: Interactive Leaflet map with OpenStreetMap tiles displaying office geofence perimeters and punch coordinate pins.
8. **Strict Privacy Architecture**: Location coordinates are queried **strictly at check-in/check-out time**. No background or continuous location tracking is performed.

---

## 2. Role-Based Access Control (RBAC) Matrix (FRD Section 11)

| Role | Scope | Permissions & Allowed Capabilities |
|---|---|---|
| **Super Admin** | `all` | Full access. Define office geofences and default radius thresholds; view organization-wide punch map; review any flagged punch. |
| **HR Manager** | `all` / `manage` | Manage WFH location approvals; review and resolve flagged punches across departments; view company-wide punch map and geofence settings. |
| **Department Manager** | `team` | View team members' check-in locations at punch time only on Punch Map; review and recommend flagged punches for direct reports. |
| **Employee** | `own` | Check in/out with browser/device geolocation; view own punch history; apply for WFH approved location; field check-in (if granted). |

---

## 3. User Stories & Acceptance Criteria (BUILD-GUIDE Section 17)

### Story 14.1: Haversine Spherical Distance Engine (BUILD-GUIDE Row 14.1 · P1)
> **As a** System Architect,  
> **I want** a server-side Haversine mathematical utility,  
> **So that** distance between employee punch coordinates and target geofences is accurately computed in meters without third-party API dependencies.

#### Acceptance Criteria
* **Given** two valid WGS84 coordinate pairs $(lat_1, lon_1)$ and $(lat_2, lon_2)$,
* **When** `calculateHaversineDistance(lat1, lon1, lat2, lon2)` is executed on the server,
* **Then** it returns the exact great-circle distance in meters using Earth radius $R = 6,371,000 \text{ m}$.
* **Role Specifics**:
  * **All Roles**: System calculations are uniform and deterministic. Unit tests verify known geographical benchmark points (e.g., Karachi Head Office to Clifton Branch within $\pm 1 \text{ m}$ tolerance).

---

### Story 14.2: Location-Enforced Geofenced Check-In (BUILD-GUIDE Row 14.2 · P1)
> **As an** Employee,  
> **I want** to clock in using my device's GPS coordinates,  
> **So that** my attendance is confirmed inside the authorized office geofence.

#### Acceptance Criteria
* **Given** an authenticated employee attempting to check in via web or mobile,
* **When** coordinates (`latitude`, `longitude`, `accuracy`) are transmitted with the clock-in request,
* **Then** the server verifies distance against active company geofences (`settings.geoFences`):
  * If distance $\le$ `radiusMeters`: Check-in succeeds with `status: 'present'` and coordinates saved in `attendance.location`.
  * If distance $>$ `radiusMeters` and employee does not have an approved WFH or Field permit: Check-in is rejected with `HTTP 403` or marked `flagged` with reason `"Out of geofence bounds"`.
* **Role Specifics**:
  * **Employee**: Receives clear visual indicator (inside fence: green; outside: red warning distance in meters).
  * **Super Admin / HR**: Can configure office center coordinates and radius in company settings.

---

### Story 14.3: Accuracy & Mock GPS Spoofing Detection (BUILD-GUIDE Row 14.3 · P1)
> **As an** HR Manager,  
> **I want** the system to detect mock locations and imprecise GPS signals,  
> **So that** location spoofing and proxy check-ins are intercepted.

#### Acceptance Criteria
* **Given** an employee submitting a check-in payload,
* **When** `accuracy` exceeds the configured threshold (default $> 100 \text{ m}$) or client indicators signal mock location provider,
* **Then** the punch is accepted but flagged with `flagType: 'low_accuracy'` or `flagType: 'mock_gps'`, triggering a notification to HR/Manager.
* **Role Specifics**:
  * **Employee**: Prompted with "Weak GPS signal detected. Attendance recorded but flagged for manager verification."
  * **HR / Manager**: Flagged punch queue displays accuracy rating (in meters) and warning badge.

---

### Story 14.4: Approved WFH Locations Management (BUILD-GUIDE Row 14.4 · P2)
> **As a** Remote / Hybrid Employee,  
> **I want** to submit my approved home/remote location coordinates,  
> **So that** I can check in while working from home without being falsely flagged.

#### Acceptance Criteria
* **Given** an active employee,
* **When** the employee registers an address with GPS coordinates and radius (max $150 \text{ m}$) via `POST /api/v1/attendance/wfh-locations`,
* **Then** the record is created with `status: 'pending'` in `wfhLocation.model.js`.
* **When** HR Manager approves the request (`PATCH /api/v1/attendance/wfh-locations/:id/status`),
* **Then** the location becomes active. Subsequent check-ins by that employee within that radius are accepted as valid WFH punches.
* **Role Specifics**:
  * **Employee**: Can view list of own registered remote locations and statuses (`pending`, `approved`, `rejected`).
  * **HR Manager**: Reviews pending WFH location requests, verifies address, and approves/rejects with remarks.

---

### Story 14.5: Client-Site Field Visit Check-In (BUILD-GUIDE Row 14.5 · P2)
> **As an** On-Field Sales / Support Executive,  
> **I want** to check in from a client site,  
> **So that** my attendance is logged without requiring office geofence proximity.

#### Acceptance Criteria
* **Given** an employee possessing the `attendance.fieldCheckIn` permission,
* **When** checking in with `isClientVisit: true`, `clientName`, and `remarks`,
* **Then** the punch is accepted outside office geofences, tagged with `source: 'field'`, and stores client visit metadata alongside GPS coordinates.
* **Role Specifics**:
  * **Employee without permission**: Attempting client-site check-in receives `HTTP 403 Forbidden`.
  * **Department Manager**: Can view client visit details, coordinates, and timestamp on punch review.

---

### Story 14.6: Flagged Punches Review & Resolution Queue (BUILD-GUIDE Row 14.6 · P1)
> **As a** Department Manager or HR Manager,  
> **I want** a dedicated review queue for flagged out-of-bounds punches,  
> **So that** I can regularize legitimate emergencies or penalize illegitimate punches.

#### Acceptance Criteria
* **Given** punches flagged due to distance, low accuracy, or mock GPS,
* **When** Manager/HR views `GET /api/v1/attendance/flagged`,
* **Then** records are listed with employee name, punch time, coordinates, distance from nearest geofence, and flag reasons.
* **When** Manager/HR decides (`PATCH /api/v1/attendance/flagged/:id/review`) with `action: 'approve' | 'reject'` and mandatory comments,
* **Then** the attendance record status is updated (`flagResolved: true`, `flagResolution: { decision, actorId, comments, resolvedAt }`).
* **Role Specifics**:
  * **Department Manager**: Can review direct reports' flagged punches (scoped to `team`).
  * **HR Manager / Super Admin**: Can review and override across the entire organization.

---

### Story 14.7: Interactive Punch Map (BUILD-GUIDE Row 14.7 · P2)
> **As a** Department Manager or HR Manager,  
> **I want** to visualize check-in locations on an interactive Leaflet map,  
> **So that** I can visually inspect punch distributions and office boundary compliance.

#### Acceptance Criteria
* **Given** an authorized user on `/attendance/locations`,
* **When** selecting a date and optional department filter,
* **Then** the Leaflet map renders:
  1. Office geofences as semi-transparent circular overlays (`L.circle`) with radius matching configured meters.
  2. Employee check-in pins (`L.marker`) colored green (inside fence), blue (approved WFH), and red (flagged / out of fence).
  3. Clicking a pin displays popup with employee name, employee code, check-in time, and distance to nearest office.
* **Role Specifics**:
  * **Department Manager**: Map pins strictly filtered to direct team members (`team` scope).
  * **HR / Admin**: Can view company-wide pins or filter by department.

---

### Story 14.8: Employee Privacy Notice & Zero Continuous Tracking (BUILD-GUIDE Row 14.8 · P1)
> **As an** Employee,  
> **I want** explicit privacy guarantees and transparency,  
> **So that** I know my location is only accessed when I press the check-in button and never tracked in the background.

#### Acceptance Criteria
* **Given** the frontend attendance interface,
* **When** geolocation is requested,
* **Then** a clear Attendance Privacy Notice is displayed: *"Location is captured only at check-in/out time to verify office proximity. Background tracking is strictly prohibited and never performed."*
* **Security & Architectural Invariant**:
  * Backend contains **zero background telemetry, polling, or continuous location stream routes**.
  * Location coordinates are stored strictly inside the `Attendance` document generated at punch moments.

---

## 4. Technical Architecture & Library Patterns (Context7 Fetch)

### Leaflet (v1.9.4) Syntax Standard:
Per official Leaflet ESM standards verified via Context7:
```javascript
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 1. Initialize Map
const map = L.map('punch-map-container').setView([24.8607, 67.0011], 13);

// 2. OpenStreetMap Tile Layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// 3. Office Geofence Circle Overlay
L.circle([officeLat, officeLng], {
  color: '#059669', // Emerald
  fillColor: '#10b981',
  fillOpacity: 0.2,
  radius: officeRadiusMeters
}).addTo(map).bindPopup('<b>Karachi Head Office</b><br>Radius: 100m');

// 4. Punch Marker with Popup
L.marker([punchLat, punchLng])
  .addTo(map)
  .bindPopup('<b>Bilal Khan</b><br>Clock In: 09:02 AM<br>Status: Inside Fence');
```

---

## 5. Definition of Done (DoD)
1. Complete Vertical Slices 14.1 to 14.8 implemented without placeholders (plain JavaScript).
2. Backend routes protected with `authenticate`, `validate` (Zod), and CASL `checkPermission`.
3. Unit tests verifying Haversine calculations and mock coordinates.
4. Multi-role E2E test covering Employee, Department Manager, HR Manager, and Super Admin.
5. All tests passing and clean Vite production build.

