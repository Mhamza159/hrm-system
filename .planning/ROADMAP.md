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
- [x] **10. M9 Payroll (+ Pakistan Statutory Compliance)** · *BUILD-GUIDE Section 12* · **17 Features (9.1 to 9.17)**
  - Salary structure CRUD (basic, allowances, deductions in integer paisa), mid-month salary revision with history, earnings breakdown (overtime, bonus, arrears, commission, encashment), deductions breakdown (unpaid leaves, late penalties, loans, advances), Pakistan FBR salaried income tax calculator (annual / 12), EOBI statutory deduction calculator, one-click payroll generation via BullMQ with live Socket.io progress, 4-stage workflow (Draft $\rightarrow$ Review $\rightarrow$ Approve $\rightarrow$ Paid), individual payslip adjustment in draft mode, branded PDF payslip generation, multi-channel payslip delivery (portal, email PDF, optional WhatsApp), Generic Standard Pakistani Corporate Excel advice sheet export, final settlement calculation on exit, annual income tax deduction certificate, withholding tax & EOBI reports, manager team overtime hours view, department-level payroll cost report.
- [x] **11. M7 Dashboard & Reports** · *BUILD-GUIDE Section 13* · **8 Features (7.1 to 7.8)**
  - Role-specific executive dashboards (Super Admin, HR Manager, Department Manager, Employee), real-time KPI widgets (headcount, today's attendance, pending approvals, upcoming birthdays, open jobs, payroll expenses), comprehensive report engines (attendance, leaves, payroll, headcount, turnover, department expenses), multi-criteria filter bar, export to Excel and PDF.
- [x] **12. X1 Security, Audit & Quality (Phase 1 Final Gate)** · *BUILD-GUIDE Section 14* · **10 Features (X1.1 to X1.10)**
  - Audit log viewer with before/after diff inspector, soft-delete enforcement & paid payroll lock, verification of AES encryption at rest (CNIC, bank, salary), server-side 403 authorization boundary testing across all endpoints, rate limiting & XSS/NoSQL sanitization audit, private document signed URL expiry verification, database backup & restore dry run, performance tuning (<3s on 500 records), full mobile & tablet responsive audit, automated test suite verification (Vitest unit calculations, Supertest API tests, Playwright key flows).

---

## Phase 2: Smart Operations (P2 Scope)

**Goal:** Expand financial self-service, deploy multi-modal smart attendance (GPS, QR, Face), and introduce asset custody, employee lifecycle onboarding/offboarding, and project time tracking.
**Scope:** 9 Modules · 67 Vertical Slice Features

- [x] **13. M10 Loans & Advances** · *BUILD-GUIDE Section 15* · **6 Features (10.1 to 10.6)**
  - Employee loan/advance application, policy limit validation, multi-tier approval workflow, installment repayment schedule, automatic monthly payroll deduction, outstanding balance tracking & early settlement.
- [x] **14. M11 Expense Claims** · *BUILD-GUIDE Section 16* · **5 Features (11.1 to 11.5)**
  - Expense categories & monetary caps, claim submission with receipt image upload, multi-tier approval workflow, reimbursement processing (via payroll or direct), monthly expense analytics.
- [x] **15. M14 GPS / Geo-fencing Attendance** · *BUILD-GUIDE Section 17* · **8 Features (14.1 to 14.8)**
  - Server-side Haversine distance validation, location-verified check-in against office geo-fence, accuracy & mock-GPS detection, manager-approved remote/WFH locations, client-site check-in for sales staff, flagged-punch review queue, punch location map view, privacy protection (punch-time-only location capture).
- [x] **16. M13 QR Code Attendance** · *BUILD-GUIDE Section 18* · **6 Features (13.1 to 13.6)**
  - Office kiosk device registration, dynamic rotating QR code (auto-refreshed every 30–60s with signed token), mobile scanner check-in, device binding to employee phone, HR device binding reset, kiosk interval & toggle settings.
- [x] **17. M12 Face Recognition Attendance** · *BUILD-GUIDE Section 19* · **9 Features (12.1 to 12.9)**
  - Client-side `@vladmandic/face-api` model loader, one-time face descriptor enrollment (3–5 captures), HR enrollment approval/re-enrollment, anti-spoofing liveness detection (blink/turn), camera-based face check-in, confidence threshold & toggle settings, suspicious attempt logging with photo capture, fallback manual correction request, manager flagged snapshot view.
- [x] **18. M23 Asset Management** · *BUILD-GUIDE Section 20* · **6 Features (23.1 to 23.6)**
  - Hardware & software asset inventory, custodian assignment/return with history timeline, warranty & license expiration alerts, asset repair/maintenance tracking, manager asset requisition workflow, employee "My Assets" page with issue reporting.
- [x] **19. M18 Onboarding & Offboarding** · *BUILD-GUIDE Section 21* · **11 Features (18.1 to 18.11)**
  - Onboarding checklist templates, automated checklist creation upon employee creation, task ownership & due date tracking with alerts, automated new hire welcome email, employee resignation submission, resignation decision & notice period tracking, exit clearance checklist across departments, exit interview questionnaire, automatic link to final settlement (M9), automated experience & relieving letter PDF generation, automated account deactivation on last working day.
- [x] **20. M19 Performance & Appraisal** · *BUILD-GUIDE Section 22* · **9 Features (19.1 to 19.9)**
  - Role/designation KPI templates, quarterly/annual review cycles, goal/OKR editor, employee self-appraisal, manager review & scoring, optional 360° peer feedback, final review with salary revision recommendation draft, historical appraisal timeline on profile, review cycle completion tracking.
- [ ] **21. M22 Projects & Timesheets** · *BUILD-GUIDE Section 23* · **7 Features (22.1 to 22.7)**
  - Client & project master register, project team assignment, weekly grid timesheet entry (billable/non-billable), timesheet submission & manager approval, billable utilization analytics, project cost & profitability calculations, missing timesheet compliance tracker.

---

## Phase 3: AI Features (Intelligence Scope)

**Goal:** Integrate AI-powered workflows using OpenAI API (`gpt-4o-mini` / `gpt-4o`) via backend service adapter.
**Scope:** 3 Modules · 27 Vertical Slice Features

- [x] **22. M15 Recruitment & AI Screening** · *BUILD-GUIDE Section 24* · **13 Features (15.1 to 15.13)**
  - Department job requisition, executive position approval, public careers page & job postings, candidate application with CV upload, AI CV parsing (skills, experience, education), AI match score & rationale against job description, Kanban candidate pipeline board, interview scheduler with interviewer evaluation forms, technical assessment links, offer letter generation, one-click conversion of hired candidate to employee with onboarding checklist, internal job board & referral submission, human-in-the-loop decision mandate (AI assists, human decides).
- [x] **23. M16 HR Chatbot** · *BUILD-GUIDE Section 25* · **9 Features (16.1 to 16.9)**
  - Company policy document uploader & text extraction, AI chat assistant API, company handbook knowledge retrieval, personal employee data queries (leave balance, latest payslip, pay date), quick actions (apply leave, download slip), human HR hand-off for unresolved queries, bilingual English & Roman Urdu natural language understanding, chat conversation history, chatbot toggle & data access controls.
- [x] **24. M17 Attrition Prediction** · *BUILD-GUIDE Section 26* · **5 Features (17.1 to 17.5)**
  - Weekly attrition risk calculation cron (signals: absences, tardiness, appraisal delays, survey trends, compensation stagnation), risk tier categorization (Low, Medium, High) with primary drivers, department-level retention analytics, retention recommendations & HR intervention notes, strict access scoping (confidential to HR & Super Admin).

---

## Phase 4: Engagement & Polish (P3 Scope)

**Goal:** Enhance workplace engagement, introduce internal real-time communication, provide full Urdu localization, and optimize PWA performance.
**Scope:** 5 Modules · 31 Vertical Slice Features

- [x] **25. M20 Rewards, Celebrations & Surveys** · *BUILD-GUIDE Section 27* · **5 Features (20.1 to 20.5)**
  - Employee of the Month nomination & voting, peer appreciation wall with badges, birthday & work anniversary automated morning greetings, pulse surveys & company polls, interactive survey analytics.
- [x] **26. M21 Anonymous Feedback & Grievance** · *BUILD-GUIDE Section 28* · **6 Features (21.1 to 21.6)**
  - Anonymous feedback submission with encrypted tracking code (no user ID logged), formal grievance case management, confidential harassment investigation committee portal, status inquiry via tracking code, case escalation to Super Admin, manager restriction from seeing complaints against their own team.
- [x] **27. M24 Internal Chat** · *BUILD-GUIDE Section 29* · **7 Features (24.1 to 24.7)**
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

### Phase 6: Expense Module – UI Design Improvements

**Goal:** Modernize and elevate the Expense Module UI across Buttons & Pills, Categories & Limits, Archive Tab, and Active Tab with consistent Forest & Emerald design tokens, semantic tables, and row-click modals.
**Requirements**:

- Improve buttons and status pills with strict semantic colors, consistent spacing, and hairline alignment.
- Overhaul "Categorize & Limit" tab with high-density data tables and row-click category detail modals.
- Overhaul "Archive Tab" with structured archived records, revert/permanent-delete actions, and dedicated audit modals.
- Overhaul "Active Tab" across claims & categories with cohesive typography, tabular numeric formatting, and production-quality layouts per `DESIGN.md` and `docs/UI-REFERENCE.md`.

**Depends on:** Phase 5
**Plans:** 3 plans

Plans:

- [x] **Plan 06-01: Buttons, Pills, Semantic Badges & Category Detail Modal** (`.planning/phases/06-expense-module-ui-design-improvements/06-01-PLAN.md`)
- [x] **Plan 06-02: Categorize & Limit Tab and Archive Tab Overhaul** (`.planning/phases/06-expense-module-ui-design-improvements/06-02-PLAN.md`)
- [x] **Plan 06-03: Active Claims & Approvals Views Polish & Verification** (`.planning/phases/06-expense-module-ui-design-improvements/06-03-PLAN.md`)

### Phase 7: Assets Module – Complete UI Redesign & Improvements

**Goal:** Complete UI redesign and craft modernization across the entire Assets Module (My Assets, Assets Register, Custodian Assignment, and Asset Requisitions) adhering strictly to Forest & Emerald design system (`DESIGN.md`, `docs/UI-REFERENCE.md`), granular PBAC/RBAC permission gating, active/archive lifecycle management, and assignment-based deletion prevention.

**Requirements**:

- **1. My Assets Page Redesign**:
  - Full UI overhaul with dedicated Buttons / Pills tabs, cohesive status badges (`assigned`, `in-repair`, `pending`, `retired`), and spacing.
  - Interactive row-click modal on data table displaying asset metadata, specs, serial number, assignment history, custodian details, and return actions.
- **2. Assets Register Page & Archive Lifecycle**:
  - Full UI redesign with separate **Active** and **Archive** tabs, unified search, category/status filters, and high-density semantic tables.
  - Archive tab modal with **Revert** (restore to active) and **Permanent Delete** (guarded with safety checks).
  - **Critical Business Rule**: If an asset is assigned to any user (`assignedTo` is present / status `assigned`), it must NOT be deleted (neither normal soft-delete nor permanent delete). Strictly enforced in both backend API and frontend UI with clear explanatory banners.
- **3. Custodian Assignment Dropdown**:
  - Redesign custodian selection dropdown into a modern, searchable select component showing employee avatar/initials, name, employee ID, department, and designation.
- **4. Requisition Page Modernization**:
  - Complete redesign of the Asset Requisition workflow with status indicators (`pending`, `approved`, `rejected`, `allocated`), semantic tables, action modals (Approve/Reject/Allocate), and creation form.
- **5. PBAC & RBAC Enforcement**:
  - Condition all action buttons and controls via `Can` component and permission checks (`assets.manage`, `assets.create`, `assets.delete`, `assets.assign`, `assets.approve`). If a permission is missing, hide the action entirely.

**Depends on:** Phase 6
**Plans:** 3 plans

Plans:

- [x] **Plan 07-01: Backend Lifecycle & Deletion Guard Hardening** (`.planning/phases/07-assets-module-complete-ui-redesign-improvements/07-01-PLAN.md`)
- [x] **Plan 07-02: Modern Custodian Dropdown & My Assets Page Overhaul** (`.planning/phases/07-assets-module-complete-ui-redesign-improvements/07-02-PLAN.md`)
- [x] **Plan 07-03: Assets Register (Active & Archive Tabs) & Requisitions Workflow** (`.planning/phases/07-assets-module-complete-ui-redesign-improvements/07-03-PLAN.md`)

### Phase 8: Recruitment & ATS Module – Complete UI Redesign & Improvements

**Goal:** Deliver a completely redesigned, modern, professional, pixel-perfect Recruitment & ATS Module adhering strictly to Forest & Emerald design tokens (`DESIGN.md`, `docs/UI-REFERENCE.md`), granular PBAC/RBAC permission gating (`docs/PBAC.md`, `docs/RBAC.md`), active/archive lifecycle workflows, and cohesive candidate pipeline and referral tracking.

**Requirements**:
- **1. Job Opening Page & Archive Lifecycle**:
  - Complete UI redesign with modern layout, structure, typography, spacing, and emerald color scheme.
  - Buttons, status pills, tabs, filters, dropdowns, and action menus styled to high-craft standard with pixel-perfect alignment.
  - Separate **Active** and **Archive** tabs for job openings.
  - Professional Archive tab modal with **Revert** (restore archived job opening to Active) and **Permanent Delete** (permanently delete job opening, subject to authorization and business safety rules).
- **2. Public Career Portal**:
  - Complete UI redesign of the public-facing careers portal with modern visual hierarchy, typography, dark/light harmonious surfaces, and responsive layout.
  - Refined job listings, detail view, application modal/forms, upload buttons, and confirmation states.
- **3. Candidate Pipeline (ATS)**:
  - Complete UI redesign of the candidate pipeline and Kanban/stage views.
  - Clear candidate status pills with semantic color mapping (applied, screening, interview, offer, hired, rejected).
  - Modern filters, search, candidate preview drawers, stage progression controls, and evaluation forms.
- **4. Internal Jobs & Employee Referral Page**:
  - Complete UI redesign of both Internal Jobs portal and Employee Referral submission & tracking pages.
  - Polished tables, referral forms, reward indicators, status badges, and details modals.
- **5. PBAC & RBAC Enforcement**:
  - Full adherence to PBAC and RBAC rules; actions hidden if user lacks corresponding permission (`recruitment.manage`, `recruitment.view`, etc.).
  - Preserve all existing business logic, validation rules, and API contracts.

**Depends on:** Phase 7
**Plans:** 4 plans

Plans:

- [x] **Plan 08-01: Backend Active/Archive Lifecycle Endpoints & Test Suite Hardening** (`.planning/phases/08-recruitment-ats-module-complete-ui-redesign-improvements/08-01-PLAN.md`)
- [x] **Plan 08-02: Job Openings Page Overhaul & Archive Lifecycle Modal** (`.planning/phases/08-recruitment-ats-module-complete-ui-redesign-improvements/08-02-PLAN.md`)
- [x] **Plan 08-03: Public Career Portal & Candidate Application Experience Overhaul** (`.planning/phases/08-recruitment-ats-module-complete-ui-redesign-improvements/08-03-PLAN.md`)
- [x] **Plan 08-04: Candidate Pipeline Board & Internal Mobility/Referral Pages Overhaul** (`.planning/phases/08-recruitment-ats-module-complete-ui-redesign-improvements/08-04-PLAN.md`)

### Phase 9: AI Resume Parsing Enhancements & Multi-Provider OpenAI/Gemini Setup

**Goal:** Upgrade the Recruitment & ATS AI engine with real document text extraction (digital PDF & Word DOCX), multi-provider orchestration (configurable Google Gemini & OpenAI with automatic failover), Redis resume caching, and enhanced candidate fit evaluation.

**Requirements**:
- **1. Real Document Text Extraction**:
  - Integrate robust PDF text extraction (`pdf-parse`) and Word DOCX text extraction (`mammoth`) to extract real body text from uploaded resumes instead of synthetic metadata.
  - Retain safety guards against binary corruption, infinite loops, and prompt bloat (clean text normalization and length capping).
- **2. Multi-Provider AI Architecture & OpenAI Setup**:
  - Configure `OPENAI_API_KEY` and explicit provider routing (`AI_PROVIDER=auto|gemini|openai`).
  - Seamless dual-engine failover: if primary provider encounters rate limits (HTTP 429) or quota errors, automatically retry with secondary provider before falling back to heuristic parsing.
  - Standardize JSON Schema structured output across both Gemini (`gemini-2.5-flash`) and OpenAI (`gpt-4o-mini`).
- **3. Performance & Cost Optimization**:
  - Implement SHA-256 buffer hash caching via Redis to prevent redundant API invocations on repeated screenings of the same document.
- **4. Testing & Verification**:
  - Add end-to-end and security tests verifying real PDF/DOCX text extraction, prompt injection neutralization with actual document text, and multi-provider failover.

**Depends on:** Phase 8
**Plans:** 3 plans

Plans:

- [x] **Plan 09-01: Document Text Extraction Engine (PDF & Word DOCX)** (`.planning/phases/09-ai-resume-parsing-enhancements-openai-gemini-setup/09-01-PLAN.md`)
- [x] **Plan 09-02: Multi-Provider AI Architecture & OpenAI / Gemini Failover** (`.planning/phases/09-ai-resume-parsing-enhancements-openai-gemini-setup/09-02-PLAN.md`)
- [x] **Plan 09-03: Resume Buffer Hash Caching & Verification Hardening** (`.planning/phases/09-ai-resume-parsing-enhancements-openai-gemini-setup/09-03-PLAN.md`)

### Phase 10: AI Resume Screening Accuracy, Candidate Data Parsing & UI Improvements

**Goal:** Fix AI resume screening accuracy issues, eliminate false-positive degree and experience hallucinations, accurately tokenize job requirements to cleanly differentiate matched vs. unmatched skills, preserve authentic CV data, and elevate CandidateDetailModal with segmented tabs, source evidence, and PBAC/RBAC controls per `DESIGN.md` and `docs/UI-REFERENCE.md`.

**Requirements**:
- **1. AI Resume Parsing Accuracy & Evidence Extraction**:
  - Root out regex substring false-positives in `heuristicResumeParser` (where word substrings like "Mastering", "Systems", "Forms" falsely triggered Master's Degree).
  - High-precision degree detection matching exact boundaries (`BSCS`, `BS Computer Science`, `Bachelor of Science`) and explicit degree contexts.
  - Accurate experience years extraction from job history timelines while ignoring degree graduation dates.
  - Zero-hallucination mandate: if an attribute is missing or ambiguous, return "Not Found / Verification Required" instead of assuming.
- **2. Smart Skills Matching (Matched vs. Missing Skills)**:
  - Tokenize multi-skill requirement strings (e.g. "React Js", "Node Js Html Css Javascript Mongo DB MYSQL Tailwind Css Bootstrap") into distinct individual skills.
  - Differentiate matched skills (emerald pills) from missing/unmatched job requirements (rose pills) with strict bidirectional boundary checking.
- **3. Screening Modal Overhaul (CandidateDetailModal)**:
  - Improve existing `CandidateDetailModal.jsx` without duplicate components.
  - Tabbed or clean structured sections: Overview, Extracted Attributes (with CV Source References), Skills Matrix (Matched vs. Unmatched), AI Assessment & Rationale, Recruitment Actions.
  - Visual clarity distinguishing raw extracted facts from AI advisory match scoring.
- **4. Verification & Re-Screening**:
  - Re-screen the 3 real candidate CVs (Noraiz Ali, Muhammad Naik, Muhammad Adnan) and verify 100% accurate extraction against their original documents.

**Depends on:** Phase 9
**Plans:** 3 plans

Plans:

- [x] **Plan 10-01: High-Precision Degree & Experience Extraction Engine** (`.planning/phases/10-ai-resume-screening-accuracy-candidate-data-parsing-ui-improvements/10-01-PLAN.md`)
- [x] **Plan 10-02: Granular Skills Tokenizer & Matched vs Unmatched Evaluation** (`.planning/phases/10-ai-resume-screening-accuracy-candidate-data-parsing-ui-improvements/10-02-PLAN.md`)
- [x] **Plan 10-03: CandidateDetailModal UI Overhaul & Real Candidate Re-Screening Verification** (`.planning/phases/10-ai-resume-screening-accuracy-candidate-data-parsing-ui-improvements/10-03-PLAN.md`)

---

### Phase 11: Performance Management Module – Complete UI Redesign & Improvements

**Goal:** Deliver a modern, pixel-perfect, enterprise-grade redesign across the entire Performance Management Module (M19) adhering strictly to the Forest & Emerald design system (`DESIGN.md` & `docs/UI-REFERENCE.md`), including Team Reviews, Appraisal Cycles, and KPI Templates, while strictly preserving PBAC/RBAC authorization rules, business invariants, and payroll linkages.

**Requirements**:
- **1. Team Reviews – Complete UI Redesign**:
  - Executive review metrics header (Total in Queue, Pending Self, Awaiting Manager, Ready for Finalization, Finalized).
  - Search, cycle, and status filter bar with tabular numerics.
  - New comprehensive read-only `ReviewDetailModal.jsx` for multi-tab inspection of employee scorecards, OKRs, and feedback.
  - Redesigned `ManagerReviewModal.jsx` with ergonomic 1–5 scoring controls, qualitative textareas, and increment recommendation sliders.
  - Redesigned `FinalizeReviewModal.jsx` with self vs manager score comparisons and M9 Payroll salary sync preview.
  - Redesigned `PeerFeedbackModal.jsx`.
- **2. Appraisal Cycles – Complete UI Redesign**:
  - Executive overview stat cards and progress indicators.
  - Card grid & tabular cycle listings with dual deadline badges (`selfReviewDeadline`, `managerReviewDeadline`) and live progress meters.
  - New `ReviewCycleDetailModal.jsx` for viewing cycle parameters and audit information.
  - Redesigned `ReviewCycleModal.jsx` with date-range validation and review auto-instantiation callout.
  - Redesigned `CycleProgressPage.jsx` with department completion meters and overdue reviewer tracking.
  - Accessible `ConfirmModal.jsx` replacing crude browser confirms.
- **3. KPI Templates – Complete UI Redesign**:
  - Overview stat cards, designation filters, and active/inactive toggle filters.
  - Redesigned `KpiTemplateModal.jsx` with a real-time 100% weightage visual gauge and instant sum validation.
  - New read-only `KpiTemplateDetailModal.jsx` for inspecting template rubrics and criteria.
- **4. Employee Self-Review Portal & Goals Editor**:
  - Redesigned `MyReviewPage.jsx` with deadline countdown, goal management via `GoalsEditor.jsx`, self-score calculators, and finalized summary views.
  - Redesigned `EmployeePerformanceTab.jsx` for employee profile timelines.
- **5. Design Consistency & Verification**:
  - Forest & Emerald brand archetype (`#047857` / `#10B981`, `#0F172A`, `#F8FAFC`), 1px hairline borders, eliminating legacy `indigo-*` classes.
  - 100% test pass rate on `tests/m19.performance.e2e.test.js` and clean production build.

**Depends on:** Phase 10
**Plans:** 4 plans

Plans:

- [x] **Plan 11-01: KPI Templates Redesign, Dynamic 100% Weightage Modal, Detail View & Test Hardening** (`.planning/phases/11-performance-management-module-complete-ui-redesign-improvements/11-01-PLAN.md`)
- [x] **Plan 11-02: Appraisal Cycles Redesign, Cycle Detail View & Telemetry Progress Overhaul** (`.planning/phases/11-performance-management-module-complete-ui-redesign-improvements/11-02-PLAN.md`)
- [x] **Plan 11-03: Team Reviews Queue, Review Detail Modal, Manager Evaluation & Finalize Redesign** (`.planning/phases/11-performance-management-module-complete-ui-redesign-improvements/11-03-PLAN.md`)
- [x] **Plan 11-04: Employee Self-Review, Goals Editor, Historical Timeline & Responsive Polish** (`.planning/phases/11-performance-management-module-complete-ui-redesign-improvements/11-04-PLAN.md`)

---

### Phase 12: Employee Lifecycle Module – Complete UI Redesign, Integration Audit & Improvements

**Goal:** Deliver a modern, pixel-perfect, enterprise-grade redesign across the entire Employee Lifecycle Module (M18) adhering strictly to the Forest & Emerald design system (`DESIGN.md` & `docs/UI-REFERENCE.md`), including Onboarding, Resignation, Exit Clearance, and Checklist Templates. Conduct a comprehensive cross-module integration audit ensuring seamless data flow across Recruitment (M15), Employee Management (M3), Asset Custody (M23), Final Settlement (M9), and Account Deactivation (M1).

**Requirements**:
- **1. Onboarding – Complete UI Redesign**:
  - Executive onboarding telemetry metrics (Active, In Progress, Provisioning Pending, Completed).
  - Search, department filters, and tabular progress meters.
  - New `OnboardingDetailModal.jsx` for full employee profile sheet, task list by category, task completion toggles, and welcome email re-dispatch.
  - Redesigned `MyTasksPage.jsx` for employee self-service lifecycle tasks.
- **2. Resignation – Complete UI Redesign**:
  - Dual-tabbed view separating employee self-service resignation submission/status tracking from the management review queue.
  - New `ResignationDetailModal.jsx` displaying employee tenure, reason, official LWD picker with notice period calculation, rejection reason, and confidential exit interview inspection.
- **3. Exit Clearance – Complete UI Redesign**:
  - Clearance telemetry overview and 4-department status indicators (`IT`, `Finance`, `Admin`, `HR`).
  - New `ExitClearanceDetailModal.jsx` with departmental sign-offs, live M23 Asset Custody checker (with hardware return blocker), and M9 Final Settlement preview.
  - Service letters action bar (Experience Letter and Relieving Letter PDF streaming).
- **4. Checklist Templates – Complete UI Redesign**:
  - Category tabs (`Onboarding Templates` vs `Offboarding Templates`), department filtering, search, and active/inactive status pills.
  - New read-only `ChecklistTemplateDetailModal.jsx` for inspecting rubrics and criteria.
  - Redesigned `ChecklistTemplateModal.jsx` with category tags, role assignees, due offsets, and safe modification warnings.
- **5. Cross-Module Integration Audit & Polish**:
  - Complete verification of M15 Recruitment $\rightarrow$ M3 Employee $\rightarrow$ M18 Onboarding, M18 Resignation $\rightarrow$ M3 Notice $\rightarrow$ M18 Offboarding, M18 Exit Clearance $\rightarrow$ M23 Asset lock, and M18 LWD $\rightarrow$ M1 Deactivation.
  - Zero legacy `indigo-*` classes across `frontend/src/features/onboarding/`.
  - 100% test pass on `tests/m18.onboarding.e2e.test.js` and clean production build.

**Depends on:** Phase 11
**Plans:** 4 plans

Plans:

- [x] **Plan 12-01: Checklist Templates Master Authoring Redesign, Detail Modal & Task Rubric Hardening** (`.planning/phases/12-employee-lifecycle-module-complete-ui-redesign-integration-audit-improvements/12-01-PLAN.md`)
- [x] **Plan 12-02: Employee Onboarding Progress Tracker, Detail Modal & Lifecycle Tasks Redesign** (`.planning/phases/12-employee-lifecycle-module-complete-ui-redesign-integration-audit-improvements/12-02-PLAN.md`)
- [x] **Plan 12-03: Resignation Self-Service, Notice Period Tracker & Management Review Modal Overhaul** (`.planning/phases/12-employee-lifecycle-module-complete-ui-redesign-integration-audit-improvements/12-03-PLAN.md`)
- [x] **Plan 12-04: Exit Clearance, M23 Asset Custody Lock, Final Settlement & Comprehensive Integration Verification** (`.planning/phases/12-employee-lifecycle-module-complete-ui-redesign-integration-audit-improvements/12-04-PLAN.md`)

---

### Phase 13: My Profile Module – Complete Audit, UI Redesign & Role-Based Improvements

**Goal:** Deliver a modern, pixel-perfect, role-aware overhaul across the My Profile Module across all 4 system personas (Super Admin, HR Manager, Department Manager, Regular Employee). Decompose the legacy 1,782-line duplicate monolith into clean, single-responsibility sub-components adhering to the Forest & Emerald Enterprise design system (`DESIGN.md` & `docs/UI-REFERENCE.md`), enforce strict PBAC authorization boundaries and change request workflows, eliminate internal technical database leaks, and ensure 100% test pass rate with clean production builds.

**Requirements**:
- **1. Complete My Profile Audit – All Roles**:
  - Comprehensive inspection of field visibility and action requirements across Super Admin, HR Manager, Department Manager, and Regular Employee.
  - Eliminate sensitive technical database leaks (e.g. "CASL Policy Boundary", "Encrypted JWT + Salted Bcrypt", "Apex Level 0") and replace with professional enterprise copy.
  - Tailor information density: eliminate irrelevant operational fields (e.g. probation end dates, shift rosters, line managers) for Super Admin.
- **2. Sub-Component Modularization & De-duplication**:
  - Decompose monolithic `MyProfilePage.jsx` into modular components under `frontend/src/features/employees/components/profile/`:
    - `ProfileHeader.jsx` (Hero banner, avatar upload, role pills, masked CNIC, contact credentials).
    - `PersonalInfoCard.jsx` (Personal information, DOB, gender, residential address).
    - `EmploymentDetailsCard.jsx` (Role-tailored designation, department, reporting manager, shift timings).
    - `AccountSecurityCard.jsx` (2FA status and toggle modal, password change modal, login history link).
    - `SkillsQualificationsCard.jsx` (Self-service competency tags with add/remove actions).
    - `PayrollBankCard.jsx` (Payroll bank coordinates and emergency contacts with change request notice).
    - `RoleGovernanceCard.jsx` (Contextual quick action hub tailored per persona).
  - Reduce `MyProfilePage.jsx` from 1,782 lines down to under 300 lines using Ponytail principles.
- **3. Role-Based Design & Experience**:
  - **Super Admin**: System governance, account defense, root metrics, administrative master hub shortcuts (`/users`, `/roles`, `/departments`, `/designations`, `/settings`).
  - **HR Manager**: Workforce governance context, people operations quick links (`/employees`, `/change-requests`, `/onboarding`, `/offboarding`, `/attendance/shifts`).
  - **Department Manager**: Department leadership context, team supervisory scope, peer approval delegation quick access (`/delegations`).
  - **Regular Employee**: Comprehensive self-service profile, shift timings, residential address, emergency contacts, skills editor, and self-service quick links (`/org-chart`, `/policies`).
- **4. Security, PBAC & Editability Rules**:
  - Enforce PBAC field protection: regular employees cannot directly modify protected fields (salary, CNIC, bank details, designation, department).
  - Seamless change request workflow via `ChangeRequestModal.jsx` (`POST /api/v1/employees/me/change-request`).
  - Secure password management and 2FA state synchronization between Redux and DB.
- **5. Design Consistency & Verification**:
  - Forest & Emerald brand palette (`#111D17` dark surface, `#1A3125` border, `#00C471` emerald accent). Zero legacy `indigo-*` classes.
  - 100% test pass on `tests/m3.employees.e2e.test.js` (16/16 tests).
  - Oxlint clean (0 errors, 0 warnings) and clean `vite build`.

**Depends on:** Phase 12
**Plans:** 4 plans

Plans:

- [x] **Plan 13-01: Profile Header, Personal Info, Employment Details & Account Security Cards** (`.planning/phases/13-my-profile-module-complete-audit-ui-redesign-role-based-improvements/13-01-PLAN.md`)
- [x] **Plan 13-02: Skills Taxonomy, Bank Coordinates, Emergency Details & Change Request Flow** (`.planning/phases/13-my-profile-module-complete-audit-ui-redesign-role-based-improvements/13-02-PLAN.md`)
- [x] **Plan 13-03: Role Governance Hub & Master Orchestrator Consolidation** (`.planning/phases/13-my-profile-module-complete-audit-ui-redesign-role-based-improvements/13-03-PLAN.md`)
- [x] **Plan 13-04: Multi-Role Visual Audit, End-to-End Verification, Oxlint Audit & Production Build** (`.planning/phases/13-my-profile-module-complete-audit-ui-redesign-role-based-improvements/13-04-PLAN.md`)

---

### Phase 14: Employees Module – Complete Audit, UI Redesign & Improvements

**Goal:** Deliver a comprehensive audit and pixel-perfect UI redesign across the entire Employees Module (Module M3). Modernize the Employee Directory with dual view modes (Table View and Card Grid View), advanced faceted filters, and triple status buckets (`Active Workforce`, `Inactive / Suspended`, `Archive Bucket`). Introduce a new 10-section `EmployeeDetailModal.jsx` for seamless in-place employee inspection, overhaul the 5-step onboarding wizard (`EmployeeFormPage.jsx`), modernize `StatusChangeModal.jsx`, `DocumentUploadModal.jsx`, `EmployeeImportPage.jsx`, and `ChangeRequestsPage.jsx` adhering strictly to the Forest & Emerald Enterprise theme, with complete PBAC authorization and 100% backend E2E test verification.

**Requirements**:
- **1. Complete Employees Module Audit**:
  - Review all existing pages, forms, tables, modals, buttons, filters, and actions.
  - Verify PBAC and RBAC permission boundaries across all 4 roles (Super Admin, HR Manager, Department Manager, Employee).
  - Hide all unauthorized action buttons (Onboard, Ingest, Export, Edit, Archive, Status Change).
- **2. Data Table & Dual View Switching (Table & Card Grid)**:
  - Add dual view mode toggle (`Table View` vs `Card Grid View`).
  - Modern Card Grid view displaying avatars, initials, names, codes, designations, departments, status pills, and action menus.
  - Semantic high-density data table with monospaced employee codes, stacked name/email cells, and aligned columns.
  - Triple status buckets: `Active Workforce`, `Inactive / Suspended`, and `Archive Bucket` with live counts.
  - Advanced filters (search, department, designation, status) with one-click reset.
- **3. Employee Comprehensive Detail Modal (`EmployeeDetailModal.jsx`)**:
  - Implement a new 10-section detail modal triggered on row or card click: Overview, Personal Information, Employment Details, Department & Designation, Reporting Hierarchy, Contact Coordinates, Document Vault, Career History, Account Information, and Financial Overview (masked where appropriate).
  - Role-aware action bar with Edit, Change Status, Reset Password, and Archive buttons.
  - Polish full `EmployeeProfilePage.jsx` and its sub-tabs (`ProfileOverviewTab.jsx`, `ProfileDocumentsTab.jsx`, `ProfileHistoryTab.jsx`, `ProfileSalaryTab.jsx`).
- **4. Employee Create & Edit Wizard Redesign (`EmployeeFormPage.jsx`)**:
  - Completely redesign the 5-step wizard (Personal Details, Contact & Emergency, Job Assignment, Bank Coordinates, Account Provisioning).
  - Pakistani CNIC mask (`XXXXX-XXXXXXX-X`) with 13-digit validation.
  - Reactive dependent dropdowns (designation dynamically filtered by department).
  - Account provisioning modal with temporary login credentials and copy button.
- **5. Supporting Modals, Ingestion & Change Requests**:
  - Redesign `StatusChangeModal.jsx` with critical status warnings and mandatory reason.
  - Redesign `DocumentUploadModal.jsx` with drag/drop, category tags, and 5MB validation.
  - Polish `EmployeeImportPage.jsx` with template download and row error reporter.
  - Polish `ChangeRequestsPage.jsx` with card diff view and quick approval actions.
- **6. Design Consistency & Verification**:
  - 100% Forest & Emerald brand archetype (`#111D17` dark surface, `#1A3125` border, `#00C471` emerald accent).
  - 100% test pass on `tests/m3.employees.e2e.test.js` (16/16 tests).
  - Oxlint clean (0 errors, 0 warnings) and clean `vite build`.

**Depends on:** Phase 13
**Plans:** 4 plans

Plans:

- [x] **Plan 14-01: Directory Overhaul, Dual View (Data Table & Card Grid) & Advanced Filters** (`.planning/phases/14-employees-module-complete-audit-ui-redesign-improvements/14-01-PLAN.md`)
- [x] **Plan 14-02: Employee Comprehensive Detail Modal & Profile View Modernization** (`.planning/phases/14-employees-module-complete-audit-ui-redesign-improvements/14-02-PLAN.md`)
- [x] **Plan 14-03: Employee Create & Edit Wizard Redesign (`EmployeeFormPage.jsx`) & Supporting Modals** (`.planning/phases/14-employees-module-complete-audit-ui-redesign-improvements/14-03-PLAN.md`)
- [x] **Plan 14-04: Excel Bulk Ingestion, Change Requests Review Queue, Integration & Verification** (`.planning/phases/14-employees-module-complete-audit-ui-redesign-improvements/14-04-PLAN.md`)

---

### Phase 15: Reward & Engagement Module – Complete Audit, UI Redesign & Improvements

**Goal:** Deliver a comprehensive audit, full visual modernization, and strict PBAC permission compliance across all four submodules of the Reward & Engagement Module (Module M20): Award & Honors, Appreciation Wall, Celebration Wall, and Pulse Survey. Unify every page and modal with the Forest & Emerald Enterprise design system, enforce dynamic action gating, ensure cryptographic survey anonymity, and verify with automated E2E tests, Oxlint, and production builds.

**Requirements**:
- **1. Award & Honors Submodule**:
  - High-density KPI cards (Total Cycles, Open Nominations, Active Voting Ballots, Honored Winners).
  - Segmented status tabs (`All Cycles`, `Accepting Nominations`, `Voting Open`, `Announced Winners`).
  - Dark forest & emerald honors showcase hero for the latest announced winner.
  - Redesigned `VotingCard.jsx` with single-ballot voting, nomination citations, and admin vote tally stats.
  - Redesigned `CreateAwardModal.jsx`, `NominateModal.jsx`, and `AnnounceWinnerModal.jsx`.
- **2. Appreciation Wall Submodule**:
  - Peer kudos feed with overview metrics, interactive badge filters, and text search.
  - Redesigned `KudosCard.jsx` with sender $\rightarrow$ receiver directional flow, badge pills, quotations, and optimistic like reactions.
  - Redesigned `GiveKudosModal.jsx` with searchable colleague picker, 7-badge selector grid, and character counter.
  - Real-time updates via `kudos:created` WebSocket broadcast.
- **3. Celebration Wall Submodule**:
  - Today's Spotlight Celebration banner for birthdays and work anniversaries with festive emerald accents.
  - Customizable lookahead timeline selector (15, 30, 60, 90 days).
  - Redesigned `CelebrationCard.jsx` with countdown badges (`Tomorrow`, `In X days`) and milestone tags.
  - One-click "Send Milestone Kudos" bridge connecting to the Appreciation Wall.
- **4. Pulse Survey & Analytics Submodule**:
  - Survey overview dashboard with participation KPI cards and status tabs (`Active`, `Draft`, `Closed`).
  - Redesigned `SurveyFillModal.jsx` with prominent privacy guarantee, progress bar, 5-star rating, single/multi-choice polls, and qualitative feedback.
  - Redesigned `SurveyBuilderModal.jsx` with dynamic question builder and department targeting.
  - Redesigned `RatingBreakdownChart.jsx` with participation rates, rating distribution bars, and strictly anonymized feedback.
- **5. PBAC Permissions & Data Security**:
  - Replace hardcoded role checks with capability-based checks (`rewards.manage`, `rewards.nominate`, `rewards.vote`, `rewards.kudos`, `rewards.respond`).
  - Hide all unauthorized action buttons.
  - Enforce cryptographic survey anonymity: zero responder IDs exposed.
- **6. Design Consistency & Verification**:
  - 100% Forest & Emerald brand palette (`#111D17` surface, `#1A3125` border, `#00C471` emerald accent).
  - 100% pass on `tests/e2e/m20-rewards.spec.js`.
  - Zero Oxlint errors, zero warnings, zero `prop-types` imports, and clean `vite build`.

**Depends on:** Phase 14
**Plans:** 4 plans

Plans:

- [x] **Plan 15-01: Award & Honors Submodule Audit, UI Redesign & PBAC Enforcement** (`.planning/phases/15-reward-engagement-module-complete-audit-ui-redesign-improvements/15-01-PLAN.md`)
- [x] **Plan 15-02: Appreciation Wall Submodule Audit, UI Redesign & Interaction Overhaul** (`.planning/phases/15-reward-engagement-module-complete-audit-ui-redesign-improvements/15-02-PLAN.md`)
- [x] **Plan 15-03: Celebration Wall Submodule Audit, UI Redesign & Lifecycle Integration** (`.planning/phases/15-reward-engagement-module-complete-audit-ui-redesign-improvements/15-03-PLAN.md`)
- [x] **Plan 15-04: Pulse Surveys & Analytics Submodule Overhaul & Module Verification Gate** (`.planning/phases/15-reward-engagement-module-complete-audit-ui-redesign-improvements/15-04-PLAN.md`)

---

### Phase 16: Feedback & Grievance Module – Complete Audit, UI Redesign & Improvements

**Goal:** Deliver a comprehensive audit, full visual modernization, and strict PBAC/RBAC permission compliance across all four submodules of the Feedback & Grievance Module (Module M21): Submit Feedback, Track Case, Grievance Admin, and Inquiry Committee. Standardize every page, drawer, and modal to the Forest & Emerald Enterprise design system, enforce strict role isolation (Department Managers barred from admin/committee; Harassment complaints strictly quarantined to the Inquiry Committee), support authenticated + cryptographic case tracking, and verify with Oxlint and production builds.

**Requirements**:
- **1. Submit Feedback Submodule (`SubmitFeedbackPage.jsx`)**:
  - Distinct header with shield badge and channel description.
  - Interactive 6-category selection grid (Open Suggestion, Formal Grievance, Workplace Issue, Harassment Complaint, Health & Safety, Other) with dynamic active indicator.
  - Anonymous mode toggle with cryptographic tracking code guarantee banner.
  - Department targeting, priority selector, character counter, and optional attachment URLs.
  - High-craft tracking code modal with one-click clipboard copy and direct navigation to case tracking.
- **2. Track Case Submodule (`TrackFeedbackPage.jsx`)**:
  - Dual-mode tracking interface: `Track by Code` (for anonymous or direct tracking) and `My Submitted Cases` (authenticated feed via `useGetMyFeedbackSubmissionsQuery`).
  - Elevated 4-stage visual timeline (Submitted $\rightarrow$ Under Review $\rightarrow$ Active Investigation $\rightarrow$ Resolved / Closed).
  - Sanitized public updates and resolution notes feed; confidential administrative notes strictly hidden.
- **3. Grievance Admin Submodule (`GrievanceAdminPage.jsx` & Drawers)**:
  - Real-time KPI summary cards (Total Grievances, Active Investigations, Escalated Cases, Resolved/Closed, Urgent Priority) via `useGetGrievanceStatsQuery`.
  - Comprehensive filtering by search query, category, priority, and segmented status tabs (`All`, `Active`, `Under Review`, `Escalated`, `Resolved`, `Dismissed`).
  - High-density docket table with monospaced tracking code, complainant anonymity pill, status badges, and action triggers.
  - Redesigned `CaseDetailsDrawer.jsx` with full case details, public/private note toggles, and direct status updates.
  - Redesigned `StatusChangeModal.jsx` and `EscalateModal.jsx` (escalate to Super Admin).
  - Strict PBAC Gate: Department Managers are strictly barred with 403 Access Denied.
- **4. Inquiry Committee Submodule (`CommitteeDashboardPage.jsx`)**:
  - Restricted clearance executive console with statutory crimson insignia (Pakistan Protection Against Harassment at the Workplace Act).
  - Quarantined case docket exclusively querying `category: 'Harassment'` (inaccessible to standard HR and managers).
  - High-privacy docket table with complainant identity masking and formal investigation controls.
  - Strict PBAC Gate: Accessible exclusively to designated committee members and Super Admin.
- **5. Design Consistency & Verification**:
  - 100% Forest & Emerald brand palette (`#111D17` surface, `#1A3125` border, `#00C471` emerald accent; with `#E11D48` crimson quarantine accent).
  - Zero `prop-types` imports across all 7 feedback files.
  - Zero Oxlint errors, zero warnings.
  - Clean Vite production build (`npm run build`).

**Depends on:** Phase 15
**Plans:** 4 plans

Plans:

- [x] **Plan 16-01: Submit Feedback Submodule Audit & UI Redesign** (`.planning/phases/16-feedback-grievance-module-complete-audit-ui-redesign-improvements/16-01-PLAN.md`)
- [x] **Plan 16-02: Track Case Submodule Audit, Dual-Mode Tracking & Timeline UI Redesign** (`.planning/phases/16-feedback-grievance-module-complete-audit-ui-redesign-improvements/16-02-PLAN.md`)
- [x] **Plan 16-03: Grievance Admin Submodule & Management Drawer Audit & Redesign** (`.planning/phases/16-feedback-grievance-module-complete-audit-ui-redesign-improvements/16-03-PLAN.md`)
- [x] **Plan 16-04: Inquiry Committee Submodule & Module Verification Gate** (`.planning/phases/16-feedback-grievance-module-complete-audit-ui-redesign-improvements/16-04-PLAN.md`)

---

### Phase 17: Internal Chat Module – Complete Audit, UI Redesign & Improvements

**Goal:** Deliver a comprehensive audit, full visual modernization, and real-time communication refinement across the entire Internal Chat Module (Module M24). Elevate the messaging interface to the Forest & Emerald Enterprise design standard (`#061A14` canvas, `#111D17` panels, `#1A3125` borders, `#00C471` emerald accents), ensure seamless 1-to-1 direct messaging, custom group channels, and automated department rooms, implement live online presence dots, typing indicators, read receipts, 10MB vaulted file/image attachments, and verify with Oxlint and production builds.

**Requirements**:
- **1. Chat Workspace Layout & Split View (`ChatPage.jsx`)**:
  - Full-height responsive split-view workspace with persistent conversation list on desktop and seamless full-screen toggle on mobile.
  - High-craft default empty state hero with quick direct/group actions.
  - Dynamic department channel auto-sync (`/conversations/sync-department`).
- **2. Conversation List Sidebar (`ConversationList.jsx`)**:
  - Top header with Message title, department sync trigger, group creation trigger, and new chat action.
  - Real-time search filtering conversations by coworker name and message preview.
  - Segmented filter tabs (`All`, `Direct`, `Groups`, `Department`) with active emerald pills.
  - Live online presence indicator dot (`#00C471`) and unread count badges.
- **3. Active Chat Feed & Message Bubbles (`ChatArea.jsx`, `MessageBubble.jsx`)**:
  - Active channel header showing coworker/group avatar, presence status, and info drawer toggle.
  - In-conversation message search with query highlight.
  - Distinct sender (emerald `#00C471` bubble) vs recipient (`#111D17` card with `#1A3125` border) bubble geometries.
  - Double checkmark read receipts (`CheckCheck`) and inline image/document attachment cards.
  - Real-time typing telemetry banner ("X is typing...").
- **4. Message Composer & Attachment Vaulting (`MessageInput.jsx`, `useChatSocket.js`)**:
  - Multiline auto-expanding message composer with Enter/Shift+Enter shortcuts.
  - Memory-safe 10MB file and image uploader via `/chat/upload` with pending file preview pills.
  - Typing debouncer socket emitter with 2-second timeout.
  - Archival read-only freeze banner for archived conversations.
- **5. Direct/Group Modals & Participant Drawer (`NewChatModal.jsx`, `NewGroupModal.jsx`, `GroupInfoDrawer.jsx`)**:
  - Searchable coworker directory for instant 1-to-1 conversation initiation (preventing duplicate rooms).
  - Custom group channel creator with colleague multi-select checkmark pills.
  - Channel info slide-over drawer with participant roster, online dots, admin badge, add/remove member controls, and Super Admin archival toggle.
- **6. Design Consistency & Verification**:
  - 100% Forest & Emerald brand archetype (`#111D17` dark surface, `#1A3125` border, `#00C471` emerald accent).
  - Zero `prop-types` imports across all 9 chat files.
  - Zero Oxlint errors, zero warnings.
  - Clean Vite production build (`npm run build`).

**Depends on:** Phase 16
**Plans:** 4 plans

Plans:

- [x] **Plan 17-01: Chat Workspace Layout, Split View & Conversation List Sidebar** (`.planning/phases/17-internal-chat-module-complete-audit-ui-redesign-improvements/17-01-PLAN.md`)
- [x] **Plan 17-02: Active Chat Feed, Header & Message Bubbles Stream** (`.planning/phases/17-internal-chat-module-complete-audit-ui-redesign-improvements/17-02-PLAN.md`)
- [x] **Plan 17-03: Message Composer, Attachment Vaulting & Real-Time Socket Telemetry** (`.planning/phases/17-internal-chat-module-complete-audit-ui-redesign-improvements/17-03-PLAN.md`)
- [x] **Plan 17-04: Channel Modals, Group Management Drawer & Module Verification Gate** (`.planning/phases/17-internal-chat-module-complete-audit-ui-redesign-improvements/17-04-PLAN.md`)

---

## Summary of Master Roadmap Metrics

- **Phase 1 (Core HR & Payroll):** 12 modules · 148 features
- **Phase 2 (Smart Operations):** 9 modules · 67 features
- **Phase 3 (AI Features):** 3 modules · 27 features
- **Phase 4 (Engagement & Polish):** 5 modules · 31 features
- **Phase 5 (Release & Handover):** 3 deployment milestones
- **Total Vertical Slice Features:** **273 features** across 26 modules + 2 cross-cutting quality gates (X1, X2) + 3 deployment milestones.
