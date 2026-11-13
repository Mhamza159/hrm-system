# Tasks: Leave Types Archive Bucket & Lifecycle Management (Revert & Permanent Delete)

**Input**: Feature Specification ([`spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/32-leave-types-archive-and-lifecycle-management/spec.md)) and Implementation Plan ([`plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/32-leave-types-archive-and-lifecycle-management/plan.md))  
**Feature Branch**: `feature/32-leave-types-archive-and-lifecycle-management`  
**Organization**: Tasks are structured by prioritized user stories (P1 & P2) to allow independent implementation, automated verification, and incremental progress tracking.

---

## Task Summary Table

| Phase | Story / Topic | Priority | Task Range | Estimated Work |
|---|---|---|---|---|
| **Phase 1** | Model & Schema Foundations | Pre-req | `T001` - `T003` | Schema fields (`isArchived`, `archivedAt`, `archivedBy`) & indexes in `leaveType.model.js` |
| **Phase 2** | US2: Soft-Archive Lifecycle Service & Routes | P1 (MVP) | `T004` - `T007` | `deleteLeaveType` soft-archive, quota sync, audit logging |
| **Phase 3** | US3: Revert Category from Archive Bucket | P1 (MVP) | `T008` - `T011` | `restoreLeaveType` service, duplicate code check, route `POST /:id/restore` |
| **Phase 4** | US4: Permanent Deletion & Referential Integrity | P1 (MVP) | `T012` - `T015` | `permanentDeleteLeaveType` service, 409 conflict guard, route `DELETE /:id/permanent` |
| **Phase 5** | US1: Frontend RTK Query & Tab Switcher Architecture | P1 | `T016` - `T019` | RTK mutations, Active Policies vs Archive tab switcher with live counts |
| **Phase 6** | US5: UI Polish, Dual-View Modes & Confirmation Modals | P2 | `T020` - `T023` | Table & Card Grid actions, Revert/Delete confirm modals, informational banner |
| **Phase 7** | Automated Testing & Production Build | Verification | `T024` - `T026` | Vitest integration tests, frontend production build, regression verification |

---

## Phase 1: Model & Schema Foundations

**Purpose**: Update `LeaveType` Mongoose schema with dedicated archival fields and compound indexes to support fast filtering.

- [x] T001 Verify active git branch is `feature/32-leave-types-archive-and-lifecycle-management`.
- [x] T002 Update `backend/src/models/leaveType.model.js` to add archival fields:
  ```javascript
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date,
    default: null
  },
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
  ```
- [x] T003 Add compound index in `backend/src/models/leaveType.model.js`:
  ```javascript
  leaveTypeSchema.index({ isArchived: 1, isActive: 1 });
  ```

**Checkpoint**: Schema is updated, backwards-compatible with existing documents, and indexed for fast retrieval.

---

## Phase 2: User Story 2 — Soft-Archive Lifecycle Service & Routes (Priority: P1) 🎯 MVP

**Goal**: Standard category deletion moves the record to the Archive bucket, sets `isArchived: true` and `isActive: false`, synchronizes employee quotas, and logs an audit record.

**Independent Test**: Calling `DELETE /api/v1/leave-types/:id` with admin credentials updates the document to `isArchived: true, isActive: false`, triggers `syncAllEmployeesLeaveBalances`, and returns the archived object with HTTP 200.

- [x] T004 [US2] Update `getLeaveTypes` in `backend/src/modules/leaves/leave.service.js`:
  - Support query filter `archived`:
    - When `filter.archived === 'true'`: query `{ isArchived: true }`.
    - When `filter.archived === 'false'` or `filter.activeOnly === 'true'`: query `{ isArchived: false, isActive: true }`.
    - If user is not admin/HR: enforce `{ isArchived: false, isActive: true }` so regular employees never see archived types in application dropdowns.
- [x] T005 [US2] Update `deleteLeaveType` in `backend/src/modules/leaves/leave.service.js`:
  - Update document fields: `leaveType.isArchived = true; leaveType.isActive = false; leaveType.archivedAt = new Date(); leaveType.archivedBy = actor?._id;`
  - Call `syncAllEmployeesLeaveBalances(currentYear)` to prune or disable the archived category from live employee balances.
  - Record audit log: `action: 'LEAVE_TYPE_ARCHIVE', meta: { name, code, archivedAt }`.
- [x] T006 [US2] Update `leave.controller.js` to return message `"Leave category archived successfully"`.
- [x] T007 [US2] Ensure `leaveType.routes.js` parameter validation permits standard ID parameter for `DELETE /:id`.

**Checkpoint**: Calling delete marks the leave type archived, synchronizes employee quotas, and leaves the document intact for future recovery.

---

## Phase 3: User Story 3 — Revert Category from Archive Bucket (Priority: P1) 🎯 MVP

**Goal**: Allow administrators to restore an archived leave category back to active circulation with duplicate code conflict prevention and automatic quota re-synchronization.

**Independent Test**: Calling `POST /api/v1/leave-types/:id/restore` on an archived category restores `isActive: true, isArchived: false`, re-allocates days across eligible employee balances, and returns HTTP 200.

