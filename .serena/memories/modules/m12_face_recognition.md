# Module M12: Face Recognition Attendance

## Overview
Implemented client-side facial landmark detection and descriptor extraction using `@vladmandic/face-api`, coupled with server-side Euclidean distance template matching ($d < 0.50$), active blink liveness detection (EAR), and managerial enrollment review.

## Data Models
1. **User Schema Extension (`user.model.js`)**:
   - `faceEnrollment`:
     - `status`: enum `['none', 'pending', 'approved', 'rejected']`
     - `descriptors`: `[[Number]]` (3 to 5 arrays of 128 floating-point numbers)
     - `enrollmentPhotoUrl`: String (base64 or storage URL)
     - `enrolledAt`: Date
     - `approvedAt`: Date
     - `approvedBy`: ObjectId ref 'User'
     - `rejectionReason`: String

2. **Attendance Model Extension (`attendance.model.js`)**:
   - `source`: Extended to include `'face'`
   - `snapshotUrl`: String (stores face capture at time of punch)
   - `confidenceDistance`: Number (Euclidean distance to closest template)

3. **Setting (`setting.model.js`)**:
   - Key `'faceAttendance'`: `{ isEnabled: Boolean, matchThreshold: Number (default 0.50), requireLiveness: Boolean }`

## APIs & Endpoints
- `POST /api/v1/attendance/face/enroll`: Submit 3-5 face descriptors (Permission: `attendance.mark: own`).
- `GET /api/v1/attendance/face/status`: Fetch user biometric enrollment state (Permission: `attendance.mark: own`).
- `GET /api/v1/attendance/face/enrollments`: Paginated HR review queue with regex-escaped search (Permission: `attendance.face.manage: all`).
- `PATCH` & `POST /api/v1/attendance/face/:userId/approve` & `/attendance/face/enrollments/:userId/approve`: HR approve enrollment.
- `PATCH` & `POST /api/v1/attendance/face/:userId/reject` & `/attendance/face/enrollments/:userId/reject`: HR reject with mandatory reason.
- `DELETE` & `POST /api/v1/attendance/face/:userId` & `/attendance/face/enrollments/:userId/reset`: Administrative purge for re-enrollment.
- `POST /api/v1/attendance/check-in` & `check-out`: Face verification punch; failed attempts ($d \ge 0.50$) log `status: 'absent'`, `isFlagged: true`, `flagReason: 'face_match_failed'`.

## Permissions
- `attendance.face.manage`: Subject `'Attendance'`, Scopes `['all', 'department']`. Assigned to `Super Admin` and `HR Manager`.
- `attendance.mark`: Scope `own`. Used for self-service enrollment and camera punch.

## Architecture & Security Decisions
- **Biometric Vector Hardening**: Coordinates strictly enforced as finite numbers (`Number.isFinite`), length 128, bounded array length 3-5 to resist vector poisoning and memory DoS.
- **Snapshot Payload Cap**: Snapshot and enrollment photos capped at 1.5MB and validated against `data:image/(jpeg|jpg|png|webp);base64,`.
- **Anti-Spoofing & Liveness**: Active blink cycle tracking via Eye Aspect Ratio (EAR) before triggering automatic biometric punch.
- **Flagged Punches Queue**: Failed biometric attempts display photo snapshots and confidence scores in `FlaggedPunchesPage.jsx`. Approving a flagged record regularizes attendance to `'present'`.
