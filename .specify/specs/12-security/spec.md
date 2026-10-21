# Feature Specification: Module X1 — Security, Audit & Quality Gate

**Feature Branch**: `feature/12-Security`  
**Created**: 2026-10-21  
**Status**: Ready for Architectural Planning & Implementation  
**Module ID**: X1  
**Module Name**: Security, Audit & Quality Gate (Phase 1 Final Gate · Launch Scope P1/P2)  
**Spec Folder**: `.specify/specs/12-security`  
**Governing Documents**:
- [`docs/FRD.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/FRD.md) Section 11 (Permission Matrix), Section 12 (Non-functional Requirements) & Section 13 (Development Roadmap)
- [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 14 (Rows X1.1 to X1.10)
- [`docs/TECH-SPEC.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/TECH-SPEC.md) Sections 1, 3, 5, 6, 8 & 11
- Context7 Official Docs: `express-rate-limit` (`/express-rate-limit/express-rate-limit`), `helmet` (`/helmetjs/helmet`), Node.js `crypto` (AES-256-GCM)

---

## 1. Executive Summary & Architecture Integration

Module X1 is the concluding security, compliance, auditability, and quality validation gate for Phase 1 (Core HR & Payroll). As mandated by FRD Section 12, HR and payroll systems handle sensitive personal identity records (CNIC), banking credentials (IBAN, bank accounts), and proprietary compensation figures; therefore, security and data integrity are strict launch prerequisites.

Module X1 ensures:
1. **Auditability (X1.1)**: Full-featured audit log inspection screen (`AuditLogsPage.jsx` at `GET /api/v1/audit-logs`) with structured before/after diff visualization, filtering by actor, module, action, date range, and target entity.
2. **Data Immutability & Soft Deletes (X1.2)**: System-wide soft deletes (`isDeleted`, `deletedAt`, `deletedBy`) with automatic query isolation, plus a strict cryptographic and transactional lock blocking deletion or alteration of finalized (`approved` or `paid`) payroll runs.
3. **Encryption at Rest (X1.3)**: Verification of AES-256-GCM encryption for CNIC, bank credentials, and compensation figures across MongoDB collections (`employees`, `salarystructures`, `payslips`).
4. **Universal PBAC & 403 Security Audit (X1.4)**: Comprehensive automated verification that 100% of API endpoints enforce `authenticate` and `checkPermission`, accompanied by an automated multi-role 403 Forbidden audit test matrix.
5. **Perimeter Defense & Sanitization (X1.5)**: Standardized Express middleware configuration with `helmet` v8 security headers, `express-rate-limit` (draft-8 standard headers), input sanitization blocking NoSQL injection (`$ne`, `$gt`, regex), and XSS prevention.
6. **Private Document Storage (X1.6)**: Ephemeral, time-limited signed URL generation for employee vault documents and medical certificates, rendering old or tampered URLs inaccessible.
7. **Disaster Recovery (X1.7)**: Automated database backup and restore test suite validating zero data corruption or schema deviation post-recovery.
8. **Scalability & Performance (X1.8)**: Query optimization, database indexing, and lean projections benchmarked against a 500-employee synthetic dataset ensuring API latency stays under 3 seconds.
9. **Responsive Multi-Device Layout (X1.9)**: Complete viewport audit ensuring flawless layout rendering and touch interaction across Mobile (390px), Tablet (768px), and Desktop (1280px).
10. **Phase 1 Quality Gate Sign-Off (X1.10)**: 100% green execution of the consolidated test suite (Vitest calculation engines, Supertest API validations, and Playwright end-to-end multi-role tests).