- [x] T008 [US3] Implement `restoreLeaveType(id, actor)` in `backend/src/modules/leaves/leave.service.js`:
  - Retrieve category by ID; throw `ApiError(404, 'Leave type not found')` if missing.
  - Verify category is currently archived (`leaveType.isArchived === true`); throw `ApiError(400, 'Leave category is not archived')` if already active.
  - Check for duplicate code conflict: verify no active unarchived category (`{ code: leaveType.code, isArchived: false, _id: { $ne: id } }`) exists. If conflict found, throw `ApiError(409, "Cannot restore: An active leave category with code '${leaveType.code}' already exists.")`.
  - Restore fields: `leaveType.isArchived = false; leaveType.isActive = true; leaveType.archivedAt = null; leaveType.archivedBy = null;`
  - Save category and call `syncAllEmployeesLeaveBalances(currentYear)`.
  - Record audit log: `action: 'LEAVE_TYPE_RESTORE', meta: { name, code, restoredAt: new Date() }`.
  - Return restored `leaveType` document.
- [x] T009 [US3] Add `restoreLeaveType` handler in `backend/src/modules/leaves/leave.controller.js`:
  - Call `leaveService.restoreLeaveType(req.params.id, req.user)`.
  - Return HTTP 200 with message `"Leave category restored to active policies successfully"`.
- [x] T010 [US3] Register `POST /:id/restore` route in `backend/src/modules/leaves/leaveType.routes.js`:
  - Guard with `checkPermission('leave.settings', 'all')`.
  - Validate with `leaveTypeIdParamSchema`.
- [x] T011 [US3] Verify that regular employees can immediately select the restored leave category in `ApplyLeaveModal` once reverted.

**Checkpoint**: Archived categories can be restored safely with full quota synchronization and conflict protection.

---

## Phase 4: User Story 4 — Permanent Deletion & Referential Integrity (Priority: P1) 🎯 MVP

**Goal**: Permanently purge an obsolete archived category from MongoDB while verifying that zero active/approved leave requests depend on it.

**Independent Test**: Calling `DELETE /api/v1/leave-types/:id/permanent` on a category with active approved leaves returns HTTP 409 Conflict. Calling on a category without active leaves deletes the document from MongoDB, prunes it from employee balances, and returns HTTP 200.

- [x] T012 [US4] Implement `permanentDeleteLeaveType(id, actor)` in `backend/src/modules/leaves/leave.service.js`:
  - Retrieve category by ID; throw `ApiError(404, 'Leave type not found')` if missing.
  - Safety Check: Count active or approved leave applications referencing this type:
    ```javascript
    const activeLeavesCount = await Leave.countDocuments({
      leaveTypeId: id,
      status: { $in: ['pending', 'approved'] }
    });
    ```
  - If `activeLeavesCount > 0`: throw `ApiError(409, "Cannot permanently delete '${leaveType.name}': There are ${activeLeavesCount} active or approved leave application(s) linked to this category. Cancel or delete those applications first, or keep this category archived.")`.
  - If clear (`activeLeavesCount === 0`):
    - Delete document: `await LeaveType.findByIdAndDelete(id);`
    - Prune from employee `LeaveBalance`: remove category balance object from all employee balance documents for current year.
    - Record audit log: `action: 'LEAVE_TYPE_PERMANENT_DELETE', meta: { name, code, deletedAt: new Date() }`.
- [x] T013 [US4] Add `permanentDeleteLeaveType` handler in `backend/src/modules/leaves/leave.controller.js`:
  - Call `leaveService.permanentDeleteLeaveType(req.params.id, req.user)`.
  - Return HTTP 200 with message `"Leave category permanently deleted"`.
- [x] T014 [US4] Register `DELETE /:id/permanent` route in `backend/src/modules/leaves/leaveType.routes.js`:
  - Guard with `checkPermission('leave.settings', 'all')`.
  - Validate with `leaveTypeIdParamSchema`.
- [x] T015 [US4] Verify audit log records reflect the permanent deletion.

**Checkpoint**: Safe permanent deletion is operational, preventing foreign key integrity breakdowns while permitting clean database hygiene.

---

## Phase 5: User Story 1 — Frontend RTK Query & Tab Switcher Architecture (Priority: P1)

**Goal**: Extend frontend RTK Query API and build the Active Policies vs Archive view switcher in `LeaveTypesPage.jsx`.

**Independent Test**: Load `/leaves/types`, observe the `Active Policies` and `Archive` tabs with live count badges, and toggle between them to observe instant roster filtering.

- [x] T016 [US1] Add RTK Query mutations to `frontend/src/features/leaves/leavesApi.js`:
  ```javascript
  restoreLeaveType: builder.mutation({
    query: (id) => ({
      url: `/leave-types/${id}/restore`,
      method: 'POST'
    }),
    invalidatesTags: [{ type: 'LeaveType', id: 'LIST' }, 'Leave']
  }),
  permanentDeleteLeaveType: builder.mutation({
    query: (id) => ({
      url: `/leave-types/${id}/permanent`,
      method: 'DELETE'
    }),
    invalidatesTags: [{ type: 'LeaveType', id: 'LIST' }, 'Leave']
  })
  ```
  Export `useRestoreLeaveTypeMutation` and `usePermanentDeleteLeaveTypeMutation`.
