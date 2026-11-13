# Feature Specification: Leave Types Archive Bucket & Lifecycle Management

**Feature Branch**: `feature/32-leave-types-archive-and-lifecycle-management`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "In the Leaves & Holiday modules under Leave Types, create an Archive tab. When someone deletes a category, it should move to the Archive and become disabled, and then the Archive should have two options: Revert and Permanent Delete. Reverting should make it active again, while deleting from the Archive should permanently delete it. For any UI you build, follow the structure from the Design.md and UI-reference.md files, and use confirmation modals inside the archive pills or tabs. Most importantly, read the Docs folder and plan and structure everything accordingly."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Active Policies vs Archive Bucket View Switcher (Priority: P1)

As a Super Admin or HR Manager,  
When I visit the Leave Types configuration page (`/leaves/types`),  
I want a clear, tactile view switcher between **Active Policies** and **Archive**,  
So that deactivated or discontinued leave types are neatly segregated from live, active statutory categories without cluttering the daily management view.

**Why this priority**: Essential information architecture requirement. Separates operational policies from archived records while providing instant visibility into how many categories exist in each state.

**Independent Test**: Can be tested independently by navigating to `/leaves/types`, observing the two view switcher tabs with live numeric counters (`Active Policies (N)` and `Archive (M)`), and toggling between them to see the filtered roster update immediately.

**Acceptance Scenarios**:

1. **Given** leave types in the database with mixed active and disabled states, **When** the page loads, **Then** the view switcher displays `Active Policies` and `Archive` tabs with accurate counters.
2. **Given** the user is on the `Active Policies` tab, **When** they view the table or card grid, **Then** only leave types with `isActive: true` are displayed.
3. **Given** the user clicks on the `Archive` tab, **When** the view switches, **Then** only leave types with `isActive: false` (archived) are displayed alongside an informational policy banner.
4. **Given** the user searches or applies filters, **When** switching tabs, **Then** the active search or category filters scope properly to the selected tab.

---

### User Story 2 - Moving Active Category to Archive (Soft-Deactivation) (Priority: P1)

As an HR Manager or Super Admin,  
When I delete a leave category from the Active Policies roster,  
I want the system to prompt me with a confirmation modal and move the category to the Archive bucket with its status set to disabled,  
So that the category is immediately withheld from new employee leave applications while preserving referential integrity for historical applications and audit logs.

**Why this priority**: Core user workflow requirement. Prevents accidental permanent data loss by defaulting standard "delete" to safe archival.

**Independent Test**: In Active Policies, click the Archive/Delete icon on an active category, confirm the action in the confirmation modal, and verify the category disappears from Active Policies, appears in the Archive tab with status `Disabled`, and triggers `syncAllEmployeesLeaveBalances` in backend.

**Acceptance Scenarios**:

1. **Given** an active leave type (e.g., `Maternity` or custom category), **When** the user clicks the Delete action in Active Policies, **Then** a confirmation modal opens with title `"Archive Leave Category?"` and message explaining it will be disabled and moved to the archive.
2. **Given** the archive confirmation modal is open, **When** the user clicks `"Archive Category"`, **Then** `DELETE /api/v1/leave-types/:id` executes, `leaveType.isActive` becomes `false`, employee quota balances are synchronized, an audit log is written, and a success toast is displayed.
3. **Given** the archived category, **When** an employee opens the `ApplyLeaveModal`, **Then** the archived category is excluded from the leave dropdown.

---

### User Story 3 - Reverting Archived Leave Category Back to Active (Priority: P1)

As an HR Manager or Super Admin,  
When I inspect the Archive tab,  
I want an explicit **Revert** action on each archived leave category,  
So that I can restore accidentally archived or seasonally discontinued policies back into active circulation with synchronized employee quotas.

**Why this priority**: Critical lifecycle symmetry. Archival is meaningless if users cannot self-serve restore deactivated policies when company requirements change.

**Independent Test**: Navigate to the Archive tab, locate an archived category, click Revert, confirm the modal, and verify the category moves back to Active Policies with status `Active`, employee leave balances are re-synchronized, and employees can apply for it again.

**Acceptance Scenarios**:

1. **Given** an archived category in the Archive tab, **When** the user views the action controls, **Then** a **Revert** (`RotateCcw`) button is prominently available with tooltip `"Revert to Active Policies"`.
2. **Given** the user clicks Revert, **When** the confirmation modal appears, **Then** it prompts `"Revert Leave Category?"` with clear explanation.
3. **Given** the user confirms Revert, **When** `POST /api/v1/leave-types/:id/restore` executes, **Then** `leaveType.isActive` becomes `true`, employee leave balances are dynamically synchronized (`syncAllEmployeesLeaveBalances`), an audit log `LEAVE_TYPE_RESTORE` is saved, and the category appears in Active Policies.

---

### User Story 4 - Permanent Deletion from Archive Bucket (Priority: P1)

As a Super Admin or HR Manager,  
When an archived leave category is obsolete and no longer needed,  
I want a **Permanent Delete** option within the Archive tab that permanently purges the category from the database after verifying safety constraints,  
So that the organization's policy database remains clean while strictly preventing orphaned foreign key errors.

