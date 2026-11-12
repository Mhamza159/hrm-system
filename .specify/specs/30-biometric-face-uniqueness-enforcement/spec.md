# Feature Specification: Biometric Face Uniqueness & Duplicate Enrollment Prevention

**Feature Branch**: `30-biometric-face-uniqueness-enforcement`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "In the face approval module, the same face is being approved for multiple user accounts, which ruins uniqueness. The same face should not be allowed to register on any other user account so that it doesn't get overridden. Attendance is working 100% perfectly with face recognition, but if a face is already registered under someone's user account, it shouldn't be allowed to register again on another user's account."

---

## 1. Executive Summary & Objective

In ELVARA HRM Enterprise, Face Recognition Biometric Attendance allows employees to clock in/out with live facial verification. However, the system currently lacks a **global 1:1 biometric uniqueness constraint**:
- Multiple user accounts can currently enroll and have approved the **exact same human face** (as verified in the production database where *Basit Aulakh* and *Bilawal Haq* share the same face embeddings with an Euclidean distance of `0.312` < `0.50` threshold).
- When multiple accounts hold identical face biometrics, it creates proxy-punching vulnerabilities, audit ambiguity, and potential identity overrides.

**Objective**: Enforce strict 1:1 biometric uniqueness across the entire organization at both **Face Enrollment Submission** and **HR Approval**, ensuring that a human face registered and approved under one employee's account can never be enrolled or approved on any other account.

---

## 2. User Scenarios & Testing *(Prioritized)*

### User Story 1 - Real-Time Biometric Uniqueness Check at Enrollment (Priority: P1)

As an employee attempting to enroll my face for biometric attendance,  
I want the system to verify that my face is not already registered under another employee's account,  
So that no duplicate identities can be created and proxy clock-ins are impossible.

**Why this priority**: Preventing duplicates at the point of ingestion stops colliding data before it ever enters the pending approval queue.

**Independent Test**:
- Attempt to enroll a face on User Account B using descriptors that match User Account A (who already has an approved face).
- The API immediately rejects with HTTP 409 Conflict / 400 Bad Request, and the UI displays a clear notification stating the face is already registered.

**Acceptance Scenarios**:
1. **Given** User A has an approved face enrollment in the system,  
   **When** User B captures and submits face enrollment descriptors matching User A (Euclidean distance < `matchThreshold`, default `0.50`),  
   **Then** the enrollment request is rejected with message: `"This facial biometric is already registered and approved for another user account. Each employee face must be unique across the organization."`
2. **Given** User A has an approved face enrollment,  
   **When** User A re-enrolls their own face (updating photos or re-capturing),  
   **Then** the uniqueness check excludes User A's own ID and permits the re-enrollment without self-collision.
3. **Given** User B submits a completely distinct, un-enrolled face,  
   **When** the descriptors are compared against all approved accounts and minimum Euclidean distance >= `matchThreshold`,  
   **Then** the enrollment is accepted and transitions to `pending` status.

---

### User Story 2 - HR Approval Uniqueness Gate & Collision Defense (Priority: P1)

As an HR Manager reviewing pending face enrollments in the Face Approvals portal,  
I want the system to block approval if a pending face matches any existing approved user,  
So that I cannot accidentally approve duplicate biometrics even if legacy or concurrent enrollments exist.

**Why this priority**: Guarantees that the approval action acts as an authoritative cryptographic barrier, ensuring database integrity even under race conditions or historical legacy records.

**Independent Test**:
- Open the Face Approvals portal (`/attendance/face-approvals`), select a pending enrollment that matches an already-approved user, and click "Approve".
- System refuses to approve, showing an alert identifying the conflicting registered user.

**Acceptance Scenarios**:
1. **Given** a pending face enrollment for User B that matches already-approved User A,  
   **When** HR clicks "Approve",  
   **Then** the approval endpoint rejects with HTTP 409 Conflict: `"Cannot approve: This face is already registered to [Employee Name] ([Employee Code]). Please reject or reset this enrollment."`
2. **Given** a pending face enrollment that is unique across all organization accounts,  
   **When** HR clicks "Approve",  
   **Then** status transitions to `approved`, timestamp and approver ID are recorded, and success toast is shown.

---

### User Story 3 - Visual Collision Warning & Legacy Duplicate Resolver in UI (Priority: P2)

As an HR Manager viewing the Face Approvals dashboard,  
I want to see visual indicators or warning badges on enrollment cards that collide with existing users,  
So that I can immediately identify duplicate submissions, inspect side-by-side photos, and reset duplicates with a clear reason.

**Why this priority**: Gives HR operational visibility into biometric conflicts and empowers them to cleanly resolve existing duplicate approvals without database queries.

