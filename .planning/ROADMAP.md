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

### Phase 18: Attrition Prediction Module – Complete Audit, Analytics Dashboard, UI Redesign & Improvements

**Goal:** Deliver a comprehensive audit, full visual modernization, and functional enhancement of the entire Attrition Prediction Module (Module M17). Elevate the flight-risk predictive analytics intelligence to the Forest & Emerald Enterprise design standard (`#061A14` canvas, `#111D17` panels, `#1A3125` borders, `#00C471` emerald accents, with `#EF4444` crimson for high risk and `#F59E0B` amber for moderate risk), build interactive native SVG analytics charts (risk distribution donut, department stacked bars, contributing factor weights), provide deep employee risk tables with gauges and CSV export, and deliver an executive employee risk dossier modal with contextual retention recommendations and audit-trailed intervention notes.

**Requirements**:
- **1. Dashboard Workspace Layout & Summary Cards (`AttritionDashboardPage.jsx`)**:
  - Full responsive dashboard layout with `#061A14` background and `#111D17` surfaces.
  - 4 executive KPI summary cards: Total Workforce Evaluated, High Flight Risk (`#EF4444`), Moderate Risk (`#F59E0B`), and Stable Retention (`#00C471`) with workforce percentages and threshold indicators.
  - On-demand recalculation trigger with rate-limit status, mutex protection, and last evaluated timestamp.
  - Global filters: full-text search, department dropdown (HR Manager & Super Admin only; locked to managed department for Department Managers), and risk tier segmented pills.
- **2. Interactive Analytics Charts Suite (`DepartmentRiskChart.jsx`, `AttritionRiskDonutChart.jsx`, `AttritionFactorsChart.jsx`)**:
  - Native SVG Department Stacked Bar Chart with hover tooltips (counts, percentages, average scores) and click-to-filter drill-down.
  - Native SVG Risk Distribution Donut Chart with central average risk gauge and interactive legend filters.
  - Contributing Factor Breakdown Chart displaying the 5 core behavioral drivers (Attendance 30%, Salary Stagnation 25%, Appraisal 20%, Tenure 15%, Engagement 10%) with explanatory threshold tooltips.
- **3. Employee Risk Analysis Table & Export (`AttritionDashboardPage.jsx`, `RiskScoreGauge.jsx`)**:
  - High-density enterprise table featuring employee avatars, codes, department/designation badges, tenure metrics, visual risk score gauges (0-100), pulsing risk tier badges, and top factor chips.
  - Interactive column sorting and responsive pagination.
  - CSV export utility generating formatted risk reports matching active filters and PBAC scope.
- **4. Employee Risk Details Modal & Retention Notes (`EmployeeRiskDetailModal.jsx`)**:
  - Comprehensive flight-risk dossier modal with employee profile credentials and tenure.
  - 5-factor breakdown horizontal progress bars with points received vs maximum weight.
  - Detected signal cards explaining point attributions.
  - Dynamic, rule-based retention recommendations tailored to specific driver signals.
  - Retention Intervention Notes logger with action category dropdown, follow-up date picker, and historical audit trail timeline.
- **5. Strict PBAC / RBAC Permission Compliance**:
  - Regular Employees: Zero access (navigation hidden, API blocked with 403 Forbidden).
  - Department Managers: Strict horizontal scoping (`scope: 'team'`); restricted to their managed department only.
  - HR Managers & Super Admins: Company-wide visibility (`scope: 'all'`) and recalculation permissions (`attrition.manage`).
- **6. Design Consistency & Verification**:
  - 100% Forest & Emerald brand archetype (`#111D17` dark surface, `#1A3125` border, `#00C471` emerald accent).
  - Zero `prop-types` imports across all attrition files.
  - Zero Oxlint errors, zero warnings.
  - 100% pass on backend automated tests (`m17.attrition.test.js` & `m17.attrition.security.test.js`).
  - Clean Vite production build (`npm run build`).

**Depends on:** Phase 17
**Plans:** 4 plans

Plans:

- [x] **Plan 18-01: Analytics Dashboard Layout, KPI Metric Cards & Global Controls** (`.planning/phases/18-attrition-prediction-module-complete-audit-analytics-dashboard-ui-redesign-improvements/18-01-PLAN.md`)
- [x] **Plan 18-02: Interactive Analytics Charts Suite (Risk Donut, Department Stacked Bars & Risk Factors Breakdown)** (`.planning/phases/18-attrition-prediction-module-complete-audit-analytics-dashboard-ui-redesign-improvements/18-02-PLAN.md`)
- [x] **Plan 18-03: Employee Risk Analysis Table, Pagination & Export Engine** (`.planning/phases/18-attrition-prediction-module-complete-audit-analytics-dashboard-ui-redesign-improvements/18-03-PLAN.md`)
- [x] **Plan 18-04: Employee Risk Details Modal, Retention Intervention Notes & Module Verification Gate** (`.planning/phases/18-attrition-prediction-module-complete-audit-analytics-dashboard-ui-redesign-improvements/18-04-PLAN.md`)

---

### Phase 19: Attrition Prediction Module — Complete UI Alignment, Layout Correction & Modal Redesign

**Goal:** Perform an exhaustive UI/UX alignment, layout correction, and modal redesign of the entire Attrition Prediction Module (Module M17). Eliminate all layout drift, unequal card heights, misaligned flex containers, and unconstrained table widths. Align charts into equal-height paired grid rows with responsive SVG scaling, lock down the employee risk table with fixed column width constraints to eliminate column jumping during pagination or sorting, and completely overhaul the Employee Risk Details Modal (`EmployeeRiskDetailModal.jsx`) with uniform metrics mini-cards, aligned form inputs (`h-9`), and an elegant historical notes docket.

**Requirements**:
- **1. Header, KPI Summary Cards & Global Toolbar Layout Alignment (`AttritionDashboardPage.jsx`)**:
  - Rebalance all 4 KPI summary cards to uniform height (`h-32`), equal internal padding (`p-5`), standardized icon containers (`w-11 h-11 rounded-xl`), and aligned baseline metrics.
  - Standardize the global filter toolbar with unified `h-9` controls, consistent icon spacing, and responsive wrapping across mobile and desktop.
  - Align header title, predictive signal badge, and recalculation button (`h-9 px-4`).
- **2. Charts Suite Geometry, Grid Height Balance & SVG Responsive Polish (`AttritionRiskDonutChart.jsx`, `AttritionFactorsChart.jsx`, `DepartmentRiskChart.jsx`)**:
  - Equalize card heights for Row 1 charts (`AttritionRiskDonutChart.jsx` and `AttritionFactorsChart.jsx`) with `h-full flex flex-col justify-between`.
  - Refine donut chart SVG centering, legend spacing, and tooltip positioning.
  - Polish `DepartmentRiskChart.jsx` with responsive SVG viewBox, aligned X-axis labels, standardized bar widths, and elevated glassmorphism tooltips.
- **3. Employee Risk Table Column Alignment, Sizing & Pagination Overhaul (`AttritionDashboardPage.jsx`, `RiskScoreGauge.jsx`, `RiskTierBadge.jsx`)**:
  - Establish fixed width constraints on table columns (`w-[280px]`, `w-[200px]`, `w-[100px]`, `w-[170px]`, `w-[140px]`, `w-[180px]`, `w-[90px]`) to prevent layout jumps during sorting or page transitions.
  - Align employee credentials with non-wrapping avatar rows, truncate overflow cleanly, and standardize risk score gauges (`w-36`) and risk tier badges (`w-32`).
  - Align pagination toolbar with consistent button touch targets and baseline record counters.
- **4. Employee Risk Dossier Modal Redesign & Module Verification Gate (`EmployeeRiskDetailModal.jsx`)**:
  - Overhaul `EmployeeRiskDetailModal.jsx` with balanced grid layouts for the 4 overview cards (`h-20 flex flex-col justify-between`), standardized 5-factor progress bar heights, uniform trigger badges, and clean recommendation cards.
  - Redesign the intervention note form with `h-9` inputs, aligned labels, and an elegant historical timeline.
  - Execute the complete verification gate (zero `prop-types`, zero Oxlint warnings, 22/22 backend test pass, clean Vite production build).

**Depends on:** Phase 18
**Plans:** 4 plans

Plans:

- [x] **Plan 19-01: Header, KPI Summary Cards & Global Toolbar Layout Alignment** (`.planning/phases/19-attrition-prediction-module-complete-ui-alignment-layout-correction-modal-redesign/19-01-PLAN.md`)
- [x] **Plan 19-02: Charts Suite Geometry, Grid Height Balance & SVG Responsive Polish** (`.planning/phases/19-attrition-prediction-module-complete-ui-alignment-layout-correction-modal-redesign/19-02-PLAN.md`)
- [x] **Plan 19-03: Employee Risk Table Column Alignment, Sizing & Pagination Overhaul** (`.planning/phases/19-attrition-prediction-module-complete-ui-alignment-layout-correction-modal-redesign/19-03-PLAN.md`)
- [x] **Plan 19-04: Employee Risk Dossier Modal Redesign & Module Verification Gate** (`.planning/phases/19-attrition-prediction-module-complete-ui-alignment-layout-correction-modal-redesign/19-04-PLAN.md`)

---

### Phase 20: Reports Module — Complete Audit, Implementation, Database Integration & UI/UX Redesign

**Goal:** Deliver a comprehensive end-to-end audit, backend aggregation completion, and full visual modernization of the entire Reports Module (Module M7 / Features 7.6 to 7.8) across all six reporting domains: Attendance, Leaves, HeadCount, Payroll, Turnover, and Department Cost. Connect 100% of reporting metrics to live MongoDB database records via backend aggregation services with zero dummy data, implement rich native SVG analytics charts, 8+ date presets, dynamic department filtering with employee counts, and detailed inspection modal sheets across all domains. Enforce strict PBAC/RBAC data scoping.

**Requirements**:
- **1. Backend Analytics Engine & Aggregation Overhaul (`reports.service.js`, `reports.validation.js`, `reports.controller.js`)**:
  - Overhaul backend reporting aggregations to compute complete KPI summaries, monthly trends, breakdown distributions, and detailed records for all 6 reports.
  - Implement period-aware Headcount calculation (active, new hires in period, exits in period).
  - Implement accurate Turnover Rate formula: `(Total Separations / Average Headcount) * 100`.
  - Wire date-range (`from` and `to`) awareness into `department-cost` across all relevant payroll runs.
  - Add backend inspection query helper for single-employee and single-department deep drilldown.
  - Enforce strict PBAC/RBAC authorization boundaries (financial reports blocked with 403 for non-HR/Admin roles; manager scoping).
- **2. Core Reports Console, Comprehensive Date Presets & Filter Architecture (`ReportsPage.jsx`, `ReportFilterToolbar.jsx`, `ExportButtons.jsx`)**:
  - Redesign reports console in Forest & Emerald Enterprise theme (`#061A14`, `#111D17`, `#1A3125`, `#00C471`).
  - Implement all 8+ quick date presets: Today, Yesterday, This Week, Last Week, This Month, Last Month, This Quarter, This Year, Custom Range.
  - Standardize all toolbar controls to `h-9` height with synchronized date range pickers.
  - Create standardized executive KPI summary cards across ALL 6 reports.
  - Wire live refresh button with loading state preserving all active filter selections.
- **3. Interactive Visual Analytics Suite & Charts for All 6 Reports (`charts/*.jsx`)**:
  - Responsive native SVG analytical charts matching the theme:
    - Attendance: Punch status distribution & daily attendance trajectory.
    - Leaves: Leave type breakdown (Casual, Annual, Sick, Unpaid) & approval status distribution.
    - Headcount: Department-wise headcount distribution & employment type breakdown.
    - Payroll: Gross vs Net vs Tax distribution & department-wise expenditure chart.
    - Turnover: Monthly turnover trend & voluntary vs involuntary separation breakdown.
    - Department Cost: Department cost comparison bar chart & cost-per-employee metric.
  - Implement elevated dark glassmorphic hover tooltips and interactive click-to-filter drilldowns.
- **4. Enhanced Data Tables, Chronological Timelines & Comprehensive Inspection Sheets (`ReportDataTable.jsx`, `modals/*.jsx`)**:
  - Overhaul `ReportDataTable.jsx` with `min-w-[1050px]` fixed table constraints, status pills, and responsive pagination.
  - Implement Daily Attendance Log Timeline & Leave Activity Timeline with event badges.
  - Build detailed inspection modals/sheets:
    - `EmployeeAttendanceInspectionModal.jsx` (period punches, late minutes, overtime, attendance rate).
    - `EmployeeLeaveInspectionModal.jsx` (leave balances, days consumed, approval history).
    - `PayrollInspectionModal.jsx` (earnings, allowances, deductions, tax, net pay breakdown).
    - `DepartmentCostInspectionModal.jsx` (department salary costs, staff roster, cost distribution).
  - Complete verification gate (zero `prop-types`, zero Oxlint warnings, backend tests pass, clean Vite production build).

**Depends on:** Phase 19
**Plans:** 4 plans

Plans:

- [x] **Plan 20-01: Backend Analytics Engine & Aggregation Overhaul** (`.planning/phases/20-reports-module-complete-audit-implementation-database-integration-ui-ux-redesign/20-01-PLAN.md`)
- [x] **Plan 20-02: Core Reports Console, Comprehensive Date Presets & Filter Architecture** (`.planning/phases/20-reports-module-complete-audit-implementation-database-integration-ui-ux-redesign/20-02-PLAN.md`)
- [x] **Plan 20-03: Interactive Visual Analytics Suite & Charts for All 6 Reports** (`.planning/phases/20-reports-module-complete-audit-implementation-database-integration-ui-ux-redesign/20-03-PLAN.md`)
- [x] **Plan 20-04: Enhanced Data Tables, Chronological Timelines & Comprehensive Inspection Sheets** (`.planning/phases/20-reports-module-complete-audit-implementation-database-integration-ui-ux-redesign/20-04-PLAN.md`)

---

### Phase 21: Company Policies Module — Complete Audit, Refinement, Implementation & UI/UX Redesign

**Goal:** Deliver a comprehensive end-to-end audit, architectural refinement, and complete implementation of the **Company Policies Module** across both administrative and employee dimensions. Support dynamic database-driven categories, semantic version control with immutable revision ledgers, multi-tier approval and publishing workflows, personalized employee applicability scoping, legally compliant digital acknowledgements, real-time compliance tracking rosters, secure document streaming, and seamless integration with the AI Chatbot and notification pipelines.

**Requirements**:
- **1. Backend Policies Architecture, Schemas, Validation & RBAC Engine (`policy.model.js`, `policyCategory.model.js`, `policyVersion.model.js`, `policyAcknowledgement.model.js`, `policy.service.js`)**:
  - Implement full policy lifecycle states: `Draft`, `Pending Approval`, `Approved`, `Published`, `Rejected`, `Archived`, `Expired`.
  - Immutable version history preserving previous snapshots, author attribution, and revision summaries without destructive overwrites.
  - Digital employee acknowledgement tracking with signature, timestamp, IP address, and unique version binding.
  - Granular PBAC permissions catalogue (`policy.view`, `policy.create`, `policy.edit`, `policy.delete`, `policy.manage`, `policy.approve`, `policy.publish`, `policy.acknowledge`, `policy.track`).
