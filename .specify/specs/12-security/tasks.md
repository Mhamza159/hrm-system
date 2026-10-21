# Development Tasks: Module X1 — Security, Audit & Quality Gate

**Feature Branch**: `feature/12-Security`  
**Created**: 2026-10-21  
**Status**: Ready for Sequential Execution  
**Module ID**: X1  
**Module Name**: Security, Audit & Quality Gate (Phase 1 Final Gate · Launch Scope P1/P2)  
**Spec Reference**: [`.specify/specs/12-security/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/12-security/spec.md)  
**Plan Reference**: [`.specify/specs/12-security/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/12-security/plan.md)  
**Build Guide Section**: Section 14 (Rows X1.1 to X1.10)

---

## Task Execution Guidelines (Strict Vertical Slice Order)
1. **Vertical Slice Execution**: Complete Backend (`model/service/controller/route`) ➔ Frontend (`RTK Query hook/page/component/Can`) ➔ Test (`Vitest API / unit assertions`) for each row before moving to the next.
2. **Standard MERN Stack Rules**: Plain JavaScript only (`.js`, `.jsx`), standard envelope `{ success, data, message, meta }`, integer paisa for financials, and CASL PBAC scopes (`all`, `team`, `own`).
3. **Task Completion Marking**: Mark `[x]` upon passing tests and verifying end-to-end dataflow.

---

## Phase 1: RBAC Foundation & Permission Registration (Prerequisite)

- [x] **X1.0-BE**: Register `audit` module and `audit.view` permission in `backend/src/shared/permissions.js`
  - Register module `audit` with subject `AuditLog`
  - Action `audit.view` (allowedScopes: `['all']`, defaultScope: `'all'`)
  - Update `backend/src/seed/roles.seed.js` to ensure `Super Admin` includes `audit.view: all`

---

## Phase 2: Audit Log Explorer & Visual Diff (Row X1.1 · P1)

- [x] **X1.1-BE**: Implement Audit Log query API in `backend/src/modules/audit/`
  - Create `audit.validation.js` with Zod query filters: `page`, `limit`, `module`, `action`, `actorId`, `startDate`, `endDate`
  - Implement `audit.service.js` with paginated Mongoose pipeline filtering on indexed keys (`{ module: 1, createdAt: -1 }`, `{ actorId: 1, createdAt: -1 }`)
  - Create `audit.controller.js` and `audit.routes.js` mounting `GET /api/v1/audit-logs` guarded by `authenticate` and `checkPermission('audit.view', 'all')`
  - Mount `/api/v1/audit-logs` in `backend/src/app.js`
- [x] **X1.1-FE**: Build Audit Logs screen & diff viewer in `frontend/src/features/audit/`
  - Create `auditApi.js` with RTK Query endpoint `useGetAuditLogsQuery`
  - Create `AuditLogFilterToolbar.jsx` with module selector, action filter, actor search, and date range inputs
  - Create `AuditLogDiffModal.jsx` to render property-level `before` vs `after` state diffs with color-coded additions/removals
  - Implement `AuditLogsPage.jsx` using `DataTable.jsx` with columns: Timestamp, Actor, Action, Module, Target, Details/Diff action
  - Update `frontend/src/components/layout/Sidebar.jsx` with "Audit Logs" navigation item wrapped in `<Can permission="audit.view" scope="all">`
  - Update `frontend/src/App.jsx` with protected route `/audit-logs`
- [x] **X1.1-TEST**: Integration tests for Audit Log Explorer (`backend/tests/auditlogs.test.js`)
  - Verify `GET /api/v1/audit-logs` returns 200 with paginated audit entries for Super Admin
  - Verify query filters (`module`, `action`, `startDate`, `endDate`) strictly return matched subsets
  - Verify 403 Forbidden when accessed by HR Manager, Department Manager, or Employee

---

## Phase 3: Universal Soft Deletes & Finalized Payroll Lock (Row X1.2 · P1)

- [x] **X1.2-BE**: Implement soft-delete middleware & payroll immutability lock
  - Verify all core Mongoose models (`Employee`, `Department`, `Leave`, `Attendance`, `User`) define `isDeleted`, `deletedAt`, and `deletedBy`
  - Add pre-find query hooks or explicit service filters ensuring `{ isDeleted: false }` across lookups
  - In `backend/src/modules/payroll/payroll.service.js`, add transactional guard in `deleteRun` blocking deletion of runs in `approved` or `paid` status with `ApiError(400, 'Cannot delete an approved or paid payroll run.')`
