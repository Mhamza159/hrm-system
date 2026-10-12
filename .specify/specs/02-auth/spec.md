# Feature Specification: M1 Authentication & Access Control

**Feature Identifier**: `02-auth`  
**Feature Branch**: `feature/02-auth`  
**Target Module**: Module M1 (Core HR Group · Priority P1)  
**Status**: Approved Specification  
**Architecture Standard**: Plain JavaScript (ES modules, `.js` / `.jsx`), Node.js LTS + Express, MongoDB + Mongoose, React + Vite, Redux Toolkit + RTK Query, Tailwind CSS + shadcn/ui (JS)

---

## 1. Executive Summary & Sources of Truth

This specification establishes the end-to-end security, session lifecycle, and authentication architecture for the HRM System, strictly grounded in:
1. **[`docs/FRD.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/FRD.md) Section 5 (M1 Authentication & Access Control):** Login, session management, credential recovery, two-factor authentication, inactivity termination, login audits.
2. **[`docs/FRD.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/FRD.md) Section 11 (Role-wise Permission Matrix):** M1 access levels:
   - **Super Admin:** `Full` (activate/deactivate any account, inspect full login histories, trigger admin resets)
   - **HR Manager:** `Manage` (create new employee user accounts, deactivate leavers, trigger resets)
   - **Department Manager:** `Own` (own profile, change password, 2FA, own login history)
   - **Employee:** `Own` (own profile, change password, 2FA, own login history)
3. **[`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 4 (M1 Rows 1.1 to 1.14):** 14 discrete vertical slice features.
4. **[`docs/TECH-SPEC.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/TECH-SPEC.md) Section 6 (Auth Flow) & Section 11 (Security Standards):** 15-minute JWT access token, 7-day httpOnly cookie refresh token with database hash & rotation, 12-round bcrypt hashing, 5 failed attempts lockout (15 minutes).

---

## 2. Technical Architecture & Library Invariants

Following documentation fetched via Context7 MCP:
- **`jsonwebtoken` (`/auth0/node-jsonwebtoken`):**
  - Access Token: Payload `{ userId, employeeId, roles, tokenVersion }`, expiration `15m`, algorithm `HS256`, secret `process.env.JWT_ACCESS_SECRET`.
  - Refresh Token: Payload `{ userId, tokenVersion }`, expiration `7d`, algorithm `HS256`, secret `process.env.JWT_REFRESH_SECRET`.
- **`bcrypt`:**
  - Password hashing via `bcrypt.hash(password, 12)` and verification via `bcrypt.compare(password, hash)`.
- **`cookie-parser`:**
  - Refresh token delivered in cookie:
    ```javascript
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth'
    });
    ```
- **`@reduxjs/toolkit` (RTK Query `/reduxjs/redux-toolkit`):**
  - Implementation of `baseQueryWithReauth` with `Mutex` synchronization: intercept `401 Unauthorized`, hold pending requests, dispatch `POST /auth/refresh`, update access token in state, and replay requests. Redirect to `/login` if refresh fails.
- **`react-router`:**
  - Protected layout wrapping `<ProtectedRoute>`: checks authenticated state; redirects to `/login` if unauthenticated; force-redirects to `/change-password` if `mustChangePassword === true`.
- **`react-hook-form` & Zod (`/react-hook-form/resolvers`):**
  - All auth forms wrapped with `useForm({ resolver: zodResolver(authSchema) })` with inline field-level validation errors.
- **`nodemailer`:**
  - SMTP transporter for OTP verification emails and password reset instructions using branded HTML email templates.

---

## 3. Prioritized User Stories & Acceptance Criteria

---

### User Story 1 — User Model & Credential Security Foundation (Priority: P1)
**BUILD-GUIDE Reference:** `ID 1.1`  
**Description:** As a system architect, I need a comprehensive Mongoose User schema with security flags, role associations, and cryptographic fields so that all subsequent authentication features have a robust persistence model.

**Why this priority:** Foundational prerequisite. No user authentication or role evaluation can occur without this data model.  
**Independent Test:** Verified via Mongoose model unit tests and MongoDB Compass collection inspection confirming indexed fields, default values, and schema validations.

