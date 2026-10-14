# Feature Specification: Module M2 — Company Settings

**Feature Branch**: `feature/04-company-settings`  
**Created**: 2026-10-13  
**Status**: Draft  
**Module ID**: M2  
**Module Name**: Company Settings  
**Governing Documents**:
- [`docs/FRD.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/FRD.md) Section 5 (M2. Company Settings) & Section 11 (Permission Matrix M2 Row)
- [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 6 (Rows 2.1 to 2.11)
- [`docs/TECH-SPEC.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/TECH-SPEC.md) Section 1, 2, 4 & 5

---

## 1. Executive Summary & Architecture Integration

Module M2 centralizes all operational, financial, temporal, and localization configuration for the single software house deployment. All configuration parameters are persisted as strongly-typed, schema-validated key-value documents in MongoDB (`settings` collection) rather than hardcoded in application logic. This guarantees that Pakistan statutory tax brackets, EOBI contribution percentages, office working hours, grace periods, leave policies, and office geo-fences remain dynamically tunable by HR and Executive leadership without requiring code changes or redeployments.

### Authorization & Scope Alignment
- **Super Admin**: Full administrative control across all settings keys (`settings.manage`), logo asset uploads, and manual database backup triggers (`POST /settings/backup-now`).
- **HR Manager**: Manage administrative settings (`settings.manage`), update working schedules, leave policies, late arrival rules, tax brackets, and notification templates.
- **Department Manager**: Read-only access to company policies (`settings.view`). Cannot mutate any settings key or trigger system backups.
- **Employee**: Read-only access to published company policies (`settings.view`). Cannot mutate any settings key or trigger system backups.

### Layer Flow Invariant
`routes` $\rightarrow$ `validate` (Zod) $\rightarrow$ `checkPermission('settings.manage' | 'settings.view')` (CASL) $\rightarrow$ `controller` $\rightarrow$ `service` $\rightarrow$ `model` (`Setting`).

---

## 2. Context7 Verified Library Syntax Patterns

### 2.1 Backend Form-Data & Logo Upload (`multer` v1.4+)
*Source: Express Multer official documentation via Context7 (`/expressjs/multer`)*
```javascript
import multer from 'multer';
import path from 'path';
import { ApiError } from '../utils/ApiError.js';

// Memory storage or designated disk storage for local asset handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/logos/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `company-logo-${Date.now()}${ext}`);
  }
});

export const logoUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid logo format. Only PNG, JPEG, WEBP, and SVG are supported.'));
    }
  }
});
```

### 2.2 Geo-Fence Map Editor (`leaflet` v1.9+)
*Source: Leaflet OpenStreetMap Quickstart via Context7 (`/leaflet/leaflet`)*
```javascript
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Initialize map centered at office coordinates (e.g. Lahore / Islamabad / Karachi, Pakistan)
export const initGeoFenceMap = (containerElement, { latitude, longitude, radiusMeters, onLocationSelect }) => {
  const map = L.map(containerElement).setView([latitude, longitude], 16);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
  let circle = L.circle([latitude, longitude], {
    color: '#5E6AD2',
    fillColor: '#5E6AD2',
    fillOpacity: 0.2,
    radius: radiusMeters
  }).addTo(map);

  const updatePosition = (lat, lng) => {
    marker.setLatLng([lat, lng]);
    circle.setLatLng([lat, lng]);
    if (onLocationSelect) onLocationSelect(lat, lng);
  };

  map.on('click', (e) => {
    updatePosition(e.latlng.lat, e.latlng.lng);
  });

  marker.on('dragend', (e) => {
    const position = marker.getLatLng();
    updatePosition(position.lat, position.lng);
  });

  return {
    map,
    updateRadius: (newRadius) => circle.setRadius(newRadius),
    destroy: () => map.remove()
  };
};
```

---

## 3. User Scenarios & Acceptance Criteria (11 User Stories)

### User Story 1 — Settings Key-Value Model & Dynamic Engine (BUILD-GUIDE Row 2.1)
**Priority**: P1  
**Why this priority**: Foundational persistent datastore for all configuration categories. Without this, no subsequent company settings can be stored, cached, or retrieved.  
**Independent Test**: `GET /api/v1/settings/:key` and `PATCH /api/v1/settings/:key` properly persist, validate, and return the updated payload, retaining values across server reboots.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin is authenticated with `settings.manage`,
   - **When** calling `PATCH /api/v1/settings/testKey` with `{ "value": { "enabled": true } }`,
   - **Then** receive HTTP 200 with standard envelope `{ success: true, data: { key: "testKey", value: { "enabled": true } } }`, and subsequent `GET /api/v1/settings/testKey` returns the saved state immediately.
