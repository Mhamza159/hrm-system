# Tasks Breakdown: M2 Company Settings

**Feature Identifier**: `04-company-settings`  
**Feature Branch**: `feature/04-company-settings`  
**Target Module**: Module M2 (Core HR Group · Priority P1 Launch Scope)  
**Spec Document**: [`.specify/specs/04-company-settings/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/04-company-settings/spec.md)  
**Plan Document**: [`.specify/specs/04-company-settings/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/04-company-settings/plan.md)  
**Governing Guide**: [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 6 (Rows 2.1–2.11)  
**Architecture Rules**: Plain JavaScript only (`.js` / `.jsx`), Vertical Slice order (BE $\rightarrow$ FE $\rightarrow$ Row Test), P1 first then P2.

---

## Phase 1: Core Company Settings & Statutory Foundation (Priority P1)

### Slice 2.1: Settings Key-Value Model, Engine & In-Memory Cache (BUILD-GUIDE ID 2.1)
- [x] **2.1-BE**: Create `backend/src/models/setting.model.js` with schema `{ key: { type: String, required: true, unique: true, index: true }, value: { type: mongoose.Schema.Types.Mixed, required: true }, description: String, updatedBy: { type: ObjectId, ref: 'User' } }`. In `backend/src/modules/settings/`, create `setting.validation.js` with generic schema validator, `setting.service.js` with in-memory cache and automatic cache invalidation on mutations, `setting.controller.js`, and `setting.routes.js` implementing `GET /api/v1/settings`, `GET /api/v1/settings/:key`, and `PATCH /api/v1/settings/:key`, guarded by `authenticate` and `checkPermission('settings.manage')`. Mount routes in `backend/src/app.js`.
- [x] **2.1-FE**: Create `frontend/src/features/settings/settingsApi.js` with RTK Query endpoints (`getSettings`, `getSettingByKey`, `updateSetting`). Create `frontend/src/features/settings/pages/SettingsPage.jsx` featuring a clean tabbed layout (Company Profile, Working Hours, Late Rules, Leave Policy, Payroll, Statutory Compliance, Geo-Fence, Templates, Backup) protected by `<Can I="settings.manage" a="Setting">`. Register `/settings` route in `frontend/src/app/router.jsx` and add Settings navigation link in `frontend/src/components/layout/Sidebar.jsx`.
- [x] **2.1-TEST**: Vitest integration test `backend/tests/settings.api.test.js`: verify Super Admin and HR Manager can set and retrieve a key with HTTP 200; verify Department Manager and Employee receive HTTP 403 Forbidden; verify updated setting persists across simulated cache warm/flush.

---

### Slice 2.2: Company Profile & Logo Asset Upload (BUILD-GUIDE ID 2.2)
- [x] **2.2-BE**: In `setting.validation.js`, define `companyProfileSchema` (`name`, `address`, `phone`, `email`, `website`, `ntn`, `strn`, `logoUrl`). Configure Multer upload middleware in `backend/src/modules/settings/setting.routes.js` targeting `uploads/logos/` with 2MB size cap and MIME filtering (`image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`). Implement `POST /api/v1/settings/company/logo` and update static asset serving in `backend/src/server.js` or `backend/src/app.js` to serve `/uploads`.
- [x] **2.2-FE**: Create `frontend/src/features/settings/components/CompanyForm.jsx` with inputs for legal name, NTN, STRN, address, phone, email, and interactive drag-and-drop/click logo file uploader with live preview. Update `frontend/src/components/layout/Topbar.jsx` to dynamically fetch and display the uploaded company logo alongside the company name.
- [x] **2.2-TEST**: Multi-role test: Super Admin uploads valid PNG logo and updates company legal info (HTTP 200); verify invalid file format (e.g. .txt) is rejected with HTTP 400; verify Department Manager and Employee cannot upload logo or update company profile (HTTP 403).

---

### Slice 2.3: Working Days & Standard Office Hours (BUILD-GUIDE ID 2.3)
- [x] **2.3-BE**: In `setting.validation.js`, define schemas for keys `workingDays` (array of enum days: `['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']`) and `officeHours` (`startTime: "HH:mm"`, `endTime: "HH:mm"`, `halfDayMinutes: Number`, `flexibleShiftAllowed: Boolean`). Ensure `setting.service.js` updates both keys and writes to `auditLogs`.
- [x] **2.3-FE**: Create `frontend/src/features/settings/components/WorkingHoursForm.jsx` with interactive weekly day-pill toggles (Monday through Sunday) and modern time pickers for shift start, shift end, and half-day duration threshold.
- [x] **2.3-TEST**: API test: HR Manager updates working days to Monday–Friday with timings 09:00–18:00 (HTTP 200); verify subsequent `GET /api/v1/settings/workingDays` returns updated days array; verify Employee receives HTTP 403 on mutation.

---

### Slice 2.4: Late Arrival Rules & Penalty Deductions (BUILD-GUIDE ID 2.4)
- [x] **2.4-BE**: In `setting.validation.js`, define `lateRulesSchema` for key `lateRules` (`graceMinutes: Number (min 0, max 60)`, `lateThresholdMinutes: Number`, `halfDayThresholdLateCount: Number (e.g. 3)`, `penaltyPerLatePaisa: Number (default 0)`). Validate integer ranges and record updates in audit trail.
- [x] **2.4-FE**: Create `frontend/src/features/settings/components/AttendanceRulesForm.jsx` with input controls for grace period minutes, consecutive late arrivals count threshold for half-day salary deduction, and flat penalty deduction in PKR (automatically converting to paisa).
- [x] **2.4-TEST**: Test late rules validation: verify non-integer or negative grace minutes triggers HTTP 400 validation error; verify valid update succeeds for Super Admin and creates audit log snapshot; verify non-admin roles receive 403.

---

### Slice 2.5: Leave Policy Definitions (BUILD-GUIDE ID 2.5)
- [x] **2.5-BE**: In `setting.validation.js`, define `leavePolicySchema` for key `leavePolicy` (`fiscalYearStart: 'January' | 'July'`, `approvalChainLevels: 1 | 2 | 3`, `carryForwardLimit: Number`, `encashmentAllowed: Boolean`, `sandwichRule: Boolean`, `probationLeaveAllowed: Boolean`).
- [x] **2.5-FE**: Create `frontend/src/features/settings/components/LeavePolicyForm.jsx` with fiscal year selector dropdown (January–December vs July–June), approval chain depth radio buttons, sandwich rule toggle, leave encashment eligibility toggle, and carry-forward days cap input.
- [x] **2.5-TEST**: Test leave policy updates: verify HR Manager can configure fiscal cycle and carry-forward limits (HTTP 200); verify invalid approval level (e.g. 5) is rejected with HTTP 400; verify Department Manager receives HTTP 403.

---

### Slice 2.6: Payroll Cycle & Pay Day Scheduling (BUILD-GUIDE ID 2.6)
- [x] **2.6-BE**: In `setting.validation.js`, define `payrollCycleSchema` for key `payrollCycle` (`cycleType: 'calendar_month' | 'custom_range'`, `startDay: Number (1-31)`, `endDay: Number (1-31)`, `disbursementDay: Number (1-31)`).
- [x] **2.6-FE**: Create `frontend/src/features/settings/components/PayrollSettingsForm.jsx` with cycle type selector, cutoff day input, and salary disbursement day input with contextual helpers explaining impact on monthly salary runs.
- [x] **2.6-TEST**: Test payroll cycle persistence: verify setting disbursementDay to 5 and startDay to 1 persists and validates 1–31 day bounds; verify non-admin mutation attempts return HTTP 403.

---

### Slice 2.7: Pakistan Statutory Compliance Settings (FBR Tax, EOBI, PESSI, PF) (BUILD-GUIDE ID 2.7)
- [x] **2.7-BE**: In `setting.validation.js`, define schemas for keys:
  - `taxSlabs`: array of progressive brackets (`taxYear: String`, slabs: `[{ minPaisa: Number, maxPaisa: Number, fixedTaxPaisa: Number, ratePercent: Number }]`).
  - `eobi`: `{ enabled: Boolean, employerRatePercent: Number, employeeRatePercent: Number, minWagePaisa: Number }`.
  - `pessi`: `{ enabled: Boolean, employerRatePercent: Number, wageCeilingPaisa: Number }`.
  - `providentFund`: `{ enabled: Boolean, employerPercent: Number, employeePercent: Number }`.
  Enforce monotonic progressive slab boundaries and integer paisa precision.
- [x] **2.7-FE**: Create `frontend/src/features/settings/components/TaxSlabsForm.jsx`: editable dynamic data table to add, modify, and delete FBR salaried tax brackets (with live conversion between PKR and integer Paisa), plus tabbed cards for EOBI, PESSI, and Provident Fund toggles and rates.
- [x] **2.7-TEST**: Test statutory compliance configuration: verify HR Manager updates FBR 2024–2025 tax brackets and EOBI 37,000 PKR minimum wage (HTTP 200); verify overlapping brackets fail Zod validation with HTTP 400; verify Department Manager receives HTTP 403.

---

## Phase 2: Advanced Spatial, Templates & Disaster Recovery (Priority P2)

### Slice 2.8: Office Geo-Fence Coordinates & Radius Editor (BUILD-GUIDE ID 2.8)
- [x] **2.8-BE**: In `setting.validation.js`, define `geoFencesSchema` for key `geoFences` as an array of geofence objects (`name: String`, `latitude: Number (-90 to 90)`, `longitude: Number (-180 to 180)`, `radiusMeters: Number (10 to 5000)`, `isActive: Boolean`).
- [x] **2.8-FE**: Create `frontend/src/features/settings/components/GeoFenceMapEditor.jsx` using `leaflet` and OpenStreetMap raster tiles: display interactive map centered at office coordinates, draggable marker, and live SVG circle representing `radiusMeters`. Include inputs for manual coordinate overrides and radius slider.
- [x] **2.8-TEST**: Integration test geo-fence editor: verify saving coordinates (e.g. Islamabad software park) and 150m radius persists under `geoFences` (HTTP 200); verify negative radius or invalid coordinates return HTTP 400; verify non-admin roles receive HTTP 403.

---

### Slice 2.9: Email & WhatsApp Notification Template Builder (BUILD-GUIDE ID 2.9)
- [x] **2.9-BE**: In `setting.validation.js`, define `templatesSchema` for key `templates` containing transactional message templates (`welcomeEmail`, `leaveApproval`, `payslipDispatch`, `passwordReset`, `whatsappAlert`) each with `subject` (for emails) and `body`. Validate template string format.
- [x] **2.9-FE**: Create `frontend/src/features/settings/components/TemplatesForm.jsx` with template selector, text area with clickable placeholder variable chips (`{{name}}`, `{{company}}`, `{{date}}`, `{{otp}}`), and a live interpolated preview pane.
- [x] **2.9-TEST**: Test template management: verify authoring new hire welcome email template persists in DB; verify test preview correctly interpolates placeholder variables; verify Employee receives HTTP 403 on mutation.

---

### Slice 2.10: Automated Database Backup Job & Manual Trigger (BUILD-GUIDE ID 2.10)
- [x] **2.10-BE**: Create `backend/src/jobs/backup.job.js` using `node-cron` for scheduled daily backups and export a manual `executeBackup()` helper generating timestamped archives with 30-day retention. In `setting.controller.js` and `setting.routes.js`, implement `POST /api/v1/settings/backup-now` and `GET /api/v1/settings/backup-status`, guarded by `authenticate`, `checkPermission('settings.manage')`, and an explicit Super Admin role verification check.
- [x] **2.10-FE**: Create `frontend/src/features/settings/components/BackupTab.jsx` inside `SettingsPage.jsx`: display system backup health status, last backup timestamp, archive storage stats, and a prominent "Backup Now" button with confirmation modal and loading spinner.
- [x] **2.10-TEST**: Multi-role security test: Super Admin triggers `POST /api/v1/settings/backup-now` (HTTP 200, backup metadata returned); verify HR Manager, Department Manager, and Employee receive HTTP 403 Forbidden.

---

### Slice 2.11: Public Employee Policies Reader Page (BUILD-GUIDE ID 2.11)
- [x] **2.11-BE**: In `setting.service.js`, implement `getPublicPolicies()`: fetch settings for `company`, `workingDays`, `officeHours`, `lateRules`, and `leavePolicy`, stripping sensitive internal metadata (e.g. NTN/STRN, backup configs, internal limits). In `setting.routes.js`, mount `GET /api/v1/settings/public-policies` guarded by `authenticate` and `checkPermission('settings.view')`.
- [x] **2.11-FE**: Create `frontend/src/features/settings/pages/PoliciesPage.jsx`: formatted read-only company handbook cards displaying office timings, working days, late arrival grace period & penalties, and leave entitlements. Register route `/policies` in `router.jsx` and add "Company Policies" navigation link in `Sidebar.jsx` visible to all authenticated roles.
- [x] **2.11-TEST**: Multi-role test: verify all 4 default roles (Super Admin, HR Manager, Department Manager, Employee) can access `GET /api/v1/settings/public-policies` (HTTP 200); verify response contains sanitized company handbook details without administrative metadata.

---

## Phase 3: Multi-Role End-to-End Verification (`E2E-M2`)

### Slice E2E-M2: Multi-Role Live End-to-End Playwright Verification (All 4 Default Roles)
- [x] **E2E-M2**: Create automated Playwright browser test `backend/tests/m2.settings.e2e.test.js` or e2e spec verifying:
  1. **Super Admin Flow**: Log in $\rightarrow$ navigate to `/settings` $\rightarrow$ update company profile & upload logo $\rightarrow$ adjust working days & late rules $\rightarrow$ configure FBR tax slabs $\rightarrow$ interact with Leaflet geo-fence map $\rightarrow$ trigger "Backup Now" $\rightarrow$ verify Topbar reflects updated logo.
  2. **HR Manager Flow**: Log in $\rightarrow$ navigate to `/settings` $\rightarrow$ successfully update leave policy & email templates $\rightarrow$ verify "Backup Now" trigger button is hidden or disabled, and direct API call is rejected with 403.
  3. **Department Manager Flow**: Log in $\rightarrow$ verify `/settings` navigation link is hidden $\rightarrow$ directly browsing `/settings` redirects away $\rightarrow$ navigate to `/policies` and verify complete read-only policies are visible.
  4. **Employee Flow**: Log in $\rightarrow$ verify `/settings` link is hidden $\rightarrow$ navigate to `/policies` $\rightarrow$ inspect working hours and leave rules $\rightarrow$ verify no administrative edit controls exist.