**Acceptance Scenarios:**
1. **Given** a new user registration or seed, **When** the document is saved to MongoDB, **Then** it must store `email` (unique, lowercase, trimmed), `passwordHash` (bcrypt 12 rounds), `roles` (array of ObjectId referencing Role model), `employeeId` (ObjectId referencing Employee model), `isActive` (default `true`), `failedAttempts` (default `0`), `lockUntil` (default `null`), `twoFactorEnabled` (default `false`), `twoFactorSecret` (encrypted), `refreshTokenHash` (default `null`), and `mustChangePassword` (default `false`).
2. **Given** an invalid or improperly formatted email, **When** model validation executes, **Then** Mongoose and Zod must reject the document with a descriptive validation error before hitting the database.

---

### User Story 2 — User Login with Access & Refresh Tokens (Priority: P1)
**BUILD-GUIDE Reference:** `ID 1.2`  
**Description:** As an employee or administrator, I want to submit my email and password on the Login page so that I receive an authenticated session to access the HRM dashboard.

**Why this priority:** Core entry gate into the application.  
**Independent Test:** Submit valid credentials via `POST /auth/login` and verify that the response body returns `{ success: true, data: { user, accessToken } }` and sets the `refreshToken` httpOnly cookie.

**Role-Based Acceptance Scenarios:**
1. **Given** any valid active user (Super Admin, HR Manager, Department Manager, Employee), **When** they submit correct email and password on `LoginPage.jsx`, **Then** the server verifies the password with bcrypt, resets `failedAttempts` to 0, signs a 15-minute access token, signs a 7-day refresh token, stores the bcrypt hash of the refresh token in `user.refreshTokenHash`, returns the access token and user payload in JSON, sets the httpOnly cookie, and redirects the user to the dashboard.
2. **Given** any user entering an incorrect password, **When** `POST /auth/login` is executed, **Then** the system increments `failedAttempts`, returns `401 Unauthorized` with message `"Invalid email or password"`, and does not disclose whether the email exists.
3. **Given** an inactive user (`isActive: false`), **When** they attempt to log in with correct credentials, **Then** the server rejects the request with `403 Forbidden` and message `"Your account has been deactivated. Please contact HR."`.

---

### User Story 3 — Brute-Force Defense & Automated Account Lockout (Priority: P1)
**BUILD-GUIDE Reference:** `ID 1.3`  
**Description:** As a security administrator, I want accounts to automatically lock after 5 consecutive failed login attempts for 15 minutes so that brute-force credential stuffing attacks are thwarted.

**Why this priority:** Critical security invariant preventing unauthorized dictionary and brute-force attacks.  
**Independent Test:** Execute 5 consecutive failed login attempts on a target email, then attempt a 6th login with the correct password, verifying rejection with lockout duration.

**Role-Based Acceptance Scenarios:**
1. **Given** an active account with 4 failed attempts, **When** a 5th incorrect password attempt occurs, **Then** the server increments `failedAttempts` to 5 and sets `lockUntil = new Date(Date.now() + 15 * 60 * 1000)` (15 minutes).
2. **Given** a locked account (`lockUntil > Date.now()`), **When** any login attempt (correct or incorrect password) is made by any role, **Then** the system immediately returns `423 Locked` with message `"Account locked due to consecutive failed attempts. Please try again after [X] minutes or contact HR."`.
3. **Given** a locked account whose `lockUntil` timestamp has passed, **When** the user logs in with the correct password, **Then** the lockout clears, `failedAttempts` resets to 0, `lockUntil` resets to `null`, and the login succeeds.

---

### User Story 4 — Automatic Session Refresh & Token Rotation (Priority: P1)
**BUILD-GUIDE Reference:** `ID 1.4`  
**Description:** As an active user, I want my expired access token to automatically refresh in the background without interrupting my work or logging me out unexpectedly.

**Why this priority:** Seamless user experience while maintaining a strict 15-minute access token security window.  
**Independent Test:** Make an API request with an expired access token and verify that the RTK Query `baseQueryWithReauth` intercepts the 401, calls `POST /auth/refresh`, and successfully replays the original request.

