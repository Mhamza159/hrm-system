# Module M26: Roles & Permissions Complete System-Wide RBAC/PBAC Overhaul & Phase 29 Studio Redesign

## 1. System Architecture & Catalogue
- **Permission Catalogue (`backend/src/shared/permissions.js`)**:
  - Exactly 127 unique registered permissions across 26 modules.
  - Zero duplicate action identifiers.
  - Structured into 5 distinct categories:
    - Core HR & Organization (`core_hr`)
    - Time, Attendance & Leaves (`time_attendance`)
    - Payroll, Loans & Compensation (`payroll_finance`)
    - Talent, Recruitment & Assets (`talent_operations`)
    - Governance, Policies & System (`governance`)
  - Exported catalogues: `PERMISSIONS_CATALOGUE`, `MODULE_CATEGORIES`, `ALL_ACTIONS_LIST`, `ACTIONS_BY_MODULE_MAP`, `ACTION_METADATA_MAP`, `GET_DEFAULT_SCOPES_MAP`.

## 2. Core Security & System Role Immunity
- **System Roles (`isSystem: true`)**:
  - `Super Admin`: Unrestricted global `manage:all` pass. Cannot be renamed, deactivated, or deleted (returns HTTP 400).
  - `HR Manager`: Tenant HR management authority. Immutable system role.
  - `Department Manager`: Departmental managerial leadership. Immutable system role.
  - `Employee`: Personal self-service access. Immutable system role.
- **Assigned User Safeguards**:
  - Roles with active assigned users (`userCount > 0`) cannot be deleted (returns HTTP 409 Conflict).
  - Deletion is strictly soft-delete (`isDeleted: true`).

## 3. PBAC Data Scoping & Field Masking
- **Data Scoping (`backend/src/utils/scopeFilter.js`)**:
  - Enforced across all Mongoose database queries.
  - Scopes: `all` (unrestricted), `department` (scoped to user's assigned department), `team` (scoped to direct and indirect reports), `own` (scoped strictly to user's own employee record).
- **Field-Level Masking (`backend/src/utils/fieldFilter.js`)**:
  - Sensitive attributes (`baseSalary`, `cnic`, `bankAccount`, `pan`, `emergencyContacts`) masked as '—' unless actor holds specific read permissions.

## 4. Phase 29: Edit Role Studio & Visual Permission Matrix Redesign
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
- **Automated Verification**:
  - Vitest suite `backend/tests/roles.matrix.audit.test.js` (6/6 passing).
  - 0 Oxlint errors across all roles components.
  - Clean Vite production build.