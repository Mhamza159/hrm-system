# Feature Specification: Module M26 — Roles & Permissions (RBAC & CASL)

**Feature Branch**: `feature/03-roles-permissions`  
**Created**: 2026-10-12  
**Status**: Draft  
**Module ID**: M26  
**Module Name**: Roles & Permissions (RBAC & CASL)  
**Governing Documents**:
- [`docs/FRD.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/FRD.md) Section 5 (M26) & Section 11 (Permission Matrix M26 Row)
- [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 5 (Rows 26.1 to 26.17)
- [`docs/TECH-SPEC.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/TECH-SPEC.md) Section 4 & Section 8

---

## 1. Executive Summary & Architecture Integration

Access in the HRM System is strictly permission-driven, not hardcoded to enum roles. Every operational action across all 26 modules maps to a structured action-subject permission. Roles are named bundles of permissions containing explicit **data scopes** (`own`, `team`, `department`, `all`), **field masking rules** (e.g. hiding sensitive salary, CNIC, and bank accounts), and **approval limits**.

### Context7 Verified Library Syntax Patterns

#### Backend Authorization (`@casl/ability` v6.7+)
```javascript
// Rule construction via AbilityBuilder and createMongoAbility
import { AbilityBuilder, createMongoAbility } from '@casl/ability';

export const defineAbilityForUser = (user, delegations = []) => {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  // Iterate over user roles and assigned permission rules
  user.roles.forEach((role) => {
    role.permissions.forEach((perm) => {
      // Conditions dynamically constructed based on data scope
      const conditions = {};
      if (perm.scope === 'own') {
        conditions.employeeId = user.employeeId || user._id;
      } else if (perm.scope === 'team') {
        conditions.reportingManagerId = user._id;
      } else if (perm.scope === 'department') {
        conditions.departmentId = user.departmentId;
      }

      can(perm.action, perm.subject, perm.fields?.length ? perm.fields : undefined, conditions);
    });
  });

  return build();
};
```

#### Frontend Declarative Protection (`@casl/react` v5+)
```jsx
// Declarative button and section guarding in JSX
import { Can } from '@casl/react';
import { useAbility } from '../context/AbilityContext';

export const RoleActionButton = ({ role }) => {
  const ability = useAbility();

  return (
    <Can I="manage" a="Role">
      <button className="btn-primary">Edit Role</button>
    </Can>
  );
};
```

---

## 2. User Scenarios & Acceptance Criteria (17 User Stories)

### User Story 1 — Permission Catalogue Master Definition (BUILD-GUIDE Row 26.1)
**Priority**: P1  
**Why this priority**: Foundational taxonomy defining all granular actions and resources across the entire HRM system. Without this, no roles can be composed or evaluated.  
**Independent Test**: `GET /api/v1/permissions` returns the full catalogue organized by module with actions and valid scopes.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin is authenticated,
   - **When** calling `GET /api/v1/permissions`,
   - **Then** receive HTTP 200 with structured JSON list of all module action permissions (`employee.view`, `leave.approve`, `payroll.run`, etc.).
2. **HR Manager**:
   - **Given** HR Manager is authenticated with `role.view` or `role.assign`,
   - **When** calling `GET /api/v1/permissions`,
   - **Then** receive HTTP 200 with the permission catalogue to populate assignment dropdowns.
3. **Department Manager**:
   - **Given** Department Manager is authenticated without `role.view`,
   - **When** calling `GET /api/v1/permissions`,
   - **Then** receive HTTP 403 Forbidden.
4. **Employee**:
   - **Given** Employee is authenticated,
   - **When** calling `GET /api/v1/permissions`,
   - **Then** receive HTTP 403 Forbidden.

---

### User Story 2 — Role Model & 4 Core System Roles Seed (BUILD-GUIDE Row 26.2)
**Priority**: P1  
**Why this priority**: Required for default system bootstrapping. Instantiates Super Admin, HR Manager, Department Manager, and Employee roles with immutable system protection.  
**Independent Test**: Executing `npm run seed` creates the 4 core roles with exact permissions matching `docs/FRD.md` Section 11.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** database is fresh or seed script runs,
   - **When** `npm run seed` executes,
   - **Then** Super Admin role is created with `isSystem: true` and unrestricted permissions.
2. **HR Manager**:
   - **Given** default seeding executes,
   - **When** inspection of HR Manager role occurs,
   - **Then** HR Manager has `all` scope across employee management, attendance, leave, and payroll preparation, but cannot alter system settings.
