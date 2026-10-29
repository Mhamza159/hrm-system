# HRM System — 5-Phase Master Implementation Roadmap

Governed strictly by [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) and [`docs/TECH-SPEC.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/TECH-SPEC.md). Every feature is built and tested as a **Vertical Slice** (Backend API + Frontend UI + Multi-role Verification Test together).

---

## Phase 1: Core HR & Payroll (Launch Scope P1)
**Goal:** Establish baseline infrastructure, authentication, granular RBAC, company settings, workforce management, attendance, leave, automated payroll engine with Pakistan FBR/EOBI compliance, and executive dashboards.
**Scope:** 12 Modules / Steps · 148 Vertical Slice Features

- [x] **1. M0 Foundation** · *BUILD-GUIDE Section 3* · **14 Features (0.1 to 0.14)**
  - Express server, MongoDB & Redis connections, env loader, standard `{ success, data, message, meta }` response, `ApiError` & error handler, Zod middleware, Multer/Cloudinary uploads, pagination helper, audit log service, email/PDF/Excel services, BullMQ queues, Socket.io, React+Vite AppLayout with sidebar/topbar, Swagger docs (`/api/docs`), and security headers (Helmet, CORS, rate-limit, mongo-sanitize).
- [x] **2. M1 Authentication & Security** · *BUILD-GUIDE Section 4* · **14 Features (1.1 to 1.14)**
  - User model, JWT access (15m) + 7-day httpOnly refresh token, account lockout (5 failed attempts), token rotation, logout, `GET /auth/me`, forgot/reset password email OTP, force password change on first login, 2FA OTP, inactivity auto-logout, login history with device/IP, account activation toggle, HR-triggered password reset.
- [x] **3. M26 Roles & Permissions (RBAC)** · *BUILD-GUIDE Section 5* · **17 Features (26.1 to 26.17)**
  - Permission catalogue, 4 default roles seed (Super Admin, HR Manager, Department Manager, Employee), `checkPermission` CASL middleware, data scope filter (`own`/`team`/`department`/`all`), field-level masking (salary, CNIC, bank), UI `Can` component and sidebar filter, custom role CRUD, visual permission matrix screen, approval limits, role cloning, multi-role assignment, delegation of approval authority, effective permissions inspector, permission audit logging, employee "My Access" tab.
- [x] **4. M2 Company Settings** · *BUILD-GUIDE Section 6* · **11 Features (2.1 to 2.11)**
  - Settings key-value model, company profile & logo upload, working days & office hours, late-arrival rules & penalty deductions, leave policy definitions, payroll cycle dates, FBR salaried tax slab table editor, EOBI/PESSI/PF settings, single office geo-fence coordinates (Leaflet map editor), email/WhatsApp template builder, database backup job & manual trigger, public policies page.
- [x] **5. M4 Departments, Designations, Shifts & Org Chart** · *BUILD-GUIDE Section 7* · **7 Features (4.1 to 4.7)**
  - Department CRUD with employee deletion protection, department head assignment, designations with grade tiers, shift definitions (fixed, flexible, night), interactive tree Org Chart, manager team view, employee reporting line view.
- [x] **6. M3 Employee Management** · *BUILD-GUIDE Section 8* · **17 Features (3.1 to 3.17)**
  - Employee model with encrypted CNIC & bank data, employee onboarding + user account creation + welcome email, 13-digit masked CNIC validation & expiry alerts, scoped employee list with filters, multi-tab employee profile, edit profile, status transition (active, notice, resigned, terminated), soft-delete archive, document vault with private expiring links, job history timeline, salary history, skills tags, Excel bulk import with row-level validation, Excel export, "My Profile" page, employee profile change requests with HR approval, probation end notification cron.
- [x] **7. M8 Notifications & Announcements** · *BUILD-GUIDE Section 9* · **8 Features (8.1 to 8.8)**
  - Multi-channel notify service (Socket.io + Email + WhatsApp), in-app notification bell with unread badge & drawer, automated transactional email alerts, optional WhatsApp notification integration, notification preferences panel, company & department announcements, pinned announcement cards on dashboard, read receipts tracking.
- [x] **8. M5 Attendance & Shifts** · *BUILD-GUIDE Section 10* · **15 Features (5.1 to 5.15)**
  - Daily attendance model (unique employee + date), shift assignment, web check-in, web check-out, break tracking, late/early/half-day rule calculations, overtime calculation, manager-approved WFH requests, monthly color-coded attendance calendar, manager team attendance view, HR attendance admin edit with reason & audit log, missed-punch correction requests with approval workflow, nightly auto-absent cron, monthly attendance lock before payroll, attendance Excel report.
- [x] **9. M6 Leave & Holidays** · *BUILD-GUIDE Section 11* · **15 Features (6.1 to 6.15)**
  - Leave types CRUD, yearly quota allocation & carry-forward cron, leave application with validation, half-day leaves, mandatory medical certificate attachment for sick leaves, multi-level approval chain, approve/reject with comment, employee cancellation with balance restoration, leave balance summary cards, team leave conflict calendar, Pakistan gazetted holiday calendar, automatic attendance marking on approved leaves, year-end leave encashment calculation, HR manual balance override with audit log, leave Excel report.
- [ ] **10. M9 Payroll (+ Pakistan Statutory Compliance)** · *BUILD-GUIDE Section 12* · **17 Features (9.1 to 9.17)**
  - Salary structure CRUD (basic, allowances, deductions in integer paisa), mid-month salary revision with history, earnings breakdown (overtime, bonus, arrears, commission, encashment), deductions breakdown (unpaid leaves, late penalties, loans, advances), Pakistan FBR salaried income tax calculator (annual / 12), EOBI statutory deduction calculator, one-click payroll generation via BullMQ with live Socket.io progress, 4-stage workflow (Draft $\rightarrow$ Review $\rightarrow$ Approve $\rightarrow$ Paid), individual payslip adjustment in draft mode, branded PDF payslip generation, multi-channel payslip delivery (portal, email PDF, optional WhatsApp), Generic Standard Pakistani Corporate Excel advice sheet export, final settlement calculation on exit, annual income tax deduction certificate, withholding tax & EOBI reports, manager team overtime hours view, department-level payroll cost report.
- [ ] **11. M7 Dashboard & Reports** · *BUILD-GUIDE Section 13* · **8 Features (7.1 to 7.8)**
  - Role-specific executive dashboards (Super Admin, HR Manager, Department Manager, Employee), real-time KPI widgets (headcount, today's attendance, pending approvals, upcoming birthdays, open jobs, payroll expenses), comprehensive report engines (attendance, leaves, payroll, headcount, turnover, department expenses), multi-criteria filter bar, export to Excel and PDF.
- [ ] **12. X1 Security, Audit & Quality (Phase 1 Final Gate)** · *BUILD-GUIDE Section 14* · **10 Features (X1.1 to X1.10)**
  - Audit log viewer with before/after diff inspector, soft-delete enforcement & paid payroll lock, verification of AES encryption at rest (CNIC, bank, salary), server-side 403 authorization boundary testing across all endpoints, rate limiting & XSS/NoSQL sanitization audit, private document signed URL expiry verification, database backup & restore dry run, performance tuning (<3s on 500 records), full mobile & tablet responsive audit, automated test suite verification (Vitest unit calculations, Supertest API tests, Playwright key flows).

---

## Phase 2: Smart Operations (P2 Scope)
**Goal:** Expand financial self-service, deploy multi-modal smart attendance (GPS, QR, Face), and introduce asset custody, employee lifecycle onboarding/offboarding, and project time tracking.
**Scope:** 9 Modules · 67 Vertical Slice Features

- [x] **13. M10 Loans & Advances** · *BUILD-GUIDE Section 15* · **6 Features (10.1 to 10.6)**
  - Employee loan/advance application, policy limit validation, multi-tier approval workflow, installment repayment schedule, automatic monthly payroll deduction, outstanding balance tracking & early settlement.
- [ ] **14. M11 Expense Claims** · *BUILD-GUIDE Section 16* · **5 Features (11.1 to 11.5)**
  - Expense categories & monetary caps, claim submission with receipt image upload, multi-tier approval workflow, reimbursement processing (via payroll or direct), monthly expense analytics.
- [ ] **15. M14 GPS / Geo-fencing Attendance** · *BUILD-GUIDE Section 17* · **8 Features (14.1 to 14.8)**
  - Server-side Haversine distance validation, location-verified check-in against office geo-fence, accuracy & mock-GPS detection, manager-approved remote/WFH locations, client-site check-in for sales staff, flagged-punch review queue, punch location map view, privacy protection (punch-time-only location capture).
- [ ] **16. M13 QR Code Attendance** · *BUILD-GUIDE Section 18* · **6 Features (13.1 to 13.6)**
  - Office kiosk device registration, dynamic rotating QR code (auto-refreshed every 30–60s with signed token), mobile scanner check-in, device binding to employee phone, HR device binding reset, kiosk interval & toggle settings.
- [ ] **17. M12 Face Recognition Attendance** · *BUILD-GUIDE Section 19* · **9 Features (12.1 to 12.9)**
  - Client-side `@vladmandic/face-api` model loader, one-time face descriptor enrollment (3–5 captures), HR enrollment approval/re-enrollment, anti-spoofing liveness detection (blink/turn), camera-based face check-in, confidence threshold & toggle settings, suspicious attempt logging with photo capture, fallback manual correction request, manager flagged snapshot view.
- [ ] **18. M23 Asset Management** · *BUILD-GUIDE Section 20* · **6 Features (23.1 to 23.6)**
  - Hardware & software asset inventory, custodian assignment/return with history timeline, warranty & license expiration alerts, asset repair/maintenance tracking, manager asset requisition workflow, employee "My Assets" page with issue reporting.
- [ ] **19. M18 Onboarding & Offboarding** · *BUILD-GUIDE Section 21* · **11 Features (18.1 to 18.11)**
  - Onboarding checklist templates, automated checklist creation upon employee creation, task ownership & due date tracking with alerts, automated new hire welcome email, employee resignation submission, resignation decision & notice period tracking, exit clearance checklist across departments, exit interview questionnaire, automatic link to final settlement (M9), automated experience & relieving letter PDF generation, automated account deactivation on last working day.
- [ ] **20. M19 Performance & Appraisal** · *BUILD-GUIDE Section 22* · **9 Features (19.1 to 19.9)**
  - Role/designation KPI templates, quarterly/annual review cycles, goal/OKR editor, employee self-appraisal, manager review & scoring, optional 360° peer feedback, final review with salary revision recommendation draft, historical appraisal timeline on profile, review cycle completion tracking.
- [ ] **21. M22 Projects & Timesheets** · *BUILD-GUIDE Section 23* · **7 Features (22.1 to 22.7)**
  - Client & project master register, project team assignment, weekly grid timesheet entry (billable/non-billable), timesheet submission & manager approval, billable utilization analytics, project cost & profitability calculations, missing timesheet compliance tracker.

---

## Phase 3: AI Features (Intelligence Scope)
**Goal:** Integrate AI-powered workflows using OpenAI API (`gpt-4o-mini` / `gpt-4o`) via backend service adapter.
**Scope:** 3 Modules · 27 Vertical Slice Features

- [ ] **22. M15 Recruitment & AI Screening** · *BUILD-GUIDE Section 24* · **13 Features (15.1 to 15.13)**
  - Department job requisition, executive position approval, public careers page & job postings, candidate application with CV upload, AI CV parsing (skills, experience, education), AI match score & rationale against job description, Kanban candidate pipeline board, interview scheduler with interviewer evaluation forms, technical assessment links, offer letter generation, one-click conversion of hired candidate to employee with onboarding checklist, internal job board & referral submission, human-in-the-loop decision mandate (AI assists, human decides).
- [ ] **23. M16 HR Chatbot** · *BUILD-GUIDE Section 25* · **9 Features (16.1 to 16.9)**
  - Company policy document uploader & text extraction, AI chat assistant API, company handbook knowledge retrieval, personal employee data queries (leave balance, latest payslip, pay date), quick actions (apply leave, download slip), human HR hand-off for unresolved queries, bilingual English & Roman Urdu natural language understanding, chat conversation history, chatbot toggle & data access controls.
- [ ] **24. M17 Attrition Prediction** · *BUILD-GUIDE Section 26* · **5 Features (17.1 to 17.5)**
  - Weekly attrition risk calculation cron (signals: absences, tardiness, appraisal delays, survey trends, compensation stagnation), risk tier categorization (Low, Medium, High) with primary drivers, department-level retention analytics, retention recommendations & HR intervention notes, strict access scoping (confidential to HR & Super Admin).

---

## Phase 4: Engagement & Polish (P3 Scope)
**Goal:** Enhance workplace engagement, introduce internal real-time communication, provide full Urdu localization, and optimize PWA performance.
**Scope:** 5 Modules · 31 Vertical Slice Features

- [ ] **25. M20 Rewards, Celebrations & Surveys** · *BUILD-GUIDE Section 27* · **5 Features (20.1 to 20.5)**
  - Employee of the Month nomination & voting, peer appreciation wall with badges, birthday & work anniversary automated morning greetings, pulse surveys & company polls, interactive survey analytics.
- [ ] **26. M21 Anonymous Feedback & Grievance** · *BUILD-GUIDE Section 28* · **6 Features (21.1 to 21.6)**
  - Anonymous feedback submission with encrypted tracking code (no user ID logged), formal grievance case management, confidential harassment investigation committee portal, status inquiry via tracking code, case escalation to Super Admin, manager restriction from seeing complaints against their own team.
- [ ] **27. M24 Internal Chat** · *BUILD-GUIDE Section 29* · **7 Features (24.1 to 24.7)**
  - Real-time 1-on-1 direct messaging (Socket.io), group conversations, automated department channels, file & image sharing, user presence indicators & read receipts, message history search, administrative channel moderation & archiving.
- [ ] **28. M25 Training & Learning** · *BUILD-GUIDE Section 30* · **7 Features (25.1 to 25.7)**
  - Training course catalogue, executive training budget approval, employee self-enrollment & manager nomination, attendance & completion tracking, training certificate uploads, employee skill matrix & gap analysis, company training cost report.
- [ ] **29. X2 Urdu Localization, PWA, Theme & Final Polish** · *BUILD-GUIDE Section 31* · **6 Features (X2.1 to X2.6)**
  - Complete English/Urdu bilingual toggle with full RTL support (`i18next`), localized Pakistani date and currency formatting (`Asia/Karachi`, PKR, `+92`), installable mobile & desktop PWA (service worker + manifest), light & dark mode themes (Tailwind), WCAG accessibility compliance (keyboard navigation, ARIA labels), final dependency security review (`npm audit`).

---

## Phase 5: Release, Deployment & Handover
**Goal:** Staging validation, production deployment on VPS, and complete client handover per `docs/TECH-SPEC.md` Section 12.
**Scope:** 3 Major Deployment Milestones

- [ ] **30. Staging Environment Deployment** · *TECH-SPEC Section 12*
  - Deploy backend and frontend containers to VPS staging environment with managed MongoDB Atlas staging cluster.
  - Automated GitHub Actions CI pipeline on `develop` branch (linting, Vitest unit tests, Supertest API tests).
  - Client User Acceptance Testing (UAT) sign-off across all 4 default roles.
- [ ] **31. Production VPS Deployment** · *TECH-SPEC Section 12*
  - Production VPS configuration (Ubuntu, Docker Compose, Redis, Nginx reverse proxy).
  - Automated Let's Encrypt HTTPS SSL certificate provisioning (mandatory for webcam face-api and GPS geolocation).
  - Production MongoDB Atlas replica set configuration (IP allow-listing, daily automated backups, point-in-time restore).
  - Production environment secrets configuration in secure VPS environment (`.env`).
  - Production database seeding (`npm run seed` for roles, permissions catalogue, and initial Super Admin credentials).
  - Release tagging on `main` branch (`v1.0.0`) with release notes.
- [ ] **32. Client Handover & Operational Runbooks** · *TECH-SPEC Section 12*
  - Interactive Swagger API documentation live at `/api/docs`.
  - Comprehensive role-based user guides (Super Admin, HR Manager, Department Manager, Employee).
  - System administration guide with password change procedures.
  - Automated database backup and disaster recovery restore runbook.
  - Sentry error monitoring & UptimeRobot health check alerts configuration.

---

## Summary of Master Roadmap Metrics
- **Phase 1 (Core HR & Payroll):** 12 modules · 148 features
- **Phase 2 (Smart Operations):** 9 modules · 67 features
- **Phase 3 (AI Features):** 3 modules · 27 features
- **Phase 4 (Engagement & Polish):** 5 modules · 31 features
- **Phase 5 (Release & Handover):** 3 deployment milestones
- **Total Vertical Slice Features:** **273 features** across 26 modules + 2 cross-cutting quality gates (X1, X2) + 3 deployment milestones.
