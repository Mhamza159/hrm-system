# HRM System — Requirements Specification

## 1. Scope Baseline
- **Document References:** Governed strictly by `docs/FRD.md`, `docs/TECH-SPEC.md`, `docs/BUILD-GUIDE.md`, and `docs/MODULES.md`.
- **System Boundaries:** 26 modules categorized into 7 functional groups for a single-tenant software house in Pakistan.

## 2. Functional Requirements by Group

### Group 1: Core HR (Launch Priority P1)
- **REQ-M1 (Authentication):** JWT access (15m) + refresh token (7d in httpOnly cookie), bcrypt password hashing, 2FA OTP, password reset, account lockout after 5 failed attempts, login history tracking.
- **REQ-M2 (Company Settings):** Company profile/logo, working hours & shifts, leave policies, late arrival grace period & deductions, payroll schedule, FBR tax slab tables, office location & geo-fence radius.
- **REQ-M3 (Employee Management):** Employee profile management, encrypted CNIC & bank details, document storage (contract, degrees, NDA), salary history, manager assignment, Excel bulk import/export.
- **REQ-M4 (Departments, Designations & Org Chart):** Department tree hierarchy, designations with grade levels, interactive Org Chart visualizer.
- **REQ-M5 (Attendance & Shifts):** Web clock-in/out, shift assignments, late arrival & overtime tracking, missed-punch correction requests with approval, auto-absent cron, monthly attendance lock before payroll.
- **REQ-M6 (Leave & Holidays):** Leave quotas & types (casual, annual, sick, unpaid), multi-tier approval chains, carry-forward rules, Pakistan gazetted holiday calendar.
- **REQ-M7 (Dashboard & Reports):** Role-tailored dashboards (Super Admin, HR, Manager, Employee), real-time attendance widgets, downloadable reports in Excel and PDF.
- **REQ-M8 (Notifications & Announcements):** Socket.io in-app real-time notifications, company announcements, email alerts.
- **REQ-M26 (Roles & Permissions - RBAC):** Fine-grained permission catalogue, dynamic CASL ability compiler, custom role creation with action/subject/scope limits.

### Group 2: Payroll & Finance (P1 & P2)
- **REQ-M9 (Payroll Management - P1):** Salary structures (basic, allowances, deductions), monthly one-click payroll run via BullMQ, FBR income tax calculation (annual divided by 12), EOBI deduction, branded PDF payslips, standard Pakistani corporate bank transfer Excel sheet export.
- **REQ-M10 (Loans & Advances - P2):** Loan requests with eligibility checks, multi-tier approval, automated installment deduction from monthly payroll, balance tracking.
- **REQ-M11 (Expense Claims - P2):** Expense claims with receipt uploads, category limits, multi-tier approval, reimbursement tracking.

### Group 3: Smart Attendance (P2)
- **REQ-M12 (Face Recognition):** Browser-side face enrollment and verification using `@vladmandic/face-api`, liveness detection, anti-spoofing checks, punch snapshot logging.
- **REQ-M13 (QR Code Attendance):** Rotating dynamic QR code on kiosk screen with expiring HMAC tokens, mobile scanner check-in, device binding.
- **REQ-M14 (GPS / Geo-fencing):** Office perimeter geo-fencing (Leaflet maps), Haversine server-side distance validation, punch-time-only location capture.

### Group 4: AI Modules (P2 & P3)
- **REQ-M15 (Recruitment & AI Resume Screening - P2):** Job posting, candidate pipeline Kanban, CV parsing, OpenAI-powered JD matching score and rationale, offer letter generation.
- **REQ-M16 (HR Chatbot - P3):** In-app policy inquiry and self-service assistant (OpenAI powered) with English and Roman Urdu support.
- **REQ-M17 (Attrition Prediction - P3):** Predictive indicators highlighting retention flight risks based on attendance, appraisal, and tenure patterns.

### Group 5: Employee Experience (P2 & P3)
- **REQ-M18 (Onboarding & Offboarding - P2):** Onboarding task checklist, asset issuance, exit clearance workflows, experience letter generation.
- **REQ-M19 (Performance & Appraisals - P2):** KPI/OKR tracking, self-reviews, manager appraisals, 360-degree feedback cycles.
- **REQ-M20 (Rewards & Surveys - P3):** Peer-to-peer recognition kudos, milestone celebration notices, employee pulse surveys.
- **REQ-M21 (Anonymous Feedback & Grievances - P3):** Anonymous grievance submissions, confidential HR case management.

### Group 6: Office Management (P2 & P3)
- **REQ-M22 (Projects & Timesheets - P2):** Project allocation, daily/weekly task timesheet submissions, billable hours auditing.
- **REQ-M23 (Asset Management - P2):** Hardware/software asset register, serial numbers, custodian assignment history.
- **REQ-M24 (Internal Chat - P3):** Socket.io team messaging channels and direct chats.
- **REQ-M25 (Training & Learning - P3):** Training course catalogue, skill tracking, certification records.

## 3. Non-Functional & Security Requirements
- **NFR-SEC-1:** All files strictly JavaScript (`.js` and `.jsx`). No TypeScript.
- **NFR-SEC-2:** Sensitive fields (CNIC, bank IBAN, salary) encrypted at rest.
- **NFR-SEC-3:** All database mutations logged to `auditLogs` collection with before/after state.
- **NFR-SEC-4:** All API routes strictly protected by `authenticate` -> `validate` -> `checkPermission`.
- **NFR-SEC-5:** Currency precision in integer paisa; dates stored in UTC, presented in `Asia/Karachi`.