**Role-Based Acceptance Scenarios:**
1. **Given** an expired 15-minute access token and a valid 7-day `refreshToken` cookie, **When** an authenticated API request returns `401`, **Then** the client automatically invokes `POST /auth/refresh`, sending the cookie.
2. **Given** `POST /auth/refresh` receives a valid cookie, **When** the server verifies the JWT and compares the token against `user.refreshTokenHash`, **Then** the server generates a new access token and a **new refresh token** (Rotation), updates `user.refreshTokenHash`, sets the new cookie, and returns the new access token.
3. **Given** a compromised or reused refresh token that does not match the stored hash, **When** `POST /auth/refresh` executes, **Then** the server invalidates the stored session, clears the cookie, and returns `401 Unauthorized` forcing immediate re-authentication.

---

### User Story 5 — Secure Logout with Token Invalidation (Priority: P1)
**BUILD-GUIDE Reference:** `ID 1.5`  
**Description:** As a user, I want to click Logout from the topbar menu so that my session is completely terminated on both client and server.

**Why this priority:** Prevents session hijacking on shared or workstation computers.  
**Independent Test:** Call `POST /auth/logout`, verify that the `refreshToken` cookie is cleared, `user.refreshTokenHash` is set to `null` in DB, and subsequent requests fail.

**Role-Based Acceptance Scenarios:**
1. **Given** an authenticated user (Super Admin, HR Manager, Department Manager, Employee), **When** they click "Logout" in the user topbar menu, **Then** the client calls `POST /auth/logout`, clears local Redux state, deletes the cached access token, clears the `refreshToken` cookie with an expired `Set-Cookie` header, sets `user.refreshTokenHash = null` in MongoDB, and redirects to `/login`.
2. **Given** a logged-out user, **When** they click the browser "Back" button, **Then** `<ProtectedRoute>` detects no authenticated state and redirects back to `/login`.

---

### User Story 6 — Current User Profile & Protected Route Guarding (Priority: P1)
**BUILD-GUIDE Reference:** `ID 1.6`  
**Description:** As an authenticated user, I want the frontend to load my profile and effective permissions via `GET /auth/me` on startup so that routes and navigation items render according to my authorized capabilities.

**Why this priority:** Client-side routing backbone and permission integration.  
**Independent Test:** Call `GET /auth/me` with a valid access token; verify return of user profile, roles, and CASL abilities. Verify unauthenticated visits redirect to `/login`.

**Role-Based Acceptance Scenarios:**
1. **Given** an unauthenticated visitor, **When** they navigate to any private route (e.g., `/dashboard`, `/employees`, `/attendance`), **Then** `<ProtectedRoute>` redirects them to `/login?redirect=[path]`.
2. **Given** an authenticated user (Super Admin, HR Manager, Department Manager, Employee), **When** the app boots, **Then** `GET /auth/me` executes, populating Redux `authSlice` with `{ user, employeeProfile, effectivePermissions }` and initializing the CASL Ability context.
3. **Given** a user with `mustChangePassword === true`, **When** `GET /auth/me` loads, **Then** the router immediately forces a redirect to `/change-password`, locking all other pages until resolved.

---

### User Story 7 — Password Recovery via Email OTP (Priority: P1)
**BUILD-GUIDE Reference:** `ID 1.7`  
**Description:** As a user who forgot their password, I want to enter my registered email address to receive a secure, 6-digit one-time passcode (OTP) so that I can initiate password recovery.

**Why this priority:** Essential self-service account recovery preventing lockouts and reducing HR support tickets.  
**Independent Test:** Submit `POST /auth/forgot-password` with a valid email; inspect Nodemailer transport for the 6-digit OTP email with 10-minute expiry.

**Role-Based Acceptance Scenarios:**
1. **Given** any registered user on `ForgotPasswordPage.jsx`, **When** they enter their email and submit, **Then** the server generates a cryptographically secure 6-digit numeric OTP, saves its hash and expiry (`Date.now() + 10 * 60 * 1000`) in the user record, and sends a styled HTML email via Nodemailer.
2. **Given** an email address that does not exist in the system, **When** submitted, **Then** the API still responds with `{ success: true, message: "If that email exists, an OTP has been sent." }` to prevent email enumeration attacks.

---

### User Story 8 — Password Reset Verification & Execution (Priority: P1)
**BUILD-GUIDE Reference:** `ID 1.8`  
**Description:** As a user who received a reset OTP, I want to enter the OTP and my new password so that my account credentials are updated and I can regain access.

