# Implementation Tasks: Module M13 — QR Code Attendance

**Feature Branch**: `feature/16-qr`  
**Specification**: [`.specify/specs/16-qr/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/16-qr/spec.md)  
**Architecture Plan**: [`.specify/specs/16-qr/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/16-qr/plan.md)  
**Target BUILD-GUIDE**: Section 18 (Rows 13.1 to 13.6)

---

## Task Execution Checklist (Vertical Slice Order)

### Phase 1: Dependencies & Permissions Setup
- [ ] **13.0-BE-DEPS**: Install backend dependency `qrcode` (v1.5.4) and verify Node.js `crypto` support.
- [ ] **13.0-BE-PERM**: Add `attendance.kiosk.manage` permission to `backend/src/shared/permissions.js` and grant to `Super Admin` and `HR Manager` in `backend/src/seed/roles.seed.js`.
- [ ] **13.0-FE-DEPS**: Install frontend camera QR scanning library `html5-qrcode` (v2.3.8) in `frontend/package.json`.

---

### Slice 1: Kiosk Devices Management (BUILD-GUIDE Row 13.1 · Priority: P1)
- [ ] **13.1-BE-MODEL**: Create `backend/src/models/kiosk.model.js` with fields: `name`, `code` (unique, uppercase), `type` (`entry` | `exit` | `both`), `locationDescription`, `secretKey` (unselected by default, 32-char crypto random string), `isActive`, `isDeleted`, `lastHeartbeatAt`, and `createdBy`.
- [ ] **13.1-BE-VALIDATION**: Define Zod schemas in `backend/src/modules/attendance/attendance.validation.js`: `createKioskSchema`, `updateKioskSchema`, and `queryKiosksSchema`.
- [ ] **13.1-BE-SERVICE**: Implement Kiosk CRUD operations in `backend/src/modules/attendance/attendance.service.js`: `createKiosk`, `getKiosks`, `updateKiosk`, and `deleteKiosk` (soft-delete).
- [ ] **13.1-BE-CONTROLLER**: Implement controller handlers in `backend/src/modules/attendance/attendance.controller.js` and register routes in `attendance.routes.js`: `GET /kiosks`, `POST /kiosks`, `PATCH /kiosks/:id`, and `DELETE /kiosks/:id` protected by `checkPermission('attendance.kiosk.manage', 'all')`.
- [ ] **13.1-FE-API**: Add RTK Query endpoints in `frontend/src/features/attendance/attendanceApi.js`: `getKiosks`, `createKiosk`, `updateKiosk`, and `deleteKiosk` with `Kiosks` cache tag.
- [ ] **13.1-FE-UI**: Create `frontend/src/features/attendance/components/KioskModal.jsx` and `frontend/src/features/attendance/pages/KiosksPage.jsx` with search, type filter tabs, status toggle, secret reveal/copy button, and registration form.
- [ ] **13.1-FE-NAV**: Register `/attendance/kiosks` route in `frontend/src/App.jsx` and add "Attendance Kiosks" menu item in `frontend/src/components/layout/Sidebar.jsx` with `Can` permission guard.
- [ ] **13.1-TEST**: Automated unit & integration tests in `backend/tests/m13.qr.e2e.test.js`: kiosk registration, unique code validation, secret key generation, soft-deletion, and role authorization checks (Super Admin/HR allowed; Dept Manager/Employee blocked with 403).

---

### Slice 2: Dynamic Rotating QR Code Generation (BUILD-GUIDE Row 13.2 · Priority: P1)
- [ ] **13.2-BE-SERVICE**: Implement HMAC SHA-256 dynamic token signing and SVG vector QR code generator using `qrcode` in `backend/src/modules/attendance/attendance.service.js` with configurable TTL (default 30s) and Base64URL payload.
- [ ] **13.2-BE-ROUTE**: Add `GET /api/v1/attendance/qr/current` endpoint in `attendance.controller.js` and `attendance.routes.js` with kiosk ID validation and rate limiting.
- [ ] **13.2-FE-API**: Add `getCurrentKioskQr` query endpoint in `frontend/src/features/attendance/attendanceApi.js`.
- [ ] **13.2-FE-PAGE**: Create standalone `frontend/src/features/attendance/pages/KioskQrPage.jsx` at `/attendance/kiosk/:id/display` with full-screen dark mode aesthetic, high-contrast dynamic rotating SVG QR, auto-refresh every 30s, and circular countdown timer ring.
- [ ] **13.2-FE-NAV**: Register `/attendance/kiosk/:id/display` route in `frontend/src/App.jsx`.
- [ ] **13.2-TEST**: Automated tests asserting dynamic QR token generation, HMAC signature validity, timestamp embedding, and auto-rotation response payload.

---

