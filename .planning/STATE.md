# HRM System — Current State & Progress Tracker

## Project Overview
- **Project:** HRM System (Human Resource Management System)
- **Client Profile:** Single software house, Pakistan (10–30 staff today, 50–80 projected in 2 years)
- **Active Branch:** `main`
- **Active Phase:** **Phase 39: Complete Software-Wide Modal Audit & UI Standardization** (Completed & Pushed)
- **Pending Phase:** **Phase 40: Software-Wide Real-Time Data Synchronization, RTK Query Cache Invalidation & Automatic Refresh System** (Queued in Backlog)
- **Last Completed Phase:** **Phase 39: Complete Software-Wide Modal Audit & UI Standardization** — **100% COMPLETE & VERIFIED**
- **Active Module:** **Module M4 Department & Org Chart** (`docs/BUILD-GUIDE.md` Section 9 · Row 4.5 & 4.7)

---

## Architecture & System Invariants (Strictly Enforced)
1. **JavaScript Only:** Strictly `.js` and `.jsx` files (ZERO `.ts` / `.tsx`).
2. **Detailed Comments:** Exhaustive line-by-line comments across all touched controllers, services, routes, models, hooks, and UI components explaining security rationale and data flow.
3. **Layer Flow:** `routes` $\rightarrow$ `validate` (Zod) $\rightarrow$ `checkPermission` (CASL) $\rightarrow$ `controller` $\rightarrow$ `service` $\rightarrow$ `model`.
4. **Standard Response Envelope:** `{ success, statusCode, data, message, meta }`.
5. **Linear Dark Craft Aesthetics:** Canvas `#090A0F`, Card `#0F111A`, Hairline `#1E2235`, Accent `#5E6AD2`.
6. **Token Architecture:** 15m in-memory access token + 7d rotating refresh token in `httpOnly`, `secure`, `sameSite: strict` cookie.
7. **Timezone:** All timestamps rendered in `Asia/Karachi` timezone on frontend.

---

## Module M1 Progress Summary (14 / 14 Slices Implemented & Passing)

### Phase 1: Core Authentication & Session Foundation (Priority P1) — 100% Complete
- [x] **Slice 1.1 (BE+TEST):** User Data Model & Security Persistence (`backend/src/models/user.model.js`, `tests/user.model.test.js`)
- [x] **Slice 1.2 (BE+FE+TEST):** User Login with Access & Refresh Token Pairs (`LoginPage.jsx`, `auth.login.test.js`)
- [x] **Slice 1.3 (BE+FE+TEST):** Brute-Force Defense & Automated 15m Account Lockout (`LoginPage.jsx`, `auth.lockout.test.js`)
- [x] **Slice 1.4 (BE+FE+TEST):** Automatic Token Rotation & Mutex Re-Auth (`baseApi.js`, `auth.refresh.test.js`)
- [x] **Slice 1.5 (BE+FE+TEST):** Secure Logout & Session Invalidation (`Topbar.jsx`, `auth.logout.test.js`)
- [x] **Slice 1.6 (BE+FE+TEST):** Current User Hydration & Route Guarding (`ProtectedRoute.jsx`, `useAuth.js`, `auth.me.test.js`)
- [x] **Slice 1.7 (BE+FE+TEST):** Password Recovery via Email OTP (`ForgotPasswordPage.jsx`, `auth.forgot-password.test.js`)
- [x] **Slice 1.8 (BE+FE+TEST):** Password Reset Verification & Execution (`ResetPasswordPage.jsx`, `auth.reset-password.test.js`)
- [x] **Slice 1.9 (BE+FE+TEST):** Self-Service Password Change & First-Login Reset Mandate (`ChangePasswordPage.jsx`, `auth.change-password.test.js`)
- [x] **Slice 1.13 (BE+FE+TEST):** User Account Activation / Deactivation (`UsersPage.jsx`, `users.status.test.js`)

### Phase 2: Enhanced Security, Auditing & Administration (Priority P2) — 100% Complete
- [x] **Slice 1.10 (BE+FE+TEST):** Two-Factor Authentication (2FA OTP) (`OtpPage.jsx`, `auth.2fa.test.js` 5 PASS)
- [x] **Slice 1.11 (FE+TEST):** Client-Side Inactivity Auto-Logout (30m) (`useIdleTimer.js`, wired in `AppLayout.jsx`, banner on `LoginPage.jsx`)
- [x] **Slice 1.12 (BE+FE+TEST):** Login History Tracking & Audit Records (`loginHistory.model.js` 90-day TTL, `LoginHistoryPage.jsx`, `auth.login-history.test.js` 3 PASS)
- [x] **Slice 1.14 (BE+FE+TEST):** HR-Initiated Emergency Password Reset (`UsersPage.jsx` modal & button, `users.reset-password.test.js` 3 PASS)

