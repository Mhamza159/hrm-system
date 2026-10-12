# Tasks Breakdown: M26 Roles & Permissions (RBAC & CASL)

**Feature Identifier**: `03-roles-permissions`  
**Feature Branch**: `feature/03-roles-permissions`  
**Target Module**: Module M26 (Core HR Group · Priority P1)  
**Spec Document**: [`.specify/specs/03-roles-permissions/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/03-roles-permissions/spec.md)  
**Plan Document**: [`.specify/specs/03-roles-permissions/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/03-roles-permissions/plan.md)  
**Governing Guide**: [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 5 (Rows 26.1–26.17)  
**Architecture Rules**: Plain JavaScript only (`.js` / `.jsx`), Vertical Slice order (BE $\rightarrow$ FE $\rightarrow$ Row Test), P1 first then P2.

---

## Phase 1: Core RBAC & Permission Matrix Foundation (Priority P1)

### Slice 26.1: Permission Catalogue Master Definition (BUILD-GUIDE ID 26.1)
- [x] **26.1-BE**: Create `backend/src/shared/permissions.js` defining `PERMISSIONS_CATALOGUE` constant across all HRM modules (`auth`, `roles`, `employees`, `attendance`, `leaves`, `payroll`, etc.) with action, subject, valid scopes (`own`, `team`, `department`, `all`), and sensitive flags. In `backend/src/modules/roles/role.service.js`, `role.controller.js`, and `role.routes.js`, implement `GET /api/v1/permissions` returning the full catalogue.
- [x] **26.1-FE**: In `frontend/src/features/roles/rolesApi.js`, create `getPermissions` query hook (`useGetPermissionsQuery`) to fetch and cache the system-wide catalogue.
- [x] **26.1-TEST**: Vitest API test `GET /api/v1/permissions`: verify it returns HTTP 200 with all categorized module actions; verify unauthenticated call returns 401.

---

### Slice 26.2: Role Model & 4 Core System Roles Seed (BUILD-GUIDE ID 26.2)
- [x] **26.2-BE**: Ensure `backend/src/models/role.model.js` schema enforces unique indexed `name`, `description`, `isSystem` (Boolean, default: false), and `permissions` array (`action`, `subject`, `scope`, `fields`, `limit`). Create `backend/src/seed/roles.seed.js` to seed the 4 core roles (`Super Admin`, `HR Manager`, `Department Manager`, `Employee`) with exact default permissions matching `docs/FRD.md` Section 11, plus the initial Super Admin account. Register script as `npm run seed:roles` in `backend/package.json`.
- [x] **26.2-TEST**: Test seeding script: verify executing seed bootstraps all 4 core roles with `isSystem: true`, sets correct permission subsets, and avoids duplicate key collisions on subsequent runs.

---

### Slice 26.3: CASL checkPermission Middleware (BUILD-GUIDE ID 26.3)
- [x] **26.3-BE**: Install `@casl/ability` in `backend/package.json`. Refactor `backend/src/middlewares/checkPermission.js` into an ability-driven middleware: compile user's assigned permissions into a CASL `MongoAbility` using `AbilityBuilder` and `createMongoAbility`; evaluate requested `action` and `subject`; attach resolved `req.permissionScope` and `req.ability` to the request; reject unauthorized users with HTTP 403 Forbidden.
- [x] **26.3-TEST**: Test `checkPermission` middleware via Supertest: verify Super Admin passes all gates, users with matching ability pass with scope attached, and users lacking ability receive 403 with standard error envelope.

---

### Slice 26.4: Data Scope Filtering Engine (BUILD-GUIDE ID 26.4)
- [x] **26.4-BE**: Create `backend/src/utils/scopeFilter.js`: accepts `(user, scope, targetEntity)` and returns Mongoose query conditions (`own` $\rightarrow$ `{ employeeId: user.employeeId || user._id }`, `team` $\rightarrow$ `{ reportingManagerId: user._id }`, `department` $\rightarrow$ `{ departmentId: user.departmentId }`, `all` $\rightarrow$ `{}`).
- [x] **26.4-TEST**: Unit test `scopeFilter.js`: verify generated MongoDB filter objects for each scope type across employee, attendance, and leave queries.

---

### Slice 26.5: Field-Level Permission & Data Masking Engine (BUILD-GUIDE ID 26.5)
- [x] **26.5-BE**: Create `backend/src/utils/fieldFilter.js`: accepts `(payload, userAbility, subject)` and strips or masks unauthorized fields (e.g. `salary`, `cnic`, `bankAccount`) with `"—"` or `null` if the user's ability rule lacks the corresponding field whitelist.
- [x] **26.5-TEST**: Unit test `fieldFilter.js`: verify Department Manager requesting employee details receives sanitized payload with salary and bank details masked, while Super Admin receives unmasked data.

---

### Slice 26.6: Frontend CASL Ability Integration & Dynamic Navigation (BUILD-GUIDE ID 26.6)
- [x] **26.6-FE**: Install `@casl/ability` and `@casl/react` in `frontend/package.json`. Create `frontend/src/lib/ability.js` to build client-side `MongoAbility` from permissions returned by `/auth/me`. Create `frontend/src/components/common/Can.jsx` wrapping `@casl/react` `Can` component. Create `frontend/src/hooks/usePermission.js` for imperative checks. Update `frontend/src/components/layout/Sidebar.jsx` to dynamically filter menu items using the ability instance.
- [x] **26.6-TEST**: Unit test frontend ability context: verify `<Can I="manage" a="Role">` renders children for Super Admin and renders null for Employee; verify sidebar hides admin links for Employee.

---

### Slice 26.7: Custom Role Management CRUD API & UI (BUILD-GUIDE ID 26.7)
- [x] **26.7-BE**: In `backend/src/modules/roles/role.validation.js`, define `createRoleSchema` and `updateRoleSchema`. In `role.service.js`, `role.controller.js`, and `role.routes.js`, implement `GET /api/v1/roles`, `POST /api/v1/roles`, `GET /api/v1/roles/:id`, `PATCH /api/v1/roles/:id`, and `DELETE /api/v1/roles/:id`, guarded by `authenticate` and `checkPermission('role.manage')`.
- [x] **26.7-FE**: In `frontend/src/features/roles/rolesApi.js`, define `getRoles`, `getRoleById`, `createRole`, `updateRole`, and `deleteRole` endpoints. Create `frontend/src/features/roles/pages/RolesListPage.jsx` with DataTable, search, pagination, and system role badges. Create `frontend/src/features/roles/pages/RoleFormPage.jsx` with name and description inputs.
- [x] **26.7-TEST**: API test CRUD operations on `/api/v1/roles`: verify creating custom role persists in DB; verify updating role attributes; verify deleting non-system role succeeds; verify 403 when called by non-admin.

---

### Slice 26.8: Interactive Visual Permission Matrix Screen (BUILD-GUIDE ID 26.8)
- [x] **26.8-BE**: In `backend/src/modules/roles/role.service.js`, support updating the `permissions` array (`action`, `subject`, `scope`, `fields`, `limit`) on `PATCH /api/v1/roles/:id`.
- [x] **26.8-FE**: Create `frontend/src/features/roles/components/PermissionMatrix.jsx`: render grouped modules as accordion rows, actions as custom styled checkboxes, and scopes as dropdown selectors (`own`, `team`, `department`, `all`). Integrate the matrix into `RoleFormPage.jsx`.
- [x] **26.8-TEST**: Component & API integration test: verify toggling permissions in the matrix and submitting updates the role in DB with correct action-scope pairings.

---

### Slice 26.11: Multi-Role Assignment to Users (BUILD-GUIDE ID 26.11)
- [x] **26.11-BE**: In `backend/src/modules/roles/role.validation.js`, define `assignRolesSchema` (array of role ObjectIds). In `role.service.js`, implement `assignUserRoles(userId, roleIds, actorUser)`: validate user exists, assign roles, and write audit log. Mount `PATCH /api/v1/users/:id/roles` guarded by `checkPermission('role.assign')`. In `auth.service.js` `getMe()`, compute the additive union of all assigned roles.
- [x] **26.11-FE**: In `frontend/src/features/roles/rolesApi.js`, define `assignUserRoles` mutation. In `frontend/src/features/users/pages/UsersPage.jsx`, add "Edit Roles" action opening a multi-select modal with checkboxes for available roles.
- [x] **26.11-TEST**: Test multi-role assignment: assign both "Employee" and "Department Manager" to a user; verify user's `/auth/me` reflects additive union of abilities across both roles.

---

### Slice 26.12: Privilege Escalation Guard & Safe Granting Boundaries (BUILD-GUIDE ID 26.12)
- [x] **26.12-BE**: In `backend/src/modules/roles/role.service.js`, add security validation in `assignUserRoles`: if actor is not Super Admin, verify that `assignedRoles.permissions ⊆ actorUser.permissions`. If actor attempts to grant a permission or role they do not possess, reject with HTTP 403 Forbidden.
- [x] **26.12-FE**: In `UsersPage.jsx` role assignment modal, disable checkboxes for roles that contain permissions outside the currently logged-in manager's own ability set, showing a tooltip explaining the restriction.
- [x] **26.12-TEST**: Security test: HR Manager attempts to assign "Super Admin" role to an employee via `PATCH /users/:id/roles`; verify backend rejects request with 403 Forbidden and logs security incident.

---

### Slice 26.13: Immutable System Roles Protection (BUILD-GUIDE ID 26.13)
- [x] **26.13-BE**: In `backend/src/modules/roles/role.service.js`, add guards in `deleteRole` and `updateRole`: if `role.isSystem === true`, block deletion and prevent renaming or clearing core system permissions with HTTP 400 Bad Request.
- [x] **26.13-FE**: In `frontend/src/features/roles/pages/RolesListPage.jsx`, disable the Delete button and display a padlock "System Role" badge for core roles.
- [x] **26.13-TEST**: Test system role protection: attempt to call `DELETE /api/v1/roles/:superAdminId`; verify backend rejects with 400 Bad Request and role remains intact.

---

### Slice 26.16: Role & Permission Change Audit Logging (BUILD-GUIDE ID 26.16)
- [x] **26.16-BE**: In `backend/src/modules/roles/role.service.js`, integrate `audit.service.js`: record every role creation, update (with before/after diff of permissions), deletion, and user role assignment in `auditLogs` with `userId`, `action`, `entity: 'Role'`, `entityId`, `before`, and `after`.
- [x] **26.16-TEST**: Test audit trail logging: modify a role's permissions matrix; query `auditLogs` collection; verify audit record exists with exact before/after diff.

---

## Phase 2: Advanced Governance, Delegation & Transparency (Priority P2)

### Slice 26.9: Granular Approval Limits per Permission (BUILD-GUIDE ID 26.9)
- [x] **26.9-BE**: In `backend/src/modules/roles/role.validation.js` and `role.service.js`, support numeric `limit` on permission rules (e.g. leave days, expense amounts). Create helper `checkApprovalLimit(user, permission, requestedAmount)` to validate thresholds.
- [x] **26.9-FE**: In `frontend/src/features/roles/components/PermissionMatrix.jsx`, render a numeric limit input next to actions that support thresholds (indicated by `hasLimit: true` in catalogue).
- [x] **26.9-TEST**: Test approval limit verification: verify approval attempt exceeding configured limit triggers rejection/escalation requirement.

---

### Slice 26.10: Role Cloning Engine (BUILD-GUIDE ID 26.10)
- [x] **26.10-BE**: In `backend/src/modules/roles/role.service.js`, implement `cloneRole(sourceRoleId, newName, actorUser)`: duplicate permissions array, set `isSystem: false`, save new role with `newName`, and log audit trail. Mount `POST /api/v1/roles/:id/clone` guarded by `checkPermission('role.manage')`.
- [x] **26.10-FE**: In `frontend/src/features/roles/rolesApi.js`, add `cloneRole` mutation. In `RolesListPage.jsx`, add "Clone" action button opening a dialog prompting for the new role name.
- [x] **26.10-TEST**: Test role cloning: clone "Department Manager" with new name "Assistant Manager"; verify new role possesses identical permissions and scopes with `isSystem: false`.

---

### Slice 26.14: Approvals Delegation System (BUILD-GUIDE ID 26.14)
- [x] **26.14-BE**: Create `backend/src/models/delegation.model.js` schema (`fromUserId`, `toUserId`, `permissions[]`, `startDate`, `endDate`, `status`, `reason`). In `backend/src/modules/roles/delegation.service.js`, implement `createDelegation`, `getDelegations`, and `cancelDelegation`. Mount `POST /api/v1/delegations`, `GET /api/v1/delegations`, and `DELETE /api/v1/delegations/:id`. In `auth.service.js` `getMe()`, dynamically inject active delegation permissions if `startDate <= now <= endDate`.
- [x] **26.14-FE**: In `frontend/src/features/roles/rolesApi.js`, add delegation query and mutation hooks. Create `frontend/src/features/roles/pages/DelegationPage.jsx` with date-picker form, manager select, and active delegations list.
- [x] **26.14-TEST**: Test delegation lifecycle: create delegation between two managers; verify delegate temporarily inherits approval ability during active date window; verify ability expires when date passes.

---

### Slice 26.15: Effective Permissions Inspector ("View As User") (BUILD-GUIDE ID 26.15)
- [x] **26.15-BE**: In `backend/src/modules/roles/role.service.js`, implement `getEffectivePermissions(targetUserId)`: resolve all assigned roles and active delegations, compute merged abilities, and return structured list of capabilities. Mount `GET /api/v1/users/:id/effective-permissions` guarded by `checkPermission('role.view')`.
- [x] **26.15-FE**: In `frontend/src/features/roles/rolesApi.js`, add `getEffectivePermissions` query hook. Create `frontend/src/features/roles/components/EffectivePermissionsModal.jsx` displaying organized cards of active permissions, scopes, and originating roles.
- [x] **26.15-TEST**: Test effective permissions API: verify calling endpoint for a multi-role user returns unified permissions list with correct sources.

---

### Slice 26.17: Employee Self-Service "My Access" Tab (BUILD-GUIDE ID 26.17)
- [x] **26.17-FE**: Create `frontend/src/features/roles/components/MyAccessTab.jsx`: renders read-only cards showing user's assigned roles, active data scopes, and capabilities summary. Mount tab in user profile navigation.
- [x] **26.17-TEST**: Test My Access tab component: verify Employee views their own role name and scope description; verify non-editable presentation.

---

## Phase 3: Multi-Role End-to-End Verification (`E2E-M26`)

### Slice E2E-M26: Full Multi-Role Playwright & API End-to-End Verification
- [x] **E2E-M26**: Multi-role E2E suite `backend/tests/m26.roles.e2e.test.js` verifying live across all 4 roles:
  1. **Super Admin**: Log in, navigate to `/roles`, create custom role "Finance Officer", configure permissions in `PermissionMatrix.jsx`, save, clone role to "Assistant Finance", and assign role to employee on `/users`.
  2. **HR Manager**: Log in, verify ability to view roles and assign allowed roles to users, verify inability to assign "Super Admin" role (privilege escalation check), and verify inability to delete system roles.
  3. **Department Manager**: Log in, navigate to `/delegations`, create 7-day approval delegation to peer manager, and verify team-scoped access.
  4. **Employee**: Log in, navigate to My Profile $\rightarrow$ "My Access", verify active role display, and verify attempt to directly browse `/roles` redirects to dashboard with Access Denied notification.
