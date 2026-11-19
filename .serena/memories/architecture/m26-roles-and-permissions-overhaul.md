# Module M26: Roles & Permissions Complete System-Wide RBAC/PBAC Overhaul

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

## 4. Frontend Command Center & Visual Studio
- **Design System**: Elvara Forest & Emerald Enterprise theme (`#061A14`, `#111D17`, `#1A3125`, `#00C471`).
- **Dashboard Analytics**:
  - 8-KPI live database-backed cards: Total Roles, Active Roles, System Core, Custom Roles, Assigned Staff, Total Permissions, Avg Perms/Role, Active Delegations.
  - SVG Zero-Dependency Visualizations:
    - `RoleDistributionChart.jsx`: Horizontal flex-bars showing headcount and workforce percentage.
    - `ModulePermissionDonut.jsx`: Native SVG Donut chart displaying permission density across categories.
- **Directory & Dual View Switcher**:
  - High-density table view with avatar stacks and permission progress bars.
  - Visual card grid view (`RoleCardView.jsx`) with localStorage persistence.
  - Multi-dimensional filter toolbar (`RoleFilterBar.jsx`) with search, role type, status, and headcount filters.
- **Guarded Modal Suite**:
  - `RoleDetailModal.jsx`: Deep inspection with tabs for permissions, assigned staff roster, and audit history.
  - `RoleCloneModal.jsx`: Clone existing role into new custom role.
  - `RoleDeleteModal.jsx`: Guarded deletion with system role and active user locks.
  - `UserRoleAssignModal.jsx`: Multi-role assignment with privilege escalation guard.
- **Visual Matrix Studio**:
  - `PermissionMatrix.jsx` with category jump-nav, tri-state checkboxes, bulk module scope setting, and auto-granting view dependencies.
  - `PermissionDiffModal.jsx`: Pre-save side-by-side differential review.