---

### Phase 3: Multi-Role End-to-End Verification (`E2E-M1`) — 100% Complete
- [x] **E2E-M1 Verification via Playwright:**
  - Super Admin: Verified dashboard rendering, user management navigation, account deactivation/reactivation toggling, emergency password reset dispatch, and company-wide audit trails.
  - Role-Based Guarding: Verified Employee and Dept Manager redirection away from `/users` back to dashboard.
  - Data-Scope Scoping: Verified Employee login history is strictly isolated to own records.
  - Security Defenses: Verified 5-attempt brute-force account lockout with 15m amber lockout banner and form disabling.
  - Fixed regression: Populated role objects in `auth.service.js` and safeguarded string/object extraction in `Topbar.jsx`.

---

## Recent Milestone Progress
- **Phase 27: Work Shifts Module — Complete UI Overhaul, Shift Scheduling, System-Wide Integration, RBAC/PBAC Compliance & Error Fixing**
  - **Status:** **100% COMPLETE & VERIFIED (2026-11-18)**
  - **Verification:** 16/16 Vitest E2E Tests Passing (`backend/tests/shifts.overhaul.e2e.test.js`), 0 Oxlint Errors, Clean Vite Production Build (`vite build` succeeded with 0 errors).
  - **Key Deliverables:**
    - Schema expansion on `Shift` (`isArchived`, `archivedAt`, `archivedBy`, `departmentId`, `capacity`, `description`, `color`) with compound indexes.
    - Strict non-negotiable **Employee Assignment Restriction Guard** (permanent deletion blocked if $\ge 1$ employee is assigned).
    - Cross-midnight calculation engine (`calculateShiftTiming`) with real-time overnight detection and duration calculations.
    - Attendance Module integration preservation (`attendance.service.js`) ensuring punch records and late evaluations remain historically intact.
    - Live 7-KPI metrics (`GET /shifts/stats`) & visual analytics (`GET /shifts/analytics`) with horizontal flex-bars and SVG Donut chart.
    - Dual View Switcher (High-density Enterprise Table View vs Shift Card Grid View (`ShiftCardView.jsx`)).
    - Multi-dimensional filter toolbar (`ShiftFilterBar.jsx`) with live search, shift type filter, status, and department selector.
    - Redesigned Modals: Create/Edit (`ShiftModal.jsx`), Deep Inspection Details (`ShiftDetailModal.jsx`), Employee Assignment (`ShiftAssignModal.jsx` using `EmployeeSelectDropdown`), Archive (`ShiftArchiveModal.jsx`), Restore (`ShiftRestoreModal.jsx`), and Permanent Delete (`ShiftPermanentDeleteModal.jsx` with strict employee lock).
    - Comprehensive Vitest E2E test suite (`backend/tests/shifts.overhaul.e2e.test.js`), 0 oxlint errors, and clean Vite production build.

- **Phase 26: Designation Module — Complete UI Overhaul, System-Wide Integration Audit, RBAC/PBAC Compliance, Analytics & Error Fixing**
  - **Status:** **100% COMPLETE & VERIFIED (2026-11-18)**
  - **Verification:** 14/14 Vitest E2E Tests Passing (`backend/tests/designations.overhaul.e2e.test.js`), 0 Oxlint Errors, Clean Vite Production Build (`vite build` succeeded in 30.54s).
  - **Key Deliverables:**
    - Live 7-KPI summary statistics header (`DesignationStatsCards.jsx`) with interactive filter triggers.
    - Native SVG Donut Chart + Horizontal Bar Chart workforce analytics (`DesignationAnalyticsSection.jsx`, `GET /designations/analytics`).
    - Dual View Switcher (High-density Enterprise Table View vs Designation Card Grid View (`DesignationCardView.jsx`)).
    - Multi-dimensional filter toolbar (`DesignationFilterBar.jsx`) with search, department, grade tier, headcount threshold, active status, and dismissible chips.
    - Modernized Modals: Create/Edit (`DesignationModal.jsx` with 5 grade tier visual selector), Detailed Inspection (`DesignationDetailModal.jsx` with assigned staff roster search), Archive (`DesignationArchiveModal.jsx`), Restore (`DesignationRestoreModal.jsx`), and Permanent Delete (`DesignationPermanentDeleteModal.jsx` with strict employee assignment lock).
    - Cross-module archival guards in `employee.service.js` blocking assignment to archived designations.
    - Strict enforcement of non-negotiable Employee Assignment Restriction Guard (permanent deletion blocked if $\ge 1$ employee assigned).

