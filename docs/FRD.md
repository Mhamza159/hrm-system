# HRM System — Functional Requirements Document

Version 1.0 · 7 October 2026

## 1. Introduction

This document defines every module, feature and role-based permission for a web-based HRM system built on the MERN stack for a single software house in Pakistan. It is the reference for scoping, estimation, development and client sign-off.

**Client profile**

- Business type: office / software house (developers, designers, QA, sales, admin staff)
- Deployment: single company, single database (not multi-tenant SaaS)
- Work patterns: office, hybrid and remote employees; project-based work; fixed and flexible shifts
- Location: Pakistan (PKR currency, FBR income tax, EOBI)

**In scope:** 26 modules across 7 groups (core HR, payroll, smart attendance, AI, employee experience, office management, compliance), four default user roles plus custom roles, web app with mobile-friendly PWA.

**Out of scope (for now):** native Android/iOS apps, accounting/general ledger, biometric hardware integration, multi-company tenancy.

**Open questions for the client**

- Approximate headcount today and in two years?
- Do any branches exist outside the main office?
- Is payroll paid by bank transfer, and which banks?
- Should salary slips go out by email, WhatsApp or both?

## 2. Technology Stack

The system uses the MERN stack with free, open-source libraries; no paid API is required for core features. Package-level details are in the Technical Specification & Project Flow document.

| Layer | Technology | Purpose |
| --- | --- | --- |
| Database | MongoDB + Mongoose | Employees, attendance, leaves, payroll, logs |
| Backend | Node.js + Express.js | REST APIs, business rules, cron jobs |
| Frontend | React + Tailwind CSS | Dashboards, forms, tables (PWA-enabled) |
| Auth | JWT + bcrypt + refresh tokens | Login, sessions, role-based access |
| Real-time | Socket.io | Internal chat, live notifications |
| Face recognition | @vladmandic/face-api | Browser-side face matching |
| QR | qrcode + html5-qrcode | Dynamic QR generation and scanning |
| Location | Browser Geolocation API + Leaflet/OpenStreetMap | Geo-fencing and map view |
| Documents | PDFKit / jsPDF, ExcelJS | Salary slips, letters, report exports |
| Charts | Recharts | Dashboard analytics |
| File uploads | Multer + Cloudinary (free tier) | CVs, photos, documents |
| Scheduling | node-cron | Monthly payroll, alerts, reminders |
| Email | Nodemailer (SMTP) | Notifications and slips |
| WhatsApp | WhatsApp Cloud API | Slips and alerts (per-message cost after free tier) |
| AI | Claude / OpenAI API or open-source model | Resume screening, chatbot (paid per use) |
| Hosting | Vercel (frontend), Render or VPS (backend), MongoDB Atlas | HTTPS required for camera and GPS |

For a paying client, a small VPS (e.g. DigitalOcean or a local Pakistani host) is recommended over free tiers, which sleep when idle.

## 3. User Roles

Four default roles control what each user sees and does; every user sees only data within their own scope. Super Admin can create more roles in M26.

| Role | Typical user | Data scope | Core responsibility |
| --- | --- | --- | --- |
| Super Admin | CEO, owner or IT admin | Entire company | System settings, roles, company policies, final approvals, audit logs |
| HR Manager | HR team | All employees | Hiring, onboarding, attendance, leaves, payroll, compliance, reports |
| Department Manager | Team lead, PM, department head | Own department / team | Approve team leaves and expenses, review performance, assign projects |
| Employee | Every staff member | Own records only | Mark attendance, apply for leave, view slips, update profile, use self-service |

**Role rules**

- A user can hold one or more roles (managed in M26); a Department Manager is also an Employee for their own records.
- Super Admin can create custom permissions per role (e.g. let a Finance Officer view payroll only).
- Approval chains are configurable: Employee → Department Manager → HR Manager (→ Super Admin above a set limit).

## 4. Module Overview

The system has 26 modules in 7 groups; Priority P1 is the launch scope, P2 follows, P3 is advanced.