- **2. Administrative Policy Console, Analytics Dashboard & Category Management (`PoliciesDashboardPage.jsx`, `PolicyCard.jsx`, `PolicyTable.jsx`, `CategoryManagementModal.jsx`, `PolicyFormModal.jsx`)**:
  - Executive KPI summary cards across 7 compliance metrics.
  - Category segmented pills, status filtering, search bar, and grid vs table view toggle.
  - Comprehensive authoring modal supporting markdown content, department/role scoping, grace periods, and file attachments.
  - Dynamic category management dialog with color and icon customizers.
- **3. Version History, Approval Workflow & Detail Inspection Drawer/View (`PolicyDetailDrawer.jsx`, `PolicyVersionHistoryModal.jsx`, `PolicyApprovalModal.jsx`, `PublishPolicyModal.jsx`)**:
  - Structured policy inspection drawer with formatted articles, metadata sidebar, and signed document streaming.
  - Interactive version history modal allowing inspection of past versions without mutating active policy.
  - Manager review interface with one-click approval and mandatory rejection feedback.
  - Publishing modal with effective date verification and multi-channel workforce alert dispatch.
- **4. Employee Policy Portal, Acknowledgement Workflow, Tracking Roster & Verification Gate (`EmployeePoliciesPage.jsx`, `PolicyAcknowledgementModal.jsx`, `PolicyAcknowledgementRosterModal.jsx`)**:
  - Personalized employee portal with "Pending Sign-off", "Acknowledged", and "All Policies" tabs.
  - Legally compliant digital sign-off modal with mandatory declaration and signature capture.
  - Administrative compliance tracking sheet with department progress bars, search, and CSV export.
  - Router and Sidebar integration in `App.jsx` and `Sidebar.jsx`.
  - Full verification gate: 0 Oxlint warnings, 100% backend integration tests passing, clean Vite production build.

**Depends on:** Phase 20
**Plans:** 4 plans

Plans:

- [x] **Plan 21-01: Backend Policies Architecture, Schemas, Validation & RBAC Engine** (`.planning/phases/21-company-policies-module-complete-audit-refinement-implementation-ui-ux-redesign/21-01-PLAN.md`)
- [x] **Plan 21-02: Administrative Policy Console, Analytics Dashboard & Category Management** (`.planning/phases/21-company-policies-module-complete-audit-refinement-implementation-ui-ux-redesign/21-02-PLAN.md`)
- [x] **Plan 21-03: Version History, Approval Workflow & Detail Inspection Drawer/View** (`.planning/phases/21-company-policies-module-complete-audit-refinement-implementation-ui-ux-redesign/21-03-PLAN.md`)
- [x] **Plan 21-04: Employee Policy Portal, Acknowledgement Workflow, Tracking Roster & Verification Gate** (`.planning/phases/21-company-policies-module-complete-audit-refinement-implementation-ui-ux-redesign/21-04-PLAN.md`)

---

## Phase 22: Announcement Module — Complete Audit, Refinement & Feature Implementation

**Goal:** Deliver a complete end-to-end audit, architectural refinement, and feature implementation for the **Announcement Module** across both administrative and employee dimensions. Support dynamic multi-department targeting, persistent pin/unpin notice boards, dedicated Archive & Restore lifecycle tabs, seen/unseen read-tracking per employee with manager analytics (seen count, unseen count, read percentage, department breakdown), rich attachments, complete modal suite redesign, and strict PBAC/RBAC enforcement.

**Requirements**:
- **1. Backend Architecture, Schemas, Validation & Archival APIs (`announcement.model.js`, `announcement.service.js`, `announcement.controller.js`, `announcement.validation.js`, `announcement.routes.js`)**:
  - Support multi-department targeting (`departmentIds`), expiry dates, attachments, and soft archival (`isArchived`, `archivedAt`, `archivedBy`).
  - Implement archival lifecycle endpoints (`PATCH /announcements/:id/archive`, `PATCH /announcements/:id/restore`) and single detail endpoint (`GET /announcements/:id`).
  - Comprehensive reader engagement analytics (`totalTargeted`, `seenCount`, `unseenCount`, `compliancePercentage`, `departmentBreakdown`, reader roster).
- **2. Announcements Feed, Dedicated Archive Tab & Multi-Filters (`AnnouncementsPage.jsx`, `AnnouncementCard.jsx`, `announcementsApi.js`)**:
  - Dedicated **Active Notices** vs **Archived Notices** view tabs.
  - Dynamic department dropdown loading from database, multi-priority filter pills, read status toggle, and sort controls.
  - Prominent Pinned Notice Board banner anchoring pinned announcements at top of feed.
  - Visual badge distinction, unread pulsing indicator, and seamless one-click actions.
- **3. Complete Modals Suite Redesign & Engagement Analytics (`AnnouncementFormModal.jsx`, `AnnouncementDetailModal.jsx`, `ReadReceiptsModal.jsx`, `DeleteConfirmationModal.jsx`, `ArchiveConfirmationModal.jsx`)**:
  - Multi-department selector, expiry picker, attachments, and validation in authoring form.
  - Dedicated reading modal with automatic read receipt marking upon view.
  - Administrative engagement docket with metrics, department progress breakdown, and reader roster.
  - Custom enterprise confirmation dialogs for deletion and archival.
- **4. End-to-End Testing, Vitest Integration Suite & Verification Gate (`tests/announcements.e2e.test.js`)**:
  - 10 comprehensive integration tests covering creation, multi-department scoping, read marking, pinning, editing, archiving, restoring, and analytics across all 4 roles.
  - 0 Oxlint warnings, 100% backend test pass rate, clean Vite production build.

**Depends on:** Phase 21
**Plans:** 4 plans

Plans:

- [x] **Plan 22-01: Backend Architecture, Schemas, Validation & Archival APIs** (`.planning/phases/22-announcement-module-complete-audit-refinement-feature-implementation/22-01-PLAN.md`)
- [x] **Plan 22-02: Announcements Feed, Dedicated Archive Tab & Multi-Filters** (`.planning/phases/22-announcement-module-complete-audit-refinement-feature-implementation/22-02-PLAN.md`)
- [x] **Plan 22-03: Complete Modals Suite Redesign & Engagement Analytics** (`.planning/phases/22-announcement-module-complete-audit-refinement-feature-implementation/22-03-PLAN.md`)
- [x] **Plan 22-04: End-to-End Testing, Vitest Integration Suite & Verification Gate** (`.planning/phases/22-announcement-module-complete-audit-refinement-feature-implementation/22-04-PLAN.md`)

---

## Phase 23: Notification Module — Complete Audit, Cross-Module Integration, RBAC/PBAC Implementation & UI/UX Upgrade

**Goal:** Deliver a comprehensive end-to-end audit, architectural expansion, and UI/UX modernization for the **Notification Module** across the entire HRMS. Support explicit module classification across all 16 domains, priority classification (`urgent`, `high`, `normal`, `low`), dedicated Archive & Restore lifecycle tabs, high-speed unread aggregation (`GET /api/v1/notifications/module-counts`), dynamic real-time unread badges & indicator dots in `Sidebar.jsx` and `Header.jsx`, a completely redesigned Notification Center (`/notifications`) and slide-out Drawer (`NotificationDrawer.jsx`), and strict PBAC confidentiality enforcement.

**Requirements**:
- **1. Backend Architecture, Schemas, Validation & Archival APIs (`notification.model.js`, `notify.service.js`, `notification.service.js`, `notification.controller.js`, `notification.routes.js`)**:
  - Support explicit `module` enum across 16 domains, `priority` tiers, and soft archival (`isArchived`, `archivedAt`).
  - Implement module unread count aggregation endpoint (`GET /api/v1/notifications/module-counts`) and archive endpoints (`PATCH /:id/archive`, `PATCH /:id/unarchive`, `PATCH /archive-all`).
  - Centralized `notify.service.js` enhancement supporting alias normalization, priority handling, and multi-channel dispatch.
- **2. Cross-Module Notification Trigger Instrumentation (16 Domains)**:
  - Audit and wire missing business event notifications across Recruitment/ATS, Onboarding/Lifecycle, Attendance, Leaves, Payroll, Loans, Expenses, Assets, Timesheets, Performance, Policies, Announcements, Rewards, Grievances, Chat, Attrition, and System Security.
  - Strict PBAC confidentiality guarantees: Grievances isolated to Committee/HR, Attrition risks isolated to SuperAdmin/HR, and masked salary privacy.
- **3. Dynamic Sidebar Notification Indicators (`Sidebar.jsx`, `Header.jsx`, `useModuleNotificationCounts.js`)**:
  - Module-level unread dots/badges in sidebar navigation for both standalone links and collapsible tree groups.
  - Real-time updates via Socket.io `notification:new` events and automatic count decrements on route visits and read events.
- **4. Notification Center & Drawer Complete UI/UX Redesign (`NotificationsPage.jsx`, `NotificationDrawer.jsx`, `NotificationCard.jsx`)**:
  - Slide-out quick drawer with "Mark All as Read" and filter pills.
  - Full Notification Center command page with Active vs Archived tabs, horizontal module filter pills, priority tags, search, and bulk operations.
  - Forest & Emerald Enterprise theme styling (`#061A14`, `#111D17`, `#1A3125`, `#00C471`).
- **5. End-to-End Testing, Vitest Integration Suite & Verification Gate (`tests/notifications.e2e.test.js`)**:
  - 10 comprehensive integration tests covering schema creation, dispatch, module aggregation, priority handling, read/unread lifecycle, archiving, and PBAC security.
  - 0 Oxlint warnings, 100% backend test pass rate, clean Vite production build.

**Depends on:** Phase 22
**Plans:** 5 plans

Plans:

- [x] **Plan 23-01: Backend Architecture, Schema Expansion & Module Aggregation APIs** (`.planning/phases/23-notification-module-complete-audit-cross-module-integration-rbac-pbac-sidebar-dots-ui-ux-upgrade/23-01-PLAN.md`)
- [x] **Plan 23-02: Cross-Module Notification Trigger Instrumentation (16 Domains)** (`.planning/phases/23-notification-module-complete-audit-cross-module-integration-rbac-pbac-sidebar-dots-ui-ux-upgrade/23-02-PLAN.md`)
- [x] **Plan 23-03: Dynamic Sidebar Indicators & Real-Time Synchronization** (`.planning/phases/23-notification-module-complete-audit-cross-module-integration-rbac-pbac-sidebar-dots-ui-ux-upgrade/23-03-PLAN.md`)
- [x] **Plan 23-04: Notification Center & Drawer Complete UI/UX Redesign** (`.planning/phases/23-notification-module-complete-audit-cross-module-integration-rbac-pbac-sidebar-dots-ui-ux-upgrade/23-04-PLAN.md`)
- [x] **Plan 23-05: End-to-End Testing, Vitest Integration Suite & Verification Gate** (`.planning/phases/23-notification-module-complete-audit-cross-module-integration-rbac-pbac-sidebar-dots-ui-ux-upgrade/23-05-PLAN.md`)

---

## Phase 24: Login History Module — Complete Audit, Implementation, Security & UI/UX Refinement

**Goal:** Deliver a complete, accurate, and secure **Login History & Authentication Audit System** across the HRMS. Record every login attempt (successful, failed, locked, restricted, 2FA challenge/verify) with complete identity snapshots (User, Employee name, code, role, department), exact UTC timestamps localized to `Asia/Karachi`, safe IP address extraction respecting trusted proxies, client environment parsing (`browser`, `os`, `deviceType`), plain-English notices and failure classifications without leaking credentials or violating user enumeration defenses. Provide dynamic KPI summary metrics (`GET /api/v1/auth/login-history/stats`), CSV export (`GET /api/v1/auth/login-history/export`), multi-filter search, detailed technical attempt inspection (`LoginDetailModal.jsx`), security alert banners for lockouts, and strict PBAC/RBAC data isolation between administrators and employees.

**Requirements**:
- **1. Backend Architecture, Schema Expansion & Event Instrumentation (`loginHistory.model.js`, `userAgentParser.js`, `auth.service.js`)**:
  - Store identity snapshots (`employeeId`, `employeeName`, `employeeCode`, `role`, `department`), client environment (`browser`, `os`, `deviceType`, `location`), status (`SUCCESS`, `FAILED`, `LOCKED`, `BLOCKED`, `RESTRICTED`, `2FA_PENDING`, `2FA_FAILED`), and `failureReason`.
  - Zero-dependency user-agent parser extracting accurate browser & OS versions.
  - Reliable instrumentation for all authentication flows (unknown accounts with timing protection, wrong password, inactive accounts, brute-force lockouts, 2FA challenges, 2FA success/failure).
  - 90-day TTL eviction index and compound query indexes.
- **2. Advanced Query APIs, Statistics Aggregation & Secure Data Export (`auth.validation.js`, `auth.service.js`, `auth.controller.js`, `auth.routes.js`)**:
  - `GET /api/v1/auth/login-history`: Paginated query with date range, status, device, role, and search filters.
  - `GET /api/v1/auth/login-history/stats`: Real-time aggregated metrics (Total Attempts, Success Rate, Failed, Locked, Unique Accounts).
  - `GET /api/v1/auth/login-history/:id`: Enriched single attempt inspection with consecutive failure correlation.
  - `GET /api/v1/auth/login-history/export`: Streaming CSV export with header formatting and permission sanitization.
- **3. Frontend RTK Query, KPI Metric Cards & Data Table Modernization (`authApi.js`, `LoginHistoryPage.jsx`, `LoginHistoryStatsCards.jsx`, `LoginHistoryFilterBar.jsx`)**:
  - Modernized UI following Forest & Emerald Enterprise theme (`#061A14`, `#111D17`, `#1A3125`, `#00C471`).
  - Metric cards showing live statistics with percentages and status badges.
  - Filter bar with date range presets, status pills, device dropdown, and instant search.
  - Data table with dual-line timestamps (`Asia/Karachi`), employee initials & badges, status pills, IP origins, and browser/OS icons.
  - Adaptive Employee Self-Service Mode: Personalizes view to "My Login Security" when accessed by non-administrative staff.
- **4. Detailed Inspection Modal, Security Alerts & Verification Gate (`LoginDetailModal.jsx`, `SecurityAlertBanner.jsx`, `tests/auth.login-history.e2e.test.js`)**:
  - Comprehensive inspection modal displaying Account, Outcome, Network, Client, and Security details with technical user-agent view and copyable values.
  - Security alert banner for accounts currently locked out.
  - 15/15 Vitest integration tests covering all authentication events, PBAC data isolation, filtering, stats, and export.
  - 0 Oxlint warnings, 100% test pass rate, clean Vite production build.

**Depends on:** Phase 23
**Plans:** 4 plans

Plans:

- [x] **Plan 24-01: Backend Architecture, Schema Expansion, User-Agent Parsing & Authentication Event Instrumentation** (`.planning/phases/24-login-history-module-complete-audit-implementation-security-ui-ux-refinement/24-01-PLAN.md`)
- [x] **Plan 24-02: Comprehensive Audit Query APIs, Aggregated Stats & Multi-Format Data Export** (`.planning/phases/24-login-history-module-complete-audit-implementation-security-ui-ux-refinement/24-02-PLAN.md`)
- [x] **Plan 24-03: Frontend RTK Query Expansion, Filter Toolbar, KPI Stat Cards & Data Table Modernization** (`.planning/phases/24-login-history-module-complete-audit-implementation-security-ui-ux-refinement/24-03-PLAN.md`)
- [x] **Plan 24-04: Detailed Login Inspection Modal, Suspicious Activity Alerts, Security Guards & Verification Gate** (`.planning/phases/24-login-history-module-complete-audit-implementation-security-ui-ux-refinement/24-04-PLAN.md`)