2. **HR Manager**:
   - **Given** HR Manager is authenticated with `settings.manage`,
   - **When** updating an allowed setting key,
   - **Then** receive HTTP 200 with persistent confirmation.
3. **Department Manager**:
   - **Given** Department Manager is authenticated with `settings.view` only,
   - **When** calling `PATCH /api/v1/settings/testKey`,
   - **Then** receive HTTP 403 Forbidden with `{ success: false, message: "Forbidden" }`.
4. **Employee**:
   - **Given** Employee is authenticated,
   - **When** calling `PATCH /api/v1/settings/testKey`,
   - **Then** receive HTTP 403 Forbidden.

---

### User Story 2 — Company Profile & Logo Asset Upload (BUILD-GUIDE Row 2.2)
**Priority**: P1  
**Why this priority**: Brands the application, establishes corporate legal entity data (NTN/STRN, official address, contact info) and provides the company logo rendered across topbar and future PDF payslips.  
**Independent Test**: Super Admin submits company name, address, NTN, and uploads a PNG logo; topbar reflects the new logo URL and legal info persists under key `company`.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin is on `SettingsPage` $\rightarrow$ Company Profile tab,
   - **When** uploading a valid PNG logo (1 MB) and entering company name "Starlight Software Ltd", address "Plot 14, Sector I-9, Islamabad", NTN "7284910-3",
   - **Then** receive HTTP 200, the logo file is stored, the `company` setting is updated, and the UI displays the preview immediately.
2. **HR Manager**:
   - **Given** HR Manager is authenticated with `settings.manage`,
   - **When** updating company phone number and official support email,
   - **Then** receive HTTP 200 with updated profile data.
3. **Department Manager**:
   - **Given** Department Manager attempts `POST /api/v1/settings/company/logo` or `PATCH /api/v1/settings/company`,
   - **When** sending request,
   - **Then** receive HTTP 403 Forbidden.
4. **Employee**:
   - **Given** Employee is authenticated,
   - **When** attempting to modify company profile or logo,
   - **Then** receive HTTP 403 Forbidden.

---

### User Story 3 — Working Days & Standard Office Hours (BUILD-GUIDE Row 2.3)
**Priority**: P1  
**Why this priority**: Defines the canonical operating schedule (active working days, standard check-in time, standard check-out time, half-day duration). Required by Module M5 for attendance and tardiness tracking.  
**Independent Test**: Setting Monday–Friday, 09:00 to 18:00 with Saturday & Sunday off saves under key `workingDays` & `officeHours` and is accessible by attendance validators.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin accesses Working Hours settings,
   - **When** toggling active days `['monday', 'tuesday', 'wednesday', 'thursday', 'friday']`, setting `startTime: "09:00"` and `endTime: "18:00"`,
   - **Then** receive HTTP 200, and `workingDays` and `officeHours` are saved to MongoDB.
2. **HR Manager**:
   - **Given** HR Manager modifies office hours to winter timings (`08:30` to `17:30`),
   - **When** submitting the form,
   - **Then** receive HTTP 200 with the updated schedule reflected in system configurations.
3. **Department Manager**:
   - **Given** Department Manager accesses the application,
   - **When** attempting to alter working days or timings via API,
   - **Then** receive HTTP 403 Forbidden.
4. **Employee**:
   - **Given** Employee accesses the application,
   - **When** attempting to modify working hours,
   - **Then** receive HTTP 403 Forbidden.

---

### User Story 4 — Late Arrival Rules & Penalty Deductions (BUILD-GUIDE Row 2.4)
**Priority**: P1  
**Why this priority**: Enforces workplace punctuality policies. Configures grace period minutes, late-count threshold for half-day deduction, and salary penalty deduction formulas.  
**Independent Test**: Updating `graceMinutes: 15`, `lateThresholdMinutes: 30`, `halfDayAfterLateCount: 3` under key `lateRules` verifies persistent calculation parameters.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin configures attendance rules,
   - **When** submitting `graceMinutes: 15`, `halfDayThresholdCount: 3` (3 late arrivals = 1 half-day deduction),
   - **Then** receive HTTP 200 with validated Zod schema and persistent storage.
