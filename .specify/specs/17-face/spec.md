# Feature Specification: Module M12 — Face Recognition Attendance

**Feature Branch**: `feature/17-face`  
**Created**: October 31, 2026  
**Status**: Draft / Review  
**Source of Truth**:
- `docs/FRD.md`: Section 7 (M12. Face Recognition Attendance) & Section 11 (Permission Matrix)
- `docs/BUILD-GUIDE.md`: Section 19 (Rows 12.1 to 12.9)
- `docs/TECH-SPEC.md`: Sections 3, 4, 5, 6, 8
- `docs/MODULES.md`: Section 6 (M12 — Face Recognition Attendance)

---

## 1. Executive Summary & Architecture Overview

Module M12 introduces AI-powered, contactless facial recognition attendance with client-side inference using `@vladmandic/face-api`. It provides biometric accuracy without expensive physical biometric hardware, protected against photo/screen spoofing via active liveness detection (blink and head posture verification).

```
+--------------------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER / WEBCAM                                       |
|                                                                                                  |
|   1. Load Neural Models (/models)                                                                |
|      - TinyFaceDetector / SsdMobilenetv1                                                         |
|      - FaceLandmark68Net (for 68-point landmarks)                                                |
|      - FaceRecognitionNet (computes 128-d Float32Array face descriptor)                          |
|                                                                                                  |
|   2. Active Liveness Detection                                                                   |
|      - Eye Aspect Ratio (EAR) tracking to require an organic blink before capture                |
|      - Landmark 36-41 (left eye) & 42-47 (right eye) calculation                                 |
|                                                                                                  |
|   3. Enrollment Flow                                           4. Check-In / Check-Out Flow      |
|      - Captures 3-5 distinct angles                                - Computes live descriptor    |
|      - Extracts 128-float descriptor vectors                       - Sends descriptor + snapshot |
+--------------------------------------------------------------------------------------------------+
                                        │                                         │
                                        ▼ POST /api/v1/attendance/face/enroll     ▼ POST /api/v1/attendance/check-in
+--------------------------------------------------------------------------------------------------+
|                                        EXPRESS BACKEND                                           |
|                                                                                                  |
|   - Enrollment Approval Workflow: Status 'pending' -> HR approves -> 'approved'                  |
|   - Verification Engine: Compares live descriptor with user's approved face descriptors         |
|   - Euclidean Distance: d = sqrt(sum((u[i] - v[i])^2))                                          |
|   - Settings Gate: Verifies d < settings.faceAttendance.matchThreshold (default: 0.50)           |
|                                                                                                  |
|   MATCH (d < threshold)                       FAIL (d >= threshold or spoof)                     |
|   ├── Attendance marked (source: 'face')       ├── Flagged punch logged (photo snapshot saved)    |
|   └── Snapshot URL stored in record            └── Fallback to manual correction request (5.12)  |
+--------------------------------------------------------------------------------------------------+
```

### Core Security & Privacy Principles
1. **Zero Raw Photo Biometric Storage**: The backend stores mathematical 128-dimensional floating-point embeddings (`faceDescriptors: [[Number]]`), not raw vector facial identities. Verification is performed via Euclidean distance calculations against approved descriptors.
2. **Client-Side Processing**: Face detection and landmark extraction run entirely within the user's browser using WebGL / WASM via TensorFlow.js in `@vladmandic/face-api`, minimizing server GPU load.
3. **Anti-Spoofing Liveness Gate**: Static printed photos and mobile screen replays fail the interactive Eye Aspect Ratio (EAR) blink verification before descriptors are emitted.
4. **Human-in-the-Loop Approval**: Regular employees cannot immediately punch with self-enrolled faces; an HR Manager or Super Admin must review and approve enrollment photos to prevent identity hijacking.
5. **Flagged Snapshots Audit Trail**: Failed or suspicious punches capture a camera snapshot and register in `flaggedPunches` for HR & Department Manager review.

---

## 2. Official Library Patterns (`@vladmandic/face-api` via Context7)

Per Context7 official documentation for `/vladmandic/face-api`:

