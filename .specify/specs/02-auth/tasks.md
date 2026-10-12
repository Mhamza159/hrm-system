# Tasks Breakdown: M1 Authentication & Access Control

**Feature Identifier**: `02-auth`  
**Feature Branch**: `feature/02-auth`  
**Target Module**: Module M1 (Core HR Group · Priority P1)  
**Spec Document**: [`.specify/specs/02-auth/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/02-auth/spec.md)  
**Plan Document**: [`.specify/specs/02-auth/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/02-auth/plan.md)  
**Governing Guide**: [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 4 (Rows 1.1–1.14)  
**Architecture Rules**: Plain JavaScript only (`.js` / `.jsx`), Vertical Slice order (BE $\rightarrow$ FE $\rightarrow$ Row Test), P1 first then P2.

---

## Phase 1: Core Authentication & Session Foundation (Priority P1)

### Slice 1.1: User Data Model & Security Persistence (BUILD-GUIDE ID 1.1)
- [x] **1.1-BE**: Create `backend/src/models/user.model.js` with schema fields: `email` (unique, lowercase, trim), `passwordHash`, `roles[]` (ref: Role), `employeeId` (ref: Employee), `isActive` (default: true), `failedAttempts` (default: 0), `lockUntil` (default: null), `twoFactorEnabled` (default: false), `twoFactorSecret`, `refreshTokenHash`, `mustChangePassword` (default: false), `lastLoginAt`, and `isDeleted`. Enforce unique email index and pre-save bcrypt hashing hook.
- [x] **1.1-TEST**: Unit test `user.model.js` via Vitest: verify unique index on email rejects duplicates, default fields populate correctly, and pre-save hook hashes password using bcrypt with 12 salt rounds.

---

### Slice 1.2: User Login with Access & Refresh Token Pairs (BUILD-GUIDE ID 1.2)
- [x] **1.2-BE**: In `backend/src/modules/auth/auth.validation.js`, define Zod `loginSchema` (email, password). In `backend/src/modules/auth/auth.service.js`, implement `login()`: check account exists & `isActive`, verify password with bcrypt, sign 15m access token & 7d refresh token, store bcrypt hash of refresh token in `user.refreshTokenHash`, and record login event. In `backend/src/modules/auth/auth.controller.js` and `auth.routes.js`, mount `POST /api/v1/auth/login`, setting `refreshToken` in an `httpOnly`, `secure`, `sameSite: strict` cookie, and returning `{ success, data: { user, accessToken }, message }`.
- [x] **1.2-FE**: In `frontend/src/features/auth/authApi.js`, define `login` mutation endpoint. In `frontend/src/features/auth/authSlice.js`, create reducers to set in-memory access token and user state. In `frontend/src/features/auth/pages/LoginPage.jsx`, construct the Linear/Stripe style login form using `react-hook-form` + Zod resolver, email input, password input, and loading spinner button.
- [x] **1.2-TEST**: Test `POST /auth/login`: valid credentials return 200 with access token in JSON body and `refreshToken` in `httpOnly` cookie; invalid credentials return 401 with generic error message without disclosing user existence.

---

### Slice 1.3: Brute-Force Defense & Automated Account Lockout (BUILD-GUIDE ID 1.3)
- [x] **1.3-BE**: In `backend/src/modules/auth/auth.service.js`, check `lockUntil` before password evaluation. If current time is earlier than `lockUntil`, reject with `423 Locked`. On failed password match, increment `failedAttempts`; if `failedAttempts >= 5`, set `lockUntil = new Date(Date.now() + 15 * 60 * 1000)` (15 minutes). On successful login, reset `failedAttempts = 0` and `lockUntil = null`.
- [x] **1.3-FE**: In `frontend/src/features/auth/pages/LoginPage.jsx`, inspect API error status: if status is 423, display prominent amber alert banner with remaining lockout duration countdown and temporarily disable the submit button.
- [x] **1.3-TEST**: Execute 5 consecutive failed login attempts on a target account; verify 5th attempt triggers 15-minute lock; verify 6th attempt with correct password returns 423 Locked until the timer elapses.

---

### Slice 1.4: Automatic Token Rotation & Transparent Session Refresh (BUILD-GUIDE ID 1.4)
- [x] **1.4-BE**: In `backend/src/modules/auth/auth.service.js`, implement `refreshToken(cookieToken)`: verify JWT with refresh secret, locate user by ID, verify `cookieToken` against `user.refreshTokenHash` with bcrypt. Sign a new 15m access token and a **new rotating 7d refresh token**, update `user.refreshTokenHash` in DB with the new hash. In `auth.controller.js` and `auth.routes.js`, mount `POST /api/v1/auth/refresh` returning the new access token and setting the new rotated cookie.
- [x] **1.4-FE**: In `frontend/src/lib/baseApi.js`, wrap RTK Query `fetchBaseQuery` with `baseQueryWithReauth` utilizing a `Mutex`: intercept 401 response, hold outgoing requests, dispatch `POST /auth/refresh`, update Redux access token, and replay the pending requests. If refresh fails, clear Redux state and redirect to `/login`.
- [x] **1.4-TEST**: API test token rotation: invoke `POST /auth/refresh` with valid cookie; verify new access token and new refresh cookie are issued; verify subsequent reuse of the old refresh cookie returns 401 and revokes the session.

---

### Slice 1.5: Secure Logout & Session Invalidation (BUILD-GUIDE ID 1.5)
- [x] **1.5-BE**: In `backend/src/modules/auth/auth.service.js`, implement `logout(userId)`: set `user.refreshTokenHash = null` in MongoDB. In `auth.controller.js` and `auth.routes.js`, mount `POST /api/v1/auth/logout` requiring `authenticate` middleware, clearing the `refreshToken` cookie with an expired `Set-Cookie` header.
- [x] **1.5-FE**: In `frontend/src/features/auth/authApi.js`, add `logout` mutation. In `frontend/src/components/layout/Topbar.jsx`, attach logout handler to user menu: on click, trigger `logout` mutation, clear Redux `authSlice`, and navigate to `/login`.
- [x] **1.5-TEST**: Test logout: call `POST /auth/logout`, verify cookie is cleared and database hash is null; verify that re-calling protected endpoints or refresh endpoint immediately fails.

---

### Slice 1.6: Current User Hydration & Protected Route Guarding (BUILD-GUIDE ID 1.6)
- [x] **1.6-BE**: Implement `backend/src/middlewares/authenticate.js` to extract Bearer token from `Authorization` header, verify JWT access secret, locate active user, and attach `req.user` and `req.userId`. In `auth.service.js` and `auth.controller.js`, implement `GET /api/v1/auth/me`: populate user roles and employee profile, compile effective CASL permissions, and return `{ success, data: { user, permissions } }`.
- [x] **1.6-FE**: In `frontend/src/features/auth/authApi.js`, define `getMe` query. In `frontend/src/components/ProtectedRoute.jsx` and `frontend/src/hooks/useAuth.js`, check authenticated state: redirect unauthenticated users to `/login`; if authenticated but `mustChangePassword === true`, force redirect to `/change-password`.
- [x] **1.6-TEST**: Test `/auth/me`: returns 200 with user profile and permissions when valid Bearer token provided, returns 401 when missing or expired; verify frontend `<ProtectedRoute>` blocks unauthenticated URL access.

---

### Slice 1.7: Password Recovery via Email OTP (BUILD-GUIDE ID 1.7)
- [x] **1.7-BE**: In `backend/src/modules/auth/auth.validation.js`, define `forgotPasswordSchema`. In `backend/src/modules/auth/auth.service.js`, implement `forgotPassword(email)`: find active user, generate secure 6-digit numeric OTP, hash OTP and store with 10-minute expiry (`resetOtpHash`, `resetOtpExpires`), dispatch HTML email via `nodemailer` transporter. Mount `POST /api/v1/auth/forgot-password` with rate-limiting (10 requests/15m). Always return generic success message to prevent user enumeration.
- [x] **1.7-FE**: Create `frontend/src/features/auth/pages/ForgotPasswordPage.jsx` with email input, form validation, submit handler calling `forgotPassword` mutation, and success confirmation screen directing user to check email.
- [x] **1.7-TEST**: Test `POST /auth/forgot-password`: verify registered user triggers OTP email and sets expiry in DB; verify non-registered email returns identical generic 200 success response.

---

### Slice 1.8: Password Reset Verification & Execution (BUILD-GUIDE ID 1.8)
- [x] **1.8-BE**: In `backend/src/modules/auth/auth.validation.js`, define `resetPasswordSchema` (email, otp, newPassword). In `backend/src/modules/auth/auth.service.js`, implement `resetPassword()`: verify unexpired OTP hash against DB, hash new password with bcrypt 12 rounds, clear OTP fields, reset `failedAttempts = 0`, clear `lockUntil`, nullify `refreshTokenHash`. Mount `POST /api/v1/auth/reset-password`.
- [x] **1.8-FE**: Create `frontend/src/features/auth/pages/ResetPasswordPage.jsx` with 6-digit OTP input, new password and confirm password fields with client-side strength requirements, calling `resetPassword` mutation.
- [x] **1.8-TEST**: Test `POST /auth/reset-password`: valid OTP updates password and enables immediate login with new credentials; invalid, expired (>10m), or previously used OTP returns 400 Bad Request.

---

### Slice 1.9: Self-Service Password Change & First-Login Reset Mandate (BUILD-GUIDE ID 1.9)
- [x] **1.9-BE**: In `backend/src/modules/auth/auth.validation.js`, define `changePasswordSchema` (currentPassword, newPassword). In `backend/src/modules/auth/auth.service.js`, implement `changePassword(userId, currentPassword, newPassword)`: verify current password with bcrypt, hash new password, set `user.mustChangePassword = false`, write audit log entry. Mount `PATCH /api/v1/auth/change-password` with `authenticate` middleware.
- [x] **1.9-FE**: Create `frontend/src/features/auth/pages/ChangePasswordPage.jsx` with current password and new password fields. In `ProtectedRoute.jsx`, enforce mandatory redirect to `/change-password` whenever `user.mustChangePassword === true`, locking all other sidebar links.
- [x] **1.9-TEST**: Test first-login flow: user with `mustChangePassword: true` logs in and is forced to `/change-password`; changing password sets flag to false and unlocks dashboard; incorrect current password returns 400.

---

### Slice 1.13: User Account Activation / Deactivation (BUILD-GUIDE ID 1.13)
- [x] **1.13-BE**: In `backend/src/modules/auth/auth.validation.js`, define `updateUserStatusSchema` (isActive, reason). In `auth.service.js`, implement `setUserStatus(userId, isActive, adminId)`: check admin has `user.manage` permission; update `user.isActive`; if `isActive === false`, immediately clear `user.refreshTokenHash` and write audit log. Mount `PATCH /api/v1/users/:id/status` requiring `authenticate` and `checkPermission('user.manage')`.
- [x] **1.13-FE**: In Users management table (`UsersPage.jsx`), add an Active/Deactivated toggle switch guarded by CASL `<Can I="manage" a="user">` component, calling `updateUserStatus` mutation.
- [x] **1.13-TEST**: Test deactivation: Super Admin/HR deactivates user; verify deactivated user's active session cannot refresh and subsequent login attempts return 403; verify non-admin user (Department Manager, Employee) calling endpoint receives 403.

---

## Phase 2: Enhanced Security, Auditing & Administration (Priority P2)

### Slice 1.10: Two-Factor Authentication (2FA OTP) (BUILD-GUIDE ID 1.10)
- [x] **1.10-BE**: In `backend/src/modules/auth/auth.service.js`, implement `enable2FA(userId)` (send verification OTP to email) and `verify2FA(userId, otp)` (set `twoFactorEnabled = true`). Update `login()`: if `twoFactorEnabled === true`, do NOT issue full session cookies; instead return `{ twoFactorRequired: true, tempToken }` and send 6-digit OTP to user email. Mount `POST /api/v1/auth/2fa/enable` and `POST /api/v1/auth/verify-otp`.
- [x] **1.10-FE**: Create `frontend/src/features/auth/pages/OtpPage.jsx` with 6-digit segmented OTP input, countdown timer, and resend action. Add 2FA enable/disable switch in User Profile security settings.
- [x] **1.10-TEST**: Test 2FA login: user with 2FA enabled logs in with valid password, is halted at OTP page; entering valid OTP issues full tokens and completes login; incorrect OTP is rejected.

---

### Slice 1.11: Client-Side Inactivity Auto-Logout (BUILD-GUIDE ID 1.11)
- [x] **1.11-FE**: Implement custom hook `frontend/src/hooks/useIdleTimer.js` listening for DOM user activity events (`mousemove`, `keydown`, `scroll`, `touchstart`). If no events occur for 30 minutes, automatically dispatch `logout` action, clear Redux state, and navigate to `/login?reason=inactivity` displaying a warning toast: *"You were logged out due to 30 minutes of inactivity"*.
- [x] **1.11-TEST**: Unit test `useIdleTimer.js`: simulate 30 minutes of idle time using Vitest fake timers; verify logout action is dispatched and router navigates to `/login?reason=inactivity`.

---

### Slice 1.12: Login History Tracking & Audit Records (BUILD-GUIDE ID 1.12)
- [x] **1.12-BE**: Create `backend/src/models/loginHistory.model.js` with fields: `userId`, `email`, `ipAddress`, `userAgent`, `deviceType`, `status` (`SUCCESS`, `FAILED`, `LOCKED`, `2FA_PENDING`), `failureReason`, and `createdAt` with a 90-day TTL index. In `auth.service.js`, record every login attempt. Implement `getLoginHistory()`: scoped to `own` records for employees/managers, or all company records for Super Admin/HR with `auth.history`. Mount `GET /api/v1/auth/login-history` with pagination.
- [x] **1.12-FE**: In `frontend/src/features/auth/authApi.js`, add `getLoginHistory` query endpoint. Create `frontend/src/features/auth/pages/LoginHistoryPage.jsx` featuring a data-dense `DataTable` displaying timestamp (formatted in `Asia/Karachi`), IP address, browser/device, and codified status badge.
- [x] **1.12-TEST**: Test login history: successful and failed logins write records to `loginHistories`; verify Employee calling `GET /auth/login-history` sees only their own records; verify Super Admin sees records across all company users.

---

### Slice 1.14: HR-Initiated Emergency Password Reset (BUILD-GUIDE ID 1.14)
- [x] **1.14-BE**: In `backend/src/modules/auth/auth.service.js`, implement `adminResetPassword(targetUserId, adminId)`: check caller has `user.manage` permission; generate secure 10-character temporary password; hash with bcrypt 12 rounds; set `mustChangePassword = true`, `failedAttempts = 0`, `lockUntil = null`; clear `refreshTokenHash`; send temporary credentials to employee email via `nodemailer`; write audit log entry. Mount `POST /api/v1/users/:id/reset-password`.
- [x] **1.14-FE**: In `UsersPage.jsx`, add "Reset Password" button in row actions dropdown guarded by `<Can I="manage" a="user">` with confirmation modal dialog, invoking `adminResetPassword` mutation.
- [x] **1.14-TEST**: Test HR reset: HR triggers reset for employee; verify employee receives temporary password email; employee logs in with temporary password and is immediately forced to change password; verify Department Manager calling endpoint receives 403 Forbidden.

---

## Phase 3: Module M1 Verification & End-to-End Testing

### Module M1 Multi-Role End-to-End Verification
- [x] **E2E-M1**: Module M1 end-to-end Playwright test, chaaron roles se:
  1. **Super Admin**: Logs in, accesses user management, deactivates a user, triggers an emergency password reset for an employee, and inspects the company-wide login history table.
  2. **HR Manager**: Logs in, triggers password reset for a locked user, updates user status, and views team login history.
  3. **Department Manager**: Logs in, attempts to access admin user management routes (assert 403 Forbidden / redirect), changes own password, and views only own login history.
  4. **Employee**: Validates complete self-service cycle:
     - 5 failed login attempts trigger 15-minute account lock.
     - Forgot password request generates email OTP and allows password reset.
     - First login with temporary credentials enforces immediate password change.
     - 30 minutes of simulated inactivity triggers auto-logout.
     - Successful login issues 15m access token + 7d rotating refresh cookie, maintaining persistent session through transparent re-auth.