- [x] **X1.2-TEST**: Soft delete and payroll lock test suite (`backend/tests/softdelete.lock.test.js`)
  - Verify soft-deleted employees and departments are excluded from standard list and search queries
  - Verify attempting to delete an `approved` or `paid` payroll run returns `400 Bad Request`
  - Verify draft payroll runs can be safely deleted

---

## Phase 4: Multi-Tier Encryption at Rest for PII & Financial Data (Row X1.3 · P1)

- [x] **X1.3-BE**: Verify and enforce AES-256-GCM encryption on sensitive database fields
  - Audit `backend/src/utils/crypto.util.js` ensuring 256-bit key derivation, 12-byte random IV, and 16-byte auth tag
  - Ensure `Employee` model encrypts `cnic`, `bankAccount.accountNumber`, and `bankAccount.iban`
  - Ensure `SalaryStructure` and `Payslip` encrypt base compensation numbers at rest
  - Ensure service-layer transparent decryption operates seamlessly for authorized callers
- [x] **X1.3-TEST**: Database encryption at rest verification tests (`backend/tests/encryption.test.js`)
  - Query MongoDB directly using raw collection driver to verify `cnic` and `bankAccount` values are stored as encrypted ciphertext strings
  - Verify transparent decryption produces original values when queried through authorized services
  - Verify tamper detection: corrupted ciphertext or authTag throws DecryptionError

---

## Phase 5: Universal Server-Side PBAC Route Enforcement & Automated 403 Audit (Row X1.4 · P1)

- [x] **X1.4-BE**: Build automated route security audit crawler
  - Inspect Express router stack in `backend/src/app.js` to ensure 100% of non-public routes mount `authenticate` and `checkPermission`
  - Ensure zero unauthenticated or unpermitted endpoints exist in the application
- [x] **X1.4-TEST**: Automated multi-role 403 Forbidden security audit matrix (`backend/tests/security.audit.test.js`)
  - Run multi-role matrix across all protected routes (`/settings`, `/roles`, `/audit-logs`, `/payroll/*`, `/employees/*`, `/leaves/*`, `/attendance/*`)
  - Assert Super Admin succeeds on administrative endpoints
  - Assert HR Manager receives 403 on Super Admin settings and audit logs
  - Assert Department Manager receives 403 on payroll and financial endpoints
  - Assert Employee receives 403 on all peer data and management endpoints
  - Assert unauthenticated requests receive 401 Unauthorized across all endpoints

---

## Phase 6: Advanced Perimeter Defenses: Rate Limiting, NoSQL Sanitizer & Helmet (Row X1.5 · P1)

- [x] **X1.5-BE**: Configure security middlewares in `backend/src/middlewares/`
  - Create `sanitize.js` to recursively strip MongoDB query selector keys (`$ne`, `$gt`, `$regex`, `$where`) and parameter pollution keys containing `.`
  - Create `rateLimiter.js` with standardized `express-rate-limit` instances using `standardHeaders: 'draft-8'` and `legacyHeaders: false`:
    - Global API: 500 requests per 15 minutes per IP
    - Auth Limiter: 10 requests per 15 minutes per IP
    - Export Limiter: 30 requests per minute
  - Configure `helmet` in `backend/src/app.js` with `crossOriginResourcePolicy: { policy: 'same-site' }`, nosniff, and frameguard