**Why this priority**: Final stage of data lifecycle management explicitly requested by the user ("deleting from the Archive should permanently delete it").

**Independent Test**: In the Archive tab, click Permanent Delete on an archived category that has no active/approved leaves; confirm in the danger modal; verify the document is removed from MongoDB, pruned from employee balances, and cannot be retrieved by ID. Also test that if active approved leaves exist, permanent deletion is safely blocked with a 409 Conflict explanation.

**Acceptance Scenarios**:

1. **Given** an archived category in the Archive tab, **When** the user clicks Permanent Delete (`Trash2`), **Then** a high-gravity danger confirmation modal opens with title `"Permanently Delete Leave Category?"` and destructive styling (`confirmVariant="danger"`).
2. **Given** an archived category with active approved leaves (`Leave.find({ leaveTypeId, status: { $in: ['pending', 'approved'] } })`), **When** the user attempts permanent deletion, **Then** backend returns HTTP 409 Conflict: `"Cannot permanently delete leave category because active or pending leave applications are associated with it. Please cancel or reject those applications first."`
3. **Given** an archived category with no blocking active leaves, **When** the user confirms permanent delete, **Then** `DELETE /api/v1/leave-types/:id/permanent` deletes the document, prunes category balances from employee records, records an audit log `LEAVE_TYPE_PERMANENT_DELETE`, and displays a success toast.

---

### User Story 5 - Design System Consistency & Dual-View Craft (Priority: P2)

As an enterprise administrator,  
When managing leave types in either Table or Card Grid view,  
I want the interface to strictly follow `DESIGN.md` (Forest & Emerald craft, hairline 1px borders, tabular numbers) and `docs/UI-REFERENCE.md`,  
So that the archive workflow feels cohesive, accessible, responsive, and visually identical to other enterprise modules like the Employee Directory Archive.

**Why this priority**: Ensures zero visual regressions, proper responsive behavior, and accessibility in both Light and Dark mode.

**Independent Test**: Inspect both Table view and Card Grid view in Light and Dark mode; verify 1px borders (`border-slate-200` / `border-slate-800`), consistent badge colors, and confirmation modal ergonomics.

**Acceptance Scenarios**:

1. **Given** both Table and Card Grid modes, **When** switching views in the Archive tab, **Then** both views display the Revert and Permanent Delete action buttons seamlessly.
2. **Given** the Archive tab is empty, **When** viewed, **Then** a clean empty state with Lucide `Archive` icon and helpful guidance copy is displayed.
3. **Given** any modal interaction, **When** confirming or cancelling, **Then** `ConfirmDialog.jsx` renders without AI-gradient artifacts, offering operational `X`, `Cancel`, and loading spinners.

---

### Edge Cases

1. **Duplicate Code Conflict on Revert**: If an archived leave type has code `SICK`, but another leave type was created with code `SICK` while it was archived, Revert must reject with 409 Conflict `"A leave category with code 'SICK' is already active."`
2. **Historical Leaves on Permanent Delete**: What happens to historic completed/rejected leaves when a category is permanently deleted?
   - If an employee has historic completed leaves (`status: 'approved'` in past years or `status: 'rejected'`), we enforce that only categories with **0 pending applications** can be permanently purged; or if historical preservation is strictly required, require all associated leave records to be unlinked or archived.
3. **Authorization Boundary**: Ensure only users with `leave.settings` permission (Super Admin and HR Manager) can access Archive, Revert, and Permanent Delete endpoints. Non-admin employees querying `/leave-types` must only receive active categories (`isActive: true`).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an `Active Policies` and `Archive` tab switcher in `LeaveTypesPage.jsx` with live record counters.
- **FR-002**: System MUST soft-delete/deactivate a leave type on standard delete (`DELETE /api/v1/leave-types/:id`), setting `isActive = false`, synchronizing employee quotas, and moving it to the Archive tab.
- **FR-003**: System MUST provide a `POST /api/v1/leave-types/:id/restore` endpoint to revert an archived leave type back to active (`isActive = true`), re-synchronizing employee quotas.
- **FR-004**: System MUST provide a `DELETE /api/v1/leave-types/:id/permanent` endpoint to permanently delete an archived leave type document from the database.
- **FR-005**: System MUST validate that a leave type cannot be permanently deleted if active or pending leave applications reference it (`status: { $in: ['pending', 'approved'] }`).
- **FR-006**: System MUST prune deleted leave types from active employee `LeaveBalance` documents when permanently deleted.
- **FR-007**: System MUST record audit log entries for `LEAVE_TYPE_ARCHIVE`, `LEAVE_TYPE_RESTORE`, and `LEAVE_TYPE_PERMANENT_DELETE`.
- **FR-008**: System MUST display confirmation modals for Archiving, Reverting, and Permanent Deletion adhering to `DESIGN.md` and `docs/UI-REFERENCE.md`.
- **FR-009**: System MUST support dual view (Table and Card Grid) in both Active Policies and Archive tabs.
- **FR-010**: All endpoints MUST enforce RBAC permissions (`leave.settings` for mutations, `leave.view` for read).