---

## Phase 25: Department Module — Complete UI Overhaul, Functional Audit, Analytics, RBAC/PBAC Compliance & Error Fixing

**Goal:** Transform the Department Module into a modern, enterprise-grade HRMS command center. Implement a comprehensive analytics dashboard with 7 KPI summary cards and native SVG/Tailwind interactive charts (workforce distribution bar chart and department share donut chart). Overhaul the active department directory with a dual view switcher (high-density Enterprise Table View vs Department Cards Grid View), advanced multi-dimensional filtering, and full responsive behavior per `DESIGN.md` and `docs/UI-REFERENCE.md`. Redesign all modals (Create, Edit, Inspect Details, Archive, Restore, and Permanent Delete) featuring an authentic, searchable Employee Dropdown with rich profiles (avatar, designation, department, employee code, status), leadership spotlight card, full staff roster sub-table, and strict enforcement of the non-negotiable **Employee Assignment Restriction Guard** (a department cannot be permanently deleted while even one employee is assigned). Verify all functionality through a comprehensive 12-test Vitest E2E suite, 0 oxlint errors, and a clean Vite production build.

**Requirements**:
- **1. Backend Analytics Aggregation & Rich Employee Candidates API (`department.service.js`, `department.controller.js`, `department.routes.js`)**:
  - `GET /api/v1/departments/analytics`: Aggregated workforce analytics (department breakdown, workforce distribution percentages, top/lowest departments, and leadership coverage ratio).
  - `GET /api/v1/departments/heads/candidates`: Real-time candidate search with complete employee profiles (avatar, designation, department, employeeCode, email, status).
  - `GET /api/v1/departments/:id`: Enriched single department inspection with assigned staff roster.
- **2. Department Dashboard Analytics, 7 KPI Cards & Interactive Visualizations (`DepartmentStatsCards.jsx`, `DepartmentAnalyticsSection.jsx`)**:
  - 7 dynamic KPI cards (Total, Active, Archived, Total Assigned Staff, Staffed Units, Empty Units, Unassigned Heads).
  - Horizontal bar chart (Employee distribution per department) and SVG Donut chart (Workforce share) with tooltips and highlights.
- **3. Department Listing Redesign, Dual View Switcher (Table & Grid) & Advanced Multi-Filters (`DepartmentsPage.jsx`, `DepartmentFilterBar.jsx`, `DepartmentCardView.jsx`)**:
  - Dual View Switcher: High-density Enterprise Table View vs Visual Department Cards Grid View.
  - Multi-dimensional filter toolbar with instant search, parent division, status, headcount range, and leadership status.
- **4. Redesigned Create & Edit Modals with Complete Searchable Employee Dropdown (`DepartmentModal.jsx`, `EmployeeSelectDropdown.jsx`)**:
  - Reusable `EmployeeSelectDropdown` with search, avatars, badges, and designations (zero generic "Employee 1" items).
  - Form validation, code uniqueness, parent hierarchy selection, and toast alerts.
- **5. Comprehensive Department Details Modal with Leadership Spotlight & Staff Roster (`DepartmentDetailModal.jsx`)**:
  - Leadership spotlight card with avatar, designation, employee code, and email.
  - Assigned staff roster table with employee search and status badges.
- **6. Archive Tab, Revert/Restore & Permanent Delete with Mandatory Employee Guard (`DepartmentsPage.jsx`, `DepartmentRestoreModal.jsx`, `DepartmentPermanentDeleteModal.jsx`)**:
  - Archive console with search and pagination.
  - Restore modal with uniqueness check.
  - Permanent delete modal with strict Employee Assignment Restriction (locked if headcount > 0 with exact warning).
- **7. Comprehensive End-to-End Vitest Test Suite & Quality Verification (`backend/tests/departments.overhaul.e2e.test.js`)**:
  - Automated integration test suite covering analytics, candidates, archiving, restore, and employee deletion blocking; 0 oxlint errors, clean Vite build.

**Depends on:** Phase 24
**Plans:** 7 plans

Plans:

- [x] **Plan 25-01: Backend Analytics Aggregation & Rich Searchable Employee Candidates API** (`.planning/phases/25-department-module-complete-audit-implementation-archive-management-ui-ux-refinement/25-01-PLAN.md`)
- [x] **Plan 25-02: Department Dashboard Analytics, 7 KPI Cards & Interactive Visualizations** (`.planning/phases/25-department-module-complete-audit-implementation-archive-management-ui-ux-refinement/25-02-PLAN.md`)
- [x] **Plan 25-03: Department Listing Redesign, Dual View Switcher (Table & Grid) & Advanced Multi-Filters** (`.planning/phases/25-department-module-complete-audit-implementation-archive-management-ui-ux-refinement/25-03-PLAN.md`)
- [x] **Plan 25-04: Redesigned Create & Edit Modals with Complete Searchable Employee Dropdown** (`.planning/phases/25-department-module-complete-audit-implementation-archive-management-ui-ux-refinement/25-04-PLAN.md`)
- [x] **Plan 25-05: Comprehensive Department Details Modal with Leadership Spotlight & Staff Roster** (`.planning/phases/25-department-module-complete-audit-implementation-archive-management-ui-ux-refinement/25-05-PLAN.md`)
- [x] **Plan 25-06: Archive Tab, Revert/Restore & Permanent Delete with Mandatory Employee Guard** (`.planning/phases/25-department-module-complete-audit-implementation-archive-management-ui-ux-refinement/25-06-PLAN.md`)
- [x] **Plan 25-07: Comprehensive End-to-End Vitest Test Suite & Quality Verification** (`.planning/phases/25-department-module-complete-audit-implementation-archive-management-ui-ux-refinement/25-07-PLAN.md`)

---

## Phase 26: Designation Module — Complete UI Overhaul, System-Wide Integration Audit, RBAC/PBAC Compliance, Analytics & Error Fixing

**Goal:** Transform the Designation Module into an enterprise-grade corporate job hierarchy and organizational taxonomy system. Implement a 7-KPI analytics command center with interactive workforce distribution visualizations (horizontal bar chart and grade share SVG donut), dual view switcher (high-density Enterprise Table View vs Designation Cards Grid View), and multi-dimensional filtering (search, department, grade tier, status, headcount range). Redesign all modals (Create, Edit, Deep Inspection Details, Archive, Restore, and Permanent Delete) with department selection, grade tier hierarchy (`Junior`, `Mid`, `Senior`, `Lead`, `Executive`), assigned staff roster sub-tables, and strict enforcement of the non-negotiable **Employee Assignment Restriction Guard** (a designation cannot be permanently deleted while $\ge 1$ employee is assigned). Audit and harden cross-module integrations (Employees, Performance/Appraisals, Recruitment/ATS, Shifts, Org Chart) ensuring archived designations cannot be assigned to new hires or promotions. Verify complete functionality through an automated Vitest E2E test suite, 0 oxlint errors, and a clean Vite production build.

**Requirements**:
- **1. Backend Schema Expansion, Archival Lifecycle & Cross-Module Assignment Guard (`designation.model.js`, `department.service.js`, `employee.service.js`)**:
  - Add `isArchived`, `archivedAt`, and `archivedBy` fields and indexes to `Designation` schema.
  - Implement soft archive (`PATCH /api/v1/designations/:id/archive`), restore (`PATCH /api/v1/designations/:id/restore`), and permanent delete (`DELETE /api/v1/designations/:id/permanent`).
  - Strict Employee Assignment Restriction Guard: Permanent deletion is blocked if $\ge 1$ employee is assigned.
  - Guard `createEmployee`, `updateEmployee`, and `recordPromotionHistory` to forbid assigning archived designations.
- **2. Backend Analytics Aggregation, KPI Statistics & Single Designation Roster Enriched API (`department.service.js`, `department.controller.js`, `department.routes.js`)**:
  - `GET /api/v1/designations/stats`: 7 aggregated KPIs (Total, Active, Archived, Total Assigned Staff, Staffed, Empty, Departments Represented).
  - `GET /api/v1/designations/analytics`: Workforce distribution by designation and grade breakdown.
  - `GET /api/v1/designations/:id`: Single designation inspection with assigned employee roster.
- **3. Dashboard Analytics, 7 KPI Summary Cards & Visual Distribution Charts (`DesignationStatsCards.jsx`, `DesignationAnalyticsSection.jsx`)**:
  - 7 KPI summary cards matching Forest & Emerald Enterprise theme (`#061A14`, `#111D17`, `#1A3125`, `#00C471`).
  - Interactive SVG Donut chart (Grade tier distribution) and flex-bar distribution chart with interactive hover tooltips.
- **4. Designation Directory Overhaul, Dual View Switcher (Table & Card Grid) & Multi-Dimensional Filtering (`DesignationsPage.jsx`, `DesignationFilterBar.jsx`, `DesignationCardView.jsx`)**:
  - Dual view switcher: Enterprise high-density Table View vs interactive Card Grid View.
  - Multi-dimensional filter bar with instant search, department selector, grade tier selector, status, and headcount filters.
- **5. Redesigned Create & Edit Modal with Department Selector & Archival Safeguards (`DesignationModal.jsx`)**:
  - Department selector with real departments, grade tier selection, uppercase code validation, and description.
- **6. Deep Inspection Details Modal with Assigned Staff Roster & Search (`DesignationDetailModal.jsx`)**:
  - Full designation profile, grade tier, department info, archival notice, and assigned staff roster with in-modal search.
- **7. Archive Management Console, Revert/Restore & Permanent Delete with Mandatory Employee Guard (`DesignationsPage.jsx`, `DesignationArchiveModal.jsx`, `DesignationRestoreModal.jsx`, `DesignationPermanentDeleteModal.jsx`, `ArchivedDesignationList.jsx`)**:
  - Dedicated Archive Tab with paginated archived designations.
  - Revert/Restore modal returning designation to active directory.
  - Permanent delete modal with strict employee lock (disabled button and warning message when headcount > 0).
- **8. Cross-Module Integration Audit & Comprehensive End-to-End Vitest Test Suite (`backend/tests/designations.overhaul.e2e.test.js`)**:
  - Comprehensive integration test suite covering CRUD, stats, analytics, archive, restore, and employee guard; 0 oxlint errors and clean Vite production build.

**Depends on:** Phase 25  
**Plans:** 8 plans  

Plans:

- [x] **Plan 26-01: Backend Schema Expansion, Archival Lifecycle & Cross-Module Assignment Guard** (`.planning/phases/26-designation-module-complete-ui-overhaul-system-wide-integration-audit-rbac-pbac-compliance-analytics-error-fixing/26-01-PLAN.md`)
- [x] **Plan 26-02: Backend Analytics Aggregation, KPI Statistics & Single Designation Roster Enriched API** (`.planning/phases/26-designation-module-complete-ui-overhaul-system-wide-integration-audit-rbac-pbac-compliance-analytics-error-fixing/26-02-PLAN.md`)
- [x] **Plan 26-03: Dashboard Analytics, 7 KPI Summary Cards & Visual Distribution Charts** (`.planning/phases/26-designation-module-complete-ui-overhaul-system-wide-integration-audit-rbac-pbac-compliance-analytics-error-fixing/26-03-PLAN.md`)
- [x] **Plan 26-04: Designation Directory Overhaul, Dual View Switcher (Table & Card Grid) & Multi-Dimensional Filtering** (`.planning/phases/26-designation-module-complete-ui-overhaul-system-wide-integration-audit-rbac-pbac-compliance-analytics-error-fixing/26-04-PLAN.md`)
- [x] **Plan 26-05: Redesigned Create & Edit Modal with Department Selector & Archival Safeguards** (`.planning/phases/26-designation-module-complete-ui-overhaul-system-wide-integration-audit-rbac-pbac-compliance-analytics-error-fixing/26-05-PLAN.md`)
- [x] **Plan 26-06: Deep Inspection Details Modal with Assigned Staff Roster & Search** (`.planning/phases/26-designation-module-complete-ui-overhaul-system-wide-integration-audit-rbac-pbac-compliance-analytics-error-fixing/26-06-PLAN.md`)
- [x] **Plan 26-07: Archive Management Console, Revert/Restore & Permanent Delete with Mandatory Employee Guard** (`.planning/phases/26-designation-module-complete-ui-overhaul-system-wide-integration-audit-rbac-pbac-compliance-analytics-error-fixing/26-07-PLAN.md`)
- [x] **Plan 26-08: Cross-Module Integration Audit & Comprehensive End-to-End Vitest Test Suite** (`.planning/phases/26-designation-module-complete-ui-overhaul-system-wide-integration-audit-rbac-pbac-compliance-analytics-error-fixing/26-08-PLAN.md`)

---

## Phase 27: Work Shifts Module — Complete UI Overhaul, Shift Scheduling, System-Wide Integration, RBAC/PBAC Compliance & Error Fixing

**Goal:** Transform the Work Shifts Module into an enterprise-grade schedule management and workforce roster command center. Implement a 7-KPI live analytics dashboard with interactive visual distributions (horizontal staff-per-shift flex-bars and SVG Donut chart for shift types), dual view switcher (high-density Enterprise Table View vs Shift Cards Grid View), and multi-dimensional filtering (search, shift type, status, department). Redesign all modals (Create, Edit, Deep Inspection Details, Employee Assignment with searchable dropdown, Archive, Restore, and Permanent Delete) with live cross-midnight calculations, break deduction previews, working days multi-select, and strict enforcement of the non-negotiable **Employee Assignment Restriction Guard** (a shift cannot be permanently deleted while $\ge 1$ employee is assigned). Audit and verify cross-module integrations with Attendance (`attendance.service.js`), Employees (`shiftId`), Departments, and Payroll, ensuring attendance check-in/out evaluations and historical punch records are fully preserved. Verify complete functionality through an automated Vitest E2E test suite, 0 oxlint errors, and a clean Vite production build.

**Requirements**:
- **1. Backend Schema Expansion, Archival Lifecycle & Employee Assignment Restriction Guard (`shift.model.js`, `department.service.js`, `shift.routes.js`, `employee.service.js`)**:
  - Add `isArchived`, `archivedAt`, `archivedBy`, `departmentId`, `capacity`, `description`, and `color` fields and compound indexes to `Shift` schema.
  - Implement soft archive (`PATCH /api/v1/shifts/:id/archive`), restore (`PATCH /api/v1/shifts/:id/restore`), and permanent delete (`DELETE /api/v1/shifts/:id/permanent`).
  - Strict Employee Assignment Restriction Guard: Permanent deletion is blocked if $\ge 1$ employee is assigned.
  - Guard `createEmployee` and `updateEmployee` to prevent assigning archived shifts.
- **2. Backend Analytics Aggregation, KPI Statistics, Staff Roster API & Employee Bulk Assignment Endpoint (`department.service.js`, `department.controller.js`, `shift.routes.js`)**:
  - `GET /api/v1/shifts/stats`: 7 aggregated KPIs (Total, Active, Archived, Assigned Staff, Staffed, Empty, Night Shifts).
  - `GET /api/v1/shifts/analytics`: Shift type distribution, day/night ratios, and headcount per shift.
  - `GET /api/v1/shifts/:id/employees`: Paginated, searchable list of employees assigned to a shift.
  - `POST /api/v1/shifts/:id/assign`: Bulk assignment of employees with capacity enforcement.