**Why this priority:** Completes the credential recovery workflow.  
**Independent Test:** Submit `POST /auth/reset-password` with valid email, OTP, and new password; verify successful update and subsequent login with new password.

**Role-Based Acceptance Scenarios:**
1. **Given** a valid, unexpired OTP, **When** the user submits the OTP and a compliant new password on `ResetPasswordPage.jsx`, **Then** the server hashes the new password with bcrypt, clears the reset OTP and expiry fields, resets `failedAttempts = 0`, sets `lockUntil = null`, invalidates existing refresh tokens, and responds with success.
2. **Given** an expired OTP (>10 minutes) or incorrect OTP, **When** submitted, **Then** the server rejects the request with `400 Bad Request` and message `"Invalid or expired OTP"`.
3. **Given** an already-used OTP, **When** submitted a second time, **Then** the server rejects it.

---

### User Story 9 — Self-Service Password Change & First-Login Mandate (Priority: P1)
**BUILD-GUIDE Reference:** `ID 1.9`  
**Description:** As a logged-in user or a newly onboarded employee with a temporary password, I must change my password so that my account remains secure and confidential.

**Why this priority:** Crucial security control ensuring newly provisioned default passwords cannot be reused.  
**Independent Test:** Create a user with `mustChangePassword = true`; verify forced redirect to `/change-password` and verification that password cannot be bypassed.

**Role-Based Acceptance Scenarios:**
1. **Given** any user with `mustChangePassword: true` (e.g., newly onboarded Employee), **When** they log in, **Then** the app forces an inescapable redirect to `/change-password`, disabling all sidebar links and dashboard access until the password is changed.
2. **Given** an authenticated user on `ChangePasswordPage.jsx`, **When** they submit their current password and a new password (min 8 chars, 1 uppercase, 1 number, 1 special char), **Then** `PATCH /auth/change-password` verifies current password with bcrypt, saves the new password hash, sets `mustChangePassword = false`, and displays a success notification.
3. **Given** an incorrect current password, **When** submitted, **Then** the request is rejected with `400 Bad Request` and message `"Current password is incorrect"`.

---

### User Story 10 — Two-Factor Authentication (2FA) via OTP (Priority: P2)
**BUILD-GUIDE Reference:** `ID 1.10`  
**Description:** As an employee or administrator desiring higher security, I want to enable Two-Factor Authentication on my profile so that logins require an OTP confirmation in addition to my password.

**Why this priority:** Secondary security enhancement protecting privileged accounts (Super Admin, HR, Finance).  
**Independent Test:** Enable 2FA on a test user, execute login, verify that `POST /auth/login` returns `{ twoFactorRequired: true, tempToken }` and requires `POST /auth/verify-otp` before issuing access/refresh tokens.

**Role-Based Acceptance Scenarios:**
1. **Given** a user in profile settings, **When** they toggle "Enable 2FA", **Then** `POST /auth/2fa/enable` sends a verification OTP to their email, and prompts for OTP confirmation before setting `twoFactorEnabled = true`.
2. **Given** a user with `twoFactorEnabled: true`, **When** they submit valid email and password on `LoginPage.jsx`, **Then** the server sends an OTP to their email and returns `{ twoFactorRequired: true, sessionToken }` without full auth cookies, redirecting to `OtpPage.jsx`.
3. **Given** a valid OTP entered on `OtpPage.jsx`, **When** `POST /auth/verify-otp` is called, **Then** full session tokens (access token and httpOnly refresh cookie) are issued.

---

### User Story 11 — Client-Side Inactivity Auto-Logout (Priority: P2)
**BUILD-GUIDE Reference:** `ID 1.11`  
**Description:** As a security-conscious organization, I want the web application to automatically log out after 30 minutes of user inactivity so that unattended workstations do not expose sensitive HR data.

**Why this priority:** Essential compliance requirement protecting physical workstations in an open software house environment.  
**Independent Test:** Configure idle timer to trigger; verify automatic session clearing and redirect to `/login` with an inactivity warning.

**Role-Based Acceptance Scenarios:**
1. **Given** an active session across any role, **When** no mouse, keyboard, or touch events occur for 30 minutes (`useIdleTimer` hook), **Then** the application automatically calls `POST /auth/logout`, clears local tokens, and redirects to `/login?reason=inactivity`.
2. **Given** an inactivity timeout, **When** the login page renders, **Then** a warning toast displays: `"You were logged out due to 30 minutes of inactivity."`.

