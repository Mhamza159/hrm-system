# HRM System — Complete Modules List (26 Modules)

The system is organized into 26 distinct modules across 7 functional groups:

### Group 1: Core HR (Launch Priority P1)
- **M1: Authentication & Access Control (P1)** — JWT login, 7-day httpOnly refresh token, bcrypt hashing, 2FA OTP, forgot/reset password.
- **M2: Company Settings (P1)** — Company details, working days/hours, grace periods, leave policies, FBR tax slabs, geo-fences.
- **M3: Employee Management (P1)** — Employee records, profile details, encrypted CNIC/bank data, document uploads, Excel bulk import.
- **M4: Department, Designation & Org Chart (P1)** — Department hierarchy, designations/grades, shift definitions, interactive tree Org Chart.
- **M5: Attendance & Shifts (P1)** — Daily check-in/out, shift assignment, late/overtime tracking, attendance corrections, monthly locking.
- **M6: Leave & Holidays (P1)** — Leave types, yearly quotas, leave applications, multi-tier approvals, public holidays calendar.
- **M7: Dashboard & Reports (P1)** — Executive & HR dashboard, attendance/headcount metrics, Excel/PDF report generation.
- **M8: Notifications & Announcements (P1)** — Real-time in-app notification bell, company announcements, email triggers.
- **M26: Roles & Permissions (RBAC) (P1)** — Permission catalogue, dynamic CASL ability, role management, custom role builder.

### Group 2: Payroll & Finance
- **M9: Payroll Management (P1)** — Salary structures, monthly payroll runs, Pakistan FBR income tax slabs, EOBI statutory deductions, payslip PDF generation, bank transfer sheets.
- **M10: Loans & Advances (P2)** — Loan requests, approval workflow, installment schedules, automatic monthly payroll deductions.
- **M11: Expense Claims (P2)** — Expense claims, receipt uploads, multi-stage approval chain, reimbursement tracking.

### Group 3: Smart Attendance
- **M12: Face Recognition Attendance (P2)** — Browser-based face matching using `@vladmandic/face-api`, face descriptors enrollment, anti-spoofing checks.
- **M13: QR Code Attendance (P2)** — Dynamic rotating kiosk QR code, mobile scanning using `html5-qrcode` & `qrcode.react`.
- **M14: GPS / Geo-fencing Attendance (P2)** — Office perimeter geo-fencing using Leaflet / react-leaflet and browser Geolocation API.

### Group 4: AI & Machine Learning
- **M15: Recruitment & AI Resume Screening (P2)** — Job openings, candidate pipeline, CV parsing, AI resume matching & scoring.
- **M16: HR Chatbot (P3)** — AI assistant answering company policies, leave balance queries, and employee FAQs.
- **M17: Attrition Prediction (P3)** — Predictive indicators analyzing attendance, leave patterns, and tenure to identify flight risks.

### Group 5: Employee Experience
- **M18: Onboarding & Offboarding (P2)** — New hire task checklists, asset assignments, exit clearance workflow, experience letters.
- **M19: Performance & Appraisal (P2)** — KPI & OKR goal setting, self-reviews, manager appraisals, 360 feedback cycles.
- **M20: Rewards, Celebrations & Surveys (P3)** — Peer recognition, birthday/anniversary notices, pulse surveys.
- **M21: Anonymous Feedback & Grievance (P3)** — Anonymous employee grievance submissions, confidential admin resolution tracking.

### Group 6: Office Management
- **M22: Projects & Timesheets (P2)** — Project allocations, daily/weekly task timesheet submissions, billable hour tracking.
- **M23: Asset Management (P2)** — Company hardware & software inventory, custodian tracking, handover/return logs.
- **M24: Internal Chat (P3)** — Real-time direct & group messaging via Socket.io.
- **M25: Training & Learning (P3)** — Course catalogue, employee skill matrix, training requests, completion certificates.

Refer to `mem:overview`, `mem:build_order`, and `mem:architecture`.