- **Phase 25: Department Module — Complete UI Overhaul, Functional Audit, Analytics, RBAC/PBAC Compliance & Error Fixing**
  - **Status:** **100% COMPLETE & VERIFIED (2026-11-18)**
  - **Verification:** 11/11 Vitest E2E Tests Passing (`backend/tests/departments.archive-lifecycle.e2e.test.js`), 0 Oxlint Errors, Clean Vite Production Build (`vite build` succeeded in 19.8s).
  - **Key Deliverables:**
    - Live 7-KPI summary statistics header (`DepartmentStatsCards.jsx`) with click filter triggers.
    - Native SVG Donut Chart + Horizontal Bar Chart workforce analytics (`DepartmentAnalyticsSection.jsx`, `GET /departments/analytics`).
    - Dual View Switcher (High-density Enterprise Table View vs Department Card Grid View (`DepartmentCardView.jsx`)).
    - Multi-dimensional filter toolbar (`DepartmentFilterBar.jsx`) with keyword search, division, status, staff headcount, leadership, and active filter chips.
    - Searchable Employee Selection Dropdown (`EmployeeSelectDropdown.jsx`) with authentic DB records, avatars, codes, and designations (zero generic "Employee 1" entries).
    - Modernized Modals: Create/Edit (`DepartmentModal.jsx`), Detailed Inspection (`DepartmentDetailModal.jsx` with leadership spotlight card and staff roster search), Archive (`DepartmentArchiveModal.jsx`), Restore (`DepartmentRestoreModal.jsx`), and Permanent Delete (`DepartmentPermanentDeleteModal.jsx` with strict employee assignment lock).

---

## Test & Build Verification Baseline
- **Vitest Test Suite:** **13 / 13 test files passed (50 / 50 tests green)**
- **Playwright E2E:** **All 4-role user flows and security defenses verified live in browser**
- **Vite Production Build:** Transformed 1654 modules, 0 errors.
- **Tasks File:** Fully synchronized at `.specify/specs/02-auth/tasks.md`.

---

## Module M26 Progress Summary (17 / 17 Slices Implemented & Passing)

### Phase 1: Core RBAC & CASL Infrastructure (Priority P1) — 100% Complete
- [x] **Slice 26.1 (BE+FE+TEST):** Complete Permission Catalogue (`permissions.js`, `GET /permissions`, `permissions.catalogue.test.js`)
- [x] **Slice 26.2 (BE+TEST):** Core Roles Model & 4-Role Idempotent Seed (`role.model.js`, `roles.seed.js`, `roles.seed.test.js`)
- [x] **Slice 26.3 (BE+TEST):** CASL `checkPermission` Middleware (`checkPermission.js`, `checkPermission.test.js` 4/4 PASS)
- [x] **Slice 26.4 (BE+TEST):** Data Scope Filtering Engine (`scopeFilter.js`, `scopeFilter.test.js` 6/6 PASS)
- [x] **Slice 26.5 (BE+TEST):** Field-Level Masking Engine (`fieldFilter.js`, `fieldFilter.test.js` 4/4 PASS)
- [x] **Slice 26.6 (FE):** Frontend CASL Integration & Navigation Guards (`ability.js`, `Can.jsx`, `usePermission.js`, `Sidebar.jsx`)
- [x] **Slice 26.7 (BE+FE+TEST):** Custom Role Management CRUD (`role.service.js`, `RolesListPage.jsx`, `RoleFormPage.jsx`, `roles.crud.test.js` 8/8 PASS)
- [x] **Slice 26.8 (BE+FE+TEST):** Interactive Visual Permission Matrix Screen (`PermissionMatrix.jsx`, accordions, actions, scopes, limits)
- [x] **Slice 26.11 (BE+FE+TEST):** Multi-Role Assignment to Users (`assignUserRoles`, `UsersPage.jsx` modal, `roles.assign.test.js`)
- [x] **Slice 26.12 (BE+FE+TEST):** Privilege Escalation Guard & Boundary Check (`roles.assign.test.js` rejects HR granting Super Admin)
- [x] **Slice 26.13 (BE+FE+TEST):** Immutable System Roles Protection (Guards block delete/rename of Super Admin/HR/Dept/Employee)
- [x] **Slice 26.16 (BE+TEST):** Role & Permission Change Audit Logging (`audit.service.js` integration in all role mutations)