2. **HR Manager**:
   - **Given** HR Manager updates `graceMinutes` from 10 to 15 minutes during Ramadan,
   - **When** updating `lateRules`,
   - **Then** receive HTTP 200 and audit log entry created.
3. **Department Manager**:
   - **Given** Department Manager attempts to modify late penalty rules,
   - **When** dispatching `PATCH /api/v1/settings/lateRules`,
   - **Then** receive HTTP 403 Forbidden.
4. **Employee**:
   - **Given** Employee attempts to modify late arrival rules,
   - **When** dispatching request,
   - **Then** receive HTTP 403 Forbidden.

---

### User Story 5 — Leave Policy Definitions (BUILD-GUIDE Row 2.5)
**Priority**: P1  
**Why this priority**: Establishes global leave management guidelines, fiscal year cycle, multi-tier approval requirements, sandwich rule enforcement, and carry-forward caps needed by Module M6.  
**Independent Test**: Saving `fiscalYearStart: "January"`, `approvalChainLevels: 2`, `carryForwardLimit: 5` under key `leavePolicy` is retrievable by leave quota engines.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin configures Leave Policy tab,
   - **When** defining `fiscalYearStart: "July"`, `encashmentAllowed: true`, `sandwichRule: true`,
   - **Then** receive HTTP 200 with persisted policy object.
2. **HR Manager**:
   - **Given** HR Manager updates `carryForwardLimit` to 7 days,
   - **When** submitting the form,
   - **Then** receive HTTP 200 with updated policy settings.
3. **Department Manager**:
   - **Given** Department Manager attempts to edit leave policy,
   - **When** dispatching `PATCH /api/v1/settings/leavePolicy`,
   - **Then** receive HTTP 403 Forbidden.
4. **Employee**:
   - **Given** Employee attempts to edit leave policy,
   - **When** dispatching request,
   - **Then** receive HTTP 403 Forbidden.

---

### User Story 6 — Payroll Cycle & Pay Day Scheduling (BUILD-GUIDE Row 2.6)
**Priority**: P1  
**Why this priority**: Fixes the recurring monthly payroll generation timeframe (cutoff day, monthly pay disbursement date, custom vs calendar month cycle) for Module M9.  
**Independent Test**: Saving `cycleType: "calendar_month"`, `cutoffDay: 30`, `disbursementDay: 5` under key `payrollCycle` governs payroll generation boundaries.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin configures Payroll Settings tab,
   - **When** specifying disbursement on the 5th of every month with cutoff on 30th/31st,
   - **Then** receive HTTP 200 with valid integer day constraints (1–31).
2. **HR Manager**:
   - **Given** HR Manager updates disbursement day from 5th to 1st,
   - **When** submitting `payrollCycle` update,
   - **Then** receive HTTP 200 with updated payroll timeline.
3. **Department Manager**:
   - **Given** Department Manager attempts to alter payroll cycle dates,
   - **When** dispatching `PATCH /api/v1/settings/payrollCycle`,
   - **Then** receive HTTP 403 Forbidden.
4. **Employee**:
   - **Given** Employee attempts to modify payroll cycle dates,
   - **When** dispatching request,
   - **Then** receive HTTP 403 Forbidden.

---

### User Story 7 — Pakistan Statutory Compliance Settings (FBR Tax, EOBI, PESSI, PF) (BUILD-GUIDE Row 2.7)
**Priority**: P1  
**Why this priority**: Pakistani legal requirement. Tax slabs and statutory social security rates change annually in federal budgets. Hardcoding them is forbidden; they must be managed via editable tabular settings.  
**Independent Test**: Dynamic addition, modification, and deletion of progressive FBR tax brackets (min, max, fixed tax, percentage rate in paisa) and EOBI percentage rates persist under `taxSlabs`, `eobi`, `pessi`, and `providentFund`.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin opens Statutory Compliance tab,
   - **When** entering FBR Salaried Slabs for Tax Year 2024–2025:
     - 0 to 600,000 PKR: 0%
     - 600,001 to 1,200,000 PKR: 5% of excess
     - 1,200,001 to 2,200,000 PKR: 30,000 fixed + 15% of excess
     and EOBI rates: Employer 5%, Employee 1% on minimum wage (37,000 PKR),
   - **Then** receive HTTP 200, values stored in integer paisa precision, and payroll calculation engine reflects updated slabs.