| # | Module | Group | Priority |
| --- | --- | --- | --- |
| M1 | Authentication & Access Control | Core HR | P1 |
| M2 | Company Settings | Core HR | P1 |
| M3 | Employee Management | Core HR | P1 |
| M4 | Department, Designation & Org Chart | Core HR | P1 |
| M5 | Attendance & Shifts | Core HR | P1 |
| M6 | Leave & Holidays | Core HR | P1 |
| M7 | Dashboard & Reports | Core HR | P1 |
| M8 | Notifications & Announcements | Core HR | P1 |
| M26 | Roles & Permissions (RBAC) | Core HR | P1 |
| M9 | Payroll | Payroll & Finance | P1 |
| M10 | Loans & Advances | Payroll & Finance | P2 |
| M11 | Expense Claims | Payroll & Finance | P2 |
| M12 | Face Recognition Attendance | Smart Attendance | P2 |
| M13 | QR Code Attendance | Smart Attendance | P2 |
| M14 | GPS / Geo-fencing | Smart Attendance | P2 |
| M15 | Recruitment & AI Resume Screening | AI | P2 |
| M16 | HR Chatbot | AI | P3 |
| M17 | Attrition Prediction | AI | P3 |
| M18 | Onboarding & Offboarding | Employee Experience | P2 |
| M19 | Performance & Appraisal | Employee Experience | P2 |
| M20 | Rewards, Celebrations & Surveys | Employee Experience | P3 |
| M21 | Anonymous Feedback & Grievance | Employee Experience | P3 |
| M22 | Projects & Timesheets | Office Management | P2 |
| M23 | Asset Management | Office Management | P2 |
| M24 | Internal Chat | Office Management | P3 |
| M25 | Training & Learning | Office Management | P3 |

## 5. Core HR Modules

These nine modules form the launch scope; every other module depends on them.

### M1. Authentication & Access Control

**Features:** email/password login, forgot/reset password by email OTP, optional two-factor authentication, JWT access + refresh tokens, auto logout after inactivity, login history with device and IP, account lock after 5 failed attempts.

- **Super Admin:** activate/deactivate any account, view login history.
- **HR Manager:** create user accounts for new employees, reset passwords, deactivate leavers.
- **Department Manager:** none beyond own account.
- **Employee:** log in, change password, enable 2FA, view own login history.

### M2. Company Settings

**Features:** company profile and logo, working days and office hours, leave policies, late-arrival rules (grace period, deductions), payroll cycle and pay date, tax settings, email/WhatsApp templates, office location and geo-fence radius, data backup.

- **Super Admin:** full control.
- **HR Manager:** edit leave policies, holidays, templates and attendance rules.
- **Department Manager / Employee:** view policies only.

### M3. Employee Management

**Features:** employee profile (personal, contact, CNIC, emergency contact, bank details), employment details (employee ID, joining date, probation end, employment type, reporting manager), document vault (CNIC copy, degrees, contract, NDA), salary history, job history (promotions, transfers), skills and tech stack, status (active, on notice, resigned, terminated), bulk import from Excel, search and filters.

- **Super Admin:** full access to all profiles, including salary.
- **HR Manager:** add/edit/archive employees, manage documents and status.
- **Department Manager:** view team profiles (no salary or bank details).
- **Employee:** view own profile, request edits (HR approves changes to sensitive fields).

### M4. Department, Designation & Org Chart

**Features:** create departments (Development, QA, Design, Sales, HR, Admin), designations with grades (Junior, Mid, Senior, Lead), assign managers, interactive org chart showing reporting lines, team view per manager.

- **Super Admin / HR Manager:** create and edit departments, designations and reporting lines.
- **Department Manager:** view own department structure.
- **Employee:** view org chart and own reporting line.

### M5. Attendance & Shifts

**Features:** web check-in/check-out, break tracking, work-from-home marking, shifts (fixed, flexible, night), late / early-leave / half-day rules, overtime calculation, monthly attendance calendar, missed-punch correction requests, auto-absent when no check-in, attendance lock before payroll.

- **Super Admin:** view all, override records, set rules.
- **HR Manager:** view and edit all records, approve corrections, assign shifts, lock month.
- **Department Manager:** view team attendance, approve team corrections and WFH requests.
- **Employee:** check in/out, view own calendar, request corrections.

### M6. Leave & Holidays

**Features:** leave types (annual, casual, sick, maternity, paternity, unpaid, comp-off), yearly quota and carry-forward rules, half-day leave, attachment for sick leave, multi-level approval, leave balance, team leave calendar, public holiday calendar (Pakistan gazetted holidays, Eid dates editable), leave encashment at year-end.