### Phase 2: Advanced Governance, Delegation & Transparency (Priority P2) — 100% Complete
- [x] **Slice 26.9 (BE+FE+TEST):** Granular Approval Limits per Permission (`approvalLimit.js`, `roles.limits_and_clone.test.js`)
- [x] **Slice 26.10 (BE+FE+TEST):** Role Cloning Engine (`cloneRole`, clone modal in `RolesListPage.jsx`, `roles.limits_and_clone.test.js`)
- [x] **Slice 26.14 (BE+FE+TEST):** Approvals Delegation System (`delegation.model.js`, `DelegationPage.jsx`, `delegations.test.js` 4/4 PASS)
- [x] **Slice 26.15 (BE+FE+TEST):** Effective Permissions Inspector (`EffectivePermissionsModal.jsx`, `effective_permissions.test.js` 2/2 PASS)
- [x] **Slice 26.17 (FE+TEST):** Employee Self-Service "My Access" Tab (`MyAccessTab.jsx` read-only capabilities overview)

### Phase 3: Multi-Role End-to-End Verification (`E2E-M26`) — 100% Complete
- [x] **E2E-M26 Verification:** `backend/tests/m26.roles.e2e.test.js` (11 / 11 tests PASS across Super Admin, HR Manager, Department Manager, and Employee flows)

---

## Module M2 Progress Summary (11 / 11 Slices Implemented & Passing)

### Phase 1: Core Company Settings & Statutory Foundation (Priority P1) — 100% Complete
- [x] **Slice 2.1 (BE+FE+TEST):** Settings Key-Value Model, In-Memory Caching & RBAC Boundary (`setting.model.js`, `setting.service.js`, `SettingsPage.jsx`, `settings.api.test.js`)
- [x] **Slice 2.2 (BE+FE+TEST):** Company Profile & Official Logo Upload (`CompanyForm.jsx`, Multer logo endpoint, `Topbar.jsx` live branding, `settings.api.test.js`)
- [x] **Slice 2.3 (BE+FE+TEST):** Working Days & Standard Office Hours (`WorkingHoursForm.jsx`, `workingDays`/`officeHours` keys, `settings.api.test.js`)
- [x] **Slice 2.4 (BE+FE+TEST):** Late Arrival Rules & Penalty Deductions (`AttendanceRulesForm.jsx`, `lateRules` key, grace minutes bounds, `settings.api.test.js`)
- [x] **Slice 2.5 (BE+FE+TEST):** Leave Policy Definitions (`LeavePolicyForm.jsx`, `leavePolicy` key, fiscal cycle & approval chain, `settings.api.test.js`)
- [x] **Slice 2.6 (BE+FE+TEST):** Payroll Cycle & Pay Day Scheduling (`PayrollSettingsForm.jsx`, `payrollCycle` key, disbursement cutoff, `settings.api.test.js`)
- [x] **Slice 2.7 (BE+FE+TEST):** Pakistan Statutory Compliance Settings (`TaxSlabsForm.jsx`, FBR progressive tax brackets in paisa, EOBI/PESSI/PF, `settings.api.test.js`)

### Phase 2: Advanced Spatial, Templates & Disaster Recovery (Priority P2) — 100% Complete
- [x] **Slice 2.8 (BE+FE+TEST):** Office Geo-Fence Coordinates & Radius Editor (`GeoFenceMapEditor.jsx`, Leaflet map, `geoFences` key, `settings.api.test.js`)
- [x] **Slice 2.9 (BE+FE+TEST):** Email & WhatsApp Notification Template Builder (`TemplatesForm.jsx`, `templates` key, placeholder tags, `settings.api.test.js`)
- [x] **Slice 2.10 (BE+FE+TEST):** Automated Database Backup Job & Manual Trigger (`backup.job.js`, `BackupTab.jsx`, Super Admin only trigger, `settings.api.test.js`)
- [x] **Slice 2.11 (BE+FE+TEST):** Public Employee Policies Reader Page (`PoliciesPage.jsx`, `/api/v1/settings/public-policies`, accessible to all 4 roles, `settings.api.test.js`)

### Phase 3: Multi-Role End-to-End Verification (`E2E-M2`) — 100% Complete
- [x] **E2E-M2 Verification:** `backend/tests/m2.settings.e2e.test.js` (12 / 12 tests PASS across Super Admin, HR Manager, Department Manager, and Employee flows)