3. **Department Manager**:
   - **Given** default seeding executes,
   - **When** inspection of Department Manager role occurs,
   - **Then** role permissions are scoped to `team` for attendance, leave approval, and performance.
4. **Employee**:
   - **Given** default seeding executes,
   - **When** inspection of Employee role occurs,
   - **Then** permissions are strictly scoped to `own` records.

---

### User Story 3 — CASL checkPermission Middleware (BUILD-GUIDE Row 26.3)
**Priority**: P1  
**Why this priority**: Core server-side authorization barrier. Replaces temporary role-string checks with dynamic CASL Ability verification on every API route.  
**Independent Test**: Endpoint guarded with `checkPermission('role.manage')` allows authorized requests and rejects unauthorized with HTTP 403.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin calls any endpoint guarded by `checkPermission(action, subject)`,
   - **When** request executes,
   - **Then** access is granted immediately.
2. **HR Manager**:
   - **Given** HR Manager requests an endpoint where their role has matching ability (e.g. `user.manage`),
   - **When** request executes,
   - **Then** access is granted; if accessing unauthorized route (e.g. `settings.manage`), HTTP 403 is returned.
3. **Department Manager**:
   - **Given** Department Manager requests route outside their abilities,
   - **When** request executes,
   - **Then** receive HTTP 403 Forbidden with `{ success: false, message: "Forbidden" }`.
4. **Employee**:
   - **Given** Employee attempts to access administrative route,
   - **When** request executes,
   - **Then** receive HTTP 403 Forbidden.

---

### User Story 4 — Data Scope Filtering Engine (BUILD-GUIDE Row 26.4)
**Priority**: P1  
**Why this priority**: Enforces tenant-like horizontal data isolation between managers and individual employees.  
**Independent Test**: Querying list endpoints with `scopeFilter` applies `{ reportingManagerId: user._id }` for team scope and `{ employeeId: user._id }` for own scope.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin accesses employee or attendance records,
   - **When** query executes with `all` scope,
   - **Then** receive 100% of company records.
2. **HR Manager**:
   - **Given** HR Manager accesses employee records,
   - **When** query executes with `all` scope,
   - **Then** receive records for all company staff.
3. **Department Manager**:
   - **Given** Department Manager accesses attendance list,
   - **When** query executes with `team` scope,
   - **Then** query filters strictly to subordinates reporting to this manager.
4. **Employee**:
   - **Given** Employee queries attendance or leave records,
   - **When** query executes with `own` scope,
   - **Then** query returns strictly records belonging to the authenticated employee ID.

---

### User Story 5 — Field-Level Permission & Data Masking Engine (BUILD-GUIDE Row 26.5)
**Priority**: P1  
**Why this priority**: Protects sensitive employee data (salary, CNIC, bank IBAN) from unauthorized eyes even within allowed data records.  
**Independent Test**: Employee payload fetched by Department Manager replaces `salary`, `cnic`, and `bankAccount` with `null` or masked strings `—`.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin fetches an employee record,
   - **When** payload is returned,
   - **Then** all fields including basic salary, CNIC, and bank accounts are present unmasked.
2. **HR Manager**:
   - **Given** HR Manager fetches an employee record,
   - **When** payload is returned,
   - **Then** all HR administrative fields are visible according to HR role permissions.
3. **Department Manager**:
   - **Given** Department Manager views team member profile,
   - **When** payload is processed by `fieldFilter`,
   - **Then** `salary`, `allowances`, `bankDetails`, and raw `cnic` are excluded or replaced with `—`.
4. **Employee**:
   - **Given** Employee views their own profile vs colleague profile,
   - **When** payload returns,
   - **Then** own profile displays full own data; other employees' sensitive fields are completely inaccessible.

---

### User Story 6 — Frontend CASL Ability Integration & Dynamic Navigation (BUILD-GUIDE Row 26.6)
**Priority**: P1  
**Why this priority**: Seamless user experience preventing dead clicks and visual confusion by dynamically rendering menus, tabs, and action buttons.  
**Independent Test**: When authenticated as Employee, administrative sidebar items (Roles, Settings, Payroll) do not render in the DOM.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin logs in,
   - **When** UI initializes `AbilityContext`,
   - **Then** all sidebar navigation links, admin buttons, and management actions render visible and interactive.