### A. Model Loading from `/public/models`
```javascript
import * as faceapi from '@vladmandic/face-api';

export async function loadFaceApiModels(modelsUri = '/models') {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelsUri),
    faceapi.nets.faceLandmark68Net.loadFromUri(modelsUri),
    faceapi.nets.faceRecognitionNet.loadFromUri(modelsUri)
  ]);
}
```

### B. Face Detection with 68 Landmarks & Descriptor Extraction
```javascript
export async function detectFaceAndComputeDescriptor(videoOrCanvasElement) {
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
  const result = await faceapi
    .detectSingleFace(videoOrCanvasElement, options)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!result) return null;

  return {
    detection: result.detection,
    landmarks: result.landmarks,
    descriptor: Array.from(result.descriptor) // Convert Float32Array to serializable Array<number>
  };
}
```

### C. Client-Side Eye Aspect Ratio (EAR) Liveness Detection
```javascript
function getEuclideanDistance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export function calculateEyeAspectRatio(eyeLandmarks) {
  // 6 eye points: p1=corner, p2=top_left, p3=top_right, p4=corner, p5=bottom_right, p6=bottom_left
  const vertical1 = getEuclideanDistance(eyeLandmarks[1], eyeLandmarks[5]);
  const vertical2 = getEuclideanDistance(eyeLandmarks[2], eyeLandmarks[4]);
  const horizontal = getEuclideanDistance(eyeLandmarks[0], eyeLandmarks[3]);
  return (vertical1 + vertical2) / (2.0 * horizontal);
}
// Blink criterion: EAR drops below 0.22 and recovers above 0.28 within 1 second.
```

### D. Server-Side Euclidean Distance Matching
```javascript
export function calculateEuclideanDistance(descriptorA, descriptorB) {
  let sum = 0;
  for (let i = 0; i < descriptorA.length; i++) {
    const diff = descriptorA[i] - descriptorB[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function findBestFaceMatch(liveDescriptor, enrolledDescriptors, threshold = 0.50) {
  let minDistance = Infinity;
  for (const enrolled of enrolledDescriptors) {
    const distance = calculateEuclideanDistance(liveDescriptor, enrolled);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }
  return {
    isMatch: minDistance < threshold,
    distance: minDistance,
    threshold
  };
}
```

---

## 3. Prioritized User Stories (BUILD-GUIDE Rows 12.1 to 12.9)

### User Story 1 (ID 12.1) - Neural Model Loading & Runtime Hook (Priority: P1)
**Description**: As an Employee or HR Manager, I want neural network weights (`tiny_face_detector`, `face_landmark_68`, `face_recognition`) to preload reliably from `/public/models/` via a custom React hook `useFaceApi` so that face detection and descriptor extraction are instantly ready when I open the camera.

- **Why this priority**: Prerequisite for every facial feature; without models in memory, detection cannot function.
- **Independent Test**: Navigate to `/attendance/face/enroll`; verify model status turns `isLoaded: true` within 3 seconds without network errors.

**Role-Wise Acceptance Criteria**:
1. **Super Admin / HR Manager**:
   - **Given** an admin opening `/attendance/face/enrollments` or camera test,
   - **When** the page mounts,
   - **Then** `useFaceApi` loads weights from `/models` and exposes `{ isLoaded: true, isLoading: false, error: null }`.
2. **Employee**:
   - **Given** an employee opening `/attendance/my` or `/attendance/face/enroll`,
   - **When** camera component renders,
   - **Then** a clean skeleton/spinner shows "Loading Face AI Engine..." until models are initialized.
3. **Department Manager**:
   - Same behavior as Employee when accessing their self-service face punch view.

---

### User Story 2 (ID 12.2) - Multi-Angle Face Enrollment (Priority: P1)
**Description**: As an Employee, I want to capture 3 to 5 distinct face snapshots (frontal, slight left, slight right) during an initial enrollment wizard so that high-quality 128-d descriptors are computed and submitted to HR for approval.

- **Why this priority**: Required to establish the biometric baseline for attendance matching.
- **Independent Test**: Employee captures 3 photos on `/attendance/face/enroll`, verifies descriptors are extracted, submits `POST /api/v1/attendance/face/enroll`, and receives status `"pending"`.

