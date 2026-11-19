# Phase 34: User Access Module Overhaul — Architecture, Security, RBAC/PBAC Compliance & Redesign

## Overview
Phase 34 delivered an enterprise-grade User Access & Security Management portal conforming to docs/UI-REFERENCE.md (Elvara Forest #061A14 & Emerald #00C471).

## 1. Data Model Alignment (User Schema)
- `name`: Added first-class `name: { type: String, trim: true, default: '' }` to `User` schema.
- Added compound indexes `{ name: 1 }` and `{ roles: 1 }`.
- Added virtual getters:
  - `isLocked`: returns true if `lockUntil && lockUntil > Date.now()`
  - `accountStatus`: returns `'locked'` if locked, else `'active'` if `isActive`, else `'inactive'`.
- Synchronized `User.name` with `Employee.name` in `employee.service.js` during onboarding and profile updates.

## 2. Backend Service & Scoped PBAC APIs (`user.service.js` & `user.controller.js`)
- `GET /api/v1/users`: Paginated listing with keyword search (name, email), role filter, department filter, status filter (`active`, `inactive`, `locked`), accessStatus filter (`assigned`, `unassigned`), and PBAC departmental scoping.
- Response Envelope Contract: `res.body.data` holds the users array; `res.body.meta` holds `{ total, page, limit, totalPages }`.
- `GET /api/v1/users/stats`: Aggregates KPI counters (`totalUsers`, `activeUsers`, `inactiveUsers`, `lockedUsers`, `assignedUsers`, `unassignedUsers`, `twoFactorUsers`) and pure SVG analytics breakdowns (Users by Role, Status Distribution).
- `GET /api/v1/users/:id`: Deep forensic inspection with employee demographics, role assignments, remaining lockout minutes, and PBAC access guards.
- Security Actions:
  - `POST /api/v1/users/:id/unlock`: Clears `lockUntil` and `failedAttempts`, creates audit log, sends notification.
  - `POST /api/v1/users/:id/revoke-sessions`: Nulls `refreshTokenHash` to evict active sessions.
  - `POST /api/v1/users/:id/force-password-change`: Sets `mustChangePassword = true` and invalidates refresh token.
  - `POST /api/v1/users/:id/reset-password`: Emergency temporary password generation.
  - `POST /api/v1/users/:id/reset-device`: Unbinds attendance hardware kiosk / mobile device.

## 3. Frontend Architecture (`frontend/src/features/users/`)
- `usersApi.js`: Dedicated RTK Query slice with tags `Users`, `UserStats`, `UserDetail`, `EffectivePermissions`.
- `userAccessTheme.js`: Semantic badge styling for account status, system/custom roles, and 2FA.
- `UserAccessDashboard.jsx`: 6-card actionable KPI deck + SVG role distribution bar chart + SVG donut account health meter.
- `UserAccessFilterBar.jsx`: Sticky multi-criteria filter toolbar (debounced search, role, department, status, access status).
- `UserAccessTable.jsx`: High-density enterprise DataTable with pagination, employee credentials, status badges, lockout warning, and action buttons.
- `UserInspectModal.jsx`: 5-tab forensic modal (Identity, Roles, Effective Permissions Matrix grouped by module, Account Security & Sessions, Access History).
- `UserRoleAssignModal.jsx`: Guarded role assignment studio with privilege escalation protection (non-super-admin cannot assign Super Admin or unheld permissions).
- `UserStatusActionModal.jsx`: Guarded confirmation dialog for activation/deactivation with mandatory justification reason.
- `UserSecurityActionsModal.jsx`: Multi-action security dialog supporting account unlock, session revocation, mandatory password rotation, emergency password reset with copyable credentials, and hardware device unbinding.
- `UsersPage.jsx`: Master page overhauling the user access experience.

## 4. Verification & Quality Gates
- Vitest Integration Suite: `tests/userAccess.module.overhaul.test.js` (15/15 passing tests covering listing, stats, PBAC, unlock, session revocation, force password change, escalation guards).
- Oxlint: 0 errors across frontend.
- Vite build: Clean production build (100% successful).