- **Super Admin:** set leave policies, final approval above a set number of days.
- **HR Manager:** manage leave types, quotas and holidays, override balances, approve.
- **Department Manager:** approve/reject team leaves, see team calendar to avoid clashes.
- **Employee:** apply, cancel pending requests, view balance and history.

### M7. Dashboard & Reports

**Features:** role-specific dashboards; widgets for headcount, today's attendance, pending approvals, upcoming birthdays, open positions, payroll cost; reports for attendance, leaves, payroll, headcount, turnover and department costs; filters by date, department and employee; export to Excel and PDF.

- **Super Admin:** company-wide analytics and cost dashboards.
- **HR Manager:** all HR reports.
- **Department Manager:** team dashboard and team reports.
- **Employee:** personal dashboard (attendance, leave balance, latest slip, tasks).

### M8. Notifications & Announcements

**Features:** in-app notification bell, email notifications, WhatsApp notifications for key events, company-wide or department-wide announcements, notice board with pinning, read receipts, user notification preferences.

- **Super Admin / HR Manager:** post company-wide announcements, manage templates.
- **Department Manager:** post team announcements.
- **Employee:** receive notifications, set preferences.

### M26. Roles & Permissions (RBAC)

Access is permission-based, not hard-coded to four roles: every action in every module is a permission, and roles are just named bundles of permissions that Super Admin can create and change.

**Features:** permission catalogue covering every module and action (view, create, edit, delete, approve, export); data scope per permission (own, team, department, all company); custom roles beyond the four defaults (e.g. Finance Officer, Recruiter, Team Lead, Auditor); multiple roles per user with combined permissions; field-level permissions that hide sensitive fields (salary, CNIC, bank account); approval limits per role (e.g. leave days or expense amount a role may approve); clone a role from an existing one; temporary delegation of approvals with start and end dates; "view as user" preview of anyone's effective permissions; audit log of every permission change; menus and buttons hidden in the UI when not permitted, with every API also checked on the server.

- **Super Admin:** create, edit and delete roles; assign permissions, scopes and limits; assign roles to users; view the permission audit log. The Super Admin role cannot be deleted or reduced.
- **HR Manager:** assign existing roles to employees; cannot grant a permission they do not hold themselves.
- **Department Manager:** delegate own approvals to another manager for a set period.
- **Employee:** view own roles and permissions.

**Example permissions**

| Permission | Scope | Allows |
| --- | --- | --- |
| employee.view | team | View profiles of own team |
| employee.salary.view | all | See salary and bank fields |
| leave.approve | department | Approve leaves in own department |
| payroll.run | all | Prepare monthly payroll |
| payroll.approve | all | Approve and release payroll |
| report.export | team | Export team reports to Excel/PDF |

**Implementation (MERN):** a `Role` collection stores permission strings with scopes, and each `User` references one or more roles. An Express middleware such as `checkPermission('leave.approve')` guards every route and filters data by scope. After login, React loads the user's effective permissions to show or hide menus, buttons and fields. The open-source CASL library can handle these checks on both backend and frontend.

## 6. Payroll & Finance Modules

Payroll runs once a month from locked attendance, approved leaves, loans and expenses, and needs HR preparation plus Super Admin approval before release.

### M9. Payroll

**Features:** salary structure per employee (basic, house rent, medical, conveyance, other allowances), earnings (overtime, bonus, arrears, commission), deductions (unpaid leave, late penalties, loan installment, income tax, EOBI, advance), one-click monthly payroll run, draft → review → approve → paid workflow, payslip PDF with company branding, payslip delivery by email/WhatsApp/portal, bank transfer sheet export (Excel per bank format), increments and revisions with effective date, final settlement on exit, annual tax certificate.

- **Super Admin:** approve and release payroll, view all salaries and cost reports.
- **HR Manager:** set salary structures, run and review payroll, generate slips and bank sheets.
- **Department Manager:** no salary access; may see team overtime hours.
- **Employee:** view and download own payslips, tax certificate and salary history.

### M10. Loans & Advances

**Features:** employee requests an advance or loan with amount and reason, configurable limit (e.g. up to 1 month salary), approval chain, installment plan, automatic deduction in payroll, outstanding balance tracking, early repayment.

