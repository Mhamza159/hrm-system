# Phase 40: Attendance Module — Face Enrollment, HR Notifications & WFH Workflow Fixes — Research & Root-Cause Audit

**Date:** 2026-11-23  
**Status:** COMPLETE & VERIFIED  
**Target:** Attendance Module (M5), Face Recognition Attendance (M12), Centralized Notification Service (M8), and Settings (M2).

---

## 1. Executive Summary & Audit Overview

A comprehensive architectural, technical, functional, and code-trace audit was conducted across the HRMS Attendance Module to address four reported operational issues:
1. **Face Punch Without Face Enrollment:** Employees without enrolled faces were able to open the face scanner or experienced hanging neural initialization without a clear, actionable requirement modal. Direct API requests could produce ambiguous error flows.
2. **Face Enrollment HR Notification Missing:** When an employee submitted face enrollment, the enrollment record was created, but zero notification logic existed in `enrollFace` (`backend/src/modules/attendance/attendance.service.js`), leaving HR unaware of pending reviews.
3. **WFH Same-Day Application Permitted:** The Work From Home (WFH) workflow did not enforce the mandatory "at least one day in advance" business rule; the frontend defaulted to today's date with no `min` constraint, and backend `applyWFH` lacked advance-notice validation.
4. **WFH Submission HR Notification Delivery:** Notification recipient resolution for WFH submissions did not reliably reach all HR recipients, notification links pointed to generic `/attendance/team` rather than the specific WFH review tab (`/attendance/team?tab=wfh`), and asynchronous notification promises lacked robust error handling.

---

## 2. Root Cause Analysis by Requirement

### Issue 1: Face Punch Without Face Enrollment
- **Backend Trace:**
  - In `backend/src/modules/attendance/attendance.service.js`, `checkIn` invokes `verifyFacePunch` if `source === 'face'` or `liveDescriptor` is present.
  - While `verifyFacePunch` checks `dbUser.faceEnrollment.status !== 'approved'`, it returned a generic error message rather than a structured error payload with a distinct code (`FACE_ENROLLMENT_REQUIRED`).
  - If a user invoked check-in without sending `liveDescriptor` while specifying `source: 'face'`, edge cases allowed inconsistent failure modes.
- **Frontend Trace:**
  - In `frontend/src/features/attendance/components/FaceCheckInModal.jsx`, `useGetFaceStatusQuery` fetched `enrollmentStatus`.
  - When `enrollmentStatus !== 'approved'`, the component set `isEngineReady = false`, keeping the user stuck on the cybernetic pre-loader screen: `"Initializing Biometric Vision: Loading neural weights into browser GPU cache..."`.
  - The optical sensor/camera stream was needlessly initiated, and no dedicated, accessible modal informed the employee that Face Enrollment was required before attempting Face Punch.
- **Resolution Strategy:**
  - Backend: Introduce strict pre-validation in `checkIn` and `verifyFacePunch`. Throw `ApiError(400, 'Face enrollment is required before using Face Punch...', [{ code: 'FACE_ENROLLMENT_REQUIRED', status }])`. Prevent any attendance or presence records.
  - Frontend: Create a dedicated, centered `FaceEnrollmentRequiredModal.jsx` (or embedded modal dialog in `FaceCheckInModal.jsx` and `PunchCardWidget.jsx`). If face is not enrolled or pending approval, immediately display the "Face Enrollment Required" modal with actions to "Complete Face Enrollment" (navigating to `/attendance/face-enrollment`) and "Cancel". Never acquire the camera or run neural models when not enrolled.

---

### Issue 2: Face Enrollment — HR Notification Not Triggered
- **Backend Trace:**
  - Examined `enrollFace(userId, { descriptors, photo })` in `backend/src/modules/attendance/attendance.service.js` (lines 2738–2810).
  - The function successfully validates 128-dimensional vectors, checks for 1:1 biometric collisions via `detectFaceCollision`, stores base64 images in Cloudinary/local storage, updates `user.faceEnrollment`, and records an audit log.
  - **Critical Root Cause:** There was **zero notification dispatch call** anywhere in `enrollFace`. No invocation of `notify()` or helper functions was ever implemented for the enrollment submission event.
- **Recipient Resolution Trace:**
  - HR reviews face enrollments via the permission `attendance.face.manage`.
  - Target roles: Active users possessing `Super Admin` or `HR Manager` roles (`Role.find({ name: { $in: ['Super Admin', 'HR Manager'] } })`).
- **Resolution Strategy:**
  - In `enrollFace`, immediately after saving the pending enrollment, resolve authorized HR Managers and Super Admins.
  - Dispatch a centralized notification via `notify(recipientUserIds, { type: 'attendance', module: 'attendance', priority: 'normal', title: 'Face Enrollment Completed', body: `${employee.name} has successfully completed Face Enrollment and their enrollment record is available for review.`, link: '/attendance/face-enrollments' })`.
  - Enforce idempotency: Do not dispatch notifications if enrollment fails or results in a biometric collision.

