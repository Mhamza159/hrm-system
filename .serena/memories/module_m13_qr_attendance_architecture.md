# Module M13: Dynamic QR Code Attendance Architecture & Decisions

## 1. Data Models
- **Kiosk (`backend/src/models/kiosk.model.js`)**:
  - `name`: String
  - `code`: String (uppercase, unique index with isDeleted)
  - `type`: Enum ('entry', 'exit', 'both')
  - `locationDescription`: String
  - `secretKey`: String (crypto.randomBytes 32 chars, select: false)
  - `isActive`: Boolean (default true)
  - `isDeleted`: Boolean (default false)
  - `lastHeartbeatAt`: Date
  - `createdBy`: ObjectId -> User
- **User Extension (`backend/src/models/user.model.js`)**:
  - `deviceId`: String (indexed)
  - `deviceBoundAt`: Date
  - `deviceModel`: String
- **Attendance Extension (`backend/src/models/attendance.model.js`)**:
  - `kioskId`: ObjectId -> Kiosk

## 2. API Surface
- `GET /api/v1/attendance/kiosks` (`attendance.kiosk.manage`, scope: all) - Query paginated kiosks
- `POST /api/v1/attendance/kiosks` (`attendance.kiosk.manage`, scope: all) - Register new kiosk and generate 32-char crypto secret
- `GET /api/v1/attendance/kiosks/:id` (`attendance.kiosk.manage`, scope: all) - Get kiosk by ID
- `PATCH /api/v1/attendance/kiosks/:id` (`attendance.kiosk.manage`, scope: all) - Update kiosk config/active status
- `DELETE /api/v1/attendance/kiosks/:id` (`attendance.kiosk.manage`, scope: all) - Soft delete kiosk
- `GET /api/v1/attendance/qr/current?kioskId=...` (`attendance.mark`, scope: own) - Dynamic HMAC SHA-256 rotating QR stream with SVG payload & 30s TTL
- `POST /api/v1/attendance/check-in` & `check-out` (`attendance.mark`, scope: own) - Accepts source: 'qr', qrToken, deviceId, deviceModel. Validates signature, expiry, kiosk directionality, and hardware device binding.
- `POST /api/v1/attendance/users/:id/reset-device` & `POST /api/v1/users/:id/reset-device` (`attendance.kiosk.manage` or `user.manage`) - Unbinds device and records audit log.

## 3. Permissions
- `attendance.kiosk.manage` (Subject: Attendance, Scopes: ['all'])
- Seeded to: Super Admin, HR Manager.

## 4. Frontend Surface
- `KiosksPage.jsx`: Administration screen with search, type tabs, active toggles, and "Display" launcher.
- `KioskModal.jsx`: Create & edit kiosk modal.
- `KioskQrPage.jsx`: Dedicated fullscreen rotating QR vector stream display with live clock and 30s countdown.
- `QrScannerModal.jsx`: Camera scanner modal using `html5-qrcode` with direction selector (Clock-in / Clock-out) and device fingerprint attachment.
- `ResetDeviceModal.jsx`: Device unbinding modal on Users page.
- `PunchCardWidget.jsx`: Integrated "Scan QR" launcher.
- `deviceFingerprint.js`: Local UUID generator and device model detector.
