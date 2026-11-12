# Tasks: Direct Single-Tier Super Admin Leave Approval for Department Managers

**Input**: Feature Specification ([`spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/31-dept-manager-leave-approval-super-admin-direct/spec.md)) and Implementation Plan ([`plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/31-dept-manager-leave-approval-super-admin-direct/plan.md))  
**Feature Branch**: `31-dept-manager-leave-approval-super-admin-direct`  
**Organization**: Tasks are structured by prioritized user stories (P1 & P2) to allow independent implementation, automated verification, and incremental progress tracking.

---

## Task Summary Table

| Phase | Story / Topic | Priority | Task Range | Estimated Work |
|---|---|---|---|---|
| **Phase 1** | Foundational Executive Guard Primitives | Pre-req | `T001` - `T003` | Helper functions in `hrApprovalGuard.js` for Department Managers |
| **Phase 2** | US1 & US2: 1-Tier Approval Chain & Super Admin Notifications | P1 (MVP) | `T004` - `T007` | Service routing, chain construction, notification trigger |
| **Phase 3** | US3: Executive Security Guard & Queue Authorization | P1 | `T008` - `T011` | Decision barrier (403), queue query scoping |
| **Phase 4** | US4: Role-Aware UI Polish & Action Guards | P2 | `T012` - `T014` | Approvals table badges, status pills, button visibility |
| **Phase 5** | Automated Testing & Production Build | Verification | `T015` - `T018` | Jest integration tests, frontend build, verification |

---

## Phase 1: Foundational Executive Guard Primitives

**Purpose**: Establish the core role-checking and assertion helpers for Department Managers in `hrApprovalGuard.js`.

- [x] T001 Verify active git branch is `31-dept-manager-leave-approval-super-admin-direct`.
- [x] T002 Implement `isUserDeptManager(user)` and `isApplicantDeptManager(applicantEmployee, applicantUser)` in `backend/src/utils/hrApprovalGuard.js`:
  - Inspect `user.roles` and `user.role` for `'Department Manager'`.
  - Inspect `applicantEmployee.designation` or `applicantEmployee.role` if needed as fallback.
- [x] T003 Implement `isApplicantManagerOrHR(applicantEmployee, applicantUser)` and `assertSuperAdminIfApplicantIsManagerOrHR(applicantEmployee, actor, requestTypeName, applicantUser)` in `backend/src/utils/hrApprovalGuard.js`:
  - Check if applicant is either HR or Department Manager.
  - Assert that decision actor holds `Super Admin` role; throw `ApiError(403, "Forbidden: Any ${requestTypeName} applied by Department Managers or HR personnel can only be approved or decided by the Super Admin.")` if unauthorized.
  - Export all new helpers alongside backwards-compatible aliases.

**Checkpoint**: Core guard helpers are unit-testable and ready to plug into the leave service.

---

## Phase 2: User Story 1 & 2 — 1-Tier Approval Chain & Super Admin Notifications (Priority: P1) 🎯 MVP

**Goal**: Automatically route Department Manager leave applications to a single-tier Super Admin chain and dispatch instant notifications to all Super Admins.

**Independent Test**: Submitting a leave application as a Department Manager produces an `approvalChain` of length 1 (`approverRole: 'Super Admin'`, `approverId: null`, `status: 'pending'`), and creates a notification targeted to Super Admin users.

- [x] T004 [US1] Update `buildApprovalChain(employee, netDays)` in `backend/src/modules/leaves/leave.service.js`:
  - Replace standalone `isApplicantHR` with `isApplicantManagerOrHR(employee._id, employee.userId)`.
  - When true, immediately return single-tier chain:
    ```javascript
    return [
      {
        step: 1,
        approverRole: 'Super Admin',
        approverId: null,
        status: 'pending'
      }
    ];
    ```
  - Verify that for regular employees (non-manager, non-HR), the multi-tier chain remains completely intact.
- [x] T005 [US2] Update `applyLeave` in `backend/src/modules/leaves/leave.service.js`:
  - Inspect `step1 = approvalChain[0]`.
  - When `step1?.approverRole === 'Super Admin'`, execute `notifySuperAdmins({ type: 'leave', title: 'New Management Leave Application', body: '...', link: '/leaves/approvals' })`.
  - Ensure standard Department Manager / HR notifications are bypassed for this application.
- [x] T006 [P] [US1] Ensure `employee.managerId` lookups are skipped when applicant is a Department Manager or HR.
- [x] T007 [US1] Verify that long leaves (>5 days) applied by Department Managers still maintain exactly 1 tier (Super Admin), without appending extra redundant tiers.

**Checkpoint**: Department Managers apply with a clean 1-tier chain, and Super Admins receive notifications.

---

## Phase 3: User Story 3 — Executive Security Guard & Queue Authorization (Priority: P1)

**Goal**: Block unauthorized decision attempts by HR or peer managers with HTTP 403 Forbidden, and correctly scope the pending approvals query.

