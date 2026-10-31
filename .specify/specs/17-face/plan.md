# Technical Architecture Plan: Module M12 — Face Recognition Attendance

**Feature Branch**: `feature/17-face`  
**Specification**: [`.specify/specs/17-face/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/17-face/spec.md)  
**Governance**: `docs/TECH-SPEC.md` (Sections 3, 4, 5, 6, 8) & `docs/MODULES.md` (Section 6)  
**Created**: October 31, 2026  
**Status**: Ready for Implementation  

---

## 1. System Architecture & Component Responsibilities

Module M12 introduces an on-device neural inference pipeline using `@vladmandic/face-api` (TensorFlow.js) coupled with a server-side Euclidean vector matching engine in Node.js/Express.

```
+───────────────────────────────────────────────────────────────────────────────────────────────────+
|                                    1. CLIENT FRONTEND PIPELINE                                    |
|                                                                                                   |
|  useFaceApi Hook (public/models)                                                                  |
|  ├── tinyFaceDetector (Lightweight 320x320 face bounding box)                                     |
|  ├── faceLandmark68Net (68 coordinates for eyes, nose, mouth, jawline)                             |
|  └── faceRecognitionNet (Outputs 128-d Float32Array embedding vector)                             |
|                                                                                                   |
|  Liveness Detection Engine (Client-side anti-spoof)                                               |
|  └── Eye Aspect Ratio (EAR) = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)                          |
|      Blink cycle triggers: EAR drops below 0.22, then recovers > 0.28                             |
+───────────────────────────────────────────────────────────────────────────────────────────────────+
                                             │
                       HTTPS REST (JSON + Base64 Snapshot)
                                             ▼