- **3. Dashboard Analytics, 7 KPI Summary Cards & Visual Distribution Charts (`ShiftStatsCards.jsx`, `ShiftAnalyticsSection.jsx`)**:
  - 7 KPI summary cards matching Forest & Emerald Enterprise theme (`#061A14`, `#111D17`, `#1A3125`, `#00C471`).
  - Interactive horizontal distribution bar chart and native SVG Donut chart for Fixed vs Flexible vs Night schedules.
- **4. Shift Directory Overhaul, Dual View Switcher (Table & Card Grid) & Multi-Dimensional Filtering Toolbar (`ShiftsPage.jsx`, `ShiftFilterBar.jsx`, `ShiftCardView.jsx`)**:
  - Dual view switcher: Enterprise Table View vs interactive Shift Cards Grid View.
  - Multi-dimensional filter toolbar with instant search, shift type filter, status filter, and department selector.
- **5. Redesigned Create & Edit Shift Modal with Real-Time Timing Calculations, Overnight Detection & Department Associations (`ShiftModal.jsx`)**:
  - Start/end time pickers with live duration calculation, break deduction, overnight moon indicator, and work days selector.
- **6. Employee Shift Assignment Modal & Shift Roster Scheduling (`ShiftAssignModal.jsx`)**:
  - Dedicated assignment modal with searchable employee dropdown, capacity bar, and roster management.
- **7. Deep Inspection Details Modal with Assigned Staff Roster & Timing Breakdown (`ShiftDetailModal.jsx`)**:
  - Full schedule inspection with timing timeline, work days chips, archival notice, and assigned employee sub-table.
- **8. Archive Management Console, Revert/Restore & Permanent Delete with Mandatory Guard & Comprehensive Vitest E2E Suite (`ArchivedShiftList.jsx`, `ShiftArchiveModal.jsx`, `ShiftRestoreModal.jsx`, `ShiftPermanentDeleteModal.jsx`, `shifts.overhaul.e2e.test.js`)**:
  - Dedicated Archive Tab with restore and guarded permanent delete.
  - Comprehensive Vitest test suite with 100% green tests, 0 oxlint errors, and clean Vite production build.

**Depends on:** Phase 26  
**Plans:** 8 plans  

Plans:

- [x] **Plan 27-01: Backend Schema Expansion, Archival Lifecycle & Employee Assignment Restriction Guard** (`.planning/phases/27-work-shifts-module-complete-ui-overhaul-shift-scheduling-system-wide-integration-rbac-pbac-compliance-error-fixing/27-01-PLAN.md`)
- [x] **Plan 27-02: Backend Analytics Aggregation, KPI Statistics, Staff Roster API & Employee Bulk Assignment Endpoint** (`.planning/phases/27-work-shifts-module-complete-ui-overhaul-shift-scheduling-system-wide-integration-rbac-pbac-compliance-error-fixing/27-02-PLAN.md`)
- [x] **Plan 27-03: Dashboard Analytics, 7 KPI Summary Cards & Visual Distribution Charts** (`.planning/phases/27-work-shifts-module-complete-ui-overhaul-shift-scheduling-system-wide-integration-rbac-pbac-compliance-error-fixing/27-03-PLAN.md`)
- [x] **Plan 27-04: Shift Directory Overhaul, Dual View Switcher (Table & Card Grid) & Multi-Dimensional Filtering Toolbar** (`.planning/phases/27-work-shifts-module-complete-ui-overhaul-shift-scheduling-system-wide-integration-rbac-pbac-compliance-error-fixing/27-04-PLAN.md`)
- [x] **Plan 27-05: Redesigned Create & Edit Shift Modal with Real-Time Timing Calculations, Overnight Detection & Department Associations** (`.planning/phases/27-work-shifts-module-complete-ui-overhaul-shift-scheduling-system-wide-integration-rbac-pbac-compliance-error-fixing/27-05-PLAN.md`)
- [x] **Plan 27-06: Employee Shift Assignment Modal & Shift Roster Scheduling** (`.planning/phases/27-work-shifts-module-complete-ui-overhaul-shift-scheduling-system-wide-integration-rbac-pbac-compliance-error-fixing/27-06-PLAN.md`)
- [x] **Plan 27-07: Deep Inspection Details Modal with Assigned Staff Roster & Timing Breakdown** (`.planning/phases/27-work-shifts-module-complete-ui-overhaul-shift-scheduling-system-wide-integration-rbac-pbac-compliance-error-fixing/27-07-PLAN.md`)
- [x] **Plan 27-08: Archive Management Console, Revert/Restore & Permanent Delete with Mandatory Guard & Comprehensive Vitest E2E Suite** (`.planning/phases/27-work-shifts-module-complete-ui-overhaul-shift-scheduling-system-wide-integration-rbac-pbac-compliance-error-fixing/27-08-PLAN.md`)

---

## Phase 28: Roles & Permissions Module — Complete System-Wide RBAC/PBAC Audit, Permission Architecture Overhaul, Serena Memory Verification & Premium Enterprise UI Redesign

**Goal:** Conduct an exhaustive, system-wide security, architectural, and visual overhaul of the Roles & Permissions Module (M26) across the entire HRMS. Audit all 26+ modules to discover, standardize, and catalogue every permission key, action, resource, and scope in `backend/src/shared/permissions.js`. Align core system roles (`Super Admin`, `HR Manager`, `Department Manager`, `Employee`) strictly with `docs/FRD.md` Section 11. Implement real-time database-backed analytics (`GET /api/v1/roles/stats` and `GET /api/v1/roles/analytics`) featuring 8 KPI summary cards, a Role Workforce Distribution Bar Chart, and a Module Permission Coverage Donut Chart. Overhaul `RolesListPage.jsx` with a dual view switcher (high-density Enterprise Table View vs Role Cards Grid View (`RoleCardView.jsx`)) and multi-dimensional filter toolbar. Redesign `PermissionMatrix.jsx` and `RoleFormPage.jsx` into a high-performance visual permission assignment studio with sticky category navigation, tri-state bulk controls, numerical approval limits, and pre-save diff reviews. Redesign all modals (Create, Edit, Deep Inspection Details with staff roster, Cloning, Guarded Deletion, and User Multi-Role Assignment). Eliminate all hardcoded role checks across the entire frontend application, standardizing 100% of UI conditional rendering onto `usePermission` and `<Can>` so unauthorized functionality is never displayed. Enforce independent server-side PBAC authorization (`checkPermission`, `scopeFilter`, `fieldFilter`) across all backend routes and services. Verify complete functionality through an automated Vitest E2E suite, 0 Oxlint errors, and a clean Vite production build.

**Requirements**:
- **1. System-Wide Permission Discovery, Catalogue Synchronization & Serena Memory Audit (`shared/permissions.js`, `role.routes.js`, `checkPermission.js`)**:
  - Discover and reconcile all permissions across 26+ modules into an exhaustive master catalogue.
  - Structure permissions with module grouping, resource subjects, human-readable labels, and allowed data scopes (`['own', 'team', 'department', 'all']`).
- **2. Backend RBAC/PBAC Core Roles Audit, Seed Alignment & Security Guards (`role.model.js`, `roles.seed.js`, `role.service.js`)**:
  - Align `roles.seed.js` with `docs/FRD.md` Section 11 (Permission Matrix).
  - Add `GET /api/v1/roles/stats` and `GET /api/v1/roles/analytics` with live MongoDB aggregations.
  - Enforce privilege escalation guards (`grant ⊆ actor.permissions`), system role rename/delete blocks, and active user assignment deletion locks (`HTTP 409 Conflict`).
- **3. System-Wide PBAC Policy Evaluation, Data Scoping Engine & Field-Level Masking (`scopeFilter.js`, `fieldFilter.js`)**:
  - Standardize `buildScopeQuery` across `Employee`, `Attendance`, `Leave`, `Payroll`, `Loan`, `Expense` services.
  - Mask confidential financial and identification fields (`salary`, `cnic`, `bankAccount`) for non-privileged scopes.
- **4. Roles & Permissions Dashboard Analytics, 8-KPI Summary Cards & SVG Visualizations (`RoleStatsCards.jsx`, `RoleAnalyticsSection.jsx`)**:
  - 8 live KPI summary cards: Total Roles, Active Roles, System Roles, Custom Roles, Assigned Staff, Total Permissions, Permission Coverage, Active Delegations.
  - Native SVG Role Workforce Distribution Bar Chart and Module Permission Coverage Donut Chart.
- **5. Enterprise Role Directory Overhaul, Dual View Switcher (Table vs Cards) & Multi-Dimensional Filter Toolbar (`RolesListPage.jsx`, `RoleCardView.jsx`, `RoleFilterBar.jsx`)**:
  - Dual view modes: High-Density Enterprise Table View vs. Visual Role Cards Grid View.
  - Multi-dimensional filter toolbar with keyword search, role type, headcount status, active status, dismissible chips, and shared pagination.
- **6. High-Performance Visual Permission Matrix Studio & Bulk Control Overhaul (`PermissionMatrix.jsx`, `RoleFormPage.jsx`)**:
  - Memoized permission rows with sticky module category tabs, tri-state module checkboxes, bulk scope dropdown, approval limit inputs, and pre-save diff review modal (`PermissionDiffModal.jsx`).
- **7. Role Create/Edit, Detailed Inspection, Cloning & User Multi-Role Assignment Modals (`RoleDetailModal.jsx`, `RoleCloneModal.jsx`, `RoleDeleteModal.jsx`, `UserRoleAssignModal.jsx`)**:
  - Complete lifecycle modal suite with system role lock, assigned staff roster sub-table, and privilege escalation prevention.
- **8. System-Wide UI Permission Guarding Audit (`Sidebar.jsx`, Core Pages, Action Buttons & CASL Can)**:
  - Eliminate hardcoded role checks; enforce 100% permission-based conditional rendering so unauthorized buttons and menus are never displayed.
- **9. Cross-Module Integration Testing, Privilege Escalation Security Audit & Comprehensive Vitest Suite (`roles.overhaul.e2e.test.js`)**:
  - Automated Vitest E2E suite covering core roles, custom lifecycle, delegation, scoping, and cross-module 403 API rejections.
  - 0 Oxlint errors across 417+ files and clean Vite production build.

**Plans**:
- [x] **Plan 28-01: System-Wide Permission Discovery, Catalogue Synchronization & Serena Memory Audit** (`.planning/phases/28-roles-permissions-module-complete-system-wide-rbac-pbac-audit-permission-architecture-overhaul-serena-memory-verification-premium-enterprise-ui-redesign/28-01-PLAN.md`)
- [x] **Plan 28-02: Backend RBAC/PBAC Core Roles Audit, Seed Alignment & Security Guards** (`.planning/phases/28-roles-permissions-module-complete-system-wide-rbac-pbac-audit-permission-architecture-overhaul-serena-memory-verification-premium-enterprise-ui-redesign/28-02-PLAN.md`)
- [x] **Plan 28-03: System-Wide PBAC Policy Evaluation, Data Scoping Engine & Field-Level Masking** (`.planning/phases/28-roles-permissions-module-complete-system-wide-rbac-pbac-audit-permission-architecture-overhaul-serena-memory-verification-premium-enterprise-ui-redesign/28-03-PLAN.md`)
- [x] **Plan 28-04: Roles & Permissions Dashboard Analytics, 8-KPI Summary Cards & SVG Visualizations** (`.planning/phases/28-roles-permissions-module-complete-system-wide-rbac-pbac-audit-permission-architecture-overhaul-serena-memory-verification-premium-enterprise-ui-redesign/28-04-PLAN.md`)
- [x] **Plan 28-05: Enterprise Role Directory Overhaul, Dual View Switcher (Table vs Cards) & Multi-Dimensional Filter Toolbar** (`.planning/phases/28-roles-permissions-module-complete-system-wide-rbac-pbac-audit-permission-architecture-overhaul-serena-memory-verification-premium-enterprise-ui-redesign/28-05-PLAN.md`)
- [x] **Plan 28-06: High-Performance Visual Permission Matrix Studio & Bulk Control Overhaul** (`.planning/phases/28-roles-permissions-module-complete-system-wide-rbac-pbac-audit-permission-architecture-overhaul-serena-memory-verification-premium-enterprise-ui-redesign/28-06-PLAN.md`)
- [x] **Plan 28-07: Role Create/Edit, Detailed Inspection, Cloning & User Multi-Role Assignment Modals** (`.planning/phases/28-roles-permissions-module-complete-system-wide-rbac-pbac-audit-permission-architecture-overhaul-serena-memory-verification-premium-enterprise-ui-redesign/28-07-PLAN.md`)
- [x] **Plan 28-08: System-Wide UI Permission Guarding Audit (Sidebar, Pages, Action Buttons & CASL Can)** (`.planning/phases/28-roles-permissions-module-complete-system-wide-rbac-pbac-audit-permission-architecture-overhaul-serena-memory-verification-premium-enterprise-ui-redesign/28-08-PLAN.md`)
- [x] **Plan 28-09: Cross-Module Integration Testing, Privilege Escalation Security Audit & Comprehensive Vitest Suite** (`.planning/phases/28-roles-permissions-module-complete-system-wide-rbac-pbac-audit-permission-architecture-overhaul-serena-memory-verification-premium-enterprise-ui-redesign/28-09-PLAN.md`)

---

## Phase 29: Roles & Permissions Module — Edit Role & Permission Matrix UI Redesign + Complete Functional Audit

**Goal:** Execute a comprehensive, high-craft UI/UX redesign and functional audit of the **Edit Role** screen (`RoleFormPage.jsx`) and its core engine, the **Visual Permission Matrix** (`PermissionMatrix.jsx`), where all module-wise permissions are displayed and managed. Transform the screen into an enterprise-grade command studio with high visual hierarchy, clean card/accordion architecture across all 26+ modules, granular action controls, tri-state bulk selection, sticky navigation, data scope controls (`all`, `department`, `team`, `own`), approval thresholds, unsaved state persistence, pre-save diff inspection, and robust validation guards.

**Requirements**:
- **1. Edit Role Studio Header & Metadata Card Redesign (`RoleFormPage.jsx`)**:
  - Re-engineer the role specification card with Forest & Emerald design tokens (`#061A14`, `#111D17`, `#1A3125`, `#00C471`).
  - System role locked visual indicators (gold crown, amber warning banner, disabled immutable fields).
  - Clean input fields: Role Name, Slug (auto-generated monospace badge), Description with real-time character counter (0/300), and Status Toggle (`Active` vs `Inactive`).
  - Breadcrumb navigation, quick exit with dirty state protection, and contextual action buttons.
- **2. Module-Wise Permission Cards & Accordion Architecture (`PermissionMatrix.jsx`)**:
  - Reorganize permissions across all 26 modules into structured, visually distinct module cards grouped by functional categories:
    - `Core HR & Organization`
    - `Time, Attendance & Leaves`
    - `Payroll, Loans & Compensation`
    - `Talent, Recruitment & Assets`
    - `Governance, Policies & System`
  - Each module card displays module icon, human-readable label, subject tag, description, total vs selected counter pill, tri-state module checkbox, and batch scope selector.
