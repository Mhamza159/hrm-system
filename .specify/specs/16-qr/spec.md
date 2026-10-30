# Feature Specification: Module M13 — QR Code Attendance

**Feature Branch**: `feature/16-qr`  
**Created**: October 30, 2026  
**Status**: Draft / Review  
**Source of Truth**:
- `docs/FRD.md`: Section 10.3 (M13. QR Code Attendance) & Section 11 (Permission Matrix)
- `docs/BUILD-GUIDE.md`: Section 18 (Rows 13.1 to 13.6)
- `docs/TECH-SPEC.md`: Sections 3, 4, 5, 6, 8

---

## 1. Executive Summary & Architecture Overview

Module M13 provides secure, touchless, on-premise attendance clock-in/out via dynamic, rotating QR codes displayed on office kiosk screens/tablets. 

### Core Security & Anti-Proxy Architecture
1. **Dynamic Rotating Token**: The office kiosk screen fetches a cryptographically signed HMAC token (`GET /attendance/qr/current?kioskId=...`), which rotates dynamically every 30 to 60 seconds (configurable in settings).
2. **Anti-Screenshot & Replay Protection**: Each QR payload embeds a timestamp, kiosk ID, type (`entry` | `exit` | `both`), and cryptographic HMAC signature. Tokens older than the rotation window are rejected.
3. **Hardware Device Binding**: To eliminate proxy attendance (clocking in for colleagues), an employee's account is automatically bound to their physical device fingerprint / `deviceId` upon their initial successful QR scan. Subsequent scans from a different phone are rejected with HTTP 403 until an HR Manager or Super Admin resets the device binding.
4. **Kiosk Directionality**: Kiosks can be configured as `entry` (clock-in only), `exit` (clock-out only), or `both` (clock-in and clock-out).

---

## 2. User Scenarios & Prioritized User Stories

### User Story 1 (ID 13.1) - Kiosk Devices Management (Priority: P1)
**Description**: As an HR Manager or Super Admin, I want to register and manage physical office kiosks (reception tablets, turnstiles, factory gates) with designated directions (`entry`, `exit`, `both`) and cryptographically generated kiosk secrets so that authenticated dynamic QR displays can be provisioned.

- **Why this priority**: Kiosks are the root trust anchor for QR generation; without registered kiosks, no QR code can be generated.
- **Independent Test**: Admin registers a new kiosk "Head Office Main Reception" (`entry`), receives auto-generated kiosk secret, edits name, and views in kiosk list.

**Role-Wise Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** an authenticated Super Admin on `/attendance/kiosks`,
   - **When** they submit a new kiosk with name `"Karachi Reception Gate 1"`, type `"both"`, location `"Ground Floor"`,
   - **Then** the kiosk is created with status `"active"`, unique 32-character secret key generated, and visible in directory.
2. **HR Manager**:
   - **Given** an authenticated HR Manager with `attendance.kiosk.manage` permission,
   - **When** they view the kiosks list or toggle a kiosk between `"active"` and `"inactive"`,
   - **Then** status updates immediately and audit log records the toggle.
3. **Department Manager**:
   - **Given** an authenticated Department Manager without `attendance.kiosk.manage`,
   - **When** they attempt to access `/attendance/kiosks` or send `POST /api/v1/attendance/kiosks`,
   - **Then** the frontend hides the menu link and the backend responds with HTTP 403 Forbidden.
4. **Employee**:
   - **Given** an authenticated regular employee,
   - **When** they attempt to hit `/api/v1/attendance/kiosks`,
   - **Then** the request is blocked with HTTP 403 Forbidden.

---

### User Story 2 (ID 13.2) - Dynamic Rotating QR Code Generation (Priority: P1)
**Description**: As an office kiosk device/tablet mounted at an entrance or reception, I want to display a high-contrast dynamic QR code that automatically re-generates and rotates every 30–60 seconds so that employees can scan it to punch attendance while preventing static photograph/screenshot replay.