- **Super Admin:** final approval, set loan policy.
- **HR Manager:** review, approve within limit, track balances.
- **Department Manager:** recommend or reject team requests.
- **Employee:** apply, view schedule and remaining balance.

### M11. Expense Claims

**Features:** claim categories (travel, fuel, client meals, internet, equipment), receipt photo upload, per-category limits, approval chain, reimbursement through payroll or separately, monthly expense report.

- **Super Admin:** set categories and limits, approve high-value claims.
- **HR Manager:** final review and mark as reimbursed.
- **Department Manager:** approve or reject team claims.
- **Employee:** submit claims with receipts, track status.

## 7. Smart Attendance Modules

All three methods are free to build and can be combined (e.g. QR + GPS in office, Face + GPS for remote check-in) to prevent proxy attendance.

### M12. Face Recognition Attendance

**Features:** one-time face enrollment (3–5 photos), check-in via webcam or phone camera, browser-side matching with face descriptors stored in MongoDB, liveness check (blink or head turn) against photo spoofing, match-confidence threshold, captured snapshot saved with each punch, fallback to manual request on failure.

- **Super Admin:** enable/disable method, set confidence threshold.
- **HR Manager:** approve enrollments, re-enroll employees, review failed or suspicious attempts.
- **Department Manager:** view team punch snapshots when flagged.
- **Employee:** enroll face, check in/out by camera.

### M13. QR Code Attendance

**Features:** dynamic QR shown on an office screen/tablet, refreshing every 30–60 seconds, signed token per QR to block reuse of screenshots, employee scans from phone while logged in, one device bound per employee, entry/exit kiosks.

- **Super Admin:** set refresh interval and kiosk devices.
- **HR Manager:** manage kiosks, reset device bindings.
- **Department Manager:** none.
- **Employee:** scan to check in/out.

### M14. GPS / Geo-fencing

**Features:** office location(s) with radius (e.g. 100 m), check-in only inside the fence, distance computed on the server with the Haversine formula, map view of punch locations (Leaflet + OpenStreetMap), approved remote locations for WFH employees, client-site check-in for sales staff, fake-GPS and accuracy checks, flagged-punch report.

- **Super Admin:** define geo-fences and radius.
- **HR Manager:** approve WFH locations, review flagged punches.
- **Department Manager:** view team locations at check-in time only (not live tracking).
- **Employee:** check in from allowed location; location captured only at punch time.

**Privacy note:** location is captured only at check-in/out, never tracked continuously; employees are informed in the attendance policy.

## 8. AI Modules

AI features assist HR decisions but never make final decisions; a human always approves hiring, rejection or any action on an employee.

### M15. Recruitment & AI Resume Screening

**Features:** job requisition by department, job posting with public careers page and shareable link, application form with CV upload, AI parsing of CVs (skills, experience, education), AI match score against job description with a short reason, candidate pipeline board (Applied → Shortlisted → Interview → Offer → Hired/Rejected), interview scheduling with interviewer feedback forms, technical test links, offer letter generation, one-click conversion of hired candidate to employee.

- **Super Admin:** approve new positions and final offers.
- **HR Manager:** post jobs, run screening, manage pipeline, send offers.
- **Department Manager:** raise job requisitions, review shortlisted CVs, give interview feedback.
- **Employee:** view internal openings, refer candidates.

### M16. HR Chatbot

**Features:** chat widget answering policy questions from the company handbook, personal queries from the employee's own data ("How many casual leaves do I have?", "When is the next pay date?"), quick actions (apply for leave, download slip), hand-off to HR when unsure, English and Roman Urdu support, chat history.

- **Super Admin:** enable feature, set data access limits.
- **HR Manager:** upload policy documents, review unanswered questions.
- **Department Manager / Employee:** ask questions about own data and policies only.

### M17. Attrition Prediction

**Features:** risk score per employee from signals such as rising absences, late arrivals, missed appraisals, no increment in 18+ months, declining survey scores; risk levels (Low, Medium, High) with the main contributing factors; department-level attrition trends; suggested retention actions.

- **Super Admin:** company-wide risk view.
- **HR Manager:** full risk dashboard and action notes.
- **Department Manager:** risk levels for own team only.
- **Employee:** no access (scores are confidential).