2. **HR Manager**:
   - **Given** HR Manager updates EOBI minimum wage threshold following gazette notification,
   - **When** saving `eobi` configuration,
   - **Then** receive HTTP 200 and audit record recorded.
3. **Department Manager**:
   - **Given** Department Manager attempts to view or edit tax slab configurations,
   - **When** accessing `PATCH /api/v1/settings/taxSlabs`,
   - **Then** receive HTTP 403 Forbidden.
4. **Employee**:
   - **Given** Employee attempts to access tax slab editor,
   - **When** dispatching mutation request,
   - **Then** receive HTTP 403 Forbidden.

---

### User Story 8 — Office Geo-Fence Coordinates & Radius Editor (BUILD-GUIDE Row 2.8)
**Priority**: P2  
**Why this priority**: Configures the spatial boundary (latitude, longitude, radius in meters) used by Module M14 for mobile and browser GPS check-in validation.  
**Independent Test**: Interactive map in `GeoFenceMapEditor.jsx` displays an OpenStreetMap tile layer; clicking or dragging sets coordinates and circle radius, which saves under key `geoFences`.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin accesses Geo-Fence tab,
   - **When** clicking on Islamabad software technology park on the map (`lat: 33.6844, lng: 73.0479`), setting radius to 150 meters, and clicking Save,
   - **Then** receive HTTP 200, and `geoFences` array contains validated coordinates with positive integer radius.
2. **HR Manager**:
   - **Given** HR Manager adjusts geo-fence radius from 100m to 200m to cover parking grounds,
   - **When** submitting update,
   - **Then** receive HTTP 200 and visual map circle resizes immediately.
3. **Department Manager**:
   - **Given** Department Manager attempts to update geo-fence coordinates,
   - **When** calling `PATCH /api/v1/settings/geoFences`,
   - **Then** receive HTTP 403 Forbidden.
4. **Employee**:
   - **Given** Employee attempts to modify office geo-fencing,
   - **When** calling API,
   - **Then** receive HTTP 403 Forbidden.

---

### User Story 9 — Email & WhatsApp Notification Template Builder (BUILD-GUIDE Row 2.9)
**Priority**: P2  
**Why this priority**: Standardizes corporate communications for transactional notifications (new hire welcome, leave approval, payslip release, password resets) with variable interpolation (`{{name}}`, `{{company}}`).  
**Independent Test**: Saving template key `templates` with customizable subject and body; sending test email replaces placeholders with dynamic preview data.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin opens Notification Templates tab,
   - **When** authoring `welcomeEmail` template: *"Dear {{name}}, Welcome to {{company}}! Your portal login is ready."*,
   - **Then** receive HTTP 200, template validates placeholder syntax, and is saved under key `templates`.
2. **HR Manager**:
   - **Given** HR Manager customizes leave approval notification message,
   - **When** saving the template form,
   - **Then** receive HTTP 200 with saved confirmation.
3. **Department Manager**:
   - **Given** Department Manager attempts to edit system templates,
   - **When** sending `PATCH /api/v1/settings/templates`,
   - **Then** receive HTTP 403 Forbidden.
4. **Employee**:
   - **Given** Employee attempts to modify templates,
   - **When** sending request,
   - **Then** receive HTTP 403 Forbidden.

---

### User Story 10 — Automated Database Backup Job & Manual Trigger (BUILD-GUIDE Row 2.10)
**Priority**: P2  
**Why this priority**: Ensures disaster recovery and data retention. Enforces daily automated backup job (30-day retention) and provides one-click manual backup trigger for Super Admin.  
**Independent Test**: Clicking "Backup Now" in UI triggers `POST /api/v1/settings/backup-now`, initiates mongodump archive, returns backup status and file metadata, and updates "Last Backup" timestamp.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin is on Settings $\rightarrow$ Backup tab,
   - **When** clicking "Backup Now" button,
   - **Then** receive HTTP 200 with `{ success: true, message: "Backup archive created successfully", data: { filename, sizeBytes, timestamp } }`, and status shows green health indicator.
