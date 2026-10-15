# Module M26: Roles & Permissions (RBAC & CASL) Architecture

## 1. Overview & Verification Status
- **Governing Guide**: `docs/BUILD-GUIDE.md` Section 5 (Rows 26.1 to 26.17) — All 17 features marked completed `☑`.
- **Roadmap Position**: Phase 1, Step 3 (`3. M26 Roles & Permissions (RBAC)` in `.planning/ROADMAP.md`).
- **Test Verification**: 47 automated backend Vitest unit, API & security tests passed (100% green). Frontend build tested cleanly in production mode.

## 2. Data Models
- **`Role`** (`backend/src/models/role.model.js`):
  - Fields: `name` (unique per company, case-insensitive), `slug`, `description`, `companyId`, `isSystem` (Boolean, protects built-in core roles), `isActive`, `permissions[]`, `isDeleted`.
  - Permissions Schema: `{ module: String, action: String, scope: 'all' | 'department' | 'team' | 'own', limit: { type: 'count' | 'amount' | 'days', value: Number } }`.
- **`ApprovalDelegation`** (`backend/src/models/delegation.model.js`):
  - Fields: `companyId`, `fromUserId`, `toUserId`, `scope` (`ALL` or specific module actions), `startDate`, `endDate`, `status` (`ACTIVE`, `EXPIRED`, `CANCELLED`), `reason`, `notes`.
  - Invariant rules: `toUserId !== fromUserId`, `endDate > startDate`.

## 3. Seeded Core Roles
- **Super Admin**: `manage:all` with scope `all` (unrestricted master administrative role).
- **HR Manager**: 27 module-level permissions across users, employees, departments, shifts, attendance, leaves, payroll, reports, and settings.
- **Department Manager**: 16 scoped permissions (`team` / `department` scope) for team directory, approvals, shifts, and org chart. Sensitive compensation/CNIC fields masked.
- **Employee**: 10 self-service permissions (`own` scope) for profile, personal attendance, leave applications, documents, and org chart self-node.

## 4. Endpoints & API Surface
- `GET /api/v1/permissions`: Categorized permissions catalogue (`shared/permissions.js`).
- `GET /api/v1/roles`: Paginated roles list with search, active filters, and assigned user counts.
- `POST /api/v1/roles`: Creates new custom role with permissions array; audit logged (`ROLE_CREATED`).
- `GET /api/v1/roles/:id`: Role details by ID.
- `PATCH /api/v1/roles/:id`: Updates role details; system role rename blocked (`HTTP 400`).
- `DELETE /api/v1/roles/:id`: Soft-deletes custom role; system role delete blocked (`HTTP 400`), active assigned roles blocked (`HTTP 409 Conflict`).
- `POST /api/v1/roles/:id/clone`: Clones existing role with identical permissions under a unique new name.
- `PATCH /api/v1/users/:id/roles`: Multi-role assignment to user; enforces privilege escalation guard (`grant ⊆ actor.permissions`).
- `GET /api/v1/users/:id/effective-permissions`: Returns calculated additive CASL permissions union across all assigned roles + active delegations.
- `POST /api/v1/delegations`: Creates temporary approval delegation; validates dates and blocks self-delegation.
- `GET /api/v1/delegations/my`: Returns active, received, and past delegations for authenticated user.
- `PATCH /api/v1/delegations/:id/cancel`: Revokes delegation; authorized only for delegator or Super Admin.

## 5. Security & Architectural Invariants
1. **Privilege Escalation Prevention**:
   - Non-Super Admins cannot grant the Super Admin role (`HTTP 403`).
   - Callers cannot grant roles containing permissions they themselves do not possess (`HTTP 403`).
2. **System Role Protection**:
   - `isSystem: true` roles (`Super Admin`, `HR Manager`, `Department Manager`, `Employee`) cannot be deleted or renamed.
3. **Additive CASL Permissions Union**:
   - Effective user ability is computed dynamically in `auth.service.js` and `role.service.js` by combining all assigned roles and active timestamped delegations.
4. **Data Scopes & Field Masking**:
   - `scopeFilter` applies `{ own, team, department, all }` constraints to MongoDB list queries.
   - `fieldFilter` strips confidential fields (`salary`, `cnic`, `bankAccount`) for unauthorized viewers.
5. **Concurrency & Thread Safety**:
   - Atomic `User.findByIdAndUpdate` used for role assignment to eliminate Mongoose versioning conflicts.
   - Compound unique index (`companyId + name`) handled cleanly with `HTTP 409 Conflict` mapping for MongoDB code 11000.
