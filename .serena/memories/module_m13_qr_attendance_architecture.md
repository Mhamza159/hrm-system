# Module M13: Dynamic QR Code Attendance Architecture & Decisions

## 1. Overview & Status
- **Module ID**: M13 (Dynamic QR Code Attendance)
- **Status**: Complete & Verified (All 6 BUILD-GUIDE rows 13.1 - 13.6 Pass; 18/18 Unit/Integration tests pass; 13/13 Security tests pass; Playwright Multi-role E2E Pass)
- **Feature Branch**: `feature/16-qr`

## 2. Data Models
- **Kiosk (`backend/src/models/kiosk.model.js`)**:
  - `name`: String (Required, trimmed)
  - `code`: String (Required, uppercase, trimmed, compound unique index with `isDeleted`)
  - `type`: Enum ('entry', 'exit', 'both')
  - `locationDescription`: String
  - `secretKey`: String (crypto.randomBytes(32).toString('hex'), unselected by default `select: false`)
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
  - `source`: Extended enum includes `'qr'`

## 3. API Surface & Security Hardening
- `GET /api/v1/attendance/kiosks` (`attendance.kiosk.manage`, scope: all) - Paginated, sanitized regex search
- `POST /api/v1/attendance/kiosks` (`attendance.kiosk.manage`, scope: all) - Register kiosk with unique uppercase code
- `GET /api/v1/attendance/kiosks/:id` (`attendance.kiosk.manage`, scope: all) - Get kiosk by ID
- `PATCH /api/v1/attendance/kiosks/:id` (`attendance.kiosk.manage`, scope: all) - Update kiosk config/active status
- `DELETE /api/v1/attendance/kiosks/:id` (`attendance.kiosk.manage`, scope: all) - Soft delete kiosk
- `GET /api/v1/attendance/qr/current?kioskId=...` (`attendance.mark`, scope: own) - Dynamic HMAC SHA-256 rotating QR stream with SVG payload & 30s TTL, protected by `qrStreamLimiter` (120 req/min)
- `POST /api/v1/attendance/check-in` & `POST /api/v1/attendance/check-out` (`attendance.mark`, scope: own) - Accepts `source: 'qr'`, `qrToken`, `deviceId`, `deviceModel`. Validates HMAC SHA-256 constant-time signature, 30s+10s expiry, kiosk directionality, in-memory anti-replay nonce cache (`consumedQrTokens`), and permanent device binding.
- `POST /api/v1/attendance/users/:id/reset-device` & `POST /api/v1/users/:id/reset-device` (`attendance.kiosk.manage` or `user.manage`) - Unbinds device and records audit log.

## 4. Permissions
- `attendance.kiosk.manage` (Subject: Attendance, Scopes: ['all'])
- Seeded to: Super Admin, HR Manager.

## 5. Security & Anti-Fraud Mitigations
1. **No Token Replay**: In-memory LRU/TTL nonce cache rejects duplicated token submissions within 60s window.
2. **Device Binding (Anti-Proxy)**: First scan locks `deviceId` to user. Mismatched phone rejected with HTTP 403.
3. **Turnstile Enforcement**: `entry` kiosk rejects check-out; `exit` kiosk rejects check-in.
4. **Secret Protection**: Kiosk `secretKey` is `select: false` and never exposed via API payloads.
5. **ReDoS / NoSQL Defense**: Regex metacharacters escaped on search queries; Zod strictly sanitizes kioskId params.

## 6. Frontend Surface
- `KiosksPage.jsx`: Administration directory with search, filter tabs, active status toggle, and "Display" launcher.
- `KioskModal.jsx`: Kiosk registration and configuration modal.
- `KioskQrPage.jsx`: Dedicated fullscreen rotating QR vector stream display with live clock and 30s countdown.
- `QrScannerModal.jsx`: Camera scanner modal using `html5-qrcode` with direction toggle and device fingerprint attachment.
- `ResetDeviceModal.jsx`: Device unbinding modal on Users page with administrative reason log.
- `PunchCardWidget.jsx`: Integrated "Scan QR" launcher with conditional setting toggle.
- `AttendanceRulesForm.jsx`: Admin settings for QR enable/disable and rotation intervals (15s/30s/45s/60s).