2. **HR Manager**:
   - **Given** HR Manager attempts to trigger database backup via `POST /api/v1/settings/backup-now`,
   - **When** request is processed,
   - **Then** receive HTTP 403 Forbidden (Backup trigger is strictly restricted to Super Admin).
3. **Department Manager**:
   - **Given** Department Manager attempts `POST /api/v1/settings/backup-now` or `GET /api/v1/settings/backup-status`,
   - **When** sending request,
   - **Then** receive HTTP 403 Forbidden.
4. **Employee**:
   - **Given** Employee attempts backup endpoints,
   - **When** sending request,
   - **Then** receive HTTP 403 Forbidden.

---

### User Story 11 — Public Employee Policies Reader Page (BUILD-GUIDE Row 2.11)
**Priority**: P2  
**Why this priority**: Fulfills employee transparency requirement. All staff members must be able to view official company working hours, late penalty policies, leave entitlements, and public guidelines in a read-only handbook view without exposing administrative controls.  
**Independent Test**: Navigating to `/policies` as Employee or Department Manager calls `GET /api/v1/settings/public-policies` and renders formatted handbook cards, while editing buttons and controls are completely hidden.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin navigates to `/policies`,
   - **When** viewing the page,
   - **Then** see company profile, working hours, late arrival rules, and leave guidelines with a link to "Manage Settings".
2. **HR Manager**:
   - **Given** HR Manager visits `/policies`,
   - **When** viewing the page,
   - **Then** see complete policies with an "Edit in Settings" quick action button.
3. **Department Manager**:
   - **Given** Department Manager navigates to `/policies`,
   - **When** calling `GET /api/v1/settings/public-policies`,
   - **Then** receive HTTP 200 with read-only policy details, and administrative edit controls are absent from the DOM.
4. **Employee**:
   - **Given** Employee navigates to `/policies`,
   - **When** calling `GET /api/v1/settings/public-policies`,
   - **Then** receive HTTP 200 with clear, readable employee policies (office hours, grace period, leave types, public holiday overview) in read-only format.

---

## 4. Edge Cases & Failure Modes

1. **Invalid JSON / Malformed Payload**:
   - *Scenario*: Malformed or non-schema-compliant configuration payload sent to `PATCH /settings/:key`.
   - *Resolution*: Zod schema validation middleware intercepts the request before reaching the service layer and returns HTTP 400 Bad Request with field-level validation errors in `meta.errors`.
2. **Non-Existent Setting Key**:
   - *Scenario*: Client requests `GET /settings/unknown_key`.
   - *Resolution*: Return HTTP 200 with default null/empty value structure or HTTP 404 with standard envelope rather than throwing unhandled exceptions.
3. **Oversized / Malicious Logo Upload**:
   - *Scenario*: User attempts to upload a 20MB executable renamed to `.png`.
   - *Resolution*: Multer fileFilter validates MIME type (`image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`) and enforces 2MB size cap. Rejects with HTTP 400 and deletes temporary chunk.
4. **Discontinuous / Overlapping Tax Slabs**:
   - *Scenario*: Admin enters overlapping salary brackets (e.g. Slab 1: 0–600k, Slab 2: 500k–1.2M).
   - *Resolution*: Zod refinement verifies that `slabs[i].min == slabs[i-1].max + 1` or continuous progression, rejecting non-monotonic bounds.
5. **Coordinates Out of Valid Geographic Range**:
   - *Scenario*: Geo-fence input has latitude > 90 or longitude > 180 or negative radius.
   - *Resolution*: Zod schema validates `latitude: z.number().min(-90).max(90)`, `longitude: z.number().min(-180).max(180)`, `radiusMeters: z.number().int().min(10).max(5000)`.
6. **Backup Process Interruption**:
   - *Scenario*: Disk space full or mongodump fails during `POST /settings/backup-now`.
   - *Resolution*: Process failure caught cleanly, error logged, temporary partial archives cleaned up, and HTTP 500 returned with actionable diagnostic message.

---

## 5. Functional Requirements (FR) Traceability