---

## Recent Milestone Progress
- **Phase 27: Work Shifts Module — Complete UI Overhaul, Shift Scheduling, System-Wide Integration, RBAC/PBAC Compliance & Error Fixing**
  - **Status:** **100% COMPLETE & VERIFIED (2026-11-18)**
  - **Verification:** 16/16 Vitest E2E Tests Passing (`backend/tests/shifts.overhaul.e2e.test.js`), 0 Oxlint Errors, Clean Vite Production Build (`vite build` succeeded with 0 errors).
  - **Key Deliverables:**
    - Schema expansion on `Shift` (`isArchived`, `archivedAt`, `archivedBy`, `departmentId`, `capacity`, `description`, `color`) with compound indexes.
    - Strict non-negotiable **Employee Assignment Restriction Guard** (permanent deletion blocked if $\ge 1$ employee is assigned).
    - Cross-midnight calculation engine (`calculateShiftTiming`) with real-time overnight detection and duration calculations.
    - Attendance Module integration preservation (`attendance.service.js`) ensuring punch records and late evaluations remain historically intact.
    - Live 7-KPI metrics (`GET /shifts/stats`) & visual analytics (`GET /shifts/analytics`) with horizontal flex-bars and SVG Donut chart.
    - Dual View Switcher (High-density Enterprise Table View vs Shift Card Grid View (`ShiftCardView.jsx`)).
    - Multi-dimensional filter toolbar (`ShiftFilterBar.jsx`) with live search, shift type filter, status, and department selector.
    - Redesigned Modals: Create/Edit (`ShiftModal.jsx`), Deep Inspection Details (`ShiftDetailModal.jsx`), Employee Assignment (`ShiftAssignModal.jsx` using `EmployeeSelectDropdown`), Archive (`ShiftArchiveModal.jsx`), Restore (`ShiftRestoreModal.jsx`), and Permanent Delete (`ShiftPermanentDeleteModal.jsx` with strict employee lock).
    - Comprehensive Vitest E2E test suite (`backend/tests/shifts.overhaul.e2e.test.js`), 0 oxlint errors, and clean Vite production build.

- **Phase 26: Designation Module — Complete UI Overhaul, System-Wide Integration Audit, RBAC/PBAC Compliance, Analytics & Error Fixing**
  - **Status:** **100% COMPLETE & VERIFIED (2026-11-18)**
  - **Verification:** 14/14 Vitest E2E Tests Passing (`backend/tests/designations.overhaul.e2e.test.js`), 0 Oxlint Errors, Clean Vite Production Build (`vite build` succeeded in 30.54s).
  - **Key Deliverables:**
    - Live 7-KPI summary statistics header (`DesignationStatsCards.jsx`) with interactive filter triggers.
    - Native SVG Donut Chart + Horizontal Bar Chart workforce analytics (`DesignationAnalyticsSection.jsx`, `GET /designations/analytics`).
    - Dual View Switcher (High-density Enterprise Table View vs Designation Card Grid View (`DesignationCardView.jsx`)).
    - Multi-dimensional filter toolbar (`DesignationFilterBar.jsx`) with search, department, grade tier, headcount threshold, active status, and dismissible chips.
    - Modernized Modals: Create/Edit (`DesignationModal.jsx` with 5 grade tier visual selector), Detailed Inspection (`DesignationDetailModal.jsx` with assigned staff roster search), Archive (`DesignationArchiveModal.jsx`), Restore (`DesignationRestoreModal.jsx`), and Permanent Delete (`DesignationPermanentDeleteModal.jsx` with strict employee assignment lock).
    - Cross-module archival guards in `employee.service.js` blocking assignment to archived designations.
    - Strict enforcement of non-negotiable Employee Assignment Restriction Guard (permanent deletion blocked if $\ge 1$ employee assigned).

