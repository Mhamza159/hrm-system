# HRM System — Current State & Progress Tracker

## Project Overview
- **Project:** HRM System (Human Resource Management System)
- **Client Profile:** Single software house, Pakistan (10–30 staff today, 50–80 projected in 2 years)
- **Active Branch:** `feature/03-roles-permissions`
- **Active Phase:** Phase 1: Core HR & Payroll (Launch Scope P1)
- **Current Active Module:** **M26 Roles & Permissions (RBAC & CASL)** (`docs/BUILD-GUIDE.md` Section 5 · Rows 26.1 to 26.17)

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

## Test & Build Verification Baseline
- **Vitest Backend Test Suite:** **All 23 test files passing**
- **Vite Production Build:** Transformed 1672 modules, 0 errors.
- **Tasks File:** Fully synchronized at `.specify/specs/03-roles-permissions/tasks.md` (all slices marked `[x]`).