**Data note:** AI features send minimal data to the AI provider, never CNIC or bank details; the client should approve the AI provider and its data terms.

## 9. Employee Experience & Office Management Modules

These modules raise engagement and fit software-house work: project time, company laptops, team communication and skill growth.

### M18. Onboarding & Offboarding

**Features:** onboarding checklist templates (documents, laptop, email account, GitHub/Jira access, NDA signing, orientation), task owners and due dates, welcome email; offboarding with resignation submission, notice period tracking, exit checklist (asset return, access revocation, handover), exit interview form, final settlement, auto-generated experience and relieving letters.

- **Super Admin:** approve resignations of senior staff, define templates.
- **HR Manager:** run checklists, process settlements, issue letters.
- **Department Manager:** complete team tasks (access setup, handover), accept resignations.
- **Employee:** complete own checklist tasks, submit resignation, fill exit interview.

### M19. Performance & Appraisal

**Features:** goals/OKRs per quarter, KPI templates per designation, self-review + manager review + optional 360° peer feedback, rating scale, appraisal cycles (quarterly/annual), increment and promotion recommendations linked to payroll, performance history.

- **Super Admin:** approve final ratings and increments.
- **HR Manager:** set cycles and templates, track completion.
- **Department Manager:** set team goals, rate team, recommend increments.
- **Employee:** set own goals, self-review, view results.

### M20. Rewards, Celebrations & Surveys

**Features:** Employee of the Month nominations and voting, appreciation posts and badges, birthday and work-anniversary wall with automatic wishes, pulse surveys and polls with result charts.

- **Super Admin / HR Manager:** create surveys, announce awards.
- **Department Manager:** nominate, post appreciation.
- **Employee:** vote, appreciate colleagues, respond to surveys.

### M21. Anonymous Feedback & Grievance

**Features:** anonymous suggestion box, formal grievance with case tracking, harassment complaint channel routed only to designated committee, status updates to the complainant without revealing identity.

- **Super Admin:** view escalated cases.
- **HR Manager / committee:** handle and close cases.
- **Department Manager:** no access to complaints about own team.
- **Employee:** submit anonymously or by name, track own case.

### M22. Projects & Timesheets

**Features:** projects and clients, assign employees to projects, daily/weekly timesheets with hours per project and task, billable vs non-billable hours, manager approval, utilization and project cost reports.

- **Super Admin:** view project profitability.
- **HR Manager:** view timesheet compliance.
- **Department Manager:** create projects, assign team, approve timesheets.
- **Employee:** log hours, view own utilization.

### M23. Asset Management

**Features:** asset register (laptops, monitors, phones, licenses) with serial numbers, assignment to employees, assignment history, warranty and license expiry alerts, damage/repair records, auto-return step at offboarding.

- **Super Admin / HR Manager:** manage register, assign and recover assets.
- **Department Manager:** request assets for team.
- **Employee:** view assigned assets, report issues.

### M24. Internal Chat

**Features:** one-to-one and group chat, department channels created automatically, file sharing, online status, real-time delivery via Socket.io, message search.

- **All roles:** chat; Super Admin can disable or archive channels.

### M25. Training & Learning

**Features:** training catalog (internal sessions, online courses), enrollment and attendance, certificates upload, skill matrix per employee, training cost tracking.

- **Super Admin:** approve training budget.
- **HR Manager:** create programs, track completion.
- **Department Manager:** nominate team members, identify skill gaps.
- **Employee:** enroll, upload certificates, update skills.

## 10. Pakistan Compliance & Localization

Tax slabs and contribution rates change with each federal budget, so all rates are stored as editable settings, never hard-coded.