- **Why this priority**: Rotating dynamic tokens are the central defense against proxy attendance screenshots shared over messaging apps.
- **Independent Test**: Open `/attendance/kiosk/:id/display` on browser/tablet; verify a fresh QR renders and updates automatically every 30 seconds with countdown progress ring.

**Role-Wise Acceptance Scenarios**:
1. **Super Admin & HR Manager**:
   - **Given** an active kiosk record with ID `kiosk_123`,
   - **When** they open the kiosk display URL `/attendance/kiosk/kiosk_123/display` or call `GET /api/v1/attendance/qr/current?kioskId=kiosk_123`,
   - **Then** the server responds with a signed QR token `{ qrToken, expiresAt, kioskType: "both", refreshInterval: 30 }` and renders a scannable SVG/Canvas QR.
2. **Department Manager & Employee**:
   - **Given** a kiosk display running in full-screen on a wall-mounted tablet,
   - **When** any employee approaches the tablet,
   - **Then** they see the rotating QR code and a visual 30s countdown indicator without needing administrative login.
3. **Security (Screenshot Invalidation)**:
   - **Given** an employee photographs the QR code at 09:00:00 AM,
   - **When** another employee attempts to scan that photographed QR at 09:01:15 AM (75 seconds later),
   - **Then** the scan request fails with `"QR code expired. Please scan the current live code on the kiosk screen"`.

---

### User Story 3 (ID 13.3) - Scan-to-Punch Verification via Camera (Priority: P1)
**Description**: As an employee, I want to open the HRM mobile web scanner (`html5-qrcode`), point my phone camera at the office kiosk display, and instantly clock in or clock out.

- **Why this priority**: Core attendance flow enabling daily check-in and check-out for staff without biometric hardware.
- **Independent Test**: Employee clicks "Scan QR" on `/attendance/my`, scans valid kiosk QR code; attendance status updates to `present`, and record source marked as `qr`.

**Role-Wise Acceptance Scenarios**:
1. **Employee**:
   - **Given** an authenticated employee with an active camera on mobile/desktop,
   - **When** they point their camera at the kiosk QR code,
   - **Then** `html5-qrcode` decodes the token, calls `POST /api/v1/attendance/check-in` with `{ source: "qr", qrToken, deviceId }`, validates HMAC signature, and registers clock-in successfully.
2. **Department Manager**:
   - **Given** an authenticated Department Manager,
   - **When** they scan the QR code using their own phone,
   - **Then** their own attendance registers with `source: "qr"` exactly as an employee punch.
3. **HR Manager & Super Admin**:
   - **Given** HR Manager inspecting team live attendance grid,
   - **When** an employee punches via QR scan,
   - **Then** the live attendance matrix updates showing `source: "qr"` with kiosk name.
4. **Invalid / Tampered QR**:
   - **Given** a user attempting to send an altered token or invalid signature,
   - **When** the backend validates the token,
   - **Then** the request is rejected with HTTP 400 `"Invalid or tampered QR code signature"`.

---

### User Story 4 (ID 13.4) - Physical Hardware Device Binding (Priority: P1)
**Description**: As an HR system administrator, I want each employee account to bind to their physical mobile device (`deviceId` / fingerprint) upon their first QR attendance scan so that one employee cannot take a coworker's phone to punch for them or log into multiple accounts from one device.

- **Why this priority**: Eliminates buddy punching; ensures 1 employee = 1 verified phone.
- **Independent Test**: Employee A punches with Phone A (binds Phone A). Employee B tries to log into Employee B's account on Phone A and scan QR; punch is rejected.

**Role-Wise Acceptance Scenarios**:
1. **First Scan (Auto-Binding)**:
   - **Given** an employee whose `User.deviceId` is currently `null`,
   - **When** they successfully scan a valid kiosk QR with device identifier `DEV_XYZ_123`,
   - **Then** the system updates `User.deviceId = "DEV_XYZ_123"` and `User.deviceBoundAt = new Date()`, completing check-in.
