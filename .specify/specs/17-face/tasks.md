# Implementation Tasks: Module M12 — Face Recognition Attendance

**Feature Branch**: `feature/17-face`  
**Specification**: [`.specify/specs/17-face/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/17-face/spec.md)  
**Architecture Plan**: [`.specify/specs/17-face/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/17-face/plan.md)  
**Target BUILD-GUIDE**: Section 19 (Rows 12.1 to 12.9)  

---

## Task Execution Checklist (Vertical Slice Order)

### Phase 0: Dependencies & Permission Setup
- [x] **12.0-FE-DEPS**: Install `@vladmandic/face-api` (or verified ESM version) in `frontend/package.json` and deploy pre-trained neural network weights (`tiny_face_detector`, `face_landmark_68`, `face_recognition`) to `frontend/public/models/`.
- [x] **12.0-BE-PERM**: Add `attendance.face.manage` permission (Subject: `'Attendance'`, Scopes: `['all', 'department']`) to `backend/src/shared/permissions.js` and assign to `Super Admin` and `HR Manager` in `backend/src/seed/roles.seed.js`.

---

### Slice 1: Neural Models Loading & Client Hook (BUILD-GUIDE Row 12.1 · Priority: P1)
- [x] **12.1-FE-HOOK**: Create `frontend/src/features/attendance/hooks/useFaceApi.js` to initialize models (`tinyFaceDetector`, `faceLandmark68Net`, `faceRecognitionNet`) from `/models` with loading states (`isLoading`, `isLoaded`, `error`).
- [x] **12.1-FE-UI**: Add model initialization status indicator and skeleton/spinner in attendance camera components.
- [x] **12.1-TEST**: Unit/component test asserting that `useFaceApi` loads weights, manages loading state transitions, and handles missing models gracefully.

---

### Slice 2: Multi-Angle Face Enrollment (BUILD-GUIDE Row 12.2 · Priority: P1)
- [x] **12.2-BE-MODEL**: Extend `User` schema in `backend/src/models/user.model.js` with `faceEnrollment` ({ `status`: enum `['none', 'pending', 'approved', 'rejected']`, `descriptors`: `[[Number]]`, `enrollmentPhotoUrl`: String, `enrolledAt`: Date, `approvedAt`: Date, `approvedBy`: ObjectId, `rejectionReason`: String }).
- [x] **12.2-BE-VAL**: Add `enrollFaceSchema` in `backend/src/modules/attendance/attendance.validation.js` requiring 3 to 5 arrays of 128 floating-point numbers and base64 photo data URI.
- [x] **12.2-BE-SERVICE**: Implement `enrollFace` and `getFaceStatus` in `backend/src/modules/attendance/attendance.service.js` saving descriptors and marking status `'pending'`.
- [x] **12.2-BE-ROUTE**: Register `POST /api/v1/attendance/face/enroll` and `GET /api/v1/attendance/face/status` in `attendance.routes.js` protected by `authenticate`, `validate`, and `checkPermission('attendance.mark', 'own')`.
- [x] **12.2-FE-API**: Add `enrollFace` mutation and `getFaceStatus` query endpoints to `frontend/src/features/attendance/attendanceApi.js`.
- [x] **12.2-FE-UI**: Build `frontend/src/features/attendance/components/EnrollmentCaptureWizard.jsx` and `pages/FaceEnrollPage.jsx` guiding employee through 3 distinct photo captures and submitting descriptors to backend.
- [x] **12.2-FE-NAV**: Register `/attendance/face/enroll` route in `App.jsx` and add "Face Enrollment" entry in `Sidebar.jsx`.
- [x] **12.2-TEST**: Automated backend API test verifying successful enrollment submission, 128-float vector validation, and initial `'pending'` status.

---

### Slice 3: HR Enrollment Approval & Re-enrollment Lifecycle (BUILD-GUIDE Row 12.3 · Priority: P1)
- [x] **12.3-BE-VAL**: Define `faceApprovalSchema` in `backend/src/modules/attendance/attendance.validation.js` (rejection reason validation).
- [x] **12.3-BE-SERVICE**: Implement `getFaceEnrollments`, `approveFaceEnrollment`, `rejectFaceEnrollment`, and `resetFaceEnrollment` in `backend/src/modules/attendance/attendance.service.js` with audit log creation.
- [x] **12.3-BE-ROUTE**: Register `GET /api/v1/attendance/face/enrollments`, `POST /api/v1/attendance/face/enrollments/:userId/approve`, `POST /api/v1/attendance/face/enrollments/:userId/reject`, and `POST /api/v1/attendance/face/enrollments/:userId/reset` in `attendance.routes.js` protected by `checkPermission('attendance.face.manage', 'all')`.
- [x] **12.3-FE-API**: Add `getFaceEnrollments`, `approveFaceEnrollment`, `rejectFaceEnrollment`, and `resetFaceEnrollment` mutations in `frontend/src/features/attendance/attendanceApi.js`.
- [x] **12.3-FE-UI**: Build `frontend/src/features/attendance/pages/FaceEnrollmentsPage.jsx` with photo preview cards, status filter tabs (All, Pending, Approved, Rejected), approve/reject modal, and reset button.
- [x] **12.3-FE-NAV**: Register `/attendance/face/enrollments` in `App.jsx` and add "Face Approvals" in `Sidebar.jsx` with `Can` guard.
- [x] **12.3-TEST**: Automated tests verifying HR approval transitions status to `'approved'`, rejection records reason, reset clears vectors, and non-HR roles receive HTTP 403.

