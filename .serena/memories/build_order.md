# HRM System — Build Order & Execution Roadmap

The implementation follows the strict sequential build order defined in `docs/BUILD-GUIDE.md`. Every feature must be executed as a complete **Vertical Slice** (Backend API + Frontend UI + Verification Test together) before proceeding to the next.

### Phase 1: Core Foundation & MVP Launch Scope (P1)
- **Step 0: M0 Foundation** — Express server setup, MongoDB & Redis connection, environment validation, uniform API response `{ success, data, message, meta }`, `ApiError` & error handling middleware, Zod validation middleware, Multer/Cloudinary uploads, pagination helper, audit log service, common email/PDF/Excel services, BullMQ queues, Socket.io setup, AppLayout with responsive sidebar/topbar, Swagger docs, Helmet/CORS security.
- **Step 1: M1 Authentication** — JWT access + refresh tokens in httpOnly cookies, password hashing with bcrypt, 2FA OTP verification, password reset workflow.
- **Step 2: M26 Roles & Permissions (RBAC)** — CASL permission catalogue, role schema with granular scopes (`own`, `team`, `department`, `all`), dynamic ability generation, role management UI, `Can` component integration.
- **Step 3: M2 Company Settings** — Company profile, working hours, grace minutes, leave quotas, Pakistan FBR tax slabs configuration, geo-fence definitions.
- **Step 4: M4 Organization** — Departments hierarchy, designations with pay grades, shift templates, interactive D3/SVG Org Chart tree.
- **Step 5: M3 Employee Management** — Full employee lifecycle, encrypted CNIC and bank data, document upload vault, Excel bulk import/export, manager mapping.
- **Step 6: M8 Notifications & Announcements** — Real-time notification drawer (Socket.io), broadcast company announcements, email trigger jobs.
- **Step 7: M5 Attendance & Shifts** — Web clock-in/out, late arrival & overtime calculations, attendance correction requests with manager approval, monthly attendance locking.
- **Step 8: M6 Leave & Holidays** — Leave types, employee balance tracking, multi-tier approval chains, company holiday calendar.
- **Step 9: M9 Payroll & Pakistan Statutory Compliance** — Salary structures, monthly payroll run engine, FBR income tax slabs (annual tax divided by 12), EOBI statutory deductions, automated PDF payslips, bank transfer advice export.
- **Step 10: M7 Dashboard & Reports** — Executive & HR analytics, real-time headcount and attendance widgets, PDF/Excel reports.
- **Step 11: X1 Security, Audit & Quality** — Full Phase 1 audit log inspection, permission boundaries stress-testing, automated API & E2E verification.

### Phase 2: Finance, Smart Attendance & Office Operations (P2)
- **Step 12: M10 Loans & Advances + M11 Expense Claims** — Loan disbursements & payroll deductions; employee expense reimbursements with receipt capture.
- **Step 13: M14 GPS + M13 QR + M12 Face Recognition** — Geo-fenced mobile attendance, kiosk dynamic QR scanning, browser face matching (`@vladmandic/face-api`).
- **Step 14: M23 Assets + M18 Onboarding & Offboarding** — Company asset custody tracking; digital onboarding checklists and exit clearance.
- **Step 15: M19 Performance + M22 Projects & Timesheets** — Appraisal cycles with OKR scoring; project task timesheets and billable hours.

### Phase 3: AI Intelligence
- **Step 16: M15 Recruitment + M16 Chatbot + M17 Attrition Risk** — AI resume parsing/scoring, policy query chatbot, predictive attrition analytics.

### Phase 4: Engagement & Platform Polish
- **Step 17: M20 Rewards + M21 Grievances + M24 Chat + M25 Training** — Peer kudos, anonymous grievance reporting, internal Socket.io chat, training module.
- **Step 18: X2 Urdu Localization + PWA + Dark Mode + Performance Tuning** — i18next Urdu/English toggle, installable PWA manifest, dark theme, query optimization.

### The 10-Step Vertical Slice Law (per feature)
1. Backend: Mongoose Model fields.
2. Backend: Zod validation schemas.
3. Backend: Service function (business logic + audit log).
4. Backend: Controller + Route with `authenticate` -> `validate` -> `checkPermission`.
5. Backend: API test (happy path, validation error 400, unauthorized 403).
6. Frontend: RTK Query endpoint hook.
7. Frontend: UI Page/Component with loading, empty, and error states.
8. Frontend: Action buttons guarded via CASL `Can` component.
9. Frontend: Route & sidebar menu registration.
10. Test & Commit: Multi-role verification in browser, then Git commit.

Refer to `mem:overview`, `mem:modules_list`, and `mem:architecture`.
