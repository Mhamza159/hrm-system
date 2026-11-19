# Module M26: Roles & Permissions Complete System-Wide RBAC/PBAC Overhaul, Matrix Studio & Phase 30 Visibility Audit

## 1. System Architecture & Catalogue
- **Permission Catalogue (`backend/src/shared/permissions.js`)**:
  - Exactly 127 unique registered permissions across 26 modules.
  - Zero duplicate action identifiers.
  - 5 distinct categories:
    - Core HR & Organization (`core_hr`)
    - Time, Attendance & Leaves (`time_attendance`)
    - Payroll, Loans & Compensation (`payroll_finance`)
    - Talent, Recruitment & Assets (`talent_operations`)
    - Governance, Policies & System (`governance`)
  - Exported catalogues: `PERMISSIONS_CATALOGUE`, `MODULE_CATEGORIES`, `ALL_ACTIONS_LIST`, `ACTIONS_BY_MODULE_MAP`, `ACTION_METADATA_MAP`, `GET_DEFAULT_SCOPES_MAP`.

## 2. Models, Database Entities & APIs
- **Role Model (`backend/src/models/role.model.js`)**:
  - `name`: Unique role name.
  - `slug`: Monospace slug identifier for programmatic evaluation.
  - `description`: 0-200 chars.
  - `isSystem`: Boolean flag protecting core system roles.
  - `isActive`: Boolean toggle.
  - `permissions`: Array of `{ action, subject, scope, fields, limit }`.
  - `isDeleted`: Soft-delete indicator.
- **Delegation Model (`backend/src/models/delegation.model.js`)**:
  - `fromUser`, `toUser`, `startDate`, `endDate`, `permissions`, `status`, `reason`.
- **Core APIs**:
  - `GET /api/v1/permissions`: Catalogue discovery.
  - `GET /api/v1/roles`: Filtered and paginated roles with active user counts.
  - `GET /api/v1/roles/stats`: Live role metrics (total, system, custom, active, assignments).
  - `GET /api/v1/roles/analytics`: Distribution charts and module coverage.
  - `GET /api/v1/roles/:id`: Role details.
  - `POST /api/v1/roles`: Custom role creation with permission validation.
  - `PATCH /api/v1/roles/:id`: Role update with system role rename protection.
  - `POST /api/v1/roles/:id/clone`: Deep clone existing role under new identifier.
  - `DELETE /api/v1/roles/:id`: Soft-delete role with active assignment conflict prevention (HTTP 409).
  - `PATCH /api/v1/users/:id/roles`: Assign roles to staff.
  - `GET /api/v1/users/:id/effective-permissions`: Compiled effective permissions inspector.
  - `POST /api/v1/delegations`: Delegate approval authority.

## 3. Core Security & System Role Immunity
- **System Roles (`isSystem: true`)**:
  - `Super Admin`: Unrestricted global `manage:all` pass. Cannot be renamed, deactivated, or deleted (returns HTTP 400).
  - `HR Manager`: Tenant HR management authority. Immutable system role.
  - `Department Manager`: Departmental managerial leadership. Immutable system role.
  - `Employee`: Personal self-service access. Immutable system role.
- **Assigned User Safeguards**:
  - Roles with active assigned users (`userCount > 0`) cannot be deleted (returns HTTP 409 Conflict).
  - Deletion is strictly soft-delete (`isDeleted: true`).

## 4. PBAC Data Scoping & Field Masking
- **Data Scoping (`backend/src/utils/scopeFilter.js`)**:
  - Enforced across all Mongoose database queries.
  - Scopes: `all` (unrestricted), `department` (scoped to user's assigned department), `team` (scoped to direct and indirect reports), `own` (scoped strictly to user's own employee record).
- **Field-Level Masking (`backend/src/utils/fieldFilter.js`)**:
  - Sensitive attributes (`baseSalary`, `cnic`, `bankAccount`, `pan`, `emergencyContacts`) masked as '—' unless actor holds specific read permissions.