- **Income tax (FBR):** monthly withholding from annual taxable salary using editable slab tables per tax year (July–June); yearly tax certificate per employee; withholding report for filing.
- **EOBI:** employer and employee contribution tracking with editable rates and wage ceiling; monthly contribution report.
- **Provincial social security (PESSI for Punjab):** optional, enabled if applicable to the client.
- **Provident fund / gratuity:** optional schemes with configurable contribution and payout rules.
- **CNIC handling:** 13-digit format validation, expiry date with alerts 30 days before expiry.
- **Holidays:** Pakistan gazetted holiday calendar with editable Eid and Muharram dates.
- **Currency & formats:** PKR, DD/MM/YYYY dates, Pakistani phone format (+92).
- **Language:** English interface with optional Urdu labels and right-to-left support.
- **Bank transfers:** salary sheet exports in formats used by major Pakistani banks (to be confirmed with the client's bank).

The client's accountant or tax advisor should verify tax and contribution rules before payroll goes live.

## 11. Role-wise Permission Matrix

One table shows each role's default access to every module; Super Admin can change any of it per role in M26. Key: **Full** = configure + all data; **Manage** = create, edit, approve all records; **Team** = view/approve own team only; **Own** = own records only; **View** = read only; **None** = no access.

| Module | Super Admin | HR Manager | Dept. Manager | Employee |
| --- | --- | --- | --- | --- |
| M1 Authentication & Access | Full | Manage | Own | Own |
| M2 Company Settings | Full | Manage | View | View |
| M3 Employee Management | Full | Manage | Team (no salary) | Own |
| M4 Department & Org Chart | Full | Manage | View | View |
| M5 Attendance & Shifts | Full | Manage | Team | Own |
| M6 Leave & Holidays | Full | Manage | Team | Own |
| M7 Dashboard & Reports | Full | Manage | Team | Own |
| M8 Notifications & Announcements | Full | Manage | Team | Own |
| M26 Roles & Permissions | Full | Assign roles only | Delegate own approvals | View own |
| M9 Payroll | Full | Manage | None | Own |
| M10 Loans & Advances | Full | Manage | Team (recommend) | Own |
| M11 Expense Claims | Full | Manage | Team | Own |
| M12 Face Attendance | Full | Manage | Team (flagged only) | Own |
| M13 QR Attendance | Full | Manage | None | Own |
| M14 GPS / Geo-fencing | Full | Manage | Team | Own |
| M15 Recruitment & AI Screening | Full | Manage | Team (own openings) | View (openings, referrals) |
| M16 HR Chatbot | Full | Manage | Own | Own |
| M17 Attrition Prediction | Full | Manage | Team | None |
| M18 Onboarding & Offboarding | Full | Manage | Team | Own |
| M19 Performance & Appraisal | Full | Manage | Team | Own |
| M20 Rewards & Surveys | Full | Manage | Team | Own |
| M21 Feedback & Grievance | Full | Manage | None | Own |
| M22 Projects & Timesheets | Full | View | Team | Own |
| M23 Asset Management | Full | Manage | Team (request) | Own |
| M24 Internal Chat | Full | Own | Own | Own |
| M25 Training & Learning | Full | Manage | Team | Own |

## 12. Non-functional Requirements

HR data is sensitive (salaries, CNIC, bank accounts), so security and auditability are launch requirements, not extras.

**Security**

- HTTPS everywhere; passwords hashed with bcrypt; JWT with short-lived access tokens.
- Role and data-scope checks on every API on the server, not only in the UI.
- Encryption at rest for CNIC, bank account and salary fields.
- Rate limiting, input validation and protection against NoSQL injection and XSS.
- Files stored privately with signed, expiring URLs.

**Audit & data**

- Audit log of every create/edit/delete with user, time, old and new values; viewable by Super Admin.
- Soft delete for employees and payroll records; no permanent deletion of finalized payroll.
- Daily automated database backup with 30-day retention; restore tested monthly.

**Performance & usability**

- Pages load in under 3 seconds for up to 500 employees.
- Responsive design for mobile, tablet and desktop; installable as a PWA.
- Light and dark mode; accessible forms and keyboard navigation.
- Pagination and server-side search for all large lists.

## 13. Development Roadmap

Delivery runs in four phases so the client starts using core HR and payroll early, while advanced features follow. Each phase ends with client testing and sign-off before the next begins.

| Phase | Focus | Modules |
| --- | --- | --- |
| Phase 1 (Launch) | Core HR & Payroll | M1, M2, M3, M4, M5, M6, M7, M8, M26, M9 |
| Phase 2 | Smart Operations | M10, M11, M12, M13, M14, M18, M19, M22, M23 |
| Phase 3 | AI Features | M15, M16, M17 |
| Phase 4 | Engagement | M20, M21, M24, M25 |

Phase 1 alone is a complete, usable HRM; durations for each phase will be estimated after the client answers the open questions in section 1.
