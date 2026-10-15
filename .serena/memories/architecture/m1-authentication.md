# Module M1: Authentication & Access Control Architecture

## 1. Overview & Verification Status
- **Governing Guide**: `docs/BUILD-GUIDE.md` Section 4 (Rows 1.1 to 1.14) — All marked completed `☑`.
- **E2E Playwright Verification**: Completed across all 4 roles (Super Admin, HR Manager, Department Manager, Employee) with 100% pass rate in real Chrome.

## 2. Models
- `User` (`backend/src/models/user.model.js`):
  - Fields: `email`, `passwordHash` (bcrypt 12 rounds), `roles[]`, `employeeId`, `isActive`, `failedAttempts`, `lockUntil`, `twoFactorEnabled`, `twoFactorSecret`, `twoFactorOtpHash`, `twoFactorOtpExpires`, `resetOtpHash`, `resetOtpExpires`, `refreshTokenHash`, `mustChangePassword`, `lastLoginAt`, `isDeleted`.
- `LoginHistory` (`backend/src/models/loginHistory.model.js`):
  - Fields: `userId`, `email`, `ipAddress`, `userAgent`, `deviceType`, `status` (`SUCCESS`, `FAILED`, `LOCKED`, `2FA_PENDING`), `failureReason`, `createdAt` (90-day TTL index).

## 3. Endpoints & Security Contracts
- `POST /api/v1/auth/login`: Issues 15m in-memory access token + 7d rotating httpOnly refresh cookie (`path: '/'`, `sameSite: lax` in development, `strict` in production). If 2FA enabled, returns `twoFactorRequired: true` and 5m `tempToken`.
- `POST /api/v1/auth/refresh`: Validates incoming cookie against bcrypt hash in DB, invalidates old token, issues newly rotated refresh cookie and access token.
- `POST /api/v1/auth/logout`: Clears `refreshTokenHash` in DB and sets expired cookie header.
- `GET /api/v1/auth/me`: Authenticated user profile, roles, and CASL effective permissions.
- `POST /api/v1/auth/forgot-password`: Generates 6-digit email OTP (10m TTL).
- `POST /api/v1/auth/reset-password`: Verifies OTP and resets password.
- `PATCH /api/v1/auth/change-password`: Self-service password change; clears `mustChangePassword`.
- `POST /api/v1/auth/verify-otp`: Validates 2FA login OTP using `tempToken`.
- `POST /api/v1/auth/2fa/enable`, `/2fa/verify-enable`, `/2fa/disable`: 2FA management.
- `GET /api/v1/auth/login-history`: Scoped audit history (`all` for Super Admin/HR, `own` for others).

## 4. Architectural Decisions & Fixes
- **In-Memory Access Tokens**: Tokens never stored in `localStorage` or `sessionStorage` to eliminate XSS token exfiltration risk.
- **Mutex Token Refresh**: Frontend `baseApi.js` wraps `fetchBaseQuery` with an in-memory Mutex to queue concurrent 401 requests during transparent token refresh.
- **CASL Selector Memoization**: In `frontend/src/lib/ability.js`, permissions fallback uses static frozen `EMPTY_PERMISSIONS = Object.freeze([])` to avoid Redux selector re-render warnings.