2. **HR Manager**:
   - **Given** HR Manager logs in,
   - **When** UI evaluates abilities,
   - **Then** employee management, recruitment, and attendance actions are visible; system settings and role deletion buttons are hidden.
3. **Department Manager**:
   - **Given** Department Manager logs in,
   - **When** UI evaluates abilities,
   - **Then** team approval queues are displayed; company-wide configuration tabs are absent.
4. **Employee**:
   - **Given** Employee logs in,
   - **When** UI evaluates abilities,
   - **Then** only self-service navigation items (My Profile, My Attendance, My Leaves, My Payslips) are displayed.

---

### User Story 7 — Custom Role Management CRUD API & UI (BUILD-GUIDE Row 26.7)
**Priority**: P1  
**Why this priority**: Allows organizations to create custom business roles (e.g. "Finance Officer", "Talent Recruiter", "Floor Lead").  
**Independent Test**: Super Admin creates role "Finance Officer", updates description, and deletes a non-system role successfully.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin accesses `/roles`,
   - **When** creating a new role with name and description,
   - **Then** role is persisted in DB and listed in `RolesListPage.jsx`.
2. **HR Manager**:
   - **Given** HR Manager navigates to `/roles`,
   - **When** role page loads,
   - **Then** HR Manager can view existing roles to assign them, but create/edit/delete buttons are disabled or hidden.
3. **Department Manager**:
   - **Given** Department Manager attempts to navigate to `/roles`,
   - **When** route is accessed,
   - **Then** `ProtectedRoute` redirects to dashboard with toast error.
4. **Employee**:
   - **Given** Employee attempts to navigate to `/roles`,
   - **When** route is accessed,
   - **Then** redirected away with Access Denied notification.

---

### User Story 8 — Interactive Visual Permission Matrix Screen (BUILD-GUIDE Row 26.8)
**Priority**: P1  
**Why this priority**: Provides HR and Super Admin an intuitive matrix UI (Module $\times$ Action checkboxes + Scope dropdowns) to configure roles without JSON editing.  
**Independent Test**: Toggling checkboxes and selecting scopes on `PermissionMatrix.jsx` sends updated `permissions` array to `PUT /api/v1/roles/:id`.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin opens `PermissionMatrix.jsx` for a custom role,
   - **When** toggling `leave.approve` and selecting scope `department`,
   - **Then** changes save successfully and reflect in the role's CASL rules.
2. **HR Manager**:
   - **Given** HR Manager views the permission matrix,
   - **When** screen loads,
   - **Then** matrix is in read-only mode unless explicitly delegated `role.manage`.
3. **Department Manager**:
   - **Given** Department Manager visits URL directly,
   - **When** page requests data,
   - **Then** HTTP 403 returned and redirect executed.
4. **Employee**:
   - **Given** Employee accesses matrix URL,
   - **When** page loads,
   - **Then** HTTP 403 returned and redirect executed.

---

### User Story 9 — Granular Approval Limits per Permission (BUILD-GUIDE Row 26.9)
**Priority**: P2  
**Why this priority**: Enforces fiscal and policy controls (e.g. Department Manager can only approve leaves $\le 3$ days or expenses $\le$ PKR 25,000).  
**Independent Test**: Approval action rejected with HTTP 422 if requested quantity exceeds permission limit.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin configures limit on `leave.approve` (e.g. 5 days) for Dept Manager,
   - **When** saving the role,
   - **Then** limit is persisted in `permissions[].limit`.
2. **HR Manager**:
   - **Given** HR Manager handles an escalated request exceeding Dept Manager limit,
   - **When** HR reviews the request within their own higher limit,
   - **Then** request approves smoothly.
3. **Department Manager**:
   - **Given** Dept Manager has limit of 3 days on `leave.approve`,
   - **When** employee requests 5 days leave,
   - **Then** manager approval button prompts escalation to HR/Admin.
4. **Employee**:
   - **Given** Employee submits request with high value,
   - **When** viewing status,
   - **Then** UI shows multi-tier approval chain requirement.

---

### User Story 10 — Role Cloning Engine (BUILD-GUIDE Row 26.10)
**Priority**: P2  
**Why this priority**: Dramatically reduces administrative effort when creating variants of complex roles (e.g. "Senior Recruiter" cloned from "Recruiter").  
**Independent Test**: `POST /api/v1/roles/:id/clone` duplicates all permissions, scopes, and limits under a new name with `isSystem: false`.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin clicks "Clone" on `RolesListPage.jsx`,
   - **When** supplying new name "Assistant HR Manager",
   - **Then** new role is created with identical permissions and `isSystem: false`.
