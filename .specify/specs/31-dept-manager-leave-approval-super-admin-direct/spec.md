# Feature Specification: Direct Single-Tier Super Admin Leave Approval for Department Managers

**Feature Branch**: `31-dept-manager-leave-approval-super-admin-direct`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Change the criteria for the Department Manager's leave approval. Apply a Direct Single-Tier Chain (Super Admin only), exactly the way HR's approval works. Make it fully functional, ensuring that the exact same rules used for HR leave approvals apply to Department Managers as well. It should be completely integrated with notifications so that a notification is sent to the Super Admin. Make no mistakes, and adjust the UI changes accordingly. Apart from this, do not change anything else; keep the workflow for regular employees exactly as it was previously. Make no mistakes, and keep everything in English. do not merge to main unless i ask you to do"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Department Manager Applies for Leave & Direct Super Admin Tier Generation (Priority: P1)

As a Department Manager,  
When I submit a leave application for any leave type (Casual, Annual, Sick, Unpaid),  
I want the system to assign a direct single-tier approval chain routed strictly to the Super Admin,  
So that my leave is not routed to peers, subordinate department managers, or HR managers, preventing conflict of interest and mirroring the exact HR approval policy.

**Why this priority**: Core architectural change. Without this, Department Managers would incorrectly receive standard multi-tier approvals routed to reporting managers or HR.

**Independent Test**: Can be tested independently by logging in as a Department Manager, submitting a leave application, and querying the resulting `approvalChain` in the database or response payload: it must contain exactly 1 step with `approverRole: 'Super Admin'` and `status: 'pending'`.

**Acceptance Scenarios**:

1. **Given** an employee with role `Department Manager`, **When** they apply for 3 days of Casual Leave, **Then** the system creates an `approvalChain` of length 1 with `step: 1`, `approverRole: 'Super Admin'`, and `status: 'pending'`.
2. **Given** an employee with role `Department Manager`, **When** they apply for 10 days of Annual Leave (>5 days), **Then** the system still creates a single-tier `approvalChain` of length 1 directed solely to `Super Admin`, without multi-tier escalations.
3. **Given** a regular employee (non-HR, non-Dept Manager), **When** they apply for leave, **Then** the multi-tier approval chain (Step 1: Department Manager, Step 2: HR Manager, Step 3: Super Admin if >5 days) remains completely untouched and active.

---

### User Story 2 - Instant Notification Integration to Super Admins (Priority: P1)

As a Super Admin,  
When any Department Manager applies for leave,  
I want to receive an immediate in-app and dispatch notification with details (applicant name, dates, duration, leave type) and direct navigation link,  
So that I am promptly alerted to audit and decide on managerial absence without intermediate delays.

**Why this priority**: Required for immediate operational visibility; ensures Super Admins are notified directly upon submission instead of Department Managers or HR.

**Independent Test**: Can be tested by triggering a leave application as a Department Manager and verifying that all users with `Super Admin` role receive a notification record in MongoDB with `type: 'leave'`, title, description, and link `/leaves/approvals`.

**Acceptance Scenarios**:

1. **Given** a Department Manager submits a leave request, **When** the leave record is saved, **Then** `notifySuperAdmins` is executed with the applicant's name, leave type, date range, and link `/leaves/approvals`.
2. **Given** a Department Manager submits a leave request, **When** the leave is dispatched, **Then** standard Department Manager / HR approver notifications are NOT sent for this request.

---

### User Story 3 - Executive Security Guard & Decision Enforcement (Priority: P1)

As a Super Admin,  
I want strict authorization enforcement such that only users with the `Super Admin` role can approve or reject a Department Manager's leave application,  
And any attempt by an HR Manager, peer Department Manager, or unauthorized user to decide is rejected with HTTP 403 Forbidden.

**Why this priority**: Prevents security bypass and segregation-of-duties violation. Ensures consistency with the HR approval guard (`assertSuperAdminIfApplicantIsHR`).

**Independent Test**: Log in as an HR Manager and attempt a `POST /api/v1/leaves/:id/decide` on a Department Manager's leave request; verify it returns `403 Forbidden`. Then log in as Super Admin and execute the decision; verify it succeeds with `200 OK`.

**Acceptance Scenarios**:

1. **Given** a pending leave applied by a Department Manager, **When** an HR Manager or peer manager attempts to call `decideLeave`, **Then** the system throws an `ApiError(403)` with message `"Forbidden: Any leave application applied by Department Managers or HR personnel can only be approved or decided by the Super Admin."`
2. **Given** a pending leave applied by a Department Manager, **When** a Super Admin calls `decideLeave` with action `approve`, **Then** the single step is marked `status: 'approved'`, the overall leave status becomes `approved`, balances are updated, and attendance is synchronized.
3. **Given** a pending leave applied by a Department Manager, **When** a Super Admin calls `decideLeave` with action `reject` and reason, **Then** the leave is marked `rejected` and reserved pending days are released back to the balance.

---

### User Story 4 - UI Polish & Role-Aware Action Adjustments (Priority: P2)