**Role-Wise Acceptance Criteria**:
1. **Employee**:
   - **Given** an authenticated employee with no approved enrollment on `/attendance/face/enroll`,
   - **When** they guide their face through 3 distinct frames and click "Submit Enrollment",
   - **Then** `POST /api/v1/attendance/face/enroll` persists `{ faceDescriptors: [[Number]], enrollmentPhotoUrl, status: 'pending' }` on their `User` record, and UI displays *"Enrollment submitted. Awaiting HR approval."*
2. **HR Manager / Super Admin**:
   - **Given** an HR Manager viewing the employee's profile,
   - **When** enrollment is submitted,
   - **Then** the employee's face status indicates `"Pending Approval"`.
3. **Department Manager**:
   - Can view enrollment status badge (`Enrolled - Pending Approval`) in their team directory.

---

### User Story 3 (ID 12.3) - HR Enrollment Approval & Re-enrollment Lifecycle (Priority: P1)
**Description**: As an HR Manager or Super Admin, I want a dedicated management interface (`/attendance/face/enrollments`) to review submitted face enrollment photos, approve valid enrollments, or reject/delete bad photos with a mandatory reason so that only verified employees can punch.

- **Why this priority**: Critical security gate against identity fraud or poor-quality photo enrollments.
- **Independent Test**: HR reviews pending enrollment, clicks "Approve" (`PATCH /api/v1/attendance/face/:userId/approve`), verifies status transitions to `"approved"`; clicks "Reset / Re-enroll" (`DELETE /api/v1/attendance/face/:userId`), verifies descriptors are cleared.

**Role-Wise Acceptance Criteria**:
1. **Super Admin / HR Manager**:
   - **Given** an HR Manager with `attendance.face.manage` permission on `/attendance/face/enrollments`,
   - **When** they click "Approve" on a pending enrollment,
   - **Then** backend updates `user.faceEnrollment.status = 'approved'`, `approvedBy = req.user._id`, and sends a real-time notification to the employee.
   - **When** they click "Reject / Request Re-enrollment" with reason *"Photo too blurry"*,
   - **Then** `user.faceEnrollment` is cleared or marked `'rejected'`, and the employee is prompted to re-enroll.
2. **Department Manager**:
   - **Given** a Department Manager without `attendance.face.manage`,
   - **When** attempting to access `/attendance/face/enrollments` or send approval PATCH requests,
   - **Then** access is denied with HTTP 403 Forbidden.
3. **Employee**:
   - Cannot view or approve any enrollment records; receives alert when HR approves their enrollment.

---

### User Story 4 (ID 12.4) - Anti-Spoofing Liveness Verification (Priority: P1)
**Description**: As an Employee, I want the camera punch interface to verify that I am a live physical human through an organic blink detection test before taking the punch snapshot, so that photos or video replays cannot mark proxy attendance.

- **Why this priority**: Prevents the single most common facial recognition attack (holding up a photo or tablet).
- **Independent Test**: Display a static photo in front of camera $\rightarrow$ system waits indefinitely and prompts "Please blink naturally"; organic blink occurs $\rightarrow$ liveness check succeeds with green indicator.

**Role-Wise Acceptance Criteria**:
1. **Employee**:
   - **Given** an employee opening the Face Punch modal,
   - **When** camera detects a face without blinking,
   - **Then** UI shows an animated eye icon with instruction *"Please blink to confirm you are live"*.
   - **When** landmark tracking registers Eye Aspect Ratio (EAR) dropping below 0.22 and rebounding above 0.28,
   - **Then** liveness status toggles to `isLive: true`, unlocks the punch button (or triggers auto-capture), and displays a green checkmark.
2. **Super Admin / HR Manager**:
   - Can inspect whether a recorded punch passed client liveness in attendance audit details.

---

### User Story 5 (ID 12.5) - Face Scan Attendance Punch (Check-In & Check-Out) (Priority: P1)
**Description**: As an Employee, I want to look into my camera and mark Check-In or Check-Out via facial recognition so that my live face descriptor is compared against my approved enrolled descriptors and attendance is recorded if distance is below threshold.

- **Why this priority**: Core primary function of Module M12.
- **Independent Test**: Enrolled employee looks at camera, blinks, clicks Punch $\rightarrow$ backend validates descriptor distance < 0.50, marks `Attendance` with `source: 'face'`, saves punch snapshot, updates PunchCardWidget to Clocked-In.