---

### Issue 3: Work From Home (WFH) — One-Day-Before Advance Notice Restriction
- **Business Rule:**
  - WFH applications must be submitted at least one day before the requested remote work date, computed relative to the organization's official timezone (`Asia/Karachi`).
  - Example: If today is Monday, the earliest allowable WFH date is Tuesday (tomorrow). Applying on Monday for Monday is strictly prohibited.
- **Backend Trace:**
  - Examined `applyWFH` in `backend/src/modules/attendance/attendance.service.js` (lines 1073–1114).
  - Code only checked `assertMonthNotLocked(targetDate)` and existing duplicate requests for the same date.
  - There was zero validation comparing `targetDate` against current date in `Asia/Karachi`. Same-day or past-date submissions were accepted.
- **Frontend Trace:**
  - Examined `frontend/src/features/attendance/components/ApplyWFHModal.jsx`.
  - State initialized with `date = new Date().toLocaleDateString('en-CA')` (today's date).
  - The `<input type="date">` element had no `min` attribute set.
  - Form submission validation only verified that `reason.trim().length >= 5`.
- **Resolution Strategy:**
  - Backend: Calculate `tomorrowMidnight` in `Asia/Karachi` using the server's timezone utility (`normalizeToUtcMidnight`). If `targetDate < tomorrowMidnight`, throw `ApiError(400, 'WFH applications must be submitted at least one day before the requested date. Same-day applications are not allowed.', [{ code: 'WFH_ADVANCE_NOTICE_REQUIRED', earliestAllowedDate }])`.
  - Frontend: Calculate `tomorrow` string (`YYYY-MM-DD`), set `min={tomorrowStr}`, initialize default date to `tomorrowStr`, provide real-time input validation, and display a prominent warning banner if the user attempts to enter today or a past date.

---

### Issue 4: WFH Application — HR/Manager Notification Delivery & Tab Routing
- **Backend Trace:**
  - In `applyWFH`, notification dispatch was wrapped in a fire-and-forget `notify(recipientUserIds, ...).catch(() => {})`.
  - `getApprovalNotificationRecipients` attempted to find manager and admin roles, but lacked support for users with dual role assignments or standalone `role: 'Super Admin'` fields.
  - The notification link was hardcoded to `/attendance/team`, which defaults to the `all` tab rather than the dedicated WFH tab (`/attendance/team?tab=wfh`).
  - When managers decided WFH requests in `decideWFH`, the applicant was notified with `/attendance/my`, which also omitted the direct tab anchor (`/attendance/my?tab=wfh`).
- **Resolution Strategy:**
  - Standardize `getApprovalNotificationRecipients` to query both `roles: { $in: adminRoleIds }` and fallback string roles, ensuring active HR Managers and Super Admins are always resolved.
  - Update link to `/attendance/team?tab=wfh` on submission and `/attendance/my?tab=wfh` on decision.
  - Await notification delivery or handle logging cleanly to guarantee delivery tracking.

---

## 3. RBAC & PBAC Permissions Matrix

| Action | Required Permission / Role | Route / Component |
| :--- | :--- | :--- |
| Face Check-In | Authenticated User + Active Face Enrollment | `POST /api/v1/attendance/check-in` (`source: 'face'`) |
| Face Enrollment Submit | Authenticated User (`attendance.face.enroll` / own profile) | `POST /api/v1/attendance/face/enroll` |
| Face Enrollment Review | `attendance.face.manage` (`Super Admin`, `HR Manager`) | `GET /api/v1/attendance/face/enrollments`, `/face/:userId/approve`, `/reject` |
| Apply WFH | `attendance.wfh` (own scope) | `POST /api/v1/attendance/wfh` |
| Review & Decide WFH | `attendance.approve` (Manager of department / HR / Super Admin) | `GET /api/v1/attendance/wfh/team`, `PATCH /api/v1/attendance/wfh/:id/decide` |

---

## 4. Architectural Verification Plan
- **Backend Unit & E2E Testing:** Create dedicated Vitest suite `backend/tests/attendance.wfh-face-notifications.e2e.test.js` validating all 28 requirements across Face Punch blocking, Face Enrollment notification delivery, WFH advance-notice enforcement, and WFH notification routing.
- **Frontend Code Quality:** Verify `FaceCheckInModal.jsx`, `FaceEnrollmentRequiredModal.jsx`, `ApplyWFHModal.jsx`, and `TeamAttendancePage.jsx` with Oxlint (0 errors) and Vite build (clean compilation).