**Independent Test**:
- Navigate to the Face Approvals list. An enrollment card with an existing collision displays an amber/red "Biometric Conflict Detected" badge.
- Clicking the badge opens a quick comparison showing the conflicting employee's name, code, and confidence score.
- Clicking "Reset" prompts a confirmation dialog with reason `"Duplicate biometric conflict"` and resets the enrollment back to `none`.

**Acceptance Scenarios**:
1. **Given** User B has an approved or pending face enrollment that collides with User A,  
   **When** HR opens the Face Approvals page,  
   **Then** User B's card displays a prominent alert badge: `"Conflict with [User A Name] (Distance: 0.31)"`,  
   **And** the "Approve" button is disabled with an explanatory tooltip.
2. **Given** an approved duplicate face (such as legacy records in the database),  
   **When** HR clicks "Reset" on the duplicate card,  
   **Then** the enrollment is reset to `none`, freeing the account for legitimate unique enrollment.

---

## 3. Edge Cases & Boundary Conditions

- **Self-Re-enrollment**: When a user re-enrolls or updates their own biometric photos, the comparison query MUST exclude `_id: { $ne: currentUserId }`.
- **Soft-Deleted / Archived Employees**: If an employee is marked `isDeleted: true`, their face embeddings should not block a newly hired employee unless explicitly required by security policy. Default: exclude soft-deleted users (`isDeleted: false`).
- **Vector Descriptor Count**: Users typically store 3 to 5 vectors (128 dimensions each). The collision detection must calculate the cross-minimum Euclidean distance: `min(calculateEuclideanDistance(vecCandidate_i, vecExisting_j))` across all pairs.
- **Match Threshold Alignment**: The collision detection threshold MUST be synchronized with the system setting (`Setting.key: 'faceAttendance'.matchThreshold`, default `0.50`). A candidate is deemed a duplicate if `minDistance < matchThreshold`.
- **Concurrent Submissions**: If two users submit identical faces simultaneously, the HR Approval step (P1 Story 2) acts as the final atomic barrier ensuring at most one can ever be approved.

---

## 4. Functional Requirements

- **FR-001 [Biometric Collision Scanner]**: The attendance service MUST expose a helper `findConflictingFaceUser({ descriptors, excludeUserId, threshold })` that scans all active users with `faceEnrollment.status === 'approved'` and returns `{ hasConflict: boolean, conflictingUser, minDistance }`.
- **FR-002 [Enrollment Endpoint Guard]**: `POST /api/v1/attendance/face/enroll` MUST execute the collision scanner against submitted descriptors. If `hasConflict === true`, it MUST abort and return HTTP 409 Conflict with descriptive payload `{ conflictingEmployee: { name, employeeCode }, minDistance }`.
- **FR-003 [Approval Endpoint Guard]**: `POST /api/v1/attendance/face/:userId/approve` MUST re-verify face uniqueness against all other approved users before committing `status = 'approved'`. If another user already holds that biometric, approval MUST be refused with HTTP 409 Conflict.
- **FR-004 [Collision Data in Admin List View]**: `GET /api/v1/attendance/face/enrollments` MUST include conflict metadata for pending and approved items (e.g., `collisionWith: { userId, name, employeeCode, minDistance }` or `null`) so the frontend can immediately render visual conflict badges.
- **FR-005 [UI Approval Action Disabling]**: In `FaceEnrollmentsPage.jsx`, if an enrollment item has a detected collision with an approved user, the "Approve" button MUST be disabled with a tooltip or badge stating: *"Cannot approve: Biometric duplicate with [Name]"*.
- **FR-006 [Audit Logging]**: Any blocked duplicate enrollment attempt or approval collision MUST be logged to system audit logs with action `'FACE_ENROLLMENT_COLLISION_BLOCKED'`.
- **FR-007 [Legacy Cleanup Utility]**: Provide a clean administrative action or migration check to identify any existing duplicates currently in the database (e.g. *Basit Aulakh* & *Bilawal Haq*) and allow HR to reset the unverified account.

---

## 5. Non-Functional Requirements & Performance

- **In-Memory Biometric Comparison**: Scanning 128-d vectors across approved users (e.g. 100-500 employees) takes < 15ms in Node.js when querying only approved descriptors `{ 'faceEnrollment.status': 'approved', isDeleted: false }`.
- **Accuracy**: Uses the standardized Euclidean distance metric with Face-API.js 128-d vectors ($D = \sqrt{\sum (a_i - b_i)^2}$).
- **Security & Privacy**: Face snapshots and descriptors are protected behind CASL `attendance.face.manage` permission and Super Admin / HR scoping.