**Independent Test**: Calling `POST /api/v1/leaves/:id/decide` with an HR Manager token on a Department Manager's leave returns HTTP 403. Calling with a Super Admin token returns HTTP 200 and marks the leave approved.

- [x] T008 [US3] Update `decideLeave(leaveId, action, reason, user)` in `backend/src/modules/leaves/leave.service.js`:
  - Replace `assertSuperAdminIfApplicantIsHR` with `assertSuperAdminIfApplicantIsManagerOrHR(leave.employeeId, user, 'leave application')`.
  - Confirm HTTP 403 Forbidden is thrown with descriptive security message if actor is not Super Admin.
- [x] T009 [US3] Update `getPendingApprovals` in `backend/src/modules/leaves/leave.service.js`:
  - For `Super Admin`: ensure queries match `{ 'approvalChain.0.approverRole': 'Super Admin', 'approvalChain.0.status': 'pending' }`.
  - For `HR Manager`: ensure Step 1 leaves with `approverRole: 'Super Admin'` are excluded from HR pending queues to prevent un-actionable noise.
- [x] T010 [US3] Verify that when a Super Admin approves a Department Manager's leave:
  - `leave.status` becomes `'approved'`.
  - `approvalChain[0].status` becomes `'approved'`, recording `decisionBy: user._id` and timestamp.
  - Leave balances (`pendingDays` converted to `usedDays`) and Attendance (`on_leave`) sync cleanly.
- [x] T011 [US3] Verify that when a Super Admin rejects a Department Manager's leave:
  - `leave.status` becomes `'rejected'`.
  - Reserved `pendingDays` in `LeaveBalance` are restored immediately.

**Checkpoint**: Full backend authorization barrier and state transitions are secured and verified.

---

## Phase 4: User Story 4 — Role-Aware UI Polish & Action Guards (Priority: P2)

**Goal**: Update `/leaves/approvals` and dashboard pending widgets to display the Super Admin tier cleanly and restrict action controls.

**Independent Test**: Viewing `/leaves/approvals` as HR Manager shows `Step 1: Super Admin` and a non-clickable indicator (`Super Admin Review`). Viewing as Super Admin displays interactive `Audit & Decide` and `Reject` buttons.

- [x] T012 [US4] Update `frontend/src/features/leaves/pages/LeaveApprovalsPage.jsx`:
  - In table row render, detect if `currentStep?.approverRole === 'Super Admin'`.
  - For non-Super-Admin reviewers (e.g. HR Manager), display a clean status pill:
    ```jsx
    <span className="px-3 py-1 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/80">
      Super Admin Review
    </span>
    ```
  - For Super Admin, ensure `Audit & Decide` and `Reject` buttons render cleanly.
- [x] T013 [P] [US4] Update `LeaveDecideModal.jsx` if needed to display applicant designation/role (Department Manager) in the dossier header.
- [x] T014 [US4] Verify `PendingList.jsx` on the Dashboard cleanly displays Department Manager leave items for Super Admin users with working "Inspect Leave" button.

**Checkpoint**: UI is role-aware, professional, and free of AI slop.

---

## Phase 5: Automated Testing & Production Build

**Purpose**: Execute comprehensive automated integration tests and verify that the frontend builds with 0 errors.

- [x] T015 Create `backend/tests/leave.dept-manager-approval.test.js` with comprehensive test cases:
  - Test 1: Department Manager applies for leave $\rightarrow$ `approvalChain.length === 1` with `approverRole: 'Super Admin'`.
  - Test 2: Notification is recorded for active Super Admin user IDs.
  - Test 3: HR Manager attempts `decideLeave` on Department Manager request $\rightarrow$ expects HTTP 403 Forbidden.
  - Test 4: Super Admin attempts `decideLeave` $\rightarrow$ expects HTTP 200 OK and status `approved`.
  - Test 5: Regular employee applies for leave $\rightarrow$ expects multi-tier chain (Step 1: Manager, Step 2: HR), ensuring zero regression.
- [x] T016 Run Jest test suite: `npm --prefix backend test backend/tests/leave.dept-manager-approval.test.js`.
- [x] T017 Run full frontend production build: `npm --prefix frontend run build` to confirm zero compilation or lint errors.
- [x] T018 Verify that all changes remain on branch `31-dept-manager-leave-approval-super-admin-direct` and are NOT merged into `main`.

---

## Dependencies & Execution Order

- **Phase 1 (Guard Primitives)**: Blocks Phase 2 and Phase 3.
- **Phase 2 (US1 & US2: Chain & Notifications)**: Depends on Phase 1; implements the core service routing.
- **Phase 3 (US3: Authorization & Decision)**: Depends on Phase 1 & 2; secures the decision endpoint.
- **Phase 4 (US4: Frontend Polish)**: Can run in parallel with or right after Phase 3.
- **Phase 5 (Testing & Verification)**: Validates all phases end-to-end.