- [x] T017 [US1] Update `LeaveTypesPage.jsx` query configuration:
  - Fetch full leave types list from `useGetLeaveTypesQuery({})`.
  - Derive `activeTypesList = rawTypes.filter((t) => !t.isArchived && t.isActive !== false)`.
  - Derive `archivedTypesList = rawTypes.filter((t) => t.isArchived || t.isActive === false)`.
- [x] T018 [US1] Implement top View Switcher tabs in `LeaveTypesPage.jsx`:
  - State: `activeTab` (`'active'` | `'archived'`).
  - Active Policies Tab: with counter badge reflecting `activeTypesList.length`.
  - Archive Tab: with counter badge reflecting `archivedTypesList.length`.
  - Active tab styling uses Elvara emerald pill (`bg-[#00C471] text-white`).
- [x] T019 [US1] Scope search and category filters (Paid, Unpaid, Medical, Carry) to the currently active tab.

**Checkpoint**: Tabs switch cleanly with dynamic counts and live filtering.

---

## Phase 6: User Story 5 — UI Polish, Dual-View Modes & Confirmation Modals (Priority: P2)

**Goal**: Implement Revert and Permanent Delete action buttons in both Table and Card Grid views, informational archive banner, and accessible `ConfirmDialog.jsx` modals.

**Independent Test**: In the Archive tab, both Table and Card views display Revert (`RotateCcw`) and Permanent Delete (`Trash2`) buttons. Clicking each triggers its designated confirmation dialog with operational loading states.

- [x] T020 [US5] Add Archive Informational Banner in `LeaveTypesPage.jsx` when `activeTab === 'archived'`:
  - Amber-tinted card (`bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl p-4`) with `Archive` icon:
    - Title: `"Archived Leave Categories"`
    - Subtitle: `"These leave categories are currently archived and disabled from employee applications. You can revert a category to restore it to active policies, or permanently delete it from the system."`
- [x] T021 [US5] Update Table & Card View action buttons in `LeaveTypesPage.jsx`:
  - When in `Active Policies`:
    - Show **Edit** (`Edit2`) and **Archive** (`Trash2` with tooltip "Archive Leave Category").
  - When in `Archive`:
    - Show **Revert** (`RotateCcw` in emerald, tooltip "Revert to Active Policies").
    - Show **Permanent Delete** (`Trash2` in rose, tooltip "Permanently Delete Category").
- [x] T022 [US5] Integrate 3 distinct `ConfirmDialog` instances:
  - **Archive Modal**:
    - Title: `"Archive Leave Category?"`
    - Message: `"Are you sure you want to move '${archiveTarget?.name}' to the Archive? It will be disabled and hidden from new leave applications, but historical records will remain preserved."`
    - Confirm: `"Archive Category"` (destructive variant).
  - **Revert Modal**:
    - Title: `"Revert Leave Category?"`
    - Message: `"Are you sure you want to restore '${revertTarget?.name}' to active policies? It will be re-enabled and employee leave balances will be synchronized."`
    - Confirm: `"Revert Category"` (default emerald variant).
  - **Permanent Delete Modal**:
    - Title: `"Permanently Delete Leave Category?"`
    - Message: `"Are you sure you want to PERMANENTLY delete '${permanentDeleteTarget?.name}' (${permanentDeleteTarget?.code})? This action cannot be undone and will permanently remove this category from the database."`
    - Confirm: `"Permanently Delete"` (`confirmVariant="danger"`).
- [x] T023 [US5] Empty State for Archive Bucket:
  - If `archivedTypesList.length === 0`: render clean empty state with Lucide `Archive` icon and copy `"Archive Bucket Is Empty — There are currently no archived or deactivated leave categories in the system."`

**Checkpoint**: Visual craft matches `DESIGN.md` and `docs/UI-REFERENCE.md` with zero layout breakage in light and dark mode.

---

## Phase 7: Automated Testing & Production Build

**Purpose**: Verify all lifecycle transitions, edge cases, and build output.

- [x] T024 Create `backend/tests/leave.archive-lifecycle.test.js`:
  - Test 1: Moving category to archive updates `isArchived: true, isActive: false`.
  - Test 2: Employees cannot view archived categories.
  - Test 3: Reverting restores `isArchived: false, isActive: true` and syncs quotas.
  - Test 4: Reverting rejects duplicate code with HTTP 409 Conflict.
  - Test 5: Permanent delete is rejected with HTTP 409 Conflict if active leaves exist.
  - Test 6: Permanent delete succeeds if zero active leaves exist, and prunes from employee balances.
- [x] T025 Run test suite via Vitest (`npm --prefix backend test tests/leave.archive-lifecycle.test.js`) and verify all tests pass.
- [x] T026 Run frontend production build (`npm --prefix frontend run build`) to ensure 0 lint or compilation errors.

---

## Next Action
All tasks completed. Ready for commit and merge.