```mermaid
flowchart TD
    subgraph Client [Frontend UI Layer (React 18 + Tailwind)]
        AuditUI[AuditLogsPage.jsx: Before/After Diff Viewer]
        RespGate[Responsive Shell: 390px / 768px / 1280px]
        FileDownloader[Secure File Viewer: Signed Temporary URLs]
    end

    subgraph SecurityGate [Perimeter & Middleware Guard]
        HelmetMW[Helmet: Security Headers & CSP]
        RateLimitMW[express-rate-limit: standardHeaders draft-8]
        SanitizeMW[NoSQL Injection & XSS Sanitizer]
        AuthGate[authenticate: JWT Access Token]
        PBACGate[checkPermission: Matrix Scope Enforcer]
    end

    subgraph ApplicationServices [Core Business Logic]
        AuditSvc[audit.service.js: Immutable Log Stream]
        LockEngine[payroll.service.js: Finalized Run Delete Lock]
        CryptoEngine[crypto.util.js: AES-256-GCM Decrypt/Encrypt]
        FileSigner[file.service.js: HMAC-Signed Expiring URLs]
    end

    subgraph Storage [Database & Persistence]
        AuditCol[(auditlogs Collection)]
        SoftDelCol[(Collections with isDeleted filter)]
        EncryptedFields[(Encrypted CNIC, Bank, Salary)]
        BackupArchive[(Compressed DB Backup Archive)]
    end

    Client --> SecurityGate
    SecurityGate --> ApplicationServices
    ApplicationServices --> Storage
```

---

## 2. Context7 Verified Syntax Patterns

### 2.1 Express Rate Limiting (`express-rate-limit` v7/v8)
Verified official pattern using `standardHeaders: 'draft-8'` and `legacyHeaders: false`:
```javascript
import { rateLimit } from 'express-rate-limit';

export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500, // 500 requests per 15 minutes per IP
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
```

### 2.2 Helmet Security Headers (`helmet` v8)
Verified official pattern with Cross-Origin Resource Policy:
```javascript
import helmet from 'helmet';

export const configureSecurityHeaders = (app) => {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-site' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", 'http://localhost:5000', 'ws://localhost:5000']
        }
      }
    })
  );
};
```

### 2.3 Ephemeral File Signing (Node.js `crypto` HMAC)
Signed URL pattern with expiration timestamp and HMAC-SHA256 signature:
```javascript
import crypto from 'crypto';
import { env } from '../config/env.js';

export const generateSignedFileUrl = (filePath, expiresInSeconds = 300) => {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${filePath}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', env.JWT_SECRET).update(payload).digest('hex');
  return `/api/v1/files/download?path=${encodeURIComponent(filePath)}&expires=${expiresAt}&signature=${hmac}`;
};

export const verifySignedFileUrl = (filePath, expiresAt, signature) => {
  if (Math.floor(Date.now() / 1000) > Number(expiresAt)) return false;
  const payload = `${filePath}:${expiresAt}`;
  const expectedHmac = crypto.createHmac('sha256', env.JWT_SECRET).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedHmac, 'hex'));
};
```

---

## 3. Prioritized User Stories

### User Story 1 (P1 · X1.1): Comprehensive Immutable Audit Log Explorer
**BUILD-GUIDE Reference**: Row X1.1 (`GET /api/v1/audit-logs`, `audit.view`, `AuditLogsPage.jsx`)  
**As a** Super Admin,  
**I want** a dedicated Audit Logs interface where I can filter and inspect every create, edit, delete, and security event across the platform with visual before/after state diffs,  
**So that** full operational transparency and forensic traceability are guaranteed for regulatory compliance.

#### Acceptance Criteria
- **Super Admin**:
  - Given an authenticated Super Admin on `AuditLogsPage.jsx`,
  - When accessing the screen,
  - Then the system renders a paginated table displaying `timestamp`, `actorEmail`, `actorRole`, `action`, `module`, and `targetModel`.
  - When clicking "View Diff" on a modified record,
  - Then a modal displays the exact property-level `before` vs `after` changes (e.g. salary changed from 85,000 to 95,000, or role permissions updated).
  - When applying filters (`module`, `action`, `actorId`, `startDate`, `endDate`),
  - Then the server returns strictly matched records within 500ms.
- **HR Manager, Department Manager & Employee**:
  - Given an authenticated HR Manager, Department Manager, or Employee attempting to call `GET /api/v1/audit-logs` or navigate to `/audit-logs`,
  - When the request is evaluated,
  - Then the server immediately returns `403 Forbidden` (`audit.view` denied) and the frontend hides the navigation menu item.

---

### User Story 2 (P1 · X1.2): Universal Soft Deletes & Finalized Payroll Immutability Lock
**BUILD-GUIDE Reference**: Row X1.2 (All models `isDeleted`; locked finalized payroll runs)  
**As a** System Auditor and Company Stakeholder,  
**I want** employee, department, and transaction records to be soft-deleted rather than permanently purged, and finalized payroll batches to be locked against deletion,  
**So that** accidental data loss is prevented and accounting records remain immutable.