- **3. High-Density Action Grid & Fine-Grained Controls (`PermissionRow.jsx` / `PermissionMatrix.jsx`)**:
  - Consistent structured grid layout for permission actions (View, Create, Edit, Delete, Approve, Reject, Export, Import, Manage, Assign, Restore) only where supported by the catalogue.
  - Emerald primary checkbox styling (`#00C471`) with instant toggle responsiveness (<16ms).
  - Integrated data scope selector dropdown (`All Records`, `Department Scope`, `Direct Team`, `Self Only`) restricted to action's `allowedScopes`.
  - Number input for actions supporting approval thresholds (e.g. max leave days, max expense PKR amount).
- **4. Bulk Operations, Search, Filtering & Category Jump-Nav (`PermissionMatrix.jsx`)**:
  - Sticky top toolbar with debounced permission search, "Show Enabled Only" filter toggle, "Expand All" / "Collapse All" triggers, and global "Grant All" / "Revoke All" actions (for custom roles).
  - Sticky category quick-jump navigator bar with badge counters showing active selection density.
- **5. Safety Guards, Dependency Validation & Pre-Save Diff Review (`PermissionMatrix.jsx`, `PermissionDiffModal.jsx`, `RoleFormPage.jsx`)**:
  - Automated dependency resolution (auto-grants read/view permissions when write/edit/approve is selected).
  - Sticky bottom unsaved changes bar displaying pending additions, modifications, and revocations count.
  - Interactive Pre-Save Differential Review Modal (`PermissionDiffModal.jsx`) displaying color-coded delta before backend commit.
- **6. Functional Audit & End-to-End Vitest Verification (`roles.matrix.audit.test.js`)**:
  - Verify role mutation lifecycle, payload validation, system role lock, permission array integrity, and CASL compatibility.
  - Validate 0 Oxlint errors across all touched files and clean Vite production build.

**Depends on:** Phase 28  
**Plans:** 6 plans

Plans:
- [x] **Plan 29-01: Edit Role Studio Layout & Role Metadata Card Overhaul** (`.planning/phases/29-roles-permissions-module-edit-role-permission-matrix-ui-redesign-complete-functional-audit/29-01-PLAN.md`)
- [x] **Plan 29-02: Permission Matrix Category Jump-Nav, Search & Sticky Toolbar** (`.planning/phases/29-roles-permissions-module-edit-role-permission-matrix-ui-redesign-complete-functional-audit/29-02-PLAN.md`)
- [x] **Plan 29-03: Module Permission Cards, Tri-State Controls & Batch Scope Operations** (`.planning/phases/29-roles-permissions-module-edit-role-permission-matrix-ui-redesign-complete-functional-audit/29-03-PLAN.md`)
- [x] **Plan 29-04: Action Row Grid, Fine-Grained Data Scopes & Approval Limits** (`.planning/phases/29-roles-permissions-module-edit-role-permission-matrix-ui-redesign-complete-functional-audit/29-04-PLAN.md`)
- [x] **Plan 29-05: Safety Guards, Dependency Auto-Granting & Pre-Save Diff Modal Integration** (`.planning/phases/29-roles-permissions-module-edit-role-permission-matrix-ui-redesign-complete-functional-audit/29-05-PLAN.md`)
- [x] **Plan 29-06: End-to-End Functional Audit, Vitest Verification & Static Analysis** (`.planning/phases/29-roles-permissions-module-edit-role-permission-matrix-ui-redesign-complete-functional-audit/29-06-PLAN.md`)

---

## Phase 30: Complete RBAC & PBAC Frontend Permission Visibility Audit — All Roles & All Modules

**Goal:** Perform an end-to-end, project-wide audit and enforcement of permission-based frontend visibility across every module and role in the HRMS. Strictly eliminate unauthorized UI rendering (no disabled or greyed-out controls; unauthorized features must NOT render at all), enforce real-time permission revocation synchronization without manual re-login, verify independent backend API authorization (HTTP 403), preserve unrestricted Admin authority (`manage:all`), and author a comprehensive Role-Permission Visibility Matrix with automated multi-role Vitest test coverage.

**Requirements**:
- **1. Centralized Permission Primitives, Real-Time Revocation & Auth Sync Engine (`Plan 30-01`)**:
  - Rehydrate user permissions in real-time on `'Auth'` cache tag invalidation via `getMe` and `App.jsx`.
  - Ensure immediate CASL ability re-computation when permissions or roles are modified in the backend.
  - Optimize `<Can />`, `usePermission()`, and `ProtectedRoute.jsx` for zero DOM leakage and strict Admin exemption.
- **2. Core HR, Organization & Executive Dashboard Visibility Audit (`Plan 30-02`)**:
  - Filter executive metric widgets and quick actions on `DashboardPage.jsx`.
  - Conditionally render Onboard, Ingest, Export, Edit, Delete, and Compensation tabs across Employee pages and modals.
  - Hide Add Department, Add Designation, Edit, and Archive controls across Organization pages.
- **3. Time, Attendance, Shifts & Leaves Frontend Visibility Audit (`Plan 30-03`)**:
  - Guard PunchCardWidget, field check-ins, WFH requests, punch corrections, and kiosk terminal management.
  - Hide attendance lock controls, punch approval actions, shift creations/assignments, and leave approval/encashment buttons.
- **4. Payroll, Loans, Expenses & Finance Visibility Audit (`Plan 30-04`)**:
  - Hide Run Payroll, Approve Run, Adjust Payslip, Bank Advice Export, and Salary Structure controls.
  - Hide Apply Loan, Recommend, Approve, Disburse, and Foreclose controls.
  - Hide Submit Expense, Approve, Reject, Reimburse, and Expense Category settings.
- **5. Talent, Recruitment, Performance, Assets & Governance Visibility Audit (`Plan 30-05`)**:
  - Hide Job Post, Pipeline Stage Move, Candidate Hire, and Interview Scheduling actions.
  - Hide Appraisal Cycle Launch, Review Calibration, Asset Allocation/Disposal, Policy Publishing, and Role Management controls.
  - Hide Company Settings modifications and Grievance committee investigations.
- **6. End-to-End Multi-Role Testing, Visibility Matrix & Verification Report (`Plan 30-06`)**:
  - Execute automated Vitest multi-role test suite (`backend/tests/rbac.pbac.visibility.audit.test.js`) across 9 personas.
  - Publish master `docs/ROLE-PERMISSION-VISIBILITY-MATRIX.md`.
  - Validate 0 Oxlint errors and clean Vite production build.

**Depends on:** Phase 29  
**Plans:** 6 plans

Plans:
- [x] **Plan 30-01: Centralized Permission Primitives, Real-Time Revocation & Auth Sync Engine** (`.planning/phases/30-complete-rbac-pbac-frontend-permission-visibility-audit-all-roles-all-modules/30-01-PLAN.md`)
- [x] **Plan 30-02: Core HR, Organization & Dashboard Frontend Visibility Audit** (`.planning/phases/30-complete-rbac-pbac-frontend-permission-visibility-audit-all-roles-all-modules/30-02-PLAN.md`)
- [x] **Plan 30-03: Time, Attendance, Shifts & Leaves Frontend Visibility Audit** (`.planning/phases/30-complete-rbac-pbac-frontend-permission-visibility-audit-all-roles-all-modules/30-03-PLAN.md`)
- [x] **Plan 30-04: Payroll, Loans, Expenses & Finance Frontend Visibility Audit** (`.planning/phases/30-complete-rbac-pbac-frontend-permission-visibility-audit-all-roles-all-modules/30-04-PLAN.md`)
- [x] **Plan 30-05: Talent, Recruitment, Performance, Assets & Governance Visibility Audit** (`.planning/phases/30-complete-rbac-pbac-frontend-permission-visibility-audit-all-roles-all-modules/30-05-PLAN.md`)
- [x] **Plan 30-06: End-to-End Multi-Role Automated Testing, Visibility Matrix & Verification Report** (`.planning/phases/30-complete-rbac-pbac-frontend-permission-visibility-audit-all-roles-all-modules/30-06-PLAN.md`)

---

## Phase 31: Audit Log Module — Complete Enterprise-Level UI Overhaul, Audit Trail Architecture, System-Wide Activity Tracking, RBAC/PBAC Compliance & Security Audit

**Goal:** Overhaul the Audit Log Module into a high-grade, immutable centralized audit and forensic monitoring console across the HRMS. Enrich the schema with status, severity, category, and device parsing; build real-time analytics aggregation pipelines, streaming export, and statutory retention management; redesign the dashboard with KPI cards and activity trend charts; author an enterprise explorer with table, timeline, and user activity views; and enforce strict RBAC/PBAC zero UI leakage with 100% automated test coverage.

**Requirements**:
- **1. Enriched Audit Schema & Sanitized Logging Engine (`Plan 31-01`)**:
  - Add status, severity, category, description, device parsing, and archival fields with compound indexes.
  - Implement deep sanitization masking passwords, tokens, and raw secrets.
  - Verify system-wide event attribution across Auth, Employees, Roles, Payroll, Attendance, and Shifts.
- **2. Real-Time Analytics & Aggregation Pipelines (`Plan 31-02`)**:
  - Implement `/stats` and `/analytics` endpoints calculating activity velocity, success rate, and security distributions.
- **3. Streaming Export & Retention Compliance Engine (`Plan 31-03`)**:
  - Server-side CSV/Excel export respecting active filters and PBAC scoping.
  - Statutory retention policy inspection and guarded soft-archival without destructive deletion.
- **4. Enterprise Dashboard & Visual Analytics UI (`Plan 31-04`)**:
  - 8-card responsive KPI grid, activity velocity curves, module distribution donuts, and security trend meters.
- **5. Multi-View Audit Explorer & Forensic Details Studio (`Plan 31-05`)**:
  - Table, Timeline, and User Activity views with debounced search and multi-criteria filters.
  - Side-by-side state diff comparison with color-coded additions, edits, and removals.
- **6. RBAC/PBAC Security Verification & Automated Test Suite (`Plan 31-06`)**:
  - Strict zero UI leakage for non-admin roles and complete Vitest test suite (`audit.module.overhaul.test.js`).

**Depends on:** Phase 30  
**Plans:** 6 plans

Plans:
- [x] **Plan 31-01: Enhanced Audit Log Data Model, Enriched Logging Engine & Cross-Module Event Attribution** (`.planning/phases/31-audit-log-module-complete-enterprise-level-ui-overhaul-audit-trail-architecture-system-wide-activity-tracking-rbac-pbac-compliance-security-audit/31-01-PLAN.md`)
- [x] **Plan 31-02: Audit Analytics, Aggregation Pipelines & Statistics Backend APIs** (`.planning/phases/31-audit-log-module-complete-enterprise-level-ui-overhaul-audit-trail-architecture-system-wide-activity-tracking-rbac-pbac-compliance-security-audit/31-02-PLAN.md`)
- [x] **Plan 31-03: Audit Export Engine, Retention Policies & Forensic Compliance APIs** (`.planning/phases/31-audit-log-module-complete-enterprise-level-ui-overhaul-audit-trail-architecture-system-wide-activity-tracking-rbac-pbac-compliance-security-audit/31-03-PLAN.md`)
- [x] **Plan 31-04: Audit Log Dashboard, Hero Metrics & Real-Time Analytics UI** (`.planning/phases/31-audit-log-module-complete-enterprise-level-ui-overhaul-audit-trail-architecture-system-wide-activity-tracking-rbac-pbac-compliance-security-audit/31-04-PLAN.md`)
- [x] **Plan 31-05: Enterprise Audit Explorer, Multi-View Suite & Forensic Details Modal** (`.planning/phases/31-audit-log-module-complete-enterprise-level-ui-overhaul-audit-trail-architecture-system-wide-activity-tracking-rbac-pbac-compliance-security-audit/31-05-PLAN.md`)
- [x] **Plan 31-06: RBAC/PBAC Enforcement, Zero UI Leakage, System-Wide Vitest Test Suite & Master Audit Documentation** (`.planning/phases/31-audit-log-module-complete-enterprise-level-ui-overhaul-audit-trail-architecture-system-wide-activity-tracking-rbac-pbac-compliance-security-audit/31-06-PLAN.md`)

---

## Phase 32: Audit Log Module — UI Refinement Phase 2 | Complete Visual Polish, Actor Details Enhancement & Modal Redesign

**Goal:** Execute a comprehensive second-stage UI/UX refinement across the Audit Log Module. Deeply populate and format complete Actor credentials (User -> Employee -> Department, Designation, Roles, Avatar, Code, Status) on backend and frontend; harmonize button and semantic pill color tokens according to `docs/UI-REFERENCE.md`; completely redesign the Inspect Details (Forensic Diff) modal with rich actor cards and visual Before/After state comparison; completely redesign the Retention modal with Pakistan statutory labor compliance status cards and a guarded two-step archival flow; polish Table, Timeline, User Activity, and Export views; and verify 100% test pass rates and production build cleanliness.

**Requirements**:
- **1. Deep Backend Actor Enrichment & Historical Attribution Pipeline (`Plan 32-01`)**:
  - Two-level deep population in `backend/src/modules/audit/audit.service.js` resolving User -> Employee, Roles, Department, and Designation.
  - Fail-safe actor normalization utility providing complete attributes for employees, standalone admins, and automated system crons.
- **2. Universal Design System Tokens, Button & Pill Palette Harmonization (`Plan 32-02`)**:
  - Centralized token utility `auditTheme.js` mapping all statuses, severities, categories, and button variants to subtle tinted classes and icons.
  - Refined 8-card metric grid and SVG charts in Elvara Forest & Emerald Enterprise styling.
- **3. Actor Identity Presentation Across All Audit Explorer Views (`Plan 32-03`)**:
  - Rich actor identification cards (avatar, name, employee code, role pill, department) in Table, Timeline, and User Activity views.
  - Filter toolbar with active filter removal chips and smooth search input.
- **4. Complete Inspect Details (Forensic Diff) Modal Overhaul (`Plan 32-04`)**:
  - Comprehensive actor identity profile section, execution context and device diagnostics grid.
  - Dual-mode Before/After mutation inspector (Visual Field Comparison with color-coded changes + Raw JSON).
- **5. Statutory Retention & Archival Modal Complete Overhaul (`Plan 32-05`)**:
  - Statutory 365-day compliance policy overview and live active/archived metric cards.
  - Guarded two-step soft-archival flow preventing accidental record changes.
- **6. Export Modal Refinement, Comprehensive Verification, Testing & Polish (`Plan 32-06`)**:
  - Redux access token integration in export modal, full automated test suites execution, 0 Oxlint errors, and clean Vite build.

**Depends on:** Phase 31  
**Plans:** 6 plans