### Slice 3: Scan-to-Punch Verification via Camera (BUILD-GUIDE Row 13.3 · Priority: P1)
- [ ] **13.3-BE-VALIDATION**: Update `checkInSchema` and `checkOutSchema` in `backend/src/modules/attendance/attendance.validation.js` to accept `qrToken`, `deviceId`, and `deviceModel`.
- [ ] **13.3-BE-SERVICE**: Update `checkIn` and `checkOut` in `backend/src/modules/attendance/attendance.service.js`: verify HMAC SHA-256 signature against kiosk secret, check TTL expiry window ($30\text{s} + 10\text{s grace}$), enforce kiosk directionality (`entry`/`exit`), and set `source: 'qr'`, `kioskId`.
- [ ] **13.3-FE-MODAL**: Create `frontend/src/features/attendance/components/QrScannerModal.jsx` using `html5-qrcode` targeting back camera (`facingMode: 'environment'`), scan frame overlay, loading state, and vibration/haptic feedback on decode.
- [ ] **13.3-FE-WIDGET**: Update `frontend/src/features/attendance/components/PunchCardWidget.jsx` and `pages/MyAttendancePage.jsx` to render "Scan QR Code" button that launches the scanner modal.
- [ ] **13.3-TEST**: Automated tests verifying successful QR clock-in/out, expired QR code rejection, tampered token signature rejection, and wrong kiosk directionality rejection.

---

### Slice 4: Hardware Device Binding (BUILD-GUIDE Row 13.4 · Priority: P1)
- [ ] **13.4-BE-MODEL**: Extend `User` schema in `backend/src/models/user.model.js` with `deviceId` (string, indexed), `deviceBoundAt` (Date), and `deviceModel` (string).
- [ ] **13.4-BE-SERVICE**: Implement device binding assertion in `backend/src/modules/attendance/attendance.service.js`: on initial scan bind `user.deviceId`, on subsequent scans reject mismatched devices with HTTP 403 (`"Device binding mismatch"`).
- [ ] **13.4-FE-UTIL**: Implement browser/device fingerprint persistence helper `frontend/src/utils/deviceFingerprint.js` using persistent UUID stored in `localStorage`.
- [ ] **13.4-TEST**: Automated tests verifying initial automatic device binding, successful repeat punches from the bound device, and rejection of proxy punch attempts from secondary devices.

---

### Slice 5: Device Binding Reset (BUILD-GUIDE Row 13.5 · Priority: P2)
- [ ] **13.5-BE-VALIDATION**: Define `resetDeviceSchema` in `backend/src/modules/attendance/attendance.validation.js` requiring mandatory administrative reason.
- [ ] **13.5-BE-SERVICE**: Implement `resetDeviceBinding` service in `backend/src/modules/attendance/attendance.service.js` setting `deviceId = null` and `deviceBoundAt = null`, logging audit entry in `AuditLog`.
- [ ] **13.5-BE-ROUTE**: Register `POST /api/v1/users/:id/reset-device` in `backend/src/modules/attendance/attendance.routes.js` protected by `checkPermission('attendance.kiosk.manage', 'all')` or `user.manage`.
- [ ] **13.5-FE-API**: Add `resetDeviceBinding` mutation endpoint to `frontend/src/features/attendance/attendanceApi.js`.
- [ ] **13.5-FE-MODAL**: Create `frontend/src/features/users/components/ResetDeviceModal.jsx` with reason input, confirmation modal, and success toast.
- [ ] **13.5-FE-UI**: Add "Reset Device Binding" action button in `frontend/src/features/users/pages/UsersPage.jsx` for employees with bound devices.
- [ ] **13.5-TEST**: Automated tests verifying HR device binding reset, audit log creation, and subsequent re-binding from a new device on next punch.

---

### Slice 6: QR System Settings & Toggle (BUILD-GUIDE Row 13.6 · Priority: P2)
- [ ] **13.6-BE-SETTINGS**: Ensure `Setting` key `qrAttendance` (`isEnabled`, `refreshIntervalSeconds`) is queried during QR generation and enforced during scan-to-punch validation.
- [ ] **13.6-FE-SETTINGS**: Add QR Attendance configuration card in Admin Settings tab (`/settings`) allowing toggle and refresh interval adjustment (15s–120s).
- [ ] **13.6-FE-CONDITIONAL**: Conditionally hide QR scan button in `PunchCardWidget.jsx` when `qrAttendance.isEnabled === false`.
- [ ] **13.6-TEST**: Automated tests verifying rejection when QR attendance is disabled and interval change propagation.

---

### Final Multi-Role End-to-End Verification
- [ ] **13.7-E2E-PLAYWRIGHT**: Module M13 end-to-end Playwright test, chaaron roles se (Super Admin, HR Manager, Department Manager, Employee).