2. **HR Manager**:
   - **Given** HR Manager views role list,
   - **When** attempting to trigger clone,
   - **Then** action is prohibited unless granted `role.manage`.
3. **Department Manager**:
   - **Given** Dept Manager attempts clone API call,
   - **Then** rejected with HTTP 403 Forbidden.
4. **Employee**:
   - **Given** Employee attempts clone API call,
   - **Then** rejected with HTTP 403 Forbidden.

---

### User Story 11 — Multi-Role Assignment with Unified Permission Union (BUILD-GUIDE Row 26.11)
**Priority**: P1  
**Why this priority**: Real-world staff frequently wear multiple hats (e.g. "Department Manager" + "Internal Auditor"). Permissions must merge additively without conflicts.  
**Independent Test**: Assigning both roles grants the union of all permissions from both roles.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin edits user on `UsersPage.jsx`,
   - **When** selecting multiple roles from multi-select dropdown,
   - **Then** `PATCH /api/v1/users/:id/roles` updates user and recalculates abilities.
2. **HR Manager**:
   - **Given** HR Manager assigns roles to employee,
   - **When** selecting allowed roles,
   - **Then** roles are updated, and user inherits union of capabilities.
3. **Department Manager**:
   - **Given** Dept Manager views user list,
   - **Then** role modification controls are absent.
4. **Employee**:
   - **Given** Employee holds both Employee and Team Lead roles,
   - **When** navigating system,
   - **Then** employee accesses both self-service and team management pages seamlessly.

---

### User Story 12 — Safe Granting Boundaries & Anti-Privilege Escalation (BUILD-GUIDE Row 26.12)
**Priority**: P1  
**Why this priority**: Security invariant: an administrator (such as HR Manager) must NEVER be able to assign permissions or roles that exceed their own authority.  
**Independent Test**: HR Manager attempting to assign Super Admin role receives HTTP 403 Forbidden with security escalation warning.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin has unrestricted permissions,
   - **When** assigning any role to any user,
   - **Then** operation succeeds.
2. **HR Manager**:
   - **Given** HR Manager attempts to assign Super Admin role or grant permission not held in HR's own ability set,
   - **When** service verifies `grantPermissions ⊆ hrPermissions`,
   - **Then** request is rejected with HTTP 403 and security audit alert logged.
3. **Department Manager**:
   - **Given** Dept Manager attempts role assignment API,
   - **Then** rejected with HTTP 403.
4. **Employee**:
   - **Given** Employee attempts role assignment API,
   - **Then** rejected with HTTP 403.

---

### User Story 13 — Immutable System Roles Protection (BUILD-GUIDE Row 26.13)
**Priority**: P1  
**Why this priority**: Prevents catastrophic lockout. System roles (`isSystem: true`) cannot be deleted, renamed, or stripped of core permissions.  
**Independent Test**: Sending `DELETE /api/v1/roles/:superAdminId` returns HTTP 400 with message stating system roles cannot be removed.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin views system roles in UI,
   - **When** inspecting core roles,
   - **Then** delete buttons are disabled; direct API deletion returns HTTP 400.
2. **HR Manager**:
   - **Given** HR Manager attempts to delete or modify core roles,
   - **Then** operation blocked by both UI and backend controller.
3. **Department Manager**:
   - **Given** Dept Manager attempts modification,
   - **Then** blocked with HTTP 403.
4. **Employee**:
   - **Given** Employee attempts modification,
   - **Then** blocked with HTTP 403.

---

### User Story 14 — Approvals Delegation System (BUILD-GUIDE Row 26.14)
**Priority**: P2  
**Why this priority**: Ensures business continuity when managers take leave. Allows temporary delegation of approval rights between specific dates.  
**Independent Test**: `POST /api/v1/delegations` permits delegate to approve leave during active delegation window.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin views company delegations,
   - **When** opening `DelegationPage.jsx`,
   - **Then** all active, scheduled, and past delegations across departments are visible.
2. **HR Manager**:
   - **Given** HR Manager configures emergency delegation for an absent manager,
   - **When** submitting delegation form,
   - **Then** delegation is registered with audit logging.