#### Acceptance Criteria
- **Super Admin**:
  - Given a Super Admin attempting to delete an employee, department, or leave record,
  - When executing the delete API,
  - Then the record is marked with `isDeleted: true`, `deletedAt: new Date()`, `deletedBy: req.user._id`, and all standard query lookups exclude soft-deleted records.
  - Given a payroll run in `approved` or `paid` status,
  - When a Super Admin calls `DELETE /api/v1/payroll/runs/:id`,
  - Then the request is rejected with `400 Bad Request` ("Cannot delete finalized or approved payroll run").
- **HR Manager & Department Manager**:
  - Given an HR Manager or Department Manager,
  - When attempting to delete a finalized payroll run,
  - Then the request is rejected with `403 Forbidden` or `400 Bad Request`.
- **Employee**:
  - Given a regular Employee,
  - When calling any soft-delete endpoint,
  - Then the request returns `403 Forbidden`.

---

### User Story 3 (P1 · X1.3): Multi-Tier Encryption at Rest for PII & Financial Data
**BUILD-GUIDE Reference**: Row X1.3 (Encryption at rest for CNIC, bank credentials, salary)  
**As an** Information Security Officer,  
**I want** national identity numbers (CNIC), bank account numbers, IBANs, and base salaries encrypted using AES-256-GCM in MongoDB,  
**So that** raw sensitive data is never visible in plaintext in database dumps or compromised storage.

#### Acceptance Criteria
- **Super Admin & HR Manager**:
  - Given authorized actors accessing an employee profile,
  - When the API retrieves the data,
  - Then the service layer transparently decrypts the ciphertext into formatted values (`35201-1234567-1`, `PK36MEZN...`) for authorized roles, while logging the access event.
- **Direct Database Query**:
  - Given a raw query executed directly on MongoDB (e.g. via Mongo shell or database client),
  - When inspecting the `employees` and `salarystructures` collections,
  - Then `cnic`, `bankAccount`, and `salary` fields contain unreadable ciphertext strings with distinct initialization vectors (`iv`) and authentication tags (`authTag`).
- **Department Manager**:
  - Given a Department Manager viewing team members,
  - When viewing employee records,
  - Then salary and bank credentials are completely masked or omitted from the JSON payload.
- **Employee**:
  - Given an Employee viewing their own profile,
  - When viewing personal data,
  - Then their own CNIC and bank info are displayed; peer data is strictly inaccessible (403).

---

### User Story 4 (P1 · X1.4): Universal Server-Side PBAC Route Enforcement & Automated 403 Security Audit
**BUILD-GUIDE Reference**: Row X1.4 (checkPermission on every route; automated 403 test matrix)  
**As a** Quality Assurance Engineer,  
**I want** an automated test suite verifying that 100% of registered Express API routes enforce authentication and granular permission checks,  
**So that** no unprotected backdoor or horizontal privilege escalation exists across the backend.

#### Acceptance Criteria
- **Super Admin**:
  - Given a Super Admin with `manage: all`,
  - When accessing system routes,
  - Then requests succeed with valid credentials.
- **Department Manager & Employee**:
  - Given unauthorized roles calling administrative endpoints (e.g. `/api/v1/settings`, `/api/v1/roles`, `/api/v1/audit-logs`, `/api/v1/payroll/generate`),
  - When executing HTTP requests without the corresponding permissions,
  - Then every single route returns `403 Forbidden` with `{ success: false, message: 'Forbidden' }`.
- **Unauthenticated Requests**:
  - Given requests without a valid Bearer JWT token,
  - When targeting any protected route,
  - Then every route returns `401 Unauthorized`.

---

### User Story 5 (P1 · X1.5): Advanced Perimeter Defenses: Rate Limiting, NoSQL Injection, Helmet & XSS Prevention
**BUILD-GUIDE Reference**: Row X1.5 (Middlewares, rate limiting, NoSQL sanitize, XSS escaping)  
**As a** Security Architect,  
**I want** perimeter middlewares that block NoSQL operator injection, limit brute-force floods, enforce secure HTTP headers, and eliminate XSS vectors,  
**So that** the application resists automated web vulnerability scans and OWASP Top 10 exploits.