---

### User Story 12 — Login Audit History Tracking (Priority: P2)
**BUILD-GUIDE Reference:** `ID 1.12`  
**Description:** As a user or security officer, I want to review login history records (timestamp, IP address, device, browser, status) so that anomalous or unauthorized account access can be detected.

**Why this priority:** Forensics, compliance auditing, and suspicious login discovery.  
**Independent Test:** Log in from different user agents / IPs; verify records in `LoginHistoryPage.jsx` and via `GET /auth/login-history`.

**Role-Based Acceptance Scenarios:**
1. **Given** an Employee or Department Manager, **When** they view `LoginHistoryPage.jsx` (or profile tab), **Then** they see only their own login history records sorted by date descending.
2. **Given** a Super Admin or HR Manager, **When** they access the system login audit log (`auth.history`), **Then** they can view and filter login records for all company users.
3. **Given** any login attempt (successful or failed), **When** processed by the server, **Then** a record is created in `loginHistories` containing `userId`, `email`, `ipAddress`, `userAgent`, `deviceType`, `status` (`SUCCESS` / `FAILED` / `LOCKED`), and UTC timestamp.

---

### User Story 13 — User Account Activation & Deactivation (Priority: P1)
**BUILD-GUIDE Reference:** `ID 1.13`  
**Description:** As an HR Manager or Super Admin, I want to toggle an employee's user account status between Active and Deactivated so that leavers or suspended staff are blocked immediately from system access.

**Why this priority:** Immediate access revocation when an employee resigns, is terminated, or is placed on leave.  
**Independent Test:** Toggle user status to inactive via `PATCH /users/:id/status`; verify user's active tokens are revoked and login is blocked.

**Role-Based Acceptance Scenarios:**
1. **Given** a Super Admin or HR Manager (`user.manage` permission), **When** they deactivate an account on `UsersPage.jsx`, **Then** `PATCH /users/:id/status` sets `isActive = false`, clears `refreshTokenHash` in DB, and writes an audit log entry.
2. **Given** a deactivated user attempting to refresh a token or call any protected API, **When** the auth middleware runs, **Then** it rejects with `403 Forbidden` and message `"Your account has been deactivated."`.
3. **Given** an Employee or Department Manager, **When** they attempt to call `PATCH /users/:id/status`, **Then** the CASL middleware rejects with `403 Forbidden`.

---

### User Story 14 — HR-Initiated Emergency Password Reset (Priority: P2)
**BUILD-GUIDE Reference:** `ID 1.14`  
**Description:** As an HR Manager, I want to trigger a password reset for an employee who has lost access to their credentials, generating a secure temporary password and forcing them to change it upon first login.

**Why this priority:** Resolves user lockouts when employees lose access to email OTPs or forget credentials.  
**Independent Test:** Trigger reset via `POST /users/:id/reset-password`; verify temporary password generation, welcome/reset email dispatch, and forced change upon login.

**Role-Based Acceptance Scenarios:**
1. **Given** an HR Manager or Super Admin, **When** they click "Reset Password" for an employee on the Users table, **Then** `POST /users/:id/reset-password` generates a random 10-character secure temporary password, hashes it, sets `mustChangePassword = true`, `failedAttempts = 0`, `lockUntil = null`, sends the temporary password via email, and writes an audit log entry.
2. **Given** the affected employee, **When** they log in with the temporary password, **Then** login succeeds and immediately redirects to `ChangePasswordPage.jsx` requiring a new confidential password.
3. **Given** a Department Manager or Employee, **When** they attempt to trigger an admin reset for another user, **Then** CASL middleware blocks with `403 Forbidden`.

---

## 4. Role-Wise Access Control Summary (M1 Matrix)

