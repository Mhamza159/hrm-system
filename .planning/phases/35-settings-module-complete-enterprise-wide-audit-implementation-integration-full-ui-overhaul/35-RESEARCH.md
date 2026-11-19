# Phase 35 Research: Settings Module — Complete Enterprise-Wide Audit, Implementation, Integration & Full UI Overhaul

## 1. Executive Summary & Architecture Landscape

### A. Current Implementation Analysis
- **Module**: Module M2 Company Settings & System-Wide Governance (BUILD-GUIDE Section 6 · Rows 2.1 to 2.11)
- **Primary Routes**: `backend/src/modules/settings/setting.routes.js`
- **Primary Controller & Service**: `backend/src/modules/settings/setting.controller.js`, `setting.service.js`
- **Validation Schemas**: `backend/src/modules/settings/setting.validation.js`
- **Database Model**: `backend/src/models/setting.model.js` (Key-Value schema with Mixed payload and fast in-memory cache `SettingService.settingsCache`)
- **Frontend Page & Components**: `frontend/src/features/settings/pages/SettingsPage.jsx`, components in `frontend/src/features/settings/components/`

---

## 2. Exhaustive Section-by-Section Audit

### Section 1: Company Profile (BUILD-GUIDE Row 2.2)
- **Current State**: Fields for `name`, `address`, `phone`, `email`, `website`, `ntn`, `strn`, `logoUrl`. Supports Multer 2MB image upload (PNG/JPEG/WEBP/SVG) to Cloudinary or `/uploads/logos/`.
- **Gaps & Defects**:
  1. No logo deletion or reset capability (once uploaded, the logo cannot be cleared back to default initials/brandmark).
  2. No instant branding synchronization event dispatched to Topbar/Sidebar/Public Policies.
  3. No live brand preview showing how company legal details and logo appear on PDF payslips, employee ID cards, and automated email headers.

### Section 2: Working Hours (BUILD-GUIDE Row 2.3)
- **Current State**: Configures active days (`workingDays`: array of 7 weekdays) and `officeHours` (`startTime`, `endTime`, `halfDayMinutes`, `flexibleShiftAllowed`).
- **Gaps & Defects**:
  1. Timezone indicator is missing (canonical timezone is `Asia/Karachi` / PKT UTC+5).
  2. Daily total standard hours calculation not rendered dynamically in the UI (e.g. `09:00 - 18:00 = 9 hrs total - 1 hr break = 8 net hrs`).
  3. No cross-module alignment check with Module M4 Work Shifts (`backend/src/models/shift.model.js`).

### Section 3: Attendance Rules — Dynamic QR & Biometric Face (BUILD-GUIDE Rows 2.4, 12.1, 13.6)
- **Current State**: Configures late grace period (`graceMinutes`), late threshold (`lateThresholdMinutes`), half-day late count (`halfDayThresholdLateCount`), and penalty deduction (`penaltyPerLatePaisa`). Frontend form also has inputs for `qrAttendance` (`isEnabled`, `rotationSeconds`) and `faceAttendance` (`isEnabled`, `matchThreshold`, `requireLiveness`).
- **Gaps & Defects**:
  1. `qrAttendance` and `faceAttendance` schemas are MISSING from `SETTING_SCHEMAS` in `setting.validation.js`.
  2. `DEFAULT_SETTINGS` in `setting.service.js` lacks default entries for `qrAttendance` and `faceAttendance`.
  3. `attendance.service.js` directly bypasses `SettingService.getSetting` and runs `Setting.findOne({ key: 'qrAttendance' }).lean()`, circumventing the fast in-memory cache bus.
  4. UI lacks visual indicators explaining biometric privacy (e.g., face embeddings stored locally as 128-float Euclidean descriptors; photos never sent to external third parties; rotation token anti-replay window).

### Section 4: Leave Policy & Approval Chains Builder (BUILD-GUIDE Row 2.5)
- **Current State**: Configures `fiscalYearStart` ('July' | 'January'), `approvalChainLevels` (1-3), `carryForwardLimit`, `encashmentAllowed`, `sandwichRule`, `probationLeaveAllowed`.
- **Gaps & Defects**:
  1. `approvalChainLevels` is currently just a 1/2/3 radio button in the UI.
  2. Enterprise requirement: Needs an interactive **Approval Chains Builder** that defines the hierarchical approval routing:
     - Tier 1: Direct Reporting Line / Department Manager
     - Tier 2: Department Head / HR Operations Manager
     - Tier 3: Super Admin / Executive Approval for leave requests > threshold days (e.g. > 5 days)
     - Fallback delegation logic when primary approver is absent or on leave.
  3. Accrual rules explanation and sandbox preview for Pakistan gazetted holiday interactions.

### Section 5: Payroll Cycle & Cut-Off Scheduling (BUILD-GUIDE Row 2.6)
- **Current State**: Configures `cycleType` ('calendar_month' | 'custom_range'), `startDay`, `endDay`, `disbursementDay`.
- **Gaps & Defects**:
  1. `payrollCycle` is defined in Settings but NEVER consumed by `backend/src/modules/payroll/payroll.service.js`!
  2. Payroll service hardcodes monthly calendar logic rather than referencing configured `payrollCycle` boundaries.
  3. Needs automatic calculation of the attendance cut-off lock date (e.g., 2 days prior to salary generation) and disbursement advice export date.