**Role-Wise Acceptance Criteria**:
1. **Employee**:
   - **Given** an approved enrolled employee on `/attendance/my`,
   - **When** they complete liveness and punch with matching face,
   - **Then** `POST /api/v1/attendance/check-in` or `check-out` receives `{ source: 'face', liveDescriptor, snapshotUrl }`, verifies Euclidean distance < threshold, saves record with `source: 'face'`, and renders success toast.
2. **Department Manager / HR Manager**:
   - Sees attendance row flagged with `source: 'face'` badge and thumbnail preview in Daily Attendance tables.

---

### User Story 6 (ID 12.6) - Face Recognition Settings & Threshold Tuning (Priority: P2)
**Description**: As a Super Admin, I want to configure the global face recognition settings in the Settings tab (enable/disable face attendance, adjust Euclidean distance threshold from 0.35 to 0.65, toggle mandatory liveness) so that company security policy can be tuned.

- **Why this priority**: Administrative control over false-acceptance vs false-rejection rate.
- **Independent Test**: Super Admin changes threshold to 0.45 in `/settings`; backend verifies subsequent face checks use 0.45.

**Role-Wise Acceptance Criteria**:
1. **Super Admin**:
   - **Given** Super Admin on `/settings` (Attendance Rules),
   - **When** they update `faceAttendance: { isEnabled: true, matchThreshold: 0.45, requireLiveness: true }`,
   - **Then** settings are saved and reflected across all punch evaluations.
2. **HR Manager**:
   - Can view current settings in read-only mode (or edit if granted `settings.manage`).
3. **Department Manager / Employee**:
   - Setting controls are hidden; if `faceAttendance.isEnabled === false`, the "Face Punch" button is cleanly hidden on self-service pages.

---

### User Story 7 (ID 12.7) - Failed & Suspicious Attempts Logging (Priority: P2)
**Description**: As an HR Manager or Super Admin, I want any face punch attempt that exceeds the distance threshold or fails liveness to be logged as a flagged punch with the captured photo snapshot, so that unauthorized proxy attempts are auditable.

- **Why this priority**: Provides security visibility into fraud attempts.
- **Independent Test**: Impersonator attempts face punch $\rightarrow$ backend rejects with HTTP 400 (`"Face verification failed: confidence below threshold"`), creates flagged log in `Attendance` with `isFlagged: true`, `flagReason: 'face_match_failed'`, and saves the snapshot.

**Role-Wise Acceptance Criteria**:
1. **HR Manager / Super Admin**:
   - **Given** an HR Manager on `/attendance/flagged`,
   - **When** a face mismatch punch occurs,
   - **Then** a new row appears with employee name, timestamp, failed distance score, captured photo thumbnail, and action buttons to "Dismiss" or "Investigate".
2. **Employee**:
   - Sees clear message: *"Face verification failed. If this is an error, please try in better lighting or request manual attendance."*

---

### User Story 8 (ID 12.8) - Fallback Manual Correction Request (Priority: P2)
**Description**: As an Employee, I want a direct 1-click fallback to submit a Missed-Punch / Attendance Correction Request (integrated with Module M5 Feature 5.12) when face recognition fails due to camera malfunction or lighting issues, so that I am not penalized for technical difficulties.

- **Why this priority**: Ensures business continuity when environmental conditions (poor lighting, camera failure) prevent biometric match.
- **Independent Test**: Face verification fails $\rightarrow$ Modal displays "Request Manual Correction" button $\rightarrow$ Clicking opens pre-filled correction request modal for today's punch.

**Role-Wise Acceptance Criteria**:
1. **Employee**:
   - **Given** a failed face punch,
   - **When** employee clicks "Request Manual Attendance Correction",
   - **Then** the existing M5 correction modal opens pre-filled with the current timestamp and reason `"Face verification failure"`.
2. **Department Manager / HR Manager**:
   - Receives standard correction approval request in their pending approvals queue per M5 workflow.

---

### User Story 9 (ID 12.9) - Scoped Manager View for Team Flagged Snapshots (Priority: P2)
**Description**: As a Department Manager, I want to view flagged punch snapshots and face attempts exclusively for members of my assigned department/team, so that I can resolve discrepancies without accessing confidential enterprise-wide biometric logs.