- **Phase 25: Department Module — Complete UI Overhaul, Functional Audit, Analytics, RBAC/PBAC Compliance & Error Fixing**
  - **Status:** **100% COMPLETE & VERIFIED (2026-11-18)**
  - **Verification:** 11/11 Vitest E2E Tests Passing (`backend/tests/departments.archive-lifecycle.e2e.test.js`), 0 Oxlint Errors, Clean Vite Production Build (`vite build` succeeded in 19.8s).
  - **Key Deliverables:**
    - Live 7-KPI summary statistics header (`DepartmentStatsCards.jsx`) with click filter triggers.
    - Native SVG Donut Chart + Horizontal Bar Chart workforce analytics (`DepartmentAnalyticsSection.jsx`, `GET /departments/analytics`).
    - Dual View Switcher (High-density Enterprise Table View vs Department Card Grid View (`DepartmentCardView.jsx`)).
    - Multi-dimensional filter toolbar (`DepartmentFilterBar.jsx`) with keyword search, division, status, staff headcount, leadership, and active filter chips.
    - Searchable Employee Selection Dropdown (`EmployeeSelectDropdown.jsx`) with authentic DB records, avatars, codes, and designations (zero generic "Employee 1" entries).
    - Modernized Modals: Create/Edit (`DepartmentModal.jsx`), Detailed Inspection (`DepartmentDetailModal.jsx` with leadership spotlight card and staff roster search), Archive (`DepartmentArchiveModal.jsx`), Restore (`DepartmentRestoreModal.jsx`), and Permanent Delete (`DepartmentPermanentDeleteModal.jsx` with strict employee assignment lock).

---

## Test & Build Verification Baseline
- **Vitest Backend Test Suite:** **All 26 test files passing (138 / 138 tests green)**
- **Vite Production Build:** Transformed 1688 modules, 0 errors.
- **Tasks File:** Fully synchronized at `.specify/specs/04-company-settings/tasks.md` (all slices marked `[x]`).

---

## Accumulated Context

### Roadmap Evolution
- Phase 6 added: Expense Module – UI Design Improvements (Buttons & Pills, Categorize & Limit Tab, Archive Tab, Active Tab, Data Table row modals and alignments per DESIGN.md and docs/UI-REFERENCE.md)
- Phase 7 added: Assets Module – Complete UI Redesign & Improvements (My Assets, Assets Register Active/Archive tabs, Custodian Dropdown, Requisition workflow, PBAC/RBAC, and assigned asset deletion prevention)
- Phase 8 added: Recruitment & ATS Module – Complete UI Redesign & Improvements (Job Openings Active/Archive tabs, Public Career Portal, Candidate Pipeline, Internal Jobs & Employee Referrals, PBAC/RBAC alignment)
- Phase 9 added: AI Resume Parsing Enhancements & Multi-Provider OpenAI/Gemini Setup (Document Text Extraction via pdf-parse & mammoth, OpenAI configuration, dual-engine failover, Redis caching)