## 5. Phase 29: Edit Role Studio & Visual Permission Matrix Redesign
- **Design System**: Elvara Forest & Emerald Enterprise theme (`#061A14`, `#111D17`, `#1A3125`, `#00C471`).
- **Role Specifications Studio Card (`RoleFormPage.jsx`)**:
  - Breadcrumb navigation (`Roles & Permissions` -> `Edit Role: [Role Name]`).
  - Active/Inactive toggle switch (disabled with lock for core system roles).
  - Gold Crown (`Crown`) badge for immutable system roles.
  - Monospace slug preview badge (`#identifier`).
  - Auto-growing description textarea with character counter (`0/200`).
  - Offline mode detector with save prevention banner (`WifiOff`).
  - Browser departure guard (`beforeunload`) protecting uncommitted work.
- **Visual Matrix Component Hierarchy**:
  - `MatrixCategoryNav.jsx`: Sticky 5-category jump ribbon with density counts (`active/total`).
  - `ModulePermissionCard.jsx`: Collapsible card with module icon, tri-state checkbox (checked, indeterminate, unchecked), bulk scope selector, and counter badge.
  - `PermissionActionRow.jsx`: Memoized action row with primary emerald toggle, granular scope selector (`all`, `department`, `team`, `own`), and numerical approval limit input.
  - `PermissionMatrix.jsx`: Integrated matrix controller featuring debounced search filter, "Show Enabled Only" switch, "Expand/Collapse All", and automated prerequisite resolution (e.g. granting `.approve` or `.edit` automatically grants module `.view`).
- **Pre-Save Safety & Diff Review**:
  - `PermissionDiffModal.jsx`: Pre-save modal itemizing added permissions (+), modified scopes (~), modified limits (~), and revoked permissions (-).
  - Sticky bottom action bar displaying live delta count with quick "Discard" and "Review & Save" triggers.

## 6. Phase 30: System-Wide Frontend Visibility Audit & Real-Time Revocation Sync
- **Zero UI Leakage Rule**:
  - Unauthorized UI elements (buttons, links, tabs, actions, modal triggers) return `null` immediately.
  - Banned patterns completely eliminated: zero disabled buttons, greyed-out controls, or locked modal dialogs.
- **Admin Exemption**:
  - `Super Admin` and `manage:all` wildcards grant immediate pass-through across every module without restriction.
- **Real-Time Revocation Sync**:
  - Any permission change invalidates RTK Query `'Auth'` tag.
  - `App.jsx` mounts `useGetMeQuery(undefined, { skip: !isAuthenticated })`, triggering immediate background re-fetch of `/api/v1/auth/me`.
  - `authSlice` synchronously updates `state.permissions` and `state.user.effectivePermissions`.
  - CASL ability automatically rebuilds, dynamically unmounting revoked UI elements without manual re-login.
- **Dual Enforcement (Defense-in-Depth)**:
  - Every UI check is paired 1:1 with backend `checkPermission(action, subject)` middleware.
  - Direct API calls by unauthorized actors return `HTTP 403 Forbidden` (`{ success: false, code: 'FORBIDDEN' }`).
- **Documentation**:
  - Published master `docs/ROLE-PERMISSION-VISIBILITY-MATRIX.md` covering all 26 modules.

## 7. Automated Test Suites & Verification
- `backend/tests/rbac.pbac.visibility.audit.test.js`: 10 / 10 passed (100%).
- `backend/tests/roles.matrix.audit.test.js`: 6 / 6 passed (100%).
- `backend/tests/roles.overhaul.e2e.test.js`: 18 / 18 passed (100%).
- `backend/tests/roles.security-audit.test.js`: 17 / 17 passed (100%).
- `backend/tests/rbac_pbac_role_matrix.test.js`: 6 / 6 passed (100%).
- `backend/tests/permissions.catalogue.test.js`: 3 / 3 passed (100%).
- `backend/tests/effective_permissions.test.js`: 2 / 2 passed (100%).
- `backend/tests/checkPermission.test.js`: 4 / 4 passed (100%).
- **Total Tests**: 66 / 66 passing (100% green).
- **Static Analysis (Oxlint)**: 0 errors across 431 frontend files.
- **Vite Production Build**: Clean bundle in 25.15s.