Plans:
- [x] **Plan 32-01: Deep Backend Actor Enrichment & Historical Attribution Pipeline** (`.planning/phases/32-audit-log-module-ui-refinement-phase-2-complete-visual-polish-actor-details-enhancement-modal-redesign/32-01-PLAN.md`)
- [x] **Plan 32-02: Universal Design System Tokens, Button & Pill Palette Harmonization** (`.planning/phases/32-audit-log-module-ui-refinement-phase-2-complete-visual-polish-actor-details-enhancement-modal-redesign/32-02-PLAN.md`)
- [x] **Plan 32-03: Actor Identity Presentation Across All Audit Explorer Views (Table, Timeline, User Activity)** (`.planning/phases/32-audit-log-module-ui-refinement-phase-2-complete-visual-polish-actor-details-enhancement-modal-redesign/32-03-PLAN.md`)
- [x] **Plan 32-04: Complete Inspect Details (Forensic Diff) Modal Overhaul** (`.planning/phases/32-audit-log-module-ui-refinement-phase-2-complete-visual-polish-actor-details-enhancement-modal-redesign/32-04-PLAN.md`)
- [x] **Plan 32-05: Statutory Retention & Archival Modal Complete Overhaul** (`.planning/phases/32-audit-log-module-ui-refinement-phase-2-complete-visual-polish-actor-details-enhancement-modal-redesign/32-05-PLAN.md`)
- [x] **Plan 32-06: Export Modal Refinement, Comprehensive Verification, Testing & Polish** (`.planning/phases/32-audit-log-module-ui-refinement-phase-2-complete-visual-polish-actor-details-enhancement-modal-redesign/32-06-PLAN.md`)

---

## Phase 33: Change Request Module — Complete Functional Audit, Cross-Module Integration, RBAC/PBAC Compliance & Full UI Redesign

**Goal:** Overhaul the Change Request Module into a production-grade enterprise workflow system. Expand the data schema with multi-category support, baseline snapshots, file attachments, and an immutable status timeline; build transactional cross-module synchronization updating Employee, Department, Designation, and Reporting Manager master records upon approval while tracking transfers/promotions in EmployeeHistory; register dedicated RBAC/PBAC permissions with departmental scoping; redesign the dashboard with KPI metrics and pure SVG analytics; author an enterprise data table with multi-criteria filters; create a forensic side-by-side Before/After diff modal; build an employee self-service hub with dynamic category request creation; and verify the complete lifecycle with 100% automated Vitest testing.

**Requirements**:
- **1. Change Request Data Model & Synchronization Engine (`Plan 33-01`)**:
  - Add category enum, baseline snapshot (`oldValue`), file attachments, priority, reviewer assignment, and chronological timeline.
  - Multi-category atomic approval engine mutating Employee (Personal, Contact, Address, Emergency, Bank with encrypted IBAN, Dept, Designation, Manager) and User (`name`).
  - Transfer/promotion logging in `EmployeeHistory` and circular manager check prevention.
- **2. Backend REST APIs, Scoped PBAC & Notification Integration (`Plan 33-02`)**:
  - Dedicated permissions catalogue (`change_request.view`, `change_request.create`, `change_request.edit`, `change_request.approve`, `change_request.delete`).
  - Scoped endpoints for listing, metrics, inspection, decision, return for correction, and self-cancellation.
  - Immutable audit logs (`AuditService.log`) and multi-channel notification dispatch (in-app, email, Socket.io).
- **3. Actionable KPI Dashboard & Visual Analytics UI (`Plan 33-03`)**:
  - 6-card metric grid (Total, Pending Review, Pending My Action, Approved, Rejected, Returned for Correction).
  - Pure SVG visual analytics (Status distribution, Category breakdown, 6-Month velocity curve).
- **4. Enterprise Change Request Explorer & Multi-Criteria Filter Suite (`Plan 33-04`)**:
  - Full-featured DataTable with employee credentials, category badges, inline old vs new preview, and action menu.
  - Sticky filter bar with debounced search, category dropdown, status chips, department filter, and pagination.
- **5. Request Details Forensic Modal, Before/After Diff & Decision Studio (`Plan 33-05`)**:
  - Side-by-side comparative grid contrasting current baseline with requested values.
  - Reviewer decision studio with confirmation modal, mandatory rejection/return rationale capture, and Super Admin escalation protection.
- **6. Employee Self-Service Hub, Dynamic Submission Modal & End-to-End Testing (`Plan 33-06`)**:
  - Dynamic multi-category submission modal with current value pre-fill, validation, and attachment upload.
  - Self-service tracking tab in `MyProfilePage.jsx`.
  - Comprehensive automated Vitest integration suite, 0 Oxlint errors, and clean Vite production build.

**Depends on:** Phase 32  
**Plans:** 6 plans

Plans:
- [x] **Plan 33-01: Change Request Data Model, Lifecycle Engine & Cross-Module Master Synchronization** (`.planning/phases/33-change-request-module-complete-functional-audit-cross-module-integration-rbac-pbac-compliance-full-ui-redesign/33-01-PLAN.md`)
- [x] **Plan 33-02: Backend Change Request APIs, Multi-Tier Approval Chain, Scoped PBAC & Audit/Notification Integration** (`.planning/phases/33-change-request-module-complete-functional-audit-cross-module-integration-rbac-pbac-compliance-full-ui-redesign/33-02-PLAN.md`)
- [x] **Plan 33-03: Change Request Dashboard, Actionable KPI Metrics & Category Analytics UI** (`.planning/phases/33-change-request-module-complete-functional-audit-cross-module-integration-rbac-pbac-compliance-full-ui-redesign/33-03-PLAN.md`)
- [x] **Plan 33-04: Enterprise Change Request Explorer & Multi-Criteria Filter Suite** (`.planning/phases/33-change-request-module-complete-functional-audit-cross-module-integration-rbac-pbac-compliance-full-ui-redesign/33-04-PLAN.md`)
- [x] **Plan 33-05: Request Details Forensic Modal, Before/After Diff Inspector & Reviewer Decision Studio** (`.planning/phases/33-change-request-module-complete-functional-audit-cross-module-integration-rbac-pbac-compliance-full-ui-redesign/33-05-PLAN.md`)
- [x] **Plan 33-06: Employee Self-Service Hub, Dynamic Multi-Category Submission Modal & End-to-End Testing** (`.planning/phases/33-change-request-module-complete-functional-audit-cross-module-integration-rbac-pbac-compliance-full-ui-redesign/33-06-PLAN.md`)

---

## Phase 34: User Access Module — Complete Audit, RBAC/PBAC Compliance, Security, Integration & Full UI Redesign

**Goal:** Overhaul the User Access Module into an enterprise-grade administration and security portal. Extend the User data schema with first-class name support, account lockout state, session revocation, and force password change triggers; develop a dedicated User Access Service supporting paginated search, deep employee identity population, and aggregated KPI metrics; register granular permissions with PBAC departmental scoping; construct an Elvara Forest (`#061A14`) & Emerald (`#00C471`) dashboard with pure SVG security analytics; build an enterprise DataTable with multi-criteria filters; create a 5-tab forensic inspect modal detailing user credentials, linked employee, roles, effective permissions matrix, and access history; provide guarded role assignment and security action dialogs; and achieve 100% automated test coverage.

**Requirements**:
- **1. User Data Model Alignment & Security State Engine (`Plan 34-01`)**:
  - Add `name` field to User schema with compound indexes and `isLocked` state calculation.
  - Zod validation schemas for query parameters, account unlocks, and session revocations.
  - Employee-User synchronization hooks updating personal name across collections.
- **2. Backend User Access Service & Scoped PBAC APIs (`Plan 34-02`)**:
  - `user.service.js` with paginated search, deep employee population, and PBAC scoping.
  - Aggregated KPI stats endpoint (`/users/stats`) and full user inspection (`/users/:id`).
  - Administrative security endpoints: unlock, session revocation, and force password change.
  - Granular permissions catalog (`user.view`, `user.manage`, `role.assign`) and audit log integration.
- **3. User Access Dashboard & Security Analytics UI (`Plan 34-03`)**:
  - 6-card actionable KPI deck (Total, Active, Inactive, Locked, Unassigned, 2FA Enforced).
  - Pure SVG security analytics: Users by Role breakdown and Account Health status distribution.
- **4. Enterprise User Access Explorer & Multi-Criteria Filter Suite (`Plan 34-04`)**:
  - Sticky filter toolbar with debounced search, role dropdown, department filter, and status chips.
  - High-density DataTable with user avatar, employee credentials, role badges, lockout banner, and action menus.
- **5. Forensic User Inspect Modal (`Plan 34-05`)**:
  - 5-tab modal: User Identity, Assigned Roles, Effective Permissions Matrix (grouped by module with PBAC scope pills), Account Security & Sessions, and Access & Audit History.
- **6. Role Assignment Studio, Security Actions & End-to-End Testing (`Plan 34-06`)**:
  - Role assignment modal with privilege escalation defense and assignment reason capture.
  - Security action dialogs for unlock, session revocation, emergency password reset, and force password change.
  - Comprehensive Vitest integration suite, 0 Oxlint errors, and clean Vite production build.

**Depends on:** Phase 33  
**Plans:** 6 plans

Plans:
- [x] **Plan 34-01: Data Model Alignment, User Schema Extension (`name`), User Status State Machine & Security Action Engine** (`.planning/phases/34-user-access-module-complete-audit-rbac-pbac-compliance-security-integration-full-ui-redesign/34-01-PLAN.md`)
- [x] **Plan 34-02: Backend REST APIs, User Access Service, Scoped PBAC, Pagination, Security Actions, Audit Log & Notification Integration** (`.planning/phases/34-user-access-module-complete-audit-rbac-pbac-compliance-security-integration-full-ui-redesign/34-02-PLAN.md`)
- [x] **Plan 34-03: User Access Dashboard, Actionable KPI Metrics & Security Analytics UI** (`.planning/phases/34-user-access-module-complete-audit-rbac-pbac-compliance-security-integration-full-ui-redesign/34-03-PLAN.md`)
- [x] **Plan 34-04: Enterprise User Access Explorer, Multi-Criteria Filter Suite & High-Density DataTable** (`.planning/phases/34-user-access-module-complete-audit-rbac-pbac-compliance-security-integration-full-ui-redesign/34-04-PLAN.md`)
- [x] **Plan 34-05: Forensic User Inspect Modal (Identity, Roles, Effective Permissions Matrix, Security State & Audit Timeline)** (`.planning/phases/34-user-access-module-complete-audit-rbac-pbac-compliance-security-integration-full-ui-redesign/34-05-PLAN.md`)
- [x] **Plan 34-06: Guarded Role Assignment Studio, Security Action Modals (Unlock, Session Revocation, Password Management) & End-to-End Testing** (`.planning/phases/34-user-access-module-complete-audit-rbac-pbac-compliance-security-integration-full-ui-redesign/34-06-PLAN.md`)

---

## Phase 35: Settings Module — Complete Enterprise-Wide Audit, Implementation, Integration & Full UI Overhaul

**Goal:** Overhaul the entire Settings Module (Module M2 Company Settings & System-Wide Governance) into an enterprise-grade administration suite. Complete audit and implementation across all 10 mandatory sections: Company Profile with logo upload/removal and system-wide branding synchronization; Working Hours with Asia/Karachi timezone, shift alignment, and net duration calculation; Attendance Rules with Dynamic QR Kiosk rotating tokens and Facial Recognition Euclidean matching & biometric privacy; Leave Policy with accrual rules and visual multi-tier Approval Chains Builder; Payroll Cycle integration with payroll engine and cut-off scheduling; Statutory Tax with Pakistan FBR progressive salaried slabs, EOBI, PESSI, Provident Fund, and interactive Tax & Net Pay Simulator; Multi-Branch Geo-fencing Leaflet interactive map with branch CRUD and Haversine distance bounds; Communication Templates Studio with live preview and mustache tag injector; Omnichannel Notification channel routing; and Enterprise Disaster Recovery with backup archive listing, secure download endpoint, and non-destructive integrity verification. Redesign the master Settings command center adhering strictly to Elvara Forest (`#061A14`) & Emerald (`#00C471`).

**Requirements**:
- **1. Backend Core Schema Extension, Zod Validators, SettingService Cache Hardening (`Plan 35-01`)**:
  - Register official Zod schemas for `qrAttendance`, `faceAttendance`, `approvalChains`, and `geoFences`.
  - Canonical defaults in `setting.service.js` and fast in-memory cache bus alignment for attendance consumers.
- **2. Company Profile & Identity Synchronization (`Plan 35-02`)**:
  - Logo upload (PNG/JPEG/WEBP/SVG max 2MB) with Cloudinary & local storage fallback.
  - Dedicated logo removal endpoint (`DELETE /api/v1/settings/company/logo`) and real-time branding synchronization across Topbar, Payslips, and Email headers.
- **3. Working Hours & Attendance Rules Overhaul (`Plan 35-03`)**:
  - Operating days toggle, Asia/Karachi canonical timezone, net working hours calculation, and shift alignment notes.
  - Punctuality grace periods, late penalties in PKR/paisa, Dynamic QR rotation parameters (15s-60s), and Face Biometric Euclidean distance threshold slider & liveness protection.
- **4. Leave Policy Overhaul & Visual Approval Chains Builder (`Plan 35-04`)**:
  - Fiscal year cycle, carry-forward quota, encashment, sandwich rule, and probation restriction.
  - Interactive multi-tier Approval Chains Builder (Reporting Manager -> Dept Head -> HR -> Super Admin) with configurable days threshold rules and absent manager delegation.
- **5. Payroll Cycle & Pakistan Statutory Tax Engine (`Plan 35-05`)**:
  - Payroll cycle calculation helpers integrated with `payroll.service.js` for attendance lock dates.
  - Pakistan FBR salaried progressive tax slabs with continuity validation, FBR 2024-25 / 2025-26 presets, EOBI (5%/1%), PESSI (6%), Provident Fund, and interactive Gross-to-Net Pay Simulator.
- **6. Multi-Branch Geo-fencing Interactive Map (`Plan 35-06`)**:
  - Multi-office management (Headquarters, Regional branches, Client sites) with Leaflet pin dragging, circular radius resizing, reverse geocoding, and Haversine multi-fence validation.
- **7. Communication Templates, Notifications & Disaster Recovery Backup Engine (`Plan 35-07`)**:
  - Email/WhatsApp mustache template builder with split-screen live preview and reset to defaults.
  - Backup archive listing endpoint (`GET /backups`), secure authenticated download endpoint (`GET /backups/:filename/download`), and non-destructive integrity validator.
- **8. Master Settings Command Center UI Redesign & Verification (`Plan 35-08`)**:
  - Redesign `SettingsPage.jsx` into a categorized sidebar/tab hub adhering strictly to `docs/UI-REFERENCE.md`.
  - Unsaved changes dirty state detection, section completion badges, and RBAC-aware tab access control.
  - 100% Vitest unit/integration tests and Playwright multi-role browser verification.

**Depends on:** Phase 34  
**Plans:** 8 plans

