# Tasks: Biometric Face Uniqueness & Duplicate Enrollment Prevention

**Input**: Feature Specification ([`spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/30-biometric-face-uniqueness-enforcement/spec.md)) and Implementation Plan ([`plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/30-biometric-face-uniqueness-enforcement/plan.md))  
**Feature Branch**: `feature/30-biometric-face-uniqueness-enforcement`  
**Organization**: Tasks are structured by prioritized user stories (P1 & P2) to allow independent implementation, automated verification, and incremental progress tracking.

---

## Task Summary Table

| Phase | Story / Topic | Priority | Task Range | Estimated Work |
|---|---|---|---|---|
| **Phase 1** | Baseline Setup & Core Collision Helper | Pre-req | `T001` - `T003` | Math distance logic & vector comparison scanner |
| **Phase 2** | US1: Real-Time Ingestion Collision Guard | P1 | `T004` - `T007` | `enrollFace` uniqueness check & 409 Conflict |
| **Phase 3** | US2: HR Approval Gate & Collision Barrier | P1 | `T008` - `T010` | `approveFaceEnrollment` atomic validation |
| **Phase 4** | US3: Visual Conflict Badges & Duplicate Resolver | P2 | `T011` - `T015` | `getFaceEnrollments` enrichment & UI indicators |
| **Phase 5** | Automated Testing & Production Build | Verification | `T016` - `T019` | Vitest suites, Vite build, live validation |

---

## Phase 1: Baseline Setup & Foundational Prerequisites

**Purpose**: Establish the core biometric comparison primitives and ensure environment stability.

- [x] T001 Verify active git branch and environment prerequisites for `feature/30-biometric-face-uniqueness-enforcement`.
- [x] T002 Implement `detectFaceCollision({ candidateDescriptors, excludeUserId, threshold })` in `backend/src/modules/attendance/attendance.service.js`:
  - Fetch all active users with `faceEnrollment.status === 'approved'` and `isDeleted: false`.
  - Exclude `excludeUserId` (to cleanly allow users to re-enroll/update their own face).
  - Compute pairwise Euclidean distance: $D = \sqrt{\sum_{i=0}^{127} (a_i - b_i)^2}$ across all 128-d vectors.
  - Return `{ hasConflict: boolean, conflictingUser, minDistance }`.
- [x] T003 [P] Add audit log action `'FACE_ENROLLMENT_COLLISION_BLOCKED'` in `backend/src/modules/attendance/attendance.service.js` for forensic accountability.

**Checkpoint**: Core mathematical collision detector is operational and testable in isolation.

---

## Phase 2: User Story 1 — Real-Time Biometric Ingestion Guard (Priority: P1) 🎯 MVP

**Goal**: Prevent duplicate biometric identities from ever being saved by rejecting colliding face enrollments at point of submission.

**Independent Test**: Calling `POST /api/v1/attendance/face/enroll` with descriptors matching an already-approved employee immediately returns HTTP 409 Conflict with descriptive payload identifying the registered account. Submitting a unique face returns HTTP 200 and transitions to `pending`.

- [x] T004 [US1] Update `enrollFace(userId, { descriptors, photo })` in `backend/src/modules/attendance/attendance.service.js`:
  - Invoke `detectFaceCollision({ candidateDescriptors: descriptors, excludeUserId: userId })`.
  - If `hasConflict === true`, record audit log and throw `ApiError(409, message)`.
- [x] T005 [US1] Ensure `enrollFace` returns structured 409 response with:
  ```json
  {
    "code": "BIOMETRIC_COLLISION_DETECTED",
    "conflictingEmployee": { "name": "...", "employeeCode": "..." },
    "confidenceDistance": 0.313
  }
  ```
- [x] T006 [US1] Update `backend/src/modules/attendance/attendance.controller.js` to ensure 409 status code is cleanly propagated to the client.
- [x] T007 [P] [US1] Update `frontend/src/features/attendance/pages/FaceEnrollPage.jsx` and `EnrollmentCaptureWizard.jsx` to parse 409 conflict errors and display a clear warning banner: *"This face is already registered to another employee account."*

**Checkpoint**: Users cannot enroll a face that matches another existing approved employee.

---

## Phase 3: User Story 2 — HR Approval Gate & Collision Barrier (Priority: P1)