- [x] **quick/20261019-notification-settings-tab:** Admin Notification & Announcement Delivery Method Selection (In-App Only, Email Only, WhatsApp Only, Mixed Omnichannel). Mounted tab in `SettingsPage.jsx`, wired `NotificationSettingsForm.jsx`, validated in `setting.validation.js`, enforced in `notify.service.js`. Verified via 16/16 tests (`admin-notification-settings.test.js`, `whatsapp-notifications.test.js`) and Vite build.
- [x] **quick/20261025-sidebar-scrollbar-ui-fix:** Fix UI scrollbar in the left navigation sidebar. Replaced default 17px native Windows light-gray scrollbar with sleek, minimalist dark scrollbar (`.sidebar-scrollbar` with thin width, transparent track, subtle translucent thumb on dark `#061A14`, hover emerald `#00C471`). Added `.custom-scrollbar` and `.scrollbar-none` utilities. Verified via Vite build (1819 modules transformed, 0 errors).
- [x] **quick/20261025-org-chart-refresh-button:** Added in-app data reload action to Org Chart (`/org-chart`). Wired RTK Query `refetch()` with `isFetching` loading state, `RefreshCw` spinner, and `sonner` toast alerts in `OrgChartPage.jsx` (PageHeader action, Department filter pill, and canvas control bar). Enhanced `PageHeader.jsx` to support `children` actions. Verified via Vite build.
- [x] **quick/20261025-org-chart-color-scheme-fix:** Harmonized Org Chart (`/org-chart`) color scheme with Forest & Emerald design system (`DESIGN.md`). Replaced hardcoded pitch-black slate elements (`bg-slate-900`, `bg-slate-950`, `bg-[#061A14]/95`) with responsive theme tokens (`bg-white dark:bg-[#111D17]`, `border-slate-200 dark:border-[#1A3125]`, and blueprint dot-grid canvas). Themed node cards (`OrgChartNode.jsx`), filter bar, zoom tools, and detail modal. Verified via Vite build.
- [x] **quick/20261111-employee-archive-bucket-and-modal-fix:** Fix employee delete modal close button (`ConfirmDialog.jsx`), create Archive Bucket in Employee Directory (`EmployeeListPage.jsx`) with live tab switcher, implement Revert (`POST /api/v1/employees/:id/restore`) and Permanent Delete (`DELETE /api/v1/employees/:id/permanent`) with dedicated danger confirmation modal. Verified via 19/19 Vitest tests (`employees.api.test.js`) and Vite production build.
- [x] **quick/20261113-on-leave-modal-ui-redesign:** Redesigned on-leave attendance blocking modal (`OnLeaveModal.jsx`) to adhere strictly to Forest & Emerald design system (`DESIGN.md` & `docs/UI-REFERENCE.md`). Eliminated AI-gradient button and harsh callout, added hairline borders, authoritative CalendarClock badge, semantic category pills, and balanced self-service cancellation controls. Verified via Vite production build and Vitest test suite.
- [x] **quick/20261113-leave-types-table-ui-redesign:** Redesigned Leave Types (`LeaveTypesPage.jsx`) table to remove AI slop, duplicate search bars, and nested card borders. Replaced nested DataTable with native high-density enterprise table featuring unified toolbar with single search, monospace code tags, tabular yearly quotas, restrained remuneration pills, em-dash carry-forward values, eligibility column, and styled action buttons adhering to `DESIGN.md` and `docs/UI-REFERENCE.md`. Verified via Vite build and Vitest tests.
- [x] **quick/20261118-login-history-avatar-integration:** Integrate real Cloudinary User/Employee profile avatar photos in the Login History data table and Attempt Inspection modal. Added `avatar` field to `loginHistorySchema`, populated via `recordLoginHistory` and `enrichLoginRecord`, backfilled 680 historical records in Atlas, and connected canonical `PersonAvatar` component in `LoginHistoryPage.jsx` and `LoginDetailModal.jsx`. Verified via 15/15 Vitest E2E tests (`tests/auth.login-history.e2e.test.js`), Oxlint (0 errors, 0 warnings), and Vite production build.
- [x] **phase/06-expense-module-ui-design-improvements:** Comprehensive overhaul of Expense Module UI craft across Buttons & Pills, Categorize & Limit Tab, Archive Tab, and Active Views. Implemented semantic CategoryPills, built `ExpenseCategoryDetailModal` with full audit metadata and action triggers on row click, redesigned high-density semantic tables with tabular numbers, receipt indicators, and hairline borders in `ExpenseCategoriesPage.jsx`, `ExpenseApprovalsPage.jsx`, and `MyExpensesPage.jsx`. Verified via 6/6 Vitest tests (`expense.category-archive.test.js`), Vite production build (2020 modules, 0 errors), and live Playwright browser verification across all active/archive tables and modals.
- [x] **phase/07-assets-module-complete-ui-redesign-improvements:** Complete UI redesign and architectural modernization of the Assets Module. Implemented searchable `CustodianSelect.jsx`, comprehensive `AssetDetailModal.jsx` and `AssetArchiveDetailModal.jsx`, overhauled `MyAssetsPage.jsx` with KPI metric cards, buttons/pills tab switcher, and enterprise table; overhauled `AssetsPage.jsx` into dual Active and Archive console with strict assigned asset deletion lock UI and backend 400 enforcement; redesigned `AssetRequestsPage.jsx` into a modern requisition pipeline with status pills and allocation modals. Verified via 29/29 Vitest tests (`m23.asset.e2e.test.js`), 17/17 security tests (`m23.asset.security.test.js`), Vite production build (2023 modules, 0 errors), and live Playwright browser verification.
- [x] **phase/08-recruitment-ats-module-complete-ui-redesign-improvements:** Complete UI redesign and architectural modernization of the Recruitment & ATS Module. Implemented Active/Archive lifecycle with Revert to Draft (`POST /api/v1/recruitment/jobs/:id/restore`) and guarded Permanent Deletion (`DELETE /api/v1/recruitment/jobs/:id/permanent`, protected against active pipeline candidates); overhauled `JobsPage.jsx` with KPI counters, Active/Archive/Requisition tabs, and `JobArchiveDetailModal.jsx`; overhauled external `CareersPublicPage.jsx` with responsive emerald cards and `ApplyPage.jsx` with drag-and-drop resume upload; overhauled `CandidatePipelinePage.jsx` Kanban board with semantic stage borders and candidate detail modal; redesigned `InternalJobsPage.jsx` and `EmployeeReferralModal.jsx` with rich position cards, incentive trackers, and validation. Verified via 29/29 Vitest tests (`m15.recruitment.test.js`, `m15.recruitment.security.test.js`) and Vite production build (2024 modules, 0 errors).
- [x] **phase/09-ai-resume-parsing-enhancements-openai-gemini-setup:** Upgrade Recruitment & ATS AI system with real document text extraction (`pdf-parse` & `mammoth` in `documentParser.service.js`), multi-provider architecture (`ai.service.js` with `AI_PROVIDER=auto|gemini|openai`, `OPENAI_API_KEY`, dual-engine failover on HTTP 429 quota exhaustion, and deterministic heuristic fallback), SHA-256 buffer hash caching (`aiCache.service.js`), candidate `aiProvider` tracking in MongoDB model, and frontend AI engine inspection badge in `CandidateDetailModal.jsx`. Verified via 26/26 backend tests (`m15.documentParser.test.js`, `m15.multiProvider.test.js`, `m15.recruitment.security.test.js`) and Vite production build (2024 modules, 0 errors).
- [x] **phase/25-department-module-complete-audit-implementation-archive-management-ui-ux-refinement:** Complete end-to-end audit, regression fix, and implementation of Department Module across backend schema, services, routes, RTK Query API, and modern frontend UI. Diagnosed and permanently resolved the listing regression caused by unpopulated BSON fields by querying `{ isArchived: { $ne: true } }` and normalizing legacy documents. Implemented full archive lifecycle (`isArchived`, `archivedAt`, `archivedBy`), dynamic KPI statistics (`GET /api/v1/departments/stats`), dedicated Archive Tab, Revert/Restore modal (`PATCH /:id/restore`), and Permanent Deletion modal (`DELETE /:id/permanent`). Enforced critical business rule: permanently deleting a department is strictly blocked when $\ge 1$ employee is assigned, enforced on both backend and frontend. Added employee onboarding and profile guard against assigning employees to archived departments. Verified via 11/11 Vitest E2E tests (`backend/tests/departments.archive-lifecycle.e2e.test.js`), Oxlint (0 errors), and clean Vite production build.
- [x] **phase/26-designation-module-complete-ui-overhaul-system-wide-integration-audit-rbac-pbac-compliance-analytics-error-fixing:** Complete end-to-end audit, overhaul, and architectural hardening of the Designation Module. Expanded Designation schema with archival lifecycle metadata (`isArchived`, `archivedAt`, `archivedBy`) and non-negotiable Employee Assignment Restriction Guard blocking permanent deletion while $\ge 1$ employee is assigned. Delivered 7-KPI live statistics header (`DesignationStatsCards.jsx`), interactive SVG Donut and horizontal flex-bars (`DesignationAnalyticsSection.jsx`), dual view switcher (high-density Table vs `DesignationCardView.jsx`), multi-dimensional `DesignationFilterBar.jsx`, and redesigned modal suite (`DesignationModal.jsx`, `DesignationDetailModal.jsx`, `DesignationArchiveModal.jsx`, `DesignationRestoreModal.jsx`, and `DesignationPermanentDeleteModal.jsx`). Verified via 14/14 Vitest E2E tests (`backend/tests/designations.overhaul.e2e.test.js`), 0 oxlint errors, and clean Vite production build.
- [x] **phase/39-complete-software-wide-modal-audit-ui-standardization:** Complete software-wide audit of 172 modal and drawer components. Converted all right-side opening drawers (OrgChartDetailDrawer, PolicyDetailDrawer, ExpenseDetailDrawer, LoanScheduleDrawer, CaseDetailsDrawer, GroupInfoDrawer, NotificationDrawer, PayslipAdjustmentDrawer, SalaryStructuresPage drawer) into centered, responsive dialogs. Replaced dark/blackout backdrops with ultra-subtle transparent backdrop (`bg-black/15 backdrop-blur-xs`) and elevated stacking context to `z-[100]`. Verified via Oxlint (0 errors) and clean Vite production build.
- [ ] **phase/40-software-wide-real-time-data-sync-cache-invalidation-auto-refresh:** (PENDING BACKLOG) Permanently eliminate manual page refresh (F5) dependency across local dev and production (Vercel/Render). Establish global `refetchOnFocus` and `refetchOnReconnect`, audit and fix all missing/mismatched `invalidatesTags` across all feature mutations, implement optimistic updates for self-service actions, configure smart background polling on mission-critical operations consoles, expand multi-user Socket.io real-time cache dispatching, and verify cross-tab synchronization.