Plans:
- [x] **Plan 35-01: Backend Core Schema Extension, Zod Validators, SettingService Cache Hardening & Cross-Module Consumer Alignment** (`.planning/phases/35-settings-module-complete-enterprise-wide-audit-implementation-integration-full-ui-overhaul/35-01-PLAN.md`)
- [x] **Plan 35-02: Company Profile, Logo Management, Direct Removal & System-Wide Branding Synchronization** (`.planning/phases/35-settings-module-complete-enterprise-wide-audit-implementation-integration-full-ui-overhaul/35-02-PLAN.md`)
- [x] **Plan 35-03: Working Hours, Shift Synchronization, Attendance Rules, Dynamic QR & Biometric Privacy Engine** (`.planning/phases/35-settings-module-complete-enterprise-wide-audit-implementation-integration-full-ui-overhaul/35-03-PLAN.md`)
- [x] **Plan 35-04: Leave Policy Overhaul, Accrual Governance & Interactive Approval Chains Builder** (`.planning/phases/35-settings-module-complete-enterprise-wide-audit-implementation-integration-full-ui-overhaul/35-04-PLAN.md`)
- [x] **Plan 35-05: Payroll Cycle Integration, Pakistan FBR Progressive Tax Engine & Statutory Compliance Simulator** (`.planning/phases/35-settings-module-complete-enterprise-wide-audit-implementation-integration-full-ui-overhaul/35-05-PLAN.md`)
- [x] **Plan 35-06: Multi-Branch Geo-fencing Interactive Map & Spatial Perimeter Management** (`.planning/phases/35-settings-module-complete-enterprise-wide-audit-implementation-integration-full-ui-overhaul/35-06-PLAN.md`)
- [x] **Plan 35-07: Communication Templates, Omnichannel Notification Routing & Enterprise Disaster Recovery Engine** (`.planning/phases/35-settings-module-complete-enterprise-wide-audit-implementation-integration-full-ui-overhaul/35-07-PLAN.md`)
- [x] **Plan 35-08: Master Settings UI Redesign, Tab Navigation Hub, Unsaved Changes Guardrails & End-to-End Verification** (`.planning/phases/35-settings-module-complete-enterprise-wide-audit-implementation-integration-full-ui-overhaul/35-08-PLAN.md`)

---

## Phase 36: Company Profile — Advanced UI Refinement, Employee ID Card Implementation & Complete System-Wide Settings Integration Audit

**Goal:** Transform the Company Profile section of Module M2 into an enterprise-grade corporate identity and governance center. Completely redesign company text-field editing into a structured 5-category modal (`CompanyProfileEditModal.jsx`), replace browser-native logo removal with a dedicated confirmation modal (`CompanyLogoRemoveModal.jsx`), elevate the ID Card preview into a full design studio (`idCardConfig`), bridge the gap with the Employee Module by implementing complete employee ID card management (`EmployeeIdCardModal.jsx` with print/download/preview across Profile, List, and My Profile), and systematically eliminate hardcoded company branding across the entire HRMS (Sidebar, Login, Careers, PDF payslips, offer letters, experience certificates, reports) to make Company Profile the single source of truth.

**Requirements**:
- **1. Backend Core Schema Extension, Zod Validators, ID Card Config & SettingService Cache Bus (`Plan 36-01`)**:
  - Extend `companyProfileSchema` with full corporate identity fields (Legal Name, SECP/Registration No., Industry, Description, City, State, Country, Postal Code, Timezone, Currency) and formal `idCardConfigSchema`.
  - Canonical defaults in `setting.service.js` and fast in-memory cache bus alignment.
- **2. Company Logo Removal Confirmation Modal & Text-Fields Redesign Studio (`Plan 36-02`)**:
  - Build `CompanyLogoRemoveModal.jsx` eliminating browser-native `confirm()` dialogs.
  - Build `CompanyProfileEditModal.jsx` with 5 logical corporate field categories and real-time Zod validation.
- **3. Employee ID Card Configuration & Live Interactive Preview Studio in Company Profile (`Plan 36-03`)**:
  - Interactive Front and Back switcher with CR80 physical badge geometry.
  - Layout controls (vertical/horizontal), themes (Forest, Emerald, Light, Dark), and field toggles.
- **4. Backend Employee ID Card REST API, Verifiable Payload & RBAC/PBAC Scoped Authorization (`Plan 36-04`)**:
  - Endpoints `GET /api/v1/employees/:id/id-card` and `GET /api/v1/employees/me/id-card`.
  - Merge live employee coordinates with company branding and ID card configuration, with digital QR verification token and audit logging.
- **5. Employee Module ID Card Management Workflow (View, Preview, Download, Print) (`Plan 36-05`)**:
  - Build `EmployeeIdCardModal.jsx` with dedicated `@media print` rules for CR80 badges and PNG/PDF export.
  - Integrate across `EmployeeProfilePage.jsx`, `EmployeeListPage.jsx`, and `MyProfilePage.jsx`.
- **6. Complete System-Wide Settings Integration Audit & Implementation (`Plan 36-06`)**:
  - Refactor `Sidebar.jsx`, `LoginPage.jsx`, `CareersPublicPage.jsx`, and `ApplyPage.jsx` to consume live company branding.
  - Refactor PDF generators (`payslipPdf.service.js`, `offerPdf.service.js`, `onboarding.service.js`, `reportExport.service.js`) to consume live company profile.
- **7. Automated Test Suite, End-to-End Verification & Master Phase Documentation (`Plan 36-07`)**:
  - 100% automated integration test coverage in `backend/tests/company-profile-id-card.test.js`.
  - Oxlint and Vite production build verification.
  - Multi-role Playwright verification and Serena Memory updates.

**Depends on:** Phase 35  
**Plans:** 7 plans

Plans:
- [x] **Plan 36-01: Backend Core Schema Extension, Zod Validators, ID Card Config & SettingService Cache Bus** (`.planning/phases/36-company-profile-advanced-ui-refinement-employee-id-card-implementation-complete-system-wide-settings-integration-audit/36-01-PLAN.md`)
- [x] **Plan 36-02: Company Logo Removal Confirmation Modal & Text-Fields Redesign Studio** (`.planning/phases/36-company-profile-advanced-ui-refinement-employee-id-card-implementation-complete-system-wide-settings-integration-audit/36-02-PLAN.md`)
- [x] **Plan 36-03: Employee ID Card Configuration & Live Interactive Preview Studio in Company Profile** (`.planning/phases/36-company-profile-advanced-ui-refinement-employee-id-card-implementation-complete-system-wide-settings-integration-audit/36-03-PLAN.md`)
- [x] **Plan 36-04: Backend Employee ID Card REST API, Verifiable Payload & RBAC/PBAC Scoped Authorization** (`.planning/phases/36-company-profile-advanced-ui-refinement-employee-id-card-implementation-complete-system-wide-settings-integration-audit/36-04-PLAN.md`)
- [x] **Plan 36-05: Employee Module ID Card Management Workflow (View, Preview, Download, Print)** (`.planning/phases/36-company-profile-advanced-ui-refinement-employee-id-card-implementation-complete-system-wide-settings-integration-audit/36-05-PLAN.md`)
- [x] **Plan 36-06: Complete System-Wide Settings Integration Audit & Implementation (Sidebar, Login, Careers, PDFs, Reports)** (`.planning/phases/36-company-profile-advanced-ui-refinement-employee-id-card-implementation-complete-system-wide-settings-integration-audit/36-06-PLAN.md`)
- [x] **Plan 36-07: Automated Test Suite, End-to-End Verification & Master Phase Documentation** (`.planning/phases/36-company-profile-advanced-ui-refinement-employee-id-card-implementation-complete-system-wide-settings-integration-audit/36-07-PLAN.md`)

---

## Phase 37: Working Hours Sub-Module — Complete System-Wide Audit, Implementation & UI Redesign

**Goal:** Perform an end-to-end technical, architectural, and UI/UX overhaul of the Working Hours Sub-Module in Module M2. Establish a single source of truth for company working days (`workingDays`), standard shift hours (`officeHours`), break duration (`breakMinutes`), and half-day thresholds. Eliminate hardcoded weekend assumptions (`Sat/Sun`) and casing mismatches across Attendance, Shift Management, Leave Management, and Payroll. Guarantee that weekly offs are never marked absent, Saturday/Sunday toggling dynamically controls the entire HRMS, and historical finalized records remain protected.

**Requirements**:
- **1. Backend Schema Enhancement, Zod Validators, Break Duration & Canonical Workday Normalizer (`Plan 37-01`)**:
  - Extend `officeHoursSchema` with `breakMinutes`, `fullDayMinutes`, and `timeZone`.
  - Author `backend/src/utils/workdayHelper.js` with case-insensitive normalization, shift precedence resolution, and month working day calculations.
  - Update `DEFAULT_SETTINGS` and cache bus invalidation in `SettingService`.
- **2. Working Hours Form Complete Enterprise UI/UX Redesign (`Plan 37-02`)**:
  - Overhaul `WorkingHoursForm.jsx` following `docs/UI-reference.md` (Elvara Forest `#061A14`, Emerald `#00C471`).
  - 7-day visual schedule grid with Saturday and Sunday marked as default off, live work/off pills, and minimum 1-day validation guard.
  - Time controls for shift start, end, and break duration with live net productive hours computation deck.
  - Dedicated card for half-day thresholds and canonical timezone.
- **3. Attendance Module System-Wide Integration (`Plan 37-03`)**:
  - Harmonize `attendance.service.js` monthly sheets and daily punch logic with dynamic working days.
  - Unpunched weekly offs marked strictly as `weekly_off`, never `absent`.
  - Eliminate hardcoded `Sat/Sun` in `MyAttendancePage.jsx` and `TeamAttendancePage.jsx` calendars.
- **4. Shift Management & Half-Day Engine Harmonization (`Plan 37-04`)**:
  - Normalize `shift.model.js` `workDays` to canonical lowercase representation with company default inheritance.
  - Dynamic `halfDayMinutes` and `breakMinutes` in `statusEngine.service.js`.
  - Harmonize `ShiftManagementPage.jsx` day selectors.
- **5. Leave Management Module Integration (`Plan 37-05`)**:
  - Update `leaveCalculator.js` to dynamically exclude configured weekly offs and support shift-specific schedules.
  - Eliminate hardcoded `if (day !== 0 && day !== 6)` in `ApplyLeaveModal.jsx`.
  - Highlight weekly off columns dynamically in `TeamLeaveCalendarPage.jsx`.
- **6. Payroll Engine Working Days Integration & Historical Snapshot Protection (`Plan 37-06`)**:
  - Replace hardcoded `workingDays: 30` in `payrollProcessor.js` with true scheduled working days.
  - Guarantee weekly offs never contribute to unexcused absence deductions.
  - Enforce immutable historical snapshot protection for finalized/paid payroll records.
- **7. Automated Test Suite, Verification & Final Documentation (`Plan 37-07`)**:
  - Author `backend/tests/working-hours-integration.test.js` covering all 17 system-wide scenarios.
  - Oxlint and Vite production build clean verification.
  - Update Serena Memory and master documentation.

**Depends on:** Phase 36  
**Plans:** 7 plans

Plans:
- [x] **Plan 37-01: Backend Schema Enhancement, Zod Validators, Break Duration, Canonical Working Days Normalizer & SettingService Cache Bus** (`.planning/phases/37-working-hours-sub-module-complete-system-wide-audit-implementation-ui-redesign/37-01-PLAN.md`)
- [x] **Plan 37-02: Working Hours & Office Hours Form Complete Enterprise UI/UX Redesign** (`.planning/phases/37-working-hours-sub-module-complete-system-wide-audit-implementation-ui-redesign/37-02-PLAN.md`)
- [x] **Plan 37-03: Attendance Module System-Wide Integration — Dynamic Working Days, Monthly Attendance Sheet & Rest-Day Punch Logic** (`.planning/phases/37-working-hours-sub-module-complete-system-wide-audit-implementation-ui-redesign/37-03-PLAN.md`)
- [x] **Plan 37-04: Shift Management & Half-Day Calculation Engine Harmonization** (`.planning/phases/37-working-hours-sub-module-complete-system-wide-audit-implementation-ui-redesign/37-04-PLAN.md`)
- [x] **Plan 37-05: Leave Management Module Integration — Dynamic Working Day Deductions & Apply Modal Sync** (`.planning/phases/37-working-hours-sub-module-complete-system-wide-audit-implementation-ui-redesign/37-05-PLAN.md`)
- [x] **Plan 37-06: Payroll Engine Working Days Integration & Historical Snapshot Protection** (`.planning/phases/37-working-hours-sub-module-complete-system-wide-audit-implementation-ui-redesign/37-06-PLAN.md`)
- [x] **Plan 37-07: Automated Test Suite, System-Wide End-to-End Verification & Master Phase Documentation** (`.planning/phases/37-working-hours-sub-module-complete-system-wide-audit-implementation-ui-redesign/37-07-PLAN.md`)

---

## Phase 38: Org Chart Module — Complete Audit, Implementation, System Integration & UI Redesign

**Goal:** Perform an end-to-end technical, architectural, functional, security (RBAC/PBAC), and UI/UX overhaul of the Org Chart Module (Module M4 · Row 4.5 & 4.7). Build a production-grade, highly interactive, scalable organizational hierarchy visualization canvas in Elvara Forest theme (`#061A14`, `#00C471`). Dynamically reflect true corporate relationships from MongoDB (`Employee`, `Department`, `Designation`). Support multi-root company trees, cycle-proof DAG assembly, dangling manager resolution, multi-dimensional filters, real-time search with ancestral path lighting, 4 first-class view modes (Company Wide, Department Tree, My Team, Employee Centric), a slide-over inspection drawer, and PBAC field-level contact masking.

**Requirements**:
- **1. Backend API & Hierarchy Engine Hardening (`Plan 38-01`)**:
  - Eliminate hardcoded executive titles (`CEO`, `Executive Management`, `EMP-000`).
  - Support multi-root trees and prune circular reporting loops without infinite recursion.
  - Safe skip-level reparenting for dangling/inactive managers so no subtrees disappear.
  - Add query filtering (`departmentId`, `viewMode`, `employeeId`, `maxDepth`, `status`).
  - Enforce PBAC field masking for sensitive contact coordinates (phone, email).
  - Compute enterprise hierarchy summary stats (`totalNodes`, `departmentsCount`, `managersCount`, `maxDepth`, `spanOfControlAvg`).
- **2. Interactive Canvas & Viewport Navigation Studio (`Plan 38-02`)**:
  - Smooth custom drag-to-pan pointer engine and mouse wheel / pinch zooming (20% to 200%).
  - Fit-to-Screen auto-scale calculator and Center on Root action.
  - Depth level limiter (L1 Executive, L2 Heads, L3 Leads, All Levels).
  - Bulk Expand All / Collapse All controls.
  - Blueprint dot-grid canvas background and PNG/SVG export capability.
- **3. High-Density Enterprise Node & Connector Redesign (`Plan 38-03`)**:
  - Redesign nodes to Elvara Forest palette (`#061A14` canvas, `#111D17` cards, `#1A3125` borders, `#00C471` emerald).
  - Differentiated visual tiers for Executives, Department Heads, People Managers, and Individual Contributors.
  - Compact Node View toggle (170px chips) to prevent horizontal explosion on broad hierarchies.
  - Leaf grid stacking for managers with > 6 individual contributor reports.
  - Crisp SVG branch connectors with emerald ancestral path illumination.
- **4. Multi-Dimensional Filters, Real-Time Search & View Modes (`Plan 38-04`)**:
  - 4 specialized view modes: Company Wide, Department Tree, My Team, Employee Centric.
  - Department, Designation, and Employment Status filter dropdowns with live count pills and clear-all action.
  - High-performance real-time search auto-expanding ancestral branches, lighting the path, and focal-scrolling to matches.