---

### Slice 4: Anti-Spoofing Liveness Verification (BUILD-GUIDE Row 12.4 · Priority: P1)
- [x] **12.4-FE-UTIL**: Implement `frontend/src/features/attendance/utils/livenessDetector.js` to compute Eye Aspect Ratio (EAR) from 68 landmarks and detect organic blink cycle ($EAR < 0.22 \rightarrow > 0.28$).
- [x] **12.4-FE-UI**: Build `frontend/src/features/attendance/components/LivenessFeedback.jsx` displaying real-time instruction ("Please blink to confirm you're live") and bounding box color feedback.
- [x] **12.4-TEST**: Unit test verifying EAR computation mathematical accuracy and state machine transition from unverified to live.

---

### Slice 5: Face Check-In & Distance Matching (BUILD-GUIDE Row 12.5 · Priority: P1)
- [x] **12.5-BE-MODEL**: Extend `Attendance` model in `backend/src/models/attendance.model.js` to include `'face'` in `source` enum, `snapshotUrl`, and `confidenceDistance`.
- [x] **12.5-BE-SERVICE**: Implement vector Euclidean distance matcher in `attendance.service.js`; update `checkIn` and `checkOut` to compare `liveDescriptor` against user's approved descriptors and verify distance < match threshold.
- [x] **12.5-FE-MODAL**: Build `frontend/src/features/attendance/components/FaceCheckInModal.jsx` combining camera feed, EAR liveness detection, auto-capture, descriptor extraction, and punch submission.
- [x] **12.5-FE-WIDGET**: Update `frontend/src/features/attendance/components/PunchCardWidget.jsx` and `pages/MyAttendancePage.jsx` to render "Face Punch" action button.
- [x] **12.5-TEST**: Automated tests verifying successful face punch with matching descriptor, rejection for non-enrolled users, and proper `source: 'face'` logging.

---

### Slice 6: Threshold & On/Off Global Settings (BUILD-GUIDE Row 12.6 · Priority: P2)
- [x] **12.6-BE-SETTINGS**: Ensure `Setting` key `faceAttendance` (`isEnabled`, `matchThreshold`, `requireLiveness`) is queried dynamically during punch processing.
- [x] **12.6-FE-SETTINGS**: Add Face Recognition configuration card in `frontend/src/features/settings/components/AttendanceRulesForm.jsx` (toggle, match threshold slider 0.35–0.65, require liveness).
- [x] **12.6-FE-CONDITIONAL**: Conditionally hide "Face Punch" button in `PunchCardWidget.jsx` when `faceAttendance.isEnabled === false`.
- [x] **12.6-TEST**: Automated tests asserting rejection when face attendance is disabled and verifying threshold sensitivity changes.

---

### Slice 7: Failed & Suspicious Attempts Logging (BUILD-GUIDE Row 12.7 · Priority: P2)
- [x] **12.7-BE-SERVICE**: On distance $\ge$ threshold or liveness failure, log flagged `Attendance` record (`isFlagged: true`, `flagReason: 'face_match_failed'`, `snapshotUrl`, `confidenceDistance`).
- [x] **12.7-FE-PAGE**: Update `frontend/src/features/attendance/pages/FlaggedPunchesPage.jsx` to display photo snapshot preview and failed Euclidean distance metric.
- [x] **12.7-TEST**: Automated tests asserting that face mismatch creates a flagged attendance record with captured photo snapshot.

---

### Slice 8: Fallback Manual Correction Request (BUILD-GUIDE Row 12.8 · Priority: P2)
- [x] **12.8-FE-UI**: In `FaceCheckInModal.jsx`, on punch failure, display a prominent "Request Manual Attendance Correction" button that opens existing M5 correction modal pre-filled with timestamp and reason `"Face recognition failure"`.
- [x] **12.8-TEST**: Component test verifying fallback button renders upon mismatch and opens M5 correction request modal.

---

### Slice 9: Scoped Manager View for Flagged Snapshots (BUILD-GUIDE Row 12.9 · Priority: P2)
- [x] **12.9-BE-SERVICE**: Enforce CASL `department` scope in `GET /api/v1/attendance/flagged`, filtering results to match `departmentId` for Department Managers.
- [x] **12.9-FE-UI**: Ensure Department Managers only see flagged punch snapshots of their department staff in team attendance views.
- [x] **12.9-TEST**: Automated tests asserting Department Manager only receives their team's flagged snapshots, whereas HR Manager receives all.

---

### Slice 10: Multi-Role End-to-End Verification (BUILD-GUIDE End Gate)
- [x] **12.10-E2E-PLAYWRIGHT**: Module M12 end-to-end Playwright test suite (`tests/e2e/m12-face.spec.js`) verifying all 4 roles (Super Admin, HR Manager, Department Manager, Employee).