2. **Subsequent Scan (Matching Device)**:
   - **Given** an employee whose account is bound to `DEV_XYZ_123`,
   - **When** they scan from the same device `DEV_XYZ_123`,
   - **Then** the punch is accepted normally.
3. **Different Device (Rejection)**:
   - **Given** an employee whose account is bound to `DEV_XYZ_123`,
   - **When** they attempt to scan from a different phone `DEV_OTHER_999`,
   - **Then** the punch is rejected with HTTP 403 `"Device binding mismatch: This account is registered to another mobile device. Please contact HR to reset your device."`.
4. **All Roles**:
   - Applies equally to Employees, Department Managers, and HR Managers scanning for personal attendance.

---

### User Story 5 (ID 13.5) - Device Binding Reset (Priority: P2)
**Description**: As an HR Manager or Super Admin, I want to reset an employee's registered `deviceId` when they purchase a new phone, lose their device, or reinstall their browser, so that they can register their new device on their next scan.

- **Why this priority**: Operational continuity; employees inevitably change devices and require an authorized administrative unbind workflow.
- **Independent Test**: HR navigates to Employee/User directory, clicks "Reset Device Binding" for employee, confirms action; employee can now bind their new phone on next punch.

**Role-Wise Acceptance Scenarios**:
1. **Super Admin & HR Manager**:
   - **Given** an authenticated user with `user.manage` or `attendance.kiosk.manage`,
   - **When** they click "Reset Device Binding" on user profile `user_456` and submit confirmation with reason `"Employee upgraded to new handset"`,
   - **Then** `POST /api/v1/users/:id/reset-device` sets `deviceId = null`, `deviceBoundAt = null`, logs an audit entry, and sends an alert notification to the employee.
2. **Department Manager**:
   - **Given** a Department Manager without `user.manage`,
   - **When** they attempt to reset an employee's device binding,
   - **Then** the action is not visible in the UI and blocked with HTTP 403 on the API.
3. **Employee**:
   - **Given** an employee,
   - **When** their device is reset by HR,
   - **Then** their next QR scan automatically re-binds to their new device seamlessly.

---

### User Story 6 (ID 13.6) - QR System Settings & Interval Toggle (Priority: P2)
**Description**: As a Super Admin, I want to configure the QR Code attendance system settings (Enable/Disable toggle, dynamic rotation interval: 15s to 120s, allow photo fallback) so that organizational policy dictates attendance modalities.

- **Why this priority**: System-level governance allowing organizations to activate/deactivate QR attendance or adjust rotation cadence based on Wi-Fi speeds.
- **Independent Test**: Admin changes rotation interval from 30s to 60s in Settings; kiosk updates its rotation cycle accordingly. Admin disables QR attendance; QR scanner tab is hidden on employee dashboard.

**Role-Wise Acceptance Scenarios**:
1. **Super Admin**:
   - **Given** an authenticated Super Admin in System Settings (`/settings`),
   - **When** they update `qrAttendance: { isEnabled: true, refreshIntervalSeconds: 45, requireLocationWithQr: false }`,
   - **Then** settings are persisted to `Setting` collection key `qrAttendance` and applied immediately.
2. **Feature Disabled (All Roles)**:
   - **Given** `qrAttendance.isEnabled === false`,
   - **When** an employee opens `/attendance/my`,
   - **Then** the "Scan QR" button is hidden, and direct API requests to punch via QR return HTTP 400 `"QR code attendance is currently disabled by administrator."`.

---

## 3. Official Library Syntax & Patterns (from Context7)

### Client-Side Scanning (`html5-qrcode`)
Based on `/mebjas/html5-qrcode`:
```javascript
import { Html5Qrcode } from 'html5-qrcode';

// Initialize instance targeting specific container element ID
const html5QrCode = new Html5Qrcode('qr-reader-container');

// Launch camera with back camera preference ('environment')
await html5QrCode.start(
  { facingMode: 'environment' },
  {
    fps: 10,
    qrbox: { width: 250, height: 250 }
  },
  (decodedText, decodedResult) => {
    // Successfully decoded QR code string
    onScanSuccess(decodedText);
  },
  (errorMessage) => {
    // Transient scanning frame error (ignore frame misses)
  }
);

// Safe lifecycle cleanup
const stopScanner = async () => {
  if (html5QrCode.isScanning) {
    await html5QrCode.stop();
    html5QrCode.clear();
  }
};
```