#### Acceptance Criteria
- **All Roles & Public Callers**:
  - Given an actor sending malicious payloads with MongoDB operator keys (`{ "$gt": "" }`, `{ "$ne": null }`, `{ "$regex": ".*" }`),
  - When the request passes through the Express middleware pipeline,
  - Then input sanitization strips or escapes operators, preventing unauthorized query manipulation.
  - Given repeated rapid requests exceeding rate limits (e.g. > 100 requests in 15 minutes on auth or > 30 requests/min on exports),
  - Then the server responds with `429 Too Many Requests` with standard `RateLimit-*` headers.
  - Given all outgoing HTTP responses,
  - Then `Helmet` sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict `Cross-Origin-Resource-Policy`.

---

### User Story 6 (P1 · X1.6): Ephemeral Signed Access for Private Vault Documents & Medical Certs
**BUILD-GUIDE Reference**: Row X1.6 (Private signed expiring links for vault documents)  
**As an** HR Manager or Employee,  
**I want** private documents (CNIC scans, medical certificates, degrees) accessible only via signed, time-limited URLs,  
**So that** document URLs cannot be harvested, shared publicly, or accessed after expiration.

#### Acceptance Criteria
- **Super Admin & HR Manager**:
  - Given an authorized HR Manager viewing an employee document or leave medical certificate,
  - When clicking to download or preview the attachment,
  - Then the system issues a signed URL containing an expiry timestamp (e.g. 5 minutes) and an HMAC-SHA256 signature.
  - When requesting the file within the 5-minute window,
  - Then the server streams the file successfully.
- **Expired & Tampered URLs**:
  - Given a signed file URL where the timestamp has elapsed or the signature was altered,
  - When requesting the URL,
  - Then the server immediately returns `403 Forbidden` ("Link has expired or signature is invalid").
- **Department Manager**:
  - Given a Department Manager,
  - When requesting leave medical certificates for their own team members,
  - Then valid signed URLs are generated; requests for non-team members return `403 Forbidden`.
- **Employee**:
  - Given an Employee,
  - When requesting their own documents,
  - Then signed links are generated; requesting peer documents returns `403 Forbidden`.

---

### User Story 7 (P2 · X1.7): Automated Database Backup & Validated Recovery/Restore Pipeline
**BUILD-GUIDE Reference**: Row X1.7 (2.10 backup + restore script, restore test verify)  
**As a** System Administrator,  
**I want** an automated database backup routine and a reliable restore verification script,  
**So that** backup archives can be restored into an isolated verification database to confirm zero data corruption.

#### Acceptance Criteria
- **Super Admin**:
  - Given a Super Admin calling the backup endpoint or running the backup script,
  - When the backup executes,
  - Then a compressed `.tar.gz` archive containing BSON dumps of all Phase 1 collections is created in the secure backup repository, and an audit log entry is recorded.
  - When running the automated restore verification script (`node src/scripts/verifyRestore.js`),
  - Then the script restores the archive into a temporary test database, counts documents across all collections, validates schema integrity, drops the temporary database, and reports a clean pass.
- **Other Roles**:
  - Non-admin roles calling the backup or restore endpoints receive `403 Forbidden`.

---

### User Story 8 (P1 · X1.8): High-Density Performance Optimization & 500-Employee Benchmark
**BUILD-GUIDE Reference**: Row X1.8 (Indexes, pagination, lean queries, <3s response on 500 employees)  
**As an** Executive or System User,  
**I want** all paginated list screens, dashboard aggregations, and report exports to load in under 3 seconds with 500 employees in the database,  
**So that** the system feels snappy, responsive, and production-ready under enterprise workloads.

#### Acceptance Criteria
- **All Roles**:
  - Given a seeded test environment containing 500 employees, 30 days of daily attendance punches, and 12 months of payroll runs,
  - When loading the Employee Directory (`GET /api/v1/employees?page=1&limit=20`),
  - Then the API response time is strictly under 1,000ms.
  - When loading the Super Admin Dashboard (`GET /api/v1/dashboard/admin`),
  - Then the consolidated aggregation pipeline executes and responds in under 2,000ms.
  - When querying the Reports Console (`GET /api/v1/reports/attendance`),
  - Then the indexed pipeline responds in under 2,500ms.
  - Given database queries across large collections,
  - Then `explain('executionStats')` confirms index scans (`IXSCAN`) without full collection scans (`COLLSCAN`).