- **5. Employee Detail Inspection Drawer & Profile Bridge (`Plan 38-05`)**:
  - Slide-over inspection drawer (`480px`) with avatar, status, code, grade, designation, and department.
  - Interactive reporting manager card and direct reports roster with instant click-to-navigate.
  - Visual ancestral breadcrumb chain (`CEO -> VP -> Manager -> Employee`).
  - Permission-aware "View Full Profile" bridge to Employee module.
- **6. Automated Test Suite, System-Wide End-to-End Verification & Master Phase Documentation (`Plan 38-06`)**:
  - Comprehensive Vitest test suite (`backend/tests/orgchart-overhaul.test.js`) testing all 15 audit scenarios.
  - 0-error Oxlint run and clean Vite production build.
  - Complete Phase 38 audit report and Serena Memory synchronization.

**Depends on:** Phase 37  
**Plans:** 6 plans

Plans:
- [x] **Plan 38-01: Backend API & Hierarchy Engine Hardening** (`.planning/phases/38-org-chart-module-complete-audit-implementation-system-integration-ui-redesign/38-01-PLAN.md`)
- [x] **Plan 38-02: Interactive Canvas & Viewport Navigation Studio** (`.planning/phases/38-org-chart-module-complete-audit-implementation-system-integration-ui-redesign/38-02-PLAN.md`)
- [x] **Plan 38-03: High-Density Enterprise Node & Connector Redesign** (`.planning/phases/38-org-chart-module-complete-audit-implementation-system-integration-ui-redesign/38-03-PLAN.md`)
- [x] **Plan 38-04: Multi-Dimensional Filters, Real-Time Search & View Modes** (`.planning/phases/38-org-chart-module-complete-audit-implementation-system-integration-ui-redesign/38-04-PLAN.md`)
- [x] **Plan 38-05: Employee Detail Inspection Drawer & Profile Bridge** (`.planning/phases/38-org-chart-module-complete-audit-implementation-system-integration-ui-redesign/38-05-PLAN.md`)
- [x] **Plan 38-06: Automated Test Suite, System-Wide End-to-End Verification & Master Phase Documentation** (`.planning/phases/38-org-chart-module-complete-audit-implementation-system-integration-ui-redesign/38-06-PLAN.md`)

---

## Phase 39: Complete Software-Wide Modal Audit & UI Standardization

**Goal:** Perform a complete software-wide audit of every modal, dialog, drawer, and slide-over panel across the entire application. Identify all right-side opening modals/drawers and convert them into horizontally and vertically centered modals. Eliminate heavy, opaque black backdrop overlays and sprawling shadows in favor of a unified subtle backdrop (`bg-slate-900/40 backdrop-blur-sm`), clean `shadow-2xl` elevation, rounded corners (`rounded-2xl`), and internal scrolling.

**Requirements**:
- **1. Shared Modal Architecture & Universal Design Contract (`Plan 39-01`)**:
  - Audit and standardize shared dialogs in `frontend/src/components/common` (`ConfirmDialog`, `ErrorModal`, `PermissionDeniedModal`, `SessionExpiredModal`, `SuccessModal`, `ModalSkeleton`).
  - Establish universal modal tokens: `bg-slate-900/40 backdrop-blur-sm`, `rounded-2xl`, `border border-slate-200 dark:border-[#1A3125]`, `shadow-2xl`, and `zoom-in-95` transitions.
- **2. Core Management Drawers Conversion (`Plan 39-02`)**:
  - Convert `OrgChartDetailDrawer.jsx` (the exact staff hierarchy inspection panel from the user's screenshot) to a centered, responsive modal.
  - Convert `PolicyDetailDrawer.jsx` to a centered document inspection modal.
  - Convert `NotificationDrawer.jsx` to a centered notification center modal.
- **3. Financial & Operational Drawers Conversion (`Plan 39-03`)**:
  - Convert `ExpenseDetailDrawer.jsx` to a centered claim inspection & approval modal.
  - Convert `LoanScheduleDrawer.jsx` to a centered borrower & amortization schedule modal.
  - Convert `PayslipAdjustmentDrawer.jsx` to a centered adjustment editor modal.
  - Convert `SalaryStructuresPage.jsx` revision history drawer to a centered audit modal.
- **4. Feedback & Collaboration Drawers Conversion (`Plan 39-04`)**:
  - Convert `CaseDetailsDrawer.jsx` to a centered confidential case docket modal.
  - Convert `GroupInfoDrawer.jsx` to a centered chat channel member management modal.
- **5. Software-Wide Modal Backdrop & Black Shadow Cleanup (`Plan 39-05`)**:
  - Audit and clean up heavy, opaque black backdrops (`bg-black/70`, `bg-black/80`, `bg-slate-950/70`, etc.) and duplicate backdrops across all feature module modals.
  - Enforce subtle `bg-slate-900/40 backdrop-blur-sm` and eliminate screen-blackout shadows.
- **6. Cross-Module Verification & Master Deliverable Report (`Plan 39-06`)**:
  - Run static analysis with Oxlint (0 errors) and full Vite production build.
  - Validate responsive breakpoints (mobile, tablet, desktop) and interaction integrity (Esc key, backdrop click, form submissions).
  - Generate comprehensive `39-REPORT.md` with complete software-wide metrics.

**Depends on:** Phase 38  
**Plans:** 6 plans

Plans:
- [x] **Plan 39-01: Shared Modal Architecture & Universal Modal Standard Contract** (`.planning/phases/39-complete-software-wide-modal-audit-ui-standardization/39-01-PLAN.md`)
- [x] **Plan 39-02: Conversion of Core Management Drawers to Centered Modals** (`.planning/phases/39-complete-software-wide-modal-audit-ui-standardization/39-02-PLAN.md`)
- [x] **Plan 39-03: Conversion of Financial & Operational Drawers to Centered Modals** (`.planning/phases/39-complete-software-wide-modal-audit-ui-standardization/39-03-PLAN.md`)
- [x] **Plan 39-04: Conversion of Feedback & Collaboration Drawers to Centered Modals** (`.planning/phases/39-complete-software-wide-modal-audit-ui-standardization/39-04-PLAN.md`)
- [x] **Plan 39-05: Software-Wide Modal Backdrop & Black Shadow Cleanup** (`.planning/phases/39-complete-software-wide-modal-audit-ui-standardization/39-05-PLAN.md`)
- [x] **Plan 39-06: Cross-Module Functional Verification, Responsive Audit & Master Phase 39 Deliverable Report** (`.planning/phases/39-complete-software-wide-modal-audit-ui-standardization/39-06-PLAN.md`)

---

## Phase 40: Attendance Module — Face Enrollment, HR Notifications & WFH Workflow Fixes

**Goal:** Perform an end-to-end functional audit and complete implementation of four critical Attendance Module issues: (1) Block Face Punch if Face Enrollment is incomplete or not approved and show a dedicated "Face Enrollment Required" modal, (2) Trigger authorized HR in-app and email notifications upon successful Face Enrollment completion, (3) Strictly enforce the one-day-before advance notice rule for Work From Home (WFH) applications across frontend and backend in `Asia/Karachi` timezone, and (4) Resolve and deliver WFH submission and decision notifications to Reporting Managers, HR Managers, and Super Admins linking directly to `/attendance/team?tab=wfh`.

**Status:** ✅ **Completed** (12/12 E2E tests passing, 0 Oxlint errors, clean Vite build)

**Requirements**:
- **1. Face Punch Validation & Face Enrollment Required Modal (`Plan 40-01`)**:
  - Enforce backend validation in `checkIn` and `verifyFacePunch` blocking Face Punch if `dbUser.faceEnrollment.status !== 'approved'`.
  - Prevent attendance record creation and presence marking; return structured `FACE_ENROLLMENT_REQUIRED` code.
  - Implement centered, accessible `FaceEnrollmentRequiredModal.jsx` with "Complete Face Enrollment" and "Cancel" actions; suppress camera and neural preloader if un-enrolled.
- **2. Face Enrollment HR Notification Flow & Recipient Resolution (`Plan 40-02`)**:
  - In `enrollFace`, dispatch authoritative notifications to active HR Managers and Super Admins upon successful enrollment submission.
  - Include employee name, code, timestamp, and link (`/attendance/face-enrollments`), excluding raw biometric embeddings or image buffers.
- **3. Work From Home (WFH) One-Day-Before Advance Notice Restriction (`Plan 40-03`)**:
  - Enforce advance notice: WFH application permitted only if requested date $\ge$ tomorrow in `Asia/Karachi`.
  - Reject same-day and past applications on backend (`ApiError(400, 'WFH applications must be submitted at least one day before...')`) and frontend (datepicker `min` constraint & error banner).
- **4. WFH HR/Manager Notification Delivery & Notification Module Audit (`Plan 40-04`)**:
  - Resolve both Reporting Manager and all HR Managers / Super Admins on WFH submission.
  - Deliver notifications linking directly to `/attendance/team?tab=wfh`; notify applicant on approval/rejection linking to `/attendance/my?tab=wfh`.
- **5. Comprehensive Vitest E2E Test Suite, Cross-Module Verification & Phase Deliverables (`Plan 40-05`)**:
  - Implement full Vitest integration suite (`backend/tests/attendance.wfh-face-notifications.e2e.test.js`) covering all 28 acceptance criteria.
  - Ensure 0 Oxlint errors, clean Vite production build, and generate `40-REPORT.md`.

**Depends on:** Phase 39  
**Plans:** 5 plans (All Completed)

Plans:
- [x] **Plan 40-01: Face Punch Validation & Face Enrollment Required Modal** (`.planning/phases/40-attendance-module-face-enrollment-hr-notifications-wfh-workflow-fixes/40-01-PLAN.md`)
- [x] **Plan 40-02: Face Enrollment HR Notification Flow & Recipient Resolution** (`.planning/phases/40-attendance-module-face-enrollment-hr-notifications-wfh-workflow-fixes/40-02-PLAN.md`)
- [x] **Plan 40-03: Work From Home (WFH) One-Day-Before Advance Notice Restriction** (`.planning/phases/40-attendance-module-face-enrollment-hr-notifications-wfh-workflow-fixes/40-03-PLAN.md`)
- [x] **Plan 40-04: WFH HR/Manager Notification Delivery & Notification Module Audit** (`.planning/phases/40-attendance-module-face-enrollment-hr-notifications-wfh-workflow-fixes/40-04-PLAN.md`)
- [x] **Plan 40-05: Comprehensive Vitest E2E Test Suite, Cross-Module Verification & Phase Deliverables** (`.planning/phases/40-attendance-module-face-enrollment-hr-notifications-wfh-workflow-fixes/40-05-PLAN.md`)

---

## Phase 41: Software-Wide Real-Time Data Synchronization, RTK Query Cache Invalidation & Automatic Refresh System (Planned)

**Goal:** Permanently eliminate the need for manual page refreshes (F5) across both local development and production environments by establishing automatic data synchronization, comprehensive RTK Query cache invalidation, focus-driven auto-refetching, targeted operational polling, and multi-user Socket.io real-time cache dispatching.

**Status:** 📋 **Planned (Ready for Execution)**

**Requirements**:
- **1. Centralized Base API Auto-Refetch & Focus Rehydration (`Plan 41-01`)**:
  - Configure `refetchOnFocus: true` and `refetchOnReconnect: true` in `frontend/src/lib/baseApi.js`.
  - Wire `setupListeners(store.dispatch)` in `frontend/src/app/store.js` to enable automatic browser focus and online event re-fetching.
  - Tune `keepUnusedDataFor: 300` (5m) and cache retention policies to prevent memory leaks while guaranteeing data freshness.
- **2. Software-Wide RTK Query Mutation Cache Invalidation Audit (`Plan 41-02`)**:
  - Comprehensive audit of all 29 feature API endpoints across Attendance, Leaves, Employees, Payroll, Departments, Roles, Assets, Expenses, Recruitment, and Company Settings.
  - Fix all missing, empty, or mismatched `invalidatesTags` definitions across mutations (Add, Edit, Delete, Status Change, Approval, Rejection) so UI views instantly update upon form submission.
- **3. Global Real-Time Socket.io Cache Dispatcher & Backend Invalidation Signals (`Plan 41-03`)**:
  - Implement universally mounted `useRealtimeCacheSync` hook in `AppLayout.jsx` listening for real-time cache invalidation broadcasts.
  - Enhance backend `socket.service.js` with `broadcastCacheInvalidation` helper to emit targeted room-scoped invalidation payloads.
- **4. Targeted Smart Background Polling for Mission-Critical Consoles (`Plan 41-04`)**:
  - Add configurable, visibility-aware `pollingInterval` (15s–30s) on live operations screens (`TeamAttendancePage.jsx`, `CandidatePipelinePage.jsx`, `Notifications`, `DashboardPage.jsx`).
  - Gracefully pause polling when the document is hidden / tab inactive via `document.visibilityState` to preserve bandwidth and battery.
- **5. Optimistic Cache Updates for High-Frequency Self-Service Actions (`Plan 41-05`)**:
  - Implement `onQueryStarted` optimistic cache patching for fast interactions (attendance check-in/out toggles, status updates, notification reads).
  - Provide instant UI feedback with automated rollback on server-side validation error.
- **6. Cross-Environment Verification Test Suite & Phase Deliverables (`Plan 41-06`)**:
  - Write Vitest integration test suite (`backend/tests/sync.rtk-cache.e2e.test.js`) verifying cache invalidations and socket emissions.
  - Ensure 0 Oxlint errors, clean Vite production build, and generate `41-REPORT.md`.

**Depends on:** Phase 40  
**Plans:** 6 plans (Planned)

Plans:
- [ ] **Plan 41-01: Redux Store setupListeners, BaseApi refetchOnFocus, refetchOnReconnect & Global Lifecycle Auto-Rehydration** (`.planning/phases/41-data-sync-rtk-cache-auto-refresh/41-01-PLAN.md`)
- [ ] **Plan 41-02: Comprehensive System-Wide RTK Query Mutation invalidatesTags Audit & Patching** (`.planning/phases/41-data-sync-rtk-cache-auto-refresh/41-02-PLAN.md`)
- [ ] **Plan 41-03: Global Real-Time Socket.io Cache Dispatcher & Backend Invalidation Signals** (`.planning/phases/41-data-sync-rtk-cache-auto-refresh/41-03-PLAN.md`)
- [ ] **Plan 41-04: Smart Background Polling for Mission-Critical Operational Consoles** (`.planning/phases/41-data-sync-rtk-cache-auto-refresh/41-04-PLAN.md`)
- [ ] **Plan 41-05: Optimistic UI Updates & Error Rollbacks for High-Frequency Actions** (`.planning/phases/41-data-sync-rtk-cache-auto-refresh/41-05-PLAN.md`)
- [ ] **Plan 41-06: Cross-Module End-to-End Verification Test Suite, Multi-Tab Sync Verification & Phase Deliverables** (`.planning/phases/41-data-sync-rtk-cache-auto-refresh/41-06-PLAN.md`)

---

## Summary of Master Roadmap Metrics

- **Phase 1 (Core HR & Payroll):** 12 modules · 148 features
- **Phase 2 (Smart Operations):** 9 modules · 67 features
- **Phase 3 (AI Features):** 3 modules · 27 features
- **Phase 4 (Engagement & Polish):** 5 modules · 31 features
- **Phase 5 (Release & Handover):** 3 deployment milestones
- **Total Vertical Slice Features:** **281 features** across 27 modules + 2 cross-cutting quality gates (X1, X2) + 3 deployment milestones.
