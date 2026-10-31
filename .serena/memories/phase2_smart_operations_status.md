# Phase 2: Smart Operations — Implementation Status & Architecture Summary

## 1. Phase 2 Scope & Overall Progress
Phase 2 focuses on Smart Operations, self-service financial workflows, and multi-modal attendance.
- **Completed Modules**:
  1. **M10: Loans & Advances** (6/6 features complete, repayments integrated into payroll deductions)
  2. **M11: Expense Claims** (5/5 features complete, receipt uploads & multi-tier approval)
  3. **M14: GPS / Geo-fencing Attendance** (8/8 features complete, Leaflet radius, client-site checkin, privacy-first punch)
  4. **M13: Dynamic QR Code Attendance** (6/6 features complete, rotating HMAC SHA-256 SVG stream, 30s TTL, hardware device binding, turnstile directionality, HR device reset)
  5. **M12: Face Recognition Attendance** (9/9 features complete, client-side `@vladmandic/face-api`, 128-d Euclidean distance matching, liveness detection, HR enrollment approval, flagged attempt review)
- **Remaining Modules in Phase 2**:
  - M23: Asset Management (23.1 to 23.6)
  - M18: Onboarding & Offboarding (18.1 to 18.11)
  - M19: Performance & Appraisal (19.1 to 19.9)
  - M22: Projects & Timesheets (22.1 to 22.7)

## 2. Core Data Models in Phase 2 (Completed so far)
- `Loan`: Employee loan & advance records, repayment schedules, monthly deductions
- `ExpenseClaim` & `ExpenseCategory`: Expense requests, monetary caps, receipt proof attachments
- `OfficeLocation`: Geo-fenced physical office coordinates, radius, WFH approvals
- `Kiosk`: Dynamic QR terminal devices with code, direction (`entry`/`exit`/`both`), secretKey (unselected), status
- `User` (extended): `deviceId`, `deviceBoundAt`, `deviceModel` for anti-proxy punch locking
- `User` (extended for M12): `faceEnrollment` sub-document with 128-d descriptors array, status ('none', 'pending', 'approved', 'rejected'), enrollmentPhotoUrl, enrolledAt, approvedAt, approvedBy, rejectionReason
- `Attendance` (extended): `source` ('web', 'gps', 'qr', 'face'), `kioskId`, `coordinates`, `isFlagged`, `snapshotUrl`, `confidenceDistance`

## 3. Key Cross-Module Decisions
- Multi-modal attendance records all feed into the single unified `Attendance` collection and shift calculation engine (`getShiftAndPolicies`).
- Attendance lock before payroll (M5/M9) prevents any retrospective modification by QR or GPS punches once the month is locked.
- Audit logging is uniformly applied across device binding resets, kiosk registration, and location edits.