+───────────────────────────────────────────────────────────────────────────────────────────────────+
|                                    2. EXPRESS BACKEND PIPELINE                                    |
|                                                                                                   |
|  Routes (/api/v1/attendance/face/* & /check-in)                                                   |
|  ├── authenticate (JWT access token via httpOnly cookie or Bearer header)                         |
|  ├── validate (Zod runtime schemas: enrollFaceSchema, facePunchSchema, approveEnrollmentSchema)   |
|  └── checkPermission (CASL RBAC: attendance.mark, attendance.face.manage, scoped queries)         |
|                                                                                                   |
|  Attendance & Face Verification Service                                                           |
|  ├── Multi-Vector Euclidean Distance Matcher: d(u, v) = sqrt(sum((u[i] - v[i])^2))               |
|  ├── Threshold Validator: min(d) < setting.faceAttendance.matchThreshold (default 0.50)           |
|  └── Auto-Flagging Engine: Mismatches/spoofs create flagged attendance records for HR review      |
+───────────────────────────────────────────────────────────────────────────────────────────────────+
                                             │
                                             ▼
+───────────────────────────────────────────────────────────────────────────────────────────────────+
|                                        3. PERSISTENCE LAYER                                       |
|                                                                                                   |
|  MongoDB Collections:                                                                             |
|  ├── users: faceEnrollment { status, descriptors: [[Number]], enrollmentPhotoUrl, approvedBy }   |
|  ├── attendances: source: 'face', snapshotUrl, confidenceDistance, isFlagged, flagReason         |
|  ├── settings: faceAttendance { isEnabled, matchThreshold, requireLiveness }                      |
|  └── auditlogs: enrollment approval, rejection, and manual resets with diff audit               |
+───────────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Exact Files & Directory Mapping

### Backend Layer (`backend/`)
1. **Model Modifications**:
   - [`backend/src/models/user.model.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/models/user.model.js): Add `faceEnrollment` schema (status `enum: ['none', 'pending', 'approved', 'rejected']`, `descriptors: [[Number]]`, `enrollmentPhotoUrl`, `enrolledAt`, `approvedAt`, `approvedBy`, `rejectionReason`).
   - [`backend/src/models/attendance.model.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/models/attendance.model.js): Extend `source` enum with `'face'`; add `snapshotUrl` (string), `confidenceDistance` (number), and extend `flagReason` enum with `'face_match_failed'`, `'liveness_failed'`, `'face_not_enrolled'`.
2. **Validation Layer**:
   - [`backend/src/modules/attendance/attendance.validation.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/attendance/attendance.validation.js):
     - `enrollFaceSchema`: Validates `descriptors` (array of 3 to 5 arrays of 128 numbers) and `enrollmentPhoto` (base64 image data URI).
     - `faceApprovalSchema`: Validates `rejectionReason` (optional for approve, required for reject).
     - Extend `checkInSchema` and `checkOutSchema` to accept optional `liveDescriptor: z.array(z.number()).length(128)`, `snapshot: z.string().optional()`.
3. **Service Layer**:
   - [`backend/src/modules/attendance/attendance.service.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/attendance/attendance.service.js):
     - `enrollFace(userId, { descriptors, enrollmentPhotoUrl })`: Saves pending enrollment.
     - `getFaceEnrollmentStatus(userId)`: Returns current status and photo.
     - `getFaceEnrollments(filters, pagination)`: HR query with status filter and employee details.
     - `approveFaceEnrollment(targetUserId, adminUserId)`: Marks status `approved`.
     - `rejectFaceEnrollment(targetUserId, adminUserId, reason)`: Marks status `rejected`.
     - `resetFaceEnrollment(targetUserId, adminUserId, reason)`: Resets to `none` and clears vectors.
     - `verifyFacePunch(user, liveDescriptor, snapshotUrl)`: Computes Euclidean distance against user's approved descriptors, checks threshold from Settings, logs flagged punch on mismatch.
4. **Controller & Routes Layer**:
   - [`backend/src/modules/attendance/attendance.controller.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/attendance/attendance.controller.js): Add handlers for enroll, status, enrollments list, approve, reject, reset.
   - [`backend/src/modules/attendance/attendance.routes.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/attendance/attendance.routes.js): Register routes with rate limiting, authentication, validation, and CASL permission checks.
5. **Permissions & Seeds**:
   - [`backend/src/shared/permissions.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/shared/permissions.js): Add `attendance.face.manage` permission.
   - [`backend/src/seed/roles.seed.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/seed/roles.seed.js): Grant `attendance.face.manage` to `Super Admin` and `HR Manager`.

### Frontend Layer (`frontend/`)
1. **Public Model Weights**:
   - `frontend/public/models/`: Neural weights for `tiny_face_detector`, `face_landmark_68`, and `face_recognition`.
2. **API Hooks**:
   - [`frontend/src/features/attendance/attendanceApi.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/attendanceApi.js): Add RTK Query mutations & queries: `enrollFace`, `getFaceStatus`, `getFaceEnrollments`, `approveFaceEnrollment`, `rejectFaceEnrollment`, `resetFaceEnrollment`.
3. **Hooks & Utilities**:
   - `frontend/src/features/attendance/hooks/useFaceApi.js`: Handles loading models from `/models`, initialization state, camera stream binding, and face detection loop.
   - `frontend/src/features/attendance/utils/livenessDetector.js`: Real-time EAR computation for eye blink detection.
4. **Components & Modals**:
   - `frontend/src/features/attendance/components/FaceCheckInModal.jsx`: Camera scanner modal with live liveness guidance, auto-capture upon blink, descriptor extraction, and check-in/out submission.
   - `frontend/src/features/attendance/components/LivenessFeedback.jsx`: Visual visual eye icon / bounding box indicator showing live status.
   - `frontend/src/features/attendance/components/EnrollmentCaptureWizard.jsx`: 3-frame capture helper (Front, Left, Right) with visual progress dots.
5. **Pages**:
   - `frontend/src/features/attendance/pages/FaceEnrollPage.jsx`: Employee self-service wizard to enroll their face.
   - `frontend/src/features/attendance/pages/FaceEnrollmentsPage.jsx`: HR administration portal to review pending face photos and approve/reject with search and filters.
   - `frontend/src/features/attendance/pages/FlaggedPunchesPage.jsx`: Update to support reviewing face match failures with captured photo snapshots.
   - [`frontend/src/features/attendance/pages/MyAttendancePage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/attendance/pages/MyAttendancePage.jsx) & `PunchCardWidget.jsx`: Add "Face Punch" action button.
   - [`frontend/src/features/settings/components/AttendanceRulesForm.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/settings/components/AttendanceRulesForm.jsx): Add Face Recognition settings card (enable toggle, threshold slider 0.35-0.65, require liveness).

---

## 3. Mermaid Visual Architecture Diagrams

### Diagram 1: System Flow (Client $\rightarrow$ API $\rightarrow$ Service $\rightarrow$ MongoDB)
```mermaid
flowchart TD
    subgraph Client["Frontend Client (Browser / Camera)"]
        Cam["Webcam Video Stream"]
        FaceApi["@vladmandic/face-api (TensorFlow.js)"]
        Liveness["Eye Aspect Ratio (EAR) Blink Check"]
        Desc["128-d Vector Descriptor + Photo Snapshot"]
        
        Cam --> FaceApi
        FaceApi --> Liveness
        Liveness -->|"Blink Confirmed"| Desc
    end

    subgraph API["Express API Gateway"]
        AuthMid["authenticate (JWT Cookie)"]
        ValMid["validate (Zod Schemas)"]
        PermMid["checkPermission (CASL RBAC)"]
        RateLim["Rate Limiter (anti-flood)"]
        
        Desc -->|"POST /attendance/check-in"| RateLim
        RateLim --> AuthMid
        AuthMid --> ValMid
        ValMid --> PermMid
    end

    subgraph Service["Attendance & Face Service"]
        Euclid["Euclidean Distance Matcher: d(live, enrolled)"]
        ThreshCheck{"min(d) < Match Threshold?"}
        ShiftEngine["Shift & Late Rules Calculator"]
        FlagEngine["Flagged Punch Logger"]
        
        PermMid --> Euclid
        Euclid --> ThreshCheck
        ThreshCheck -->|"Yes (Matched)"| ShiftEngine
        ThreshCheck -->|"No (Failed)"| FlagEngine
    end

    subgraph DB["MongoDB Database"]
        UCol[("users Collection\n(approved descriptors)")]
        ACol[("attendances Collection\n(source: 'face', snapshotUrl)")]
        SCol[("settings Collection\n(faceAttendance config)")]
        
        UCol -.->|"Read approved vectors"| Euclid
        SCol -.->|"Read threshold"| ThreshCheck
        ShiftEngine -->|"Write Present/Late Record"| ACol
        FlagEngine -->|"Write Flagged Record"| ACol
    end

    classDef client fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;
    classDef api fill:#fef3c7,stroke:#d97706,stroke-width:2px;
    classDef srv fill:#dcfce7,stroke:#16a34a,stroke-width:2px;
    classDef db fill:#f3e8ff,stroke:#9333ea,stroke-width:2px;
    
    class Cam,FaceApi,Liveness,Desc client;
    class AuthMid,ValMid,PermMid,RateLim api;
    class Euclid,ThreshCheck,ShiftEngine,FlagEngine srv;
    class UCol,ACol,SCol db;
```

---

### Diagram 2: Entity-Relationship Diagram (ERD)
```mermaid
erDiagram
    USER ||--o{ ATTENDANCE : "marks"
    USER ||--o| FACE_ENROLLMENT : "contains embedded"
    SETTING ||--|| FACE_CONFIG : "defines"
    USER ||--o{ AUDIT_LOG : "triggers/reviews"

    USER {
        ObjectId _id PK
        string email
        string employeeId FK
        string[] roles
        object faceEnrollment "embedded"
        boolean isActive
        boolean isDeleted
    }

    FACE_ENROLLMENT {
        string status "none | pending | approved | rejected"
        number[][] descriptors "3 to 5 arrays of 128 floats"
        string enrollmentPhotoUrl "reference photo"
        date enrolledAt
        date approvedAt
        ObjectId approvedBy FK
        string rejectionReason
    }

    ATTENDANCE {
        ObjectId _id PK
        ObjectId employeeId FK
        date date "YYYY-MM-DD"
        date checkIn
        date checkOut
        string source "face | qr | gps | web"
        string snapshotUrl "punch photo"
        number confidenceDistance "Euclidean score"
        boolean isFlagged
        string flagReason "face_match_failed | liveness_failed"
        boolean flagResolved
    }

    FACE_CONFIG {
        boolean isEnabled "default true"
        number matchThreshold "default 0.50 (0.35-0.65)"
        boolean requireLiveness "default true"
        number minEnrollmentPhotos "default 3"
        number maxEnrollmentPhotos "default 5"
    }

    AUDIT_LOG {
        ObjectId _id PK
        ObjectId userId FK
        string action "face.enroll | face.approve | face.reset"
        object diff "before and after state"
        date createdAt
    }
```

---

### Diagram 3: Main Flow Sequence Diagram (Liveness $\rightarrow$ Vector Match $\rightarrow$ Punch)
```mermaid
sequenceDiagram
    autonumber
    actor Emp as Employee
    participant UI as FaceCheckInModal (React)
    participant TF as @vladmandic/face-api (WASM)
    participant API as Express API
    participant Srv as Attendance Service
    participant DB as MongoDB

    Emp->>UI: Opens "Face Punch" on /attendance/my
    UI->>TF: Initializes webcam video feed
    UI->>TF: detectSingleFace().withFaceLandmarks()
    Note over UI,TF: Active Liveness Loop
    TF-->>UI: 68 Landmarks emitted
    UI->>UI: Calculate Eye Aspect Ratio (EAR)
    Emp->>UI: Naturally blinks eyes (EAR < 0.22 -> > 0.28)
    UI->>UI: Liveness verified (isLive = true)
    
    UI->>TF: withFaceDescriptor() -> extracts 128 floats
    UI->>UI: Capture camera canvas snapshot (Base64)
    UI->>API: POST /api/v1/attendance/check-in { source: 'face', liveDescriptor, snapshot }
    
    API->>API: authenticate + validate + checkPermission('attendance.mark', 'own')
    API->>Srv: processPunch(user, 'check-in', data)
    
    Srv->>DB: Query user.faceEnrollment & settings.faceAttendance
    DB-->>Srv: Approved descriptors & threshold (0.50)
    
    alt User Not Enrolled or Pending
        Srv-->>API: 400 Bad Request: "Face enrollment not approved by HR"
        API-->>UI: Error toast: "Please complete face enrollment first"
    else User Approved
        Srv->>Srv: Calculate Euclidean distance against each enrolled vector
        Note over Srv: minDistance = min(sqrt(sum((u[i] - v[i])^2)))
        
        alt minDistance < threshold (e.g. 0.38 < 0.50) -> MATCH
            Srv->>DB: Create/Update Attendance record (source: 'face', confidenceDistance: 0.38, snapshotUrl)
            Srv-->>API: 200 OK: "Punch successful! Welcome."
            API-->>UI: Success toast & green checkmark
            UI->>UI: PunchCardWidget updates to Clocked-In
        else minDistance >= threshold (e.g. 0.68 >= 0.50) -> MISMATCH
            Srv->>DB: Create Flagged Attendance (isFlagged: true, flagReason: 'face_match_failed', snapshotUrl)
            Srv-->>API: 400 Bad Request: "Face verification failed"
            API-->>UI: Rejection with "Request manual correction" fallback button
        end
    end
```

---

## 4. Endpoints, Permissions & Scope Specifications

| Endpoint | Method | Permission | Scope | Request Body / Params | Expected Response |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `POST /api/v1/attendance/face/enroll` | `POST` | `attendance.mark` | `own` | `{ descriptors: number[][], photo: string }` | `{ success: true, message: "Face enrollment submitted for HR approval" }` |
| `GET /api/v1/attendance/face/status` | `GET` | `attendance.mark` | `own` | `None` | `{ success: true, data: { status, enrollmentPhotoUrl, enrolledAt } }` |
| `GET /api/v1/attendance/face/enrollments` | `GET` | `attendance.face.manage` | `all` | Query: `?status=pending&page=1&limit=20` | `{ success: true, data: [usersWithEnrollment], meta: { ... } }` |
| `PATCH /api/v1/attendance/face/:userId/approve` | `PATCH` | `attendance.face.manage` | `all` | `None` | `{ success: true, message: "Face enrollment approved successfully" }` |
| `PATCH /api/v1/attendance/face/:userId/reject` | `PATCH` | `attendance.face.manage` | `all` | `{ reason: string }` | `{ success: true, message: "Face enrollment rejected" }` |
| `DELETE /api/v1/attendance/face/:userId` | `DELETE` | `attendance.face.manage` | `all` | `{ reason: string }` | `{ success: true, message: "Face enrollment cleared for re-enrolling" }` |
| `POST /api/v1/attendance/check-in` | `POST` | `attendance.mark` | `own` | `{ source: 'face', liveDescriptor, snapshot }` | `{ success: true, data: attendanceRecord, message: "Clock-In successful" }` |
| `POST /api/v1/attendance/check-out` | `POST` | `attendance.mark` | `own` | `{ source: 'face', liveDescriptor, snapshot }` | `{ success: true, data: attendanceRecord, message: "Clock-Out successful" }` |

### New Permission Addition Step:
In [`backend/src/shared/permissions.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/shared/permissions.js):
```javascript
{
  action: 'attendance.face.manage',
  label: 'Manage Face Recognition Attendance',
  description: 'Review pending face enrollments, approve/reject photo embeddings, and inspect flagged face punch snapshots.',
  module: 'attendance',
  subject: 'Attendance',
  allowedScopes: ['all', 'department']
}
```
Seeded to `Super Admin` and `HR Manager` in [`backend/src/seed/roles.seed.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/seed/roles.seed.js).