### Server-Side Dynamic QR Generation (`qrcode`)
Based on `/soldair/node-qrcode`:
```javascript
import QRCode from 'qrcode';

// 1. Generate SVG XML string for high-contrast, scalable vector display
const svgString = await QRCode.toString(payloadString, {
  type: 'svg',
  errorCorrectionLevel: 'H',
  margin: 2,
  color: {
    dark: '#0f172a',
    light: '#ffffff'
  }
});

// 2. Or Data URL (Base64 PNG) for image tags
const dataUrl = await QRCode.toDataURL(payloadString, {
  errorCorrectionLevel: 'H',
  margin: 2
});
```

### Cryptographic Token Structure (HMAC SHA-256)
```javascript
import crypto from 'crypto';

// Format: payload.signature
// payload = base64url({ kioskId, kioskType, timestamp, nonce })
// signature = base64url(hmacSha256(payload, kioskSecret))
export const generateSignedQrToken = (kiosk, intervalSeconds = 30) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(6).toString('hex');
  const payload = Buffer.from(
    JSON.stringify({
      kId: kiosk._id.toString(),
      kType: kiosk.type, // 'entry' | 'exit' | 'both'
      ts: timestamp,
      ttl: intervalSeconds,
      nonce
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', kiosk.secretKey)
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
};
```

---

## 4. Key Entities & Database Schemas

### 1. `Kiosk` (`backend/src/models/kiosk.model.js`)
```javascript
{
  name: { type: String, required: true, trim: true, maxlength: 100 },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true }, // e.g. "KSK-REC-01"
  type: { type: String, enum: ['entry', 'exit', 'both'], default: 'both' },
  locationDescription: { type: String, default: '' },
  secretKey: { type: String, required: true, select: false }, // 32-char crypto random secret
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  lastHeartbeatAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}
```

### 2. `User` Schema Extension (`backend/src/models/user.model.js`)
```javascript
{
  deviceId: { type: String, default: null, index: true },
  deviceBoundAt: { type: Date, default: null },
  deviceModel: { type: String, default: null } // Optional human-readable agent string
}
```

### 3. `Attendance` Schema Integration (`attendance.model.js`)
- `source`: already has `'qr'` in enum.
- `kioskId`: `{ type: mongoose.Schema.Types.ObjectId, ref: 'Kiosk', default: null }`.

---

## 5. Security & Risk Analysis

1. **Replay & Screenshot Attack**: Mitigated by short 30-60s TTL + server-side HMAC validation + timestamp window check.
2. **Device Sharing (Buddy Punching)**: Mitigated by `deviceId` binding. One device can only be bound to one active employee account.
3. **Secret Key Exposure**: Kiosk `secretKey` is marked `select: false` in Mongoose and never sent in public client payloads.
4. **Brute Force / Token Guessing**: HMAC SHA-256 with 256-bit entropy prevents signature forgery.
5. **Rate Limiting**: `punchLimiter` protects `POST /check-in` (max 30/min/IP).

---

## 6. Success & Acceptance Criteria

- **SC-001**: Kiosk QR code rotates automatically every 30 seconds with 100% cryptographic validation.
- **SC-002**: Punches attempted with QR tokens older than $30\text{s} + 10\text{s grace}$ are rejected with HTTP 400.
- **SC-003**: 100% of employees scanning from an unbound device have their `deviceId` registered on first punch.
- **SC-004**: 100% of punch attempts from a secondary mismatched phone are rejected with HTTP 403.
- **SC-005**: HR Manager can reset device binding in under 3 clicks from User Directory.
- **SC-006**: Unit and integration test suite achieves 100% pass rate across all 6 BUILD-GUIDE rows.
