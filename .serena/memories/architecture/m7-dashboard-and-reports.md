# Architecture Decision Record: Module M7 (Dashboard & Reports)

## 1. Overview
Module M7 delivers tailored, role-specific executive and operational dashboards along with a multi-axis aggregation and streaming reporting engine. Strict PBAC, zero financial leakage to managers, and tenant/department scoping are enforced at the service level.

## 2. Components & Endpoints
- **Endpoints**:
  - `GET /api/v1/dashboard/admin`: Executive stats (headcount, attendance, pending approvals, monthly payroll costs, department cost distribution).
  - `GET /api/v1/dashboard/hr`: Operational stats (headcount, attendance breakdown, pending approvals queue, today on leave, upcoming birthdays, probation reviews).
  - `GET /api/v1/dashboard/manager`: Departmental team metrics (team count, present/absent, pending leaves/corrections, team overtime hours). Strictly omits financial/salary details.
  - `GET /api/v1/dashboard/employee`: Self-service snapshot (today check-in/out, live break state, leave balances, latest payslip overview, pinned announcements).
  - `GET /api/v1/reports/:type`: Multi-axis reporting (attendance, leaves, payroll, headcount, turnover, department-cost) with date, department, and employee filtering.
  - `GET /api/v1/reports/:type/export`: Streaming ExcelJS (.xlsx) and PDFKit (.pdf) exports with PBAC check `report.export` and audit logging.
  - Route order invariant: Specific report routes (e.g., `/reports/leaves`, `/reports/tax-compliance`) are registered before parametric `/:type` in `app.js`.

## 3. Security & Hardening Invariants
1. **PBAC & RBAC Scoping**:
   - Super Admin & HR Manager: Company-wide access.
   - Department Manager: Scoped strictly to `req.user.departmentId` or supervised departments. Intersection with requested filters prevents horizontal escalation.
   - Employee: Scoped strictly to `req.user.employeeId`.
2. **Financial Data Isolation**:
   - `department-cost`, `turnover`, and `payroll` reports reject non-admin/HR callers with HTTP 403 Forbidden.
   - Manager dashboard aggregations explicitly exclude salary, compensation, and payment fields.
3. **NoSQL Injection & DoS Defense**:
   - Sanitized queries; regex strings stripped of meta-characters.
   - Hard upper limit ceiling (max 5000 records) applied to report aggregations to prevent memory exhaustion.
   - Endpoint rate-limited via express-rate-limit (30 requests / min).
4. **Client Hardening**:
   - Export buttons implement double-click disable states and a 60-second AbortController timeout.