### Section 6: Statutory Tax — Pakistan FBR, EOBI, PESSI & PF (BUILD-GUIDE Row 2.7)
- **Current State**: Tax year (`2024-2025`), dynamic slab array (`minPaisa`, `maxPaisa`, `fixedTaxPaisa`, `ratePercent`). EOBI (5% employer, 1% employee, min wage 37,000 PKR). PESSI (6% employer, wage ceiling). Provident Fund (8.33% employer/employee).
- **Gaps & Defects**:
  1. Tax slab editor lacks inline validation preventing overlapping brackets or gaps between `minPaisa` and `maxPaisa`.
  2. Admins have no interactive "Tax & Net Pay Simulator" in the UI to test a given monthly gross salary against the current slab definitions before committing.
  3. Needs preset loader for Official Pakistan FBR Tax Years (e.g., Finance Act 2024-2025 and 2025-2026 salaried slabs).

### Section 7: Geo-fencing Multi-Office Interactive Map (BUILD-GUIDE Rows 2.8 & 14.1)
- **Current State**: Leaflet map with draggable pin, reverse geocoding, radius circle preview.
- **Gaps & Defects**:
  1. `GeoFenceMapEditor.jsx` currently only edits `initialData[0]`! Multiple branches (e.g. Islamabad HQ, Lahore Branch, Karachi Office, Client Site) cannot be created, selected, or managed individually.
  2. The schema supports an array of fences (`geoFencesSchema`), but the frontend lacks a branch list drawer/selector to add new branches, switch active office, toggle branch status, and preview each branch perimeter on Leaflet.
  3. Cross-module Haversine distance enforcement in `attendance.service.js` must validate against all active geofences in the array.

### Section 8: Communication Templates Builder (BUILD-GUIDE Row 2.9)
- **Current State**: Stores template dictionary (`welcomeEmail`, `leaveApproval`, `payslipDispatch`, `passwordReset`, `whatsappAlert`).
- **Gaps & Defects**:
  1. Limited placeholder tag insertion assistance (only 4 tags supported).
  2. No visual split-screen preview showing real-time HTML/Text rendering with sample employee data.
  3. No "Reset to Default Template" safeguard if an admin corrupts an essential mustache token.

### Section 9: Omnichannel Notifications & Alerts (BUILD-GUIDE Rows 2.1 & 8.5)
- **Current State**: Advanced 11-module matrix (`NotificationSettingsForm.jsx`) with In-App, Email, and WhatsApp toggles across operational domains.
- **Gaps & Defects**:
  1. Needs seamless UI shell integration with the new Elvara Forest & Emerald design system.
  2. Needs unsaved changes dirty check to alert users when leaving the tab without saving.
  3. Role-based event dispatch configuration.

### Section 10: Disaster Recovery & Database Backup Engine (BUILD-GUIDE Row 2.10)
- **Current State**: Manual trigger (`POST /backup-now`), status query (`GET /backup-status`), daily automated midnight snapshot, 30-day retention cleanup.
- **Gaps & Defects**:
  1. Super Admin cannot view the list of generated backup archives (only sees the single latest snapshot).
  2. Missing secure download endpoint (`GET /api/v1/settings/backups/:filename/download`) to allow off-site cold storage.
  3. Missing non-destructive backup integrity test validator (verifies JSON structure, required collections, document count without restoring).
  4. Restore safeguards: Needs clear UI warning and non-destructive dry-run capabilities.

---

## 3. UI/UX Overhaul Specifications (`docs/UI-REFERENCE.md`)

- **Design System Tokens**:
  - Primary Dark: Elvara Forest `#061A14`
  - Emerald Accent: `#00C471` (hover `#049856`)
  - Background Canvas: `#F8FAFC` (Light) / `#0A110D` (Dark)
  - Card Surfaces: `#FFFFFF` (Light) / `#111D17` (Dark)
  - Borders: `#EAECF0` (Light) / `#1A3125` (Dark)
- **Layout Architecture**:
  - Responsive two-column or sticky vertical tab navigation:
    - 10 structured sections grouped into logical domains:
      - **Organization**: Company Profile, Working Hours, Geo-fencing Map
      - **Policies & Payroll**: Attendance Rules, Leave Policy, Payroll Cycle, Statutory Tax
      - **System & Communications**: Templates, Notifications & Alerts, Disaster Recovery
  - Quick action header with "Unsaved Changes" dirty badge, Discard, and Save All / Save Tab actions.
  - Section completion status badges (Configured / Missing / Action Required).

---

## 4. Verification & Testing Strategy
- Unit & Service Tests: `backend/tests/settings.service.test.js` covering cache behavior, Zod schema validation, approval chain evaluation, and payroll cycle date helpers.
- API & Security Integration Tests: `backend/tests/settings.api.test.js` testing all 10 setting keys, logo upload/delete, multi-branch geofences, backup download, and 403 authorization fences.
- Browser E2E Tests: Playwright tests verifying tab navigation, logo upload & preview, Leaflet multi-fence editing, leave approval chain builder, tax simulator, and backup snapshot creation.
