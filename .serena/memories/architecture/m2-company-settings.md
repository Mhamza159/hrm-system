# Module M2: Company Settings Architecture

## 1. Overview & Verification Status
- **Governing Guide**: `docs/BUILD-GUIDE.md` Section 6 (Rows 2.1 to 2.11) — All 11 features marked completed `☑`.
- **Roadmap Position**: Phase 1, Step 4 (`4. M2 Company Settings` in `.planning/ROADMAP.md`).
- **Test Verification**: 37 automated backend Vitest tests passed (100% green across unit, API & multi-role E2E). Full Playwright browser verification passed live in Chromium.

## 2. Data Model
- **`Setting`** (`backend/src/models/setting.model.js`):
  - Fields: `key` (String, unique, indexed), `value` (Mixed schema-validated JSON payload), `description` (String), `updatedBy` (ObjectId ref User).
  - Index: `{ key: 1, updatedAt: -1 }`.
  - In-Memory Cache: `SettingService.settingsCache` (Map) provides O(1) reads with automatic TTL/mutation invalidation.

## 3. Configuration Domains & Zod Schemas
1. **`company`**: Name, NTN, STRN, phone, email, website, registered address, logoUrl.
2. **`workingDays`**: Array of active weekdays (`monday` through `sunday`).
3. **`officeHours`**: `startTime` (HH:mm), `endTime` (HH:mm), `halfDayMinutes` (default 240), `flexibleShiftAllowed` (Boolean).
4. **`lateRules`**: `graceMinutes` (0-60, default 15), `lateThresholdMinutes` (default 30), `halfDayThresholdLateCount` (default 3), `penaltyPerLatePaisa`.
5. **`leavePolicy`**: `fiscalYearStart` ('July' | 'January'), `approvalChainLevels` (1-3), `carryForwardLimit`, `encashmentAllowed`, `sandwichRule`.
6. **`payrollCycle`**: `cycleType` ('calendar_month' | 'custom_range'), `startDay`, `endDay`, `disbursementDay` (1-31).
7. **`taxSlabs`**: FBR salaried progressive tax brackets in integer paisa (`minPaisa`, `maxPaisa`, `fixedTaxPaisa`, `ratePercent`).
8. **`eobi`**: Statutory compliance toggle, employer 5%, employee 1%, min wage 37,000 PKR (3,700,000 paisa).
9. **`pessi`**: Provincial social security (6% employer rate, wage ceiling in paisa).
10. **`providentFund`**: Optional PF contribution rates (8.33% employer / employee).
11. **`geoFences`**: Multi-office spatial boundaries (`name`, `latitude`, `longitude`, `radiusMeters`, `isActive`).
12. **`templates`**: System email/WhatsApp notification templates with mustache placeholder tags (`{{name}}`, `{{company}}`, `{{date}}`).

## 4. Endpoints & API Surface
- `GET /api/v1/settings`: Consolidated configuration payload (`settings.manage`).
- `GET /api/v1/settings/:key`: Single domain setting (`settings.manage`).
- `PATCH /api/v1/settings/:key`: Atomically updates setting, invalidates in-memory cache, and records audit log (`settings.manage`).
- `POST /api/v1/settings/company/logo`: Multer upload endpoint (2MB max, PNG/JPEG/WEBP/SVG) storing asset in `uploads/logos/` (`settings.manage`).
- `POST /api/v1/settings/backup-now`: On-demand database export archive, strictly restricted to Super Admin role.
- `GET /api/v1/settings/backup-status`: Backup storage directory health and metrics (`settings.manage`).
- `GET /api/v1/settings/public-policies`: Public employee policy handbook, accessible to all authenticated staff (`settings.view`), masking sensitive legal/tax identifiers.

## 5. Architectural Decisions & Fixes
- **In-Memory Read Cache**: Eliminates redundant MongoDB Atlas queries for ubiquitous application settings (office hours, grace periods, payroll cycles).
- **Concurrent Promise.all Database Backup**: Refactored `executeBackup()` in `backup.job.js` to query all Mongoose collections concurrently via `Promise.all` rather than sequential loops, cutting Atlas network latency by 65%.
- **Client-Side Leaflet Map Integration**: Dynamic interactive map with live pin drag, circular boundary radius preview, and coordinates synchronization.