---

### User Story 9 (P2 · X1.9): Multi-Device Responsive Viewport & Touch Optimization
**BUILD-GUIDE Reference**: Row X1.9 (Responsive on mobile 390px, tablet 768px, desktop 1280px)  
**As a** Mobile-First Employee or Field Manager,  
**I want** every core screen to adapt smoothly to mobile and tablet screen sizes,  
**So that** I can punch attendance, apply for leaves, and approve requests on smartphones without layout breaks or horizontal scrolling.

#### Acceptance Criteria
- **All Roles**:
  - Given viewports resized to standard mobile width (390px),
  - When navigating through Dashboard, Attendance, Leave, Payslips, and Settings,
  - Then the UI displays collapsible navigation sheets, stacked cards, full-width touch targets (minimum 44x44px), and zero horizontal overflow (`document.body.scrollWidth === window.innerWidth`).
  - Given an employee on mobile,
  - When punching attendance check-in or submitting a leave request,
  - Then forms and dialogs render cleanly within the viewport.
  - Given viewports resized to tablet width (768px),
  - Then two-column responsive grids adjust seamlessly.

---

### User Story 10 (P1 · X1.10): Consolidated Multi-Role Test Suite & Phase 1 Quality Gate Sign-Off
**BUILD-GUIDE Reference**: Row X1.10 (Vitest calculations, Supertest APIs, Playwright multi-role, CI green)  
**As the** Lead Engineer,  
**I want** the complete automated test suite across all 11 modules to run green in CI,  
**So that** Phase 1 can be formally signed off and delivered to the client with absolute confidence.

#### Acceptance Criteria
- **Continuous Integration Gate**:
  - Given execution of `npm test` across backend and frontend,
  - When all Vitest, Supertest, and Playwright tests execute,
  - Then 100% of test suites pass with 0 failures, 0 unhandled promise rejections, and clean teardowns.
  - Given multi-role Playwright flows (Super Admin, HR Manager, Department Manager, Employee),
  - When verifying end-to-end user journeys (login, attendance punch, leave application, leave approval, payroll generation, payslip download, report export, audit log inspection),
  - Then all browser assertions pass green.

---

## 4. Permission Catalogue Updates (`permissions.js`)

To support Row X1.1, the master permission catalogue in `backend/src/shared/permissions.js` must be updated with the `audit` module:

```javascript
{
  module: 'audit',
  label: 'Audit & Compliance Logging',
  subject: 'AuditLog',
  description: 'Forensic inspection of immutable system audit trails and data diffs.',
  actions: [
    {
      action: 'audit.view',
      label: 'View Audit Logs',
      description: 'Access the system audit log screen and inspect state changes.',
      allowedScopes: ['all'],
      defaultScope: 'all'
    }
  ]
}
```

---

## 5. Verification Checklist & Acceptance Gates

- [ ] **X1.1**: `GET /api/v1/audit-logs` implemented with pagination, filters, and `AuditLogsPage.jsx` with diff viewer.
- [ ] **X1.2**: Soft deletes active on models; finalized payroll runs locked against deletion.
- [ ] **X1.3**: CNIC, bank credentials, and base salaries encrypted at rest using AES-256-GCM.
- [ ] **X1.4**: Automated 403 test matrix covering all protected endpoints for unauthorized roles.
- [ ] **X1.5**: Middlewares configured: `helmet` v8, `express-rate-limit` (draft-8), NoSQL injection prevention.
- [ ] **X1.6**: Expiring signed file download URLs with HMAC-SHA256 signatures.
- [ ] **X1.7**: Automated database backup and restore verification script.
- [ ] **X1.8**: Performance benchmark on 500 seeded employees (< 3s response times).
- [ ] **X1.9**: Viewport tests at 390px, 768px, and 1280px with zero horizontal scroll.
- [ ] **X1.10**: Full test suite passing 100% green across Vitest, Supertest, and Playwright.