3. **Department Manager**:
   - **Given** Dept Manager goes on vacation for 7 days,
   - **When** creating delegation to another manager with start and end date,
   - **Then** delegate can approve team requests strictly within date range.
4. **Employee**:
   - **Given** Employee checks pending request,
   - **When** request is approved by delegate,
   - **Then** audit trail notes approval on behalf of primary manager.

---

### User Story 15 — Effective Permissions Inspector & "View As User" (BUILD-GUIDE Row 26.15)
**Priority**: P2  
**Why this priority**: Diagnostics tool for IT and HR to troubleshoot permissions issues and inspect combined effective abilities.  
**Independent Test**: `GET /api/v1/users/:id/effective-permissions` returns resolved list of all actions, subjects, scopes, and fields.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin inspects user profile,
   - **When** clicking "View Effective Permissions",
   - **Then** modal displays complete breakdown of active abilities and originating roles.
2. **HR Manager**:
   - **Given** HR Manager inspects employee,
   - **When** viewing permissions dialog,
   - **Then** effective abilities are displayed in structured cards.
3. **Department Manager**:
   - **Given** Dept Manager views team member,
   - **Then** inspector action is hidden.
4. **Employee**:
   - **Given** Employee accesses API directly,
   - **Then** rejected with HTTP 403 unless requesting own ID.

---

### User Story 16 — Permission Mutation Security Audit Trail (BUILD-GUIDE Row 26.16)
**Priority**: P1  
**Why this priority**: Mandatory compliance requirement. Every role creation, modification, deletion, and assignment must write an immutable audit log.  
**Independent Test**: Modifying role permissions creates `auditLogs` record with before/after diff snapshots.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin modifies a role or user assignment,
   - **When** mutation commits,
   - **Then** audit log record is written with actor ID, IP, target ID, and before/after diff.
2. **HR Manager**:
   - **Given** HR Manager assigns role to user,
   - **When** mutation commits,
   - **Then** audit log records HR Manager's action.
3. **Department Manager**:
   - **Given** Dept Manager creates approval delegation,
   - **When** saved,
   - **Then** audit log records delegation creation.
4. **Employee**:
   - **Given** Employee logs in or changes password,
   - **When** action occurs,
   - **Then** audit log records the activity.

---

### User Story 17 — Employee Self-Service "My Access" Tab (BUILD-GUIDE Row 26.17)
**Priority**: P2  
**Why this priority**: Transparency for employees to understand their assigned roles, scopes, and permissions without contacting HR.  
**Independent Test**: Employee visiting My Profile $\rightarrow$ "My Access" sees cards for each held role and list of active capabilities.

**Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** Super Admin views own profile "My Access" tab,
   - **Then** shows Super Admin badge with "Full System Access".
2. **HR Manager**:
   - **Given** HR Manager views "My Access" tab,
   - **Then** shows HR Manager role badge with scope "All Employees".
3. **Department Manager**:
   - **Given** Dept Manager views "My Access" tab,
   - **Then** shows Department Manager role with team-level approval rights and active delegations.
4. **Employee**:
   - **Given** Employee navigates to My Profile $\rightarrow$ "My Access",
   - **When** tab loads,
   - **Then** lists assigned roles (e.g. "Software Engineer"), data scope ("Own records"), and permissions summary.

---

## 3. Edge Cases & Boundary Handling

1. **Role Deletion with Active Assignees**:
   - System MUST reject deletion of any custom role if one or more active users are currently assigned to it (HTTP 409 Conflict with count of assigned users).
2. **Circular or Self Delegation**:
   - Delegation engine MUST reject creating a delegation to oneself (`fromUserId === toUserId`) or chained delegation loops.
3. **Expired Delegations**:
   - CASL ability resolution MUST check `startDate <= now <= endDate` for delegations. Expired delegations automatically lose approval rights without manual intervention.
4. **Super Admin De-Elevation Attempt**:
   - Service MUST reject any attempt to update Super Admin's `isSystem` flag, change its name, or delete permissions.
5. **Simultaneous Multi-Role Assignment Conflicts**:
   - When merging permissions from multiple roles, the MOST PERMISSIVE scope wins (e.g. if Role A grants `employee.view: team` and Role B grants `employee.view: all`, effective scope is `all`).

---

## 4. Functional Requirements Checklist