| Feature / Action | Super Admin | HR Manager | Dept. Manager | Employee |
| :--- | :---: | :---: | :---: | :---: |
| **Login / Logout / Refresh** | Yes | Yes | Yes | Yes |
| **Change Own Password** | Yes | Yes | Yes | Yes |
| **Forgot / Reset Own Password** | Yes | Yes | Yes | Yes |
| **Enable / Disable Own 2FA** | Yes | Yes | Yes | Yes |
| **View Own Login History** | Yes | Yes | Yes | Yes |
| **View All Users' Login History** | Yes | Yes | No (403) | No (403) |
| **Activate / Deactivate Users** | Yes | Yes | No (403) | No (403) |
| **HR Emergency Password Reset** | Yes | Yes | No (403) | No (403) |

---

## 5. Non-Functional & Security Requirements

1. **Password Policy:** Minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (`@$!%*?&#`).
2. **Cryptographic Protection:** Passwords hashed with bcrypt (salt cost 12). Refresh token stored as bcrypt hash in MongoDB.
3. **Session Expiration Windows:**
   - Access Token: `15 minutes` (stateless JWT).
   - Refresh Token: `7 days` (stateful single-use rotating token in `httpOnly`, `secure`, `sameSite: strict` cookie).
   - Password Reset / 2FA OTP: `10 minutes` expiration window.
   - Account Lockout Window: `15 minutes` lockout after 5 consecutive failures.
   - Inactivity Timeout: `30 minutes` client-side auto-termination.
4. **Rate Limiting:** `express-rate-limit` configured on `/api/v1/auth/login` and `/api/v1/auth/forgot-password` (maximum 10 requests per 15 minutes per IP).
5. **NoSQL Injection & Sanitization:** All request bodies validated against strict Zod schemas before touching service layers.

---

## 6. Traceability Matrix & Coverage Table

Every row from [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 4 maps 1-to-1 to an independently testable User Story:

| BUILD-GUIDE ID | Feature Description | Assigned User Story | Priority | Backend Endpoint / File | Frontend Page / Component |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **1.1** | User Model & Security Fields | **User Story 1** | **P1** | `models/user.model.js` | — |
| **1.2** | Login (Access + Refresh Cookie) | **User Story 2** | **P1** | `POST /api/v1/auth/login` | `LoginPage.jsx` |
| **1.3** | Account Lock (5 failed attempts) | **User Story 3** | **P1** | `auth.service.js` (lockUntil) | `LoginPage.jsx` alert banner |
| **1.4** | Auto Refresh Token (Rotation) | **User Story 4** | **P1** | `POST /api/v1/auth/refresh` | `lib/baseApi.js` (reauth mutex) |
| **1.5** | Logout (Cookie & Hash clean) | **User Story 5** | **P1** | `POST /api/v1/auth/logout` | Topbar User Menu |
| **1.6** | Current User Profile & Protected Routes | **User Story 6** | **P1** | `GET /api/v1/auth/me` | `ProtectedRoute.jsx`, `useAuth.js` |
| **1.7** | Forgot Password (Email OTP) | **User Story 7** | **P1** | `POST /api/v1/auth/forgot-password` | `ForgotPasswordPage.jsx` |
| **1.8** | Reset Password (Verify OTP) | **User Story 8** | **P1** | `POST /api/v1/auth/reset-password` | `ResetPasswordPage.jsx` |
| **1.9** | Change Password + First-Login Mandate | **User Story 9** | **P1** | `PATCH /api/v1/auth/change-password` | `ChangePasswordPage.jsx` |
| **1.10** | Two-Factor Authentication (2FA) | **User Story 10** | **P2** | `POST /api/v1/auth/2fa/enable`, `/verify-otp` | `OtpPage.jsx`, Profile 2FA toggle |
| **1.11** | Auto Logout on Inactivity | **User Story 11** | **P2** | Client-side idle timer | `hooks/useIdleTimer.js` (30 mins) |
| **1.12** | Login History (Device, IP) | **User Story 12** | **P2** | `GET /api/v1/auth/login-history` | `LoginHistoryPage.jsx` |
| **1.13** | Account Activation / Deactivation | **User Story 13** | **P1** | `PATCH /api/v1/users/:id/status` | `UsersPage.jsx` status toggle |
| **1.14** | HR Emergency Password Reset | **User Story 14** | **P2** | `POST /api/v1/users/:id/reset-password` | `UsersPage.jsx` action dialog |

---

## 7. Next Recommended Step

Run `/speckit-plan` to generate the technical architecture blueprint, schema designs, and test verification suite for `feature/02-auth`.