**Goal**: Block HR managers from approving any face enrollment that collides with an existing approved user, ensuring database integrity even under concurrent submissions.

**Independent Test**: In Face Approvals, calling `POST /api/v1/attendance/face/:userId/approve` on a user whose face matches another approved employee fails with HTTP 409 Conflict. Unique faces approve smoothly.

- [x] T008 [US2] Update `approveFaceEnrollment(targetUserId, actor)` in `backend/src/modules/attendance/attendance.service.js`:
  - Run `detectFaceCollision({ candidateDescriptors: user.faceEnrollment.descriptors, excludeUserId: targetUserId })`.
  - If a collision is found with an approved user, abort approval and throw `ApiError(409, ...)` detailing the conflicting employee.
- [x] T009 [US2] Ensure atomic database update so approval can never result in multiple users holding identical active biometrics.
- [x] T010 [US2] Audit log `FACE_ENROLLMENT_APPROVAL_COLLISION_BLOCKED` when an approval attempt is intercepted.

**Checkpoint**: Approval endpoint acts as an authoritative cryptographic gate.

---

## Phase 4: User Story 3 — Visual Conflict Badges & Duplicate Resolver (Priority: P2)

**Goal**: Provide HR managers with full visual clarity on conflicting biometrics (such as the live Basit Aulakh & Bilawal Haq duplicate pair), disable unsafe approval actions, and allow one-click resets.

**Independent Test**: Navigate to `/attendance/face-approvals`. Cards with duplicate faces display an amber/rose "Biometric Duplicate" banner with conflicting name, code, and distance. The "Approve" button is disabled on pending collisions. Clicking "Reset" clears the duplicate.

- [x] T011 [US3] Enrich `getFaceEnrollments` in `backend/src/modules/attendance/attendance.service.js`:
  - Compute cross-collisions across the retrieved users and all approved accounts.
  - Attach `collision: { hasConflict, conflictingUserId, conflictingEmployeeName, conflictingEmployeeCode, distance }` to each user record.
- [x] T012 [US3] Update `frontend/src/features/attendance/pages/FaceEnrollmentsPage.jsx` Grid View:
  - Render a prominent alert badge on cards where `user.collision?.hasConflict === true`:
    ```jsx
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-semibold">
      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
      <span>Biometric Duplicate with {user.collision.conflictingEmployeeName} ({user.collision.conflictingEmployeeCode})</span>
    </div>
    ```
- [x] T013 [P] [US3] Update `FaceEnrollmentsPage.jsx` Table View to show the conflict badge in the status or telemetry column.
- [x] T014 [US3] In `FaceEnrollmentsPage.jsx`, conditionally disable the "Approve Biometric" button when `user.collision?.hasConflict === true`, displaying a helpful tooltip explaining the block.
- [x] T015 [US3] Verify the existing "Reset" action in `FaceEnrollmentsPage.jsx` resets duplicate enrollments back to `none`, freeing the account for unique re-enrollment.

**Checkpoint**: HR has complete visual transparency and self-serve resolution for biometric duplicates.

---

## Phase 5: Automated Testing, Build & Final Verification

**Purpose**: Verify zero regressions in biometric attendance and confirm complete test coverage.

- [x] T016 Create integration test file `backend/tests/attendance.face.uniqueness.test.js`:
  - Verify `calculateEuclideanDistance` accuracy ($D = \sqrt{\sum (a_i - b_i)^2}$).
  - Verify `detectFaceCollision` detects matches ($D < 0.50$) and passes distinct vectors ($D \ge 0.50$).
  - Verify `enrollFace` blocks duplicate face with 409 Conflict.
  - Verify `enrollFace` allows self re-enrollment for the same user.
  - Verify `approveFaceEnrollment` blocks duplicate approval with 409 Conflict.
  - Verify `verifyFacePunch` attendance punch continues to operate 100% accurately for valid approved faces.
- [x] T017 Execute backend test suite:
  ```powershell
  npx vitest run tests/attendance.face.uniqueness.test.js
  ```
  *(10/10 tests passed)*
- [x] T018 Execute frontend production build:
  ```powershell
  npm --prefix frontend run build
  ```
  *(Passed with 0 errors)*
- [x] T019 Conduct end-to-end verification and capture verified state.