- **FR-001**: System MUST maintain a centralized permission catalogue in `shared/permissions.js` and expose it via `GET /api/v1/permissions`.
- **FR-002**: System MUST persist roles in MongoDB using the `Role` model with `name`, `description`, `isSystem`, and `permissions` array.
- **FR-003**: System MUST execute `npm run seed` to bootstrap the 4 core roles: Super Admin, HR Manager, Department Manager, and Employee.
- **FR-004**: System MUST evaluate CASL abilities dynamically in `checkPermission` middleware based on `req.user.roles`.
- **FR-005**: System MUST support horizontal data scoping (`own`, `team`, `department`, `all`) in query helper `utils/scopeFilter.js`.
- **FR-006**: System MUST filter and mask sensitive attributes (salary, CNIC, bank IBAN) in `utils/fieldFilter.js`.
- **FR-007**: System MUST provide full CRUD REST endpoints for custom roles at `/api/v1/roles`.
- **FR-008**: System MUST render an interactive visual permission matrix at `/roles/matrix/:id` using Linear Dark Craft styling.
- **FR-009**: System MUST allow configuring numeric limits on approvals and enforce them during transaction validation.
- **FR-010**: System MUST support 1-click role cloning via `POST /api/v1/roles/:id/clone`.
- **FR-011**: System MUST support assigning multiple roles to users via `PATCH /api/v1/users/:id/roles`.
- **FR-012**: System MUST prevent HR Managers from granting roles containing permissions they do not possess.
- **FR-013**: System MUST prevent deleting or mutating system roles (`isSystem: true`).
- **FR-014**: System MUST support temporary approval delegation with date bounds stored in `delegation.model.js`.
- **FR-015**: System MUST compute and return effective permissions via `GET /api/v1/users/:id/effective-permissions`.
- **FR-016**: System MUST record before and after snapshots in `auditLogs` for all role and permission changes.
- **FR-017**: System MUST provide a "My Access" tab in employee profile displaying active roles and scopes.

---

## 5. Success Criteria & Verification Metrics

- **SC-001**: 100% of BUILD-GUIDE Section 5 rows (26.1 to 26.17) mapped and implemented as vertical slices.
- **SC-002**: Automated test suite covers all 17 slices with green passes across unit, model, middleware, and integration tests.
- **SC-003**: Server response latency for permission resolution under 15ms per request.
- **SC-004**: Zero TypeScript files created (`.js` and `.jsx` strictly enforced).
- **SC-005**: Playwright E2E verifies multi-role matrix configuration and access denial in live browser.

---

## 6. BUILD-GUIDE Section 5 Coverage Matrix

| BUILD-GUIDE ID | Feature Description | Assigned User Story | Priority |
| :--- | :--- | :--- | :--- |
| **26.1** | Permission catalogue (`shared/permissions.js`, `GET /permissions`) | **User Story 1** | P1 |
| **26.2** | Role model + 4 core default roles seed | **User Story 2** | P1 |
| **26.3** | CASL `checkPermission` middleware | **User Story 3** | P1 |
| **26.4** | Data scope filtering engine (`own`, `team`, `department`, `all`) | **User Story 4** | P1 |
| **26.5** | Field-level permissions & data masking | **User Story 5** | P1 |
| **26.6** | Frontend CASL ability integration (`Can.jsx`, Sidebar filter) | **User Story 6** | P1 |
| **26.7** | Custom role CRUD API & UI (`RolesListPage`, `RoleFormPage`) | **User Story 7** | P1 |
| **26.8** | Visual permission matrix screen (`PermissionMatrix.jsx`) | **User Story 8** | P1 |
| **26.9** | Approval limits per permission | **User Story 9** | P2 |
| **26.10** | Role cloning engine (`POST /roles/:id/clone`) | **User Story 10** | P2 |
| **26.11** | Multi-role assignment with union of permissions | **User Story 11** | P1 |
| **26.12** | Safe granting boundaries (anti-privilege escalation) | **User Story 12** | P1 |
| **26.13** | Immutable system roles protection (`isSystem: true`) | **User Story 13** | P1 |
| **26.14** | Approvals delegation system (`delegation.model.js`) | **User Story 14** | P2 |
| **26.15** | Effective permissions inspector ("View As User") | **User Story 15** | P2 |
| **26.16** | Permission change security audit trail logging | **User Story 16** | P1 |
| **26.17** | Employee self-service "My Access" tab | **User Story 17** | P2 |