As a user viewing the Leave Approvals queue or Dashboard widgets,  
I want the UI to accurately reflect the Super Admin tier for Department Managers,  
Showing clear badges (`Step 1: Super Admin`), disabling non-admin decision actions with clear status indicators, and giving Super Admins full audit controls.

**Why this priority**: Eliminates user confusion and guarantees seamless UI states across all roles (Super Admin, HR Manager, Department Manager, Employee).

**Independent Test**: View `/leaves/approvals` as HR Manager: leaves applied by Department Managers show `Step 1: Super Admin` and indicate `In Super Admin Phase` (or hide decision buttons). View as Super Admin: `Audit & Decide` and `Reject` buttons are enabled and functional.

**Acceptance Scenarios**:

1. **Given** a Super Admin is on `/leaves/approvals`, **When** viewing a Department Manager's pending leave, **Then** the Decision / Chain column displays an amber badge `Step 1: Super Admin`, and the Actions column displays `Audit & Decide` and `Reject`.
2. **Given** an HR Manager is on `/leaves/approvals`, **When** viewing a Department Manager's pending leave, **Then** action buttons are not interactive, displaying a badge `In Super Admin Phase` or omitted.
3. **Given** a Super Admin opens `LeaveDecideModal` for a Department Manager's leave, **Then** the dossier correctly shows applicant details, department, balance, and single-tier Super Admin decision flow.

---

## Edge Cases

- **Applicant Holds Multiple Roles**: If a user holds both `Department Manager` and `Employee`, the managerial status takes precedence and routes directly to Super Admin.
- **Super Admin Submits Leave**: If a Super Admin applies for leave, the system treats it as an administrative application (self-approved or logged as administrative absence).
- **Delegation Interaction**: Active delegations created by Department Managers must not allow delegates to approve the delegating manager's own leave.
- **Concurrent Approvals / Double Decision**: The existing optimistic/concurrency checks on `leave.status === 'pending'` prevent double-approvals or duplicate balance deductions.
- **Quota Exceeded**: Department Managers are still subject to standard leave balance validation; applying without sufficient balance throws HTTP 400.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST identify whether a leave applicant holds the `Department Manager` role or title, using an extensible guard helper (`isApplicantManagerOrHR`).
- **FR-002**: For any leave application submitted by a Department Manager, system MUST construct an `approvalChain` containing exactly one step: `step: 1`, `approverRole: 'Super Admin'`, `approverId: null`, and `status: 'pending'`.
- **FR-003**: System MUST NOT attach intermediate Department Manager or HR Manager approval tiers to leaves applied by Department Managers, regardless of leave duration (even if >5 days).
- **FR-004**: System MUST dispatch real-time in-app and database notifications to all active users with the `Super Admin` role whenever a Department Manager submits a leave request.
- **FR-005**: System MUST NOT dispatch notifications to HR Managers or peer Department Managers when a Department Manager applies for leave.
- **FR-006**: System MUST enforce an executive guard in `decideLeave` preventing any non-Super-Admin user from approving or rejecting leaves applied by Department Managers, rejecting unauthorized attempts with HTTP 403 Forbidden.
- **FR-007**: System MUST preserve 100% of the existing multi-tier approval rules for all regular (non-manager, non-HR) employees without any regression.
- **FR-008**: System MUST update the `/leaves/approvals` queue query so that Super Admins see Department Manager pending leaves under the `pending` filter, while regular HR Managers do not have decision authority over them.
- **FR-009**: Front-end UI on `/leaves/approvals` and dashboard pending widgets MUST render the chain badge as `Step 1: Super Admin` and restrict action buttons to Super Admins only for these records.
- **FR-010**: All code, documentation, log messages, and UI text MUST be in English.
- **FR-011**: Changes MUST remain on the dedicated feature branch and NOT be merged into `main` without explicit user instruction.

### Key Entities

- **Leave**: Represents the leave application document. `approvalChain` array contains `{ step: 1, approverRole: 'Super Admin', approverId: null, status: 'pending' }`.
- **User / Employee**: Linked entities representing the applicant. Must verify role inclusion of `Department Manager` via `User.roles` or `Employee.role`.
- **Notification**: Document created and targeted to all active Super Admin user IDs with link `/leaves/approvals`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of leave requests submitted by Department Managers generate a 1-tier approval chain with `approverRole: 'Super Admin'`.
- **SC-002**: 0 non-Super-Admin users can approve or reject a Department Manager's leave (100% rejection rate with HTTP 403).
- **SC-003**: Real-time notifications successfully reach 100% of active Super Admins upon Department Manager leave submission.
- **SC-004**: Zero regression for regular employees: 100% of non-manager leave applications maintain normal 2-tier / 3-tier approval chains.
- **SC-005**: All automated backend and frontend tests pass (`npm test` and `npm run build` execute with 0 errors).

---

## Assumptions

- Department Managers are identified by having `'Department Manager'` in their user roles array or employee role name.
- Super Admins have permission to decide leaves across all departments and roles.
- Existing `notifySuperAdmins` utility in `backend/src/utils/hrApprovalGuard.js` can be reused or extended to support Department Manager leave notifications.
- The Git working branch for this task is `31-dept-manager-leave-approval-super-admin-direct` and will not be merged into `main` without explicit confirmation.

