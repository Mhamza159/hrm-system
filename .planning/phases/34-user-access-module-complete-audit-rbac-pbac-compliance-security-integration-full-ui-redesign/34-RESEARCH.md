# Phase 34 Research: User Access Module — Complete Audit, RBAC/PBAC Compliance, Security, Integration & Full UI Redesign

## 1. Domain & Architecture Landscape

### A. Current Implementation Analysis
- **Module**: User Access & Administration (BUILD-GUIDE Section 4 · Row 1.13)
- **Primary Routes**: `backend/src/modules/users/user.routes.js`
- **Frontend Page**: `frontend/src/features/users/pages/UsersPage.jsx`
- **Database Model**: `backend/src/models/user.model.js`
- **Current Limitations**:
  1. `User` Schema lacks a `name` field; relies on string slicing of email (`row.email.charAt(0)`) or unpopulated `employeeId`.
  2. `GET /api/v1/users` lacks server-side pagination, searching, and filtering. It loads the entire collection with `User.find({ isDeleted: false })` and does NOT populate `employeeId` (losing employee code, department, designation, and employment status).
  3. No dedicated User Access KPI metrics or security analytics endpoint (`/stats`).
  4. Incomplete security actions: Account status toggle only mutates `isActive`, leaving `lockUntil` / `failedAttempts` without an administrative unlock mechanism, no explicit session revocation endpoint, and no force password change trigger.
  5. User Inspect view only presents a basic modal for effective permissions (`EffectivePermissionsModal.jsx`) without comprehensive identity, linked employee coordinates, account security state, or access history.
  6. Frontend UI lacks the modern Elvara Forest (`#061A14`) & Emerald (`#00C471`) design system established in Phases 28-33.

### B. Core Entities & Relationships
- `User`:
  - `email`: Strictly unique, lowercase, trimmed authentication identifier.
  - `name`: Full personal name (synced from `Employee.name` or standalone admin name).
  - `roles`: Array of `ObjectId` references to `Role`.
  - `employeeId`: `ObjectId` reference to `Employee` master record.
  - `isActive`: Boolean controlling account activation/deactivation.
  - `lockUntil`: Date representing temporary lockout after 5 consecutive failed login attempts.
  - `failedAttempts`: Number tracking consecutive failed login attempts.
  - `mustChangePassword`: Boolean requiring password update upon next login.
  - `lastLoginAt`: Timestamp of latest successful authentication.
  - `twoFactorEnabled`: 2FA activation status.
  - `deviceId`, `deviceBoundAt`, `deviceModel`: QR attendance hardware binding.
- `Employee`:
  - Links to `User` via `userId`. Holds `employeeCode`, `departmentId`, `designationId`, `employmentStatus`, `avatar`, and personal coordinates.
- `Role`:
  - Holds `name`, `description`, `isSystem`, and `permissions` array (`{ action, subject, scope }`).

---

## 2. Security & RBAC/PBAC Governance

### A. Permissions Catalog (`backend/src/shared/permissions.js`)
- `user.view`: View User Access directory, user profiles, and security metrics (scopes: `all`, `department`, `own`).
- `user.manage`: Activate/deactivate accounts, unlock locked accounts, revoke sessions, and dispatch temporary credentials (scopes: `all`).
- `role.assign`: Assign or replace user roles with privilege escalation protection (scopes: `all`).
- `role.view`: Inspect effective compiled permissions (scopes: `all`, `department`, `own`).

### B. Privilege Escalation Defense
- Non-Super Admins cannot assign the `Super Admin` role.
- An administrator cannot assign a role containing permissions they do not possess unless they have unrestricted Super Admin privileges.
- Self-deactivation and self-role escalation are strictly blocked on the backend.

---

## 3. UI/UX Design System Alignment (`docs/UI-REFERENCE.md`)

- **Palette**:
  - Dark Primary: Elvara Forest `#061A14`
  - Emerald Accent: `#00C471`
  - Slate Background: `#F8FAFC` (Light) / `#0A110D` (Dark)
  - Card Surfaces: `#FFFFFF` (Light) / `#111D17` (Dark)
  - Borders: `#EAECF0` (Light) / `#1A3125` (Dark)
- **Core Components**:
  - 6-Card KPI Deck (Total Users, Active, Deactivated, Locked/Suspended, Assigned Roles, 2FA Enabled)
  - Pure SVG Analytics (Users by Role distribution, Status breakdown)
  - Sticky Filter Toolbar (Search by name/email/code, Role dropdown, Department filter, Status chips, 2FA toggle)
  - High-Density DataTable (Avatar, Full Identity, Employee Code, Department/Designation, Role pills, Status badge, Lock indicator, Last login, Action menus)
  - 5-Tab Forensic Inspect Modal (Identity, Roles, Effective Permissions Matrix, Security State, Access History)
  - Role Assignment Studio & Security Action Modals (Unlock, Session Revocation, Password Management)