- [x] **X1.5-TEST**: Perimeter defense integration tests (`backend/tests/perimeter.test.js`)
  - Test NoSQL operator payloads are sanitized and stripped before reaching service queries
  - Test rate limit triggers `429 Too Many Requests` when threshold is exceeded, returning `RateLimit-*` headers
  - Verify Helmet security headers are present on all responses (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`)

---

## Phase 7: Ephemeral Signed File Streaming for Vault Documents & Medical Certs (Row X1.6 · P1)

- [x] **X1.6-BE**: Implement signed expiring file download service in `backend/src/modules/files/`
  - Create `file.service.js` with `generateSignedFileUrl(filePath, expiresInSeconds=300)` generating HMAC-SHA256 signatures with expiration timestamps
  - Implement `verifySignedFileUrl(filePath, expiresAt, signature)` using `crypto.timingSafeEqual`
  - Create `file.controller.js` and `file.routes.js` mounting `GET /api/v1/files/download` and `GET /api/v1/files/signed-url`
  - Mount `/api/v1/files` in `backend/src/app.js`
- [x] **X1.6-FE**: Integrate signed download flows into document vault and leave attachments
  - Update employee document viewer and leave medical cert links to fetch ephemeral signed URLs before initiating download
- [x] **X1.6-TEST**: Signed file download integration tests (`backend/tests/files.test.js`)
  - Verify valid signed URL within 5 minutes streams the file with 200 OK and attachment header
  - Verify expired signed URL (> 5 minutes) returns 403 Forbidden
  - Verify tampered URL signature returns 403 Forbidden

---

## Phase 8: High-Density Performance Optimization & 500-Employee Benchmark (Row X1.8 · P1)

- [x] **X1.8-BE**: Database indexes audit & benchmark script in `backend/src/scripts/`
  - Verify compound indexes exist for high-volume collections (`employees`, `attendances`, `leaves`, `payrollruns`, `auditlogs`)
  - Create `benchmarkPerformance.js` seeding 500 employees, 30 days of attendance, and 12 payroll runs
  - Benchmark latency for:
    - `GET /api/v1/employees?page=1&limit=20` (< 1,000ms)
    - `GET /api/v1/dashboard/admin` (< 2,000ms)
    - `GET /api/v1/reports/attendance` (< 2,500ms)
- [x] **X1.8-TEST**: Automated performance assertion test (`backend/tests/performance.test.js`)
  - Execute benchmark suite and assert all endpoint response times stay strictly under the 3,000ms threshold

---

## Phase 9: Automated Database Backup & Validated Restore Pipeline (Row X1.7 · P2)

- [x] **X1.7-BE**: Implement restore verification script in `backend/src/scripts/`
  - Create `verifyRestore.js` script:
    - Generates or takes existing backup archive
    - Restores into isolated verification database (`hrm_restore_verification`)
    - Validates collection document counts and index parity against production schema
    - Drops `hrm_restore_verification` upon successful verification
- [x] **X1.7-TEST**: Database restore verification test (`backend/tests/backup.restore.test.js`)
  - Run `verifyRestore.js` programmatically and assert clean exit code 0 with 100% data parity

---

## Phase 10: Multi-Device Responsive Viewport & Touch Optimization (Row X1.9 · P2)

- [x] **X1.9-FE**: Frontend responsive review & CSS adjustments
  - Audit all core layouts (`DashboardPage`, `EmployeesPage`, `AttendancePage`, `LeavesPage`, `PayrollPage`, `AuditLogsPage`)
  - Ensure zero horizontal overflow on 390px (Mobile), 768px (Tablet), and 1280px (Desktop)
  - Ensure minimum touch target size of 44x44px for buttons, select inputs, and date pickers
- [x] **X1.9-TEST**: Automated viewport tests via Playwright (`frontend/tests/responsive.spec.js`)
  - Resize viewports to 390px, 768px, and 1280px
  - Assert `document.body.scrollWidth === window.innerWidth` across all main views

---

## Phase 11: Consolidated Multi-Role Test Suite & Phase 1 Quality Gate Sign-Off (Row X1.10 · P1)

- [x] **X1.10-TEST**: Consolidated test suite execution & CI verification
  - Run all Vitest calculation tests and Supertest API tests across all 12 modules
  - Verify 100% tests pass with 0 failures, clean database isolation, and no memory leaks
- [x] **X1.11-E2E**: Module X1 end-to-end Playwright test, chaaron roles se
  - Super Admin: Inspect audit logs, filter by module, view before/after diff modal, verify backup creation
  - HR Manager: Verify 403 on audit logs, test soft-delete employee with active query exclusion
  - Department Manager: Verify 403 on payroll and audit logs, verify team scope isolation
  - Employee: Verify 403 on administrative endpoints, test signed file download of own documents
  - Verify complete green pass across all browser flows
