# Phase 1: Core HR & Payroll — Execution Status & Roadmap Tracking

## Completed & Verified Modules (9 / 12)
1. **M0 Foundation (Section 3 · Rows 0.1 - 0.14):** Express app, MongoDB replica set, Redis cache, Zod validation, Multer storage, standard envelope, centralized errorHandler, BullMQ queues, Socket.io, React+Vite AppLayout, Helmet, CORS, rate-limit.
2. **M1 Authentication & Access Control (Section 4 · Rows 1.1 - 1.14):** JWT access + rotating refresh token, brute-force lockout, 2FA email OTP, forced password reset, session revocation, login history.
3. **M26 Roles & Permissions / RBAC (Section 5 · Rows 26.1 - 26.17):** CASL PBAC, 4 core system roles, data scopes, field-level masking, permission matrix, approval limits, role cloning, temporal delegations.
4. **M2 Company Settings (Section 6 · Rows 2.1 - 2.11):** Key-value settings model, company profile & logo, working days & office hours, late-arrival rules, leave policy, payroll cycle dates, FBR tax slabs, EOBI/PESSI/PF settings, geo-fence editor, templates builder, database backup.
5. **M4 Departments, Designations, Shifts & Org Chart (Section 7 · Rows 4.1 - 4.7):** Department CRUD, department heads, designations with grade tiers, shifts, Org Chart tree, manager team view, employee reporting line view.
6. **M3 Employee Management (Section 8 · Rows 3.1 - 3.17):** Encrypted CNIC & bank data, employee onboarding wizard, masked CNIC validation, scoped employee list, multi-tab profile, job history, salary history, skills tags, Excel bulk import, document vault, probation alerts.
7. **M8 Notifications & Announcements (Section 9 · Rows 8.1 - 8.8):** Multi-channel notify service (Socket.io + in-app bell + email/WhatsApp templates), user notification preferences, audience-targeted announcements, notice board pin, read receipts.
8. **M5 Attendance & Shifts (Section 10 · Rows 5.1 - 5.15):** Attendance check-in/out, breaks, late/early calculation, overtime, WFH request workflow, monthly attendance calendar, manager team view, attendance corrections, auto-absent cron, monthly attendance lock, Excel export.
9. **M6 Leave & Holidays (Section 11 · Rows 6.1 - 6.15):** Leave types CRUD, annual quota & carry forward rollover, leave apply, half-day leaves, medical certificate upload, multi-tier approval chains (Manager -> HR -> Admin), approve/reject, cancellation & quota rollback, live balance cards, team leave calendar, Pakistan gazetted & lunar holidays, attendance on_leave sync, leave encashment, HR balance override with audit log, ExcelJS leave report export. Verified 100% via Playwright MCP & Vitest.

## Next Up in Phase 1 (Remaining 3 Modules)
1. **M9 Payroll (+ Pakistan Statutory Compliance) (Section 12 · Rows 9.1 - 9.17):** Salary structures, increments, earnings, deductions, FBR income tax slabs, EOBI, PESSI, PF, gratuity, BullMQ payroll generation, payslips, bank transfer advice.
2. **M7 Dashboard & Reports (Section 13 · Rows 7.1 - 7.8):** 8 features
3. **X1 Security, Audit & Quality Gate (Section 14 · Rows X1.1 - X1.10):** 10 features