- **Why this priority**: Enforces principle of least privilege and data scoping (`team` / `department`).
- **Independent Test**: Manager of "Engineering" logs in $\rightarrow$ `/attendance/flagged` displays only Engineering staff flagged face punches; attempting to query an HR or Sales punch returns HTTP 403 or empty array.

**Role-Wise Acceptance Criteria**:
1. **Department Manager**:
   - **Given** Department Manager on `/attendance/flagged`,
   - **When** query executes,
   - **Then** backend filters `departmentId = manager.departmentId`, showing only their direct/indirect reports' photos.
2. **HR Manager / Super Admin**:
   - Sees flagged punches for `all` departments with filter dropdown.
3. **Employee**:
   - Can only see their own punch status (`own` scope).

---

## 4. API Endpoints & RBAC Matrix

| Endpoint | Method | Permission | Scope | Description |
| :--- | :---: | :--- | :---: | :--- |
| `/api/v1/attendance/face/enroll` | `POST` | `attendance.mark` | `own` | Submits 3-5 face descriptors + enrollment photo for HR approval |
| `/api/v1/attendance/face/status` | `GET` | `attendance.mark` | `own` | Gets current user's face enrollment status (`none`, `pending`, `approved`, `rejected`) |
| `/api/v1/attendance/face/enrollments` | `GET` | `attendance.face.manage` | `all` | HR list of all face enrollments with status filter |
| `/api/v1/attendance/face/:userId/approve`| `PATCH` | `attendance.face.manage` | `all` | HR approves user's face enrollment |
| `/api/v1/attendance/face/:userId/reject` | `PATCH` | `attendance.face.manage` | `all` | HR rejects enrollment with reason |
| `/api/v1/attendance/face/:userId` | `DELETE`| `attendance.face.manage` | `all` | HR deletes/resets face enrollment for re-enrolling |
| `/api/v1/attendance/check-in` | `POST` | `attendance.mark` | `own` | Extends check-in to accept `source: 'face'`, `liveDescriptor`, `snapshotUrl` |
| `/api/v1/attendance/check-out` | `POST` | `attendance.mark` | `own` | Extends check-out to accept `source: 'face'`, `liveDescriptor`, `snapshotUrl` |
| `/api/v1/attendance/flagged` | `GET` | `attendance.view` | `own` / `team` / `all` | Scoped list of flagged punches (including face mismatches) |

---

## 5. Coverage Matrix: BUILD-GUIDE ID to User Story

| BUILD-GUIDE ID | Feature Description | Priority | User Story | Target Deliverables |
| :---: | :--- | :---: | :---: | :--- |
| **12.1** | Neural Models Load | P1 | **User Story 1** | `public/models/`, `frontend/src/features/attendance/hooks/useFaceApi.js` |
| **12.2** | Enrollment (3–5 photos) | P1 | **User Story 2** | `FaceEnrollPage.jsx`, `POST /attendance/face/enroll`, `user.faceEnrollment` |
| **12.3** | HR Approval / Re-enroll | P1 | **User Story 3** | `FaceEnrollmentsPage.jsx`, `PATCH /face/:userId/approve`, `DELETE /face/:userId` |
| **12.4** | Liveness Check | P1 | **User Story 4** | `FaceCheckInModal.jsx`, EAR landmark blink detection |
| **12.5** | Face Check-In & Distance Matching | P1 | **User Story 5** | Euclidean distance calculation, `source: 'face'`, snapshot storage |
| **12.6** | Threshold & On/Off Settings | P2 | **User Story 6** | `AttendanceRulesForm.jsx`, `Setting.faceAttendance` (`matchThreshold`, `isEnabled`) |
| **12.7** | Failed/Suspicious Attempts Log | P2 | **User Story 7** | `FlaggedPunchesPage.jsx` photo snapshot review, `flagReason: 'face_match_failed'` |
| **12.8** | Fallback Manual Correction Request | P2 | **User Story 8** | Integration with M5 correction modal (`5.12`) upon biometric failure |
| **12.9** | Manager Scoped Flagged Snapshots | P2 | **User Story 9** | `departmentId` scoping on flagged punches for Department Managers |