- **FR-M2-001**: System MUST store settings as extensible key-value documents in MongoDB `settings` collection.
- **FR-M2-002**: System MUST restrict all setting mutations (`PATCH /settings/:key`) to users holding `settings.manage` permission (Super Admin & HR Manager).
- **FR-M2-003**: System MUST provide public policy endpoint `GET /settings/public-policies` accessible to all authenticated users with `settings.view`.
- **FR-M2-004**: System MUST validate company logo uploads with Multer restricting files to max 2MB and allowed image MIME types.
- **FR-M2-005**: System MUST record audit log entries in `auditLogs` collection upon every configuration change with actor ID, timestamp, before snapshot, and after snapshot.
- **FR-M2-006**: System MUST represent all financial values, wage limits, and tax thresholds in integer paisa (1 PKR = 100 paisa) to eliminate floating-point arithmetic errors.
- **FR-M2-007**: System MUST provide an interactive Leaflet map editor for geo-fence positioning with OpenStreetMap tiles and draggable pin.
- **FR-M2-008**: System MUST isolate database backup execution (`POST /settings/backup-now`) strictly to Super Admin.
- **FR-M2-009**: System MUST support template placeholder variable substitution for `{{name}}`, `{{company}}`, `{{date}}`, and `{{otp}}`.

---

## 6. Key Data Entities & Schemas

### `Setting` Entity (`settings` collection)
```javascript
{
  key: { type: String, required: true, unique: true, index: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### Standard Setting Keys & Default Payloads:
1. `company`: `{ name, address, phone, email, website, ntn, strn, logoUrl }`
2. `workingDays`: `['monday', 'tuesday', 'wednesday', 'thursday', 'friday']`
3. `officeHours`: `{ startTime: "09:00", endTime: "18:00", halfDayMinutes: 240, flexibleShiftAllowed: false }`
4. `lateRules`: `{ graceMinutes: 15, lateThresholdMinutes: 30, halfDayThresholdLateCount: 3, penaltyPerLatePaisa: 0 }`
5. `leavePolicy`: `{ fiscalYearStart: "July", approvalChainLevels: 2, carryForwardLimit: 5, encashmentAllowed: true, sandwichRule: true }`
6. `payrollCycle`: `{ cycleType: "calendar_month", startDay: 1, endDay: 30, disbursementDay: 5 }`
7. `taxSlabs`: `[{ minPaisa, maxPaisa, fixedTaxPaisa, ratePercent }]`
8. `eobi`: `{ enabled: true, employerRatePercent: 5, employeeRatePercent: 1, minWagePaisa: 3700000 }`
9. `pessi`: `{ enabled: false, employerRatePercent: 6, wageCeilingPaisa: 0 }`
10. `providentFund`: `{ enabled: false, employerPercent: 8.33, employeePercent: 8.33 }`
11. `geoFences`: `[{ name: "Headquarters", latitude: 33.6844, longitude: 73.0479, radiusMeters: 150, isActive: true }]`
12. `templates`: `{ welcomeEmail: { subject, body }, leaveApproval: { subject, body }, payslipDispatch: { subject, body } }`

---

## 7. Success Criteria & Quality Metrics

- **SC-M2-001**: 100% of BUILD-GUIDE Section 6 rows (2.1 to 2.11) are mapped to vertical slices with backend endpoints, frontend UI forms, and multi-role tests.
- **SC-M2-002**: All 4 default roles (Super Admin, HR Manager, Department Manager, Employee) pass automated authorization boundary tests (Super Admin/HR succeed, Dept Manager/Employee get HTTP 403 on mutations).
- **SC-M2-003**: Settings read operations (`GET /settings/:key`) respond in under 50ms with in-memory caching.
- **SC-M2-004**: Company logo uploaded via Multer renders cleanly in the navigation Topbar and persists across client reloads.
- **SC-M2-005**: 100% compliance with JavaScript-only rule (0 `.ts` or `.tsx` files created).
- **SC-M2-006**: Vitest backend test suite passes 100% green with zero regression on existing M1 and M26 test suites.
- **SC-M2-007**: Vite production build completes with 0 errors.

---

## 8. Assumptions & Dependencies

- **Database**: MongoDB instance running with access to write to `settings` collection.
- **Authorization Seed**: Seed script (`roles.seed.js`) has established `settings.manage` and `settings.view` in permission catalogue and role definitions.
- **Leaflet Assets**: Standard Leaflet CSS and OpenStreetMap raster tile server accessible without API keys.
- **Backup Strategy**: Local mongodump execution or in-memory BSON stream backup utility configured with graceful fallback for environments lacking local mongodump binaries.
