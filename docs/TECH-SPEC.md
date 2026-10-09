# HRM System — Technical Specification & Project Flow

Version 1.0 · 7 October 2026

This document is the build guide for the HRM system on the MERN stack: what to install, how the code is organised, how data and requests flow, and the order to build it in.

## 1. Full MERN Tech Stack

The whole project uses plain JavaScript (ES modules) on both backend and frontend. To catch mistakes without TypeScript, every request and form is validated with Zod, ESLint checks the code on every commit, and tests cover the calculations. Use the current LTS of Node.js and the latest stable versions of every package at project start.

### Backend (Node.js + Express)

| Package | Purpose |
| --- | --- |
| express | Web server and REST API routing |
| mongoose | MongoDB models, schemas, validation, population |
| nodemon | Auto-restart server on code changes (development) |
| zod | Request body/query validation |
| jsonwebtoken | Access and refresh tokens |
| bcrypt | Password hashing |
| @casl/ability | Permission checks (RBAC with scopes) |
| helmet, cors | Security headers, allowed origins |
| express-rate-limit | Brute-force and abuse protection |
| express-mongo-sanitize | NoSQL injection protection |
| cookie-parser | Refresh token in httpOnly cookie |
| multer | File uploads (CVs, documents, photos) |
| cloudinary | File and image storage |
| nodemailer | Email notifications and slips |
| socket.io | Real-time chat and notifications |
| bullmq + ioredis | Background jobs (payroll run, bulk emails, alerts) |
| node-cron | Simple scheduled tasks (daily auto-absent, CNIC expiry) |
| pdfkit | Payslips, letters, certificates |
| exceljs | Excel import/export, bank sheets |
| dayjs | Dates, time zones (Asia/Karachi) |
| pino | Structured logging |
| dotenv | Environment variables |
| swagger-ui-express | API documentation |
| @anthropic-ai/sdk or openai | AI resume screening and chatbot |

### Frontend (React)

| Package | Purpose |
| --- | --- |
| react + vite | UI library and fast build tool |
| react-router | Page routing and protected routes |
| @reduxjs/toolkit + RTK Query | Global state and API caching |
| react-hook-form + zod | Forms and validation (shared schemas with backend) |
| tailwindcss + shadcn/ui | Styling and ready UI components |
| @tanstack/react-table | Large tables with sort, filter, pagination |
| recharts | Dashboard charts |
| @casl/react | Show/hide UI by permission |
| socket.io-client | Real-time updates |
| @vladmandic/face-api | Face recognition in browser |
| html5-qrcode, qrcode.react | QR scanning and display |
| react-leaflet + leaflet | Maps for geo-fencing |
| react-big-calendar | Leave and attendance calendars |
| i18next | English/Urdu language support |
| vite-plugin-pwa | Installable mobile-friendly app |
| sonner | Toast messages |

### Tooling

| Tool | Purpose |
| --- | --- |
| Git + GitHub | Version control, pull requests |
| ESLint + Prettier | Code style and linting |
| Husky + lint-staged | Checks before every commit |
| Vitest, Supertest | Unit and API tests |
| Playwright | End-to-end browser tests |
| Postman / Swagger | API testing and docs |
| Docker + Docker Compose | Same environment on every machine and server |
| GitHub Actions | CI: lint, test, build, deploy |
| MongoDB Compass | Database browsing |
| Redis | Job queue and caching |

## 2. System Architecture

The React app talks only to the Express API; the API alone reads MongoDB, queues background jobs in Redis and calls outside services. Every request crosses the same middleware chain, so permission checks cannot be skipped by any module.

| Layer | Component | Responsibility |
| --- | --- | --- |
| Client | React PWA (browser, desktop and mobile) | Pages, Redux + RTK Query, CASL permission checks, face-api.js, QR scanner, GPS, Leaflet maps, Recharts |
| Connection | HTTPS REST + Socket.io | API calls and real-time events |
| API | Node.js + Express | Middleware chain: helmet, rate limit, authenticate, validate, checkPermission |
| API | Module services | Routes, controllers and services for all 26 modules |
| API | Socket.io server | Chat and live notifications |
| Data | MongoDB Atlas | Employees, attendance, payroll, audit logs |
| Jobs | Redis + BullMQ workers | Payroll run, bulk emails, cron alerts |
| External | Cloudinary, SMTP, WhatsApp Cloud API, AI API | Files, email, WhatsApp messages, CV screening and chatbot |

## 3. Folder Structure

One Git repository (monorepo) holds the backend, frontend and shared validation schemas; each module lives in its own folder on both sides so features stay independent.

```
hrm-system/
├── backend/
│   ├── src/
│   │   ├── config/            # db, redis, cloudinary, env loader
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── auth.service.js
│   │   │   │   └── auth.validation.js
│   │   │   ├── roles/         # M26 permissions
│   │   │   ├── employees/
│   │   │   ├── departments/
│   │   │   ├── attendance/
│   │   │   ├── leaves/
│   │   │   ├── payroll/
│   │   │   ├── recruitment/
│   │   │   └── ...            # one folder per module
│   │   ├── models/            # Mongoose schemas
│   │   ├── middlewares/       # auth, checkPermission, validate, errorHandler, upload
│   │   ├── jobs/              # BullMQ workers + cron schedules
│   │   ├── sockets/           # socket.io events
│   │   ├── services/          # email, whatsapp, pdf, excel, ai, storage
│   │   ├── utils/             # ApiError, asyncHandler, haversine, tax calc
│   │   ├── seed/              # default roles, permissions, admin user
│   │   ├── app.js             # express app setup
│   │   └── server.js          # start http + socket server
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/               # store, router, providers
│   │   ├── features/
│   │   │   ├── auth/          # pages, components, api slice
│   │   │   ├── employees/
│   │   │   ├── attendance/
│   │   │   └── ...
│   │   ├── components/        # shared UI (shadcn), layout, sidebar
│   │   ├── hooks/             # useAuth, usePermission, useSocket
│   │   ├── lib/               # axios/baseQuery, casl ability, utils
│   │   ├── locales/           # en.json, ur.json
│   │   └── main.jsx
│   ├── public/models/         # face-api model files
│   └── package.json
├── shared/                    # zod schemas, permission names, enums
├── docker-compose.yml         # mongo, redis, backend, frontend
└── .github/workflows/         # CI/CD
```

**Layer rule:** routes → validation → checkPermission → controller (reads request, sends response) → service (business logic) → model (database). Controllers never query the database directly.

## 4. Database Design (MongoDB)

Every collection has `createdAt`, `updatedAt`, `createdBy` and `isDeleted` (soft delete); references use ObjectId with Mongoose `ref`, and frequently filtered fields are indexed.

| Collection | Key fields | Relations / indexes |
| --- | --- | --- |
| users | email, passwordHash, roles[], isActive, twoFactor, lastLoginAt, faceDescriptors[] | → employees (1:1), → roles; unique email |
| roles | name, description, isSystem, permissions[{action, subject, scope, fields[], limit}] | used by users |
| employees | employeeCode, name, cnic (encrypted), cnicExpiry, phone, address, emergencyContact, bank (encrypted), joiningDate, probationEnd, employmentType, status, departmentId, designationId, managerId, shiftId, skills[], documents[] | → departments, designations, employees (manager); unique employeeCode |
| departments | name, headId, parentId | tree for org chart |
| designations | title, grade, departmentId | |
| shifts | name, startTime, endTime, graceMinutes, breakMinutes, workDays[] | |
| attendance | employeeId, date, checkIn{time, method, lat, lng, photoUrl}, checkOut{...}, status, lateMinutes, overtimeMinutes, isLocked | unique (employeeId, date) |
| attendanceCorrections | attendanceId, requestedTime, reason, status, approverId | |
| leaveTypes | name, yearlyQuota, carryForward, isPaid, requiresAttachment | |
| leaveBalances | employeeId, leaveTypeId, year, allotted, used, carried | unique (employeeId, leaveTypeId, year) |
| leaves | employeeId, leaveTypeId, from, to, days, halfDay, reason, attachment, status, approvals[{level, approverId, action, at}] | index (status, employeeId) |
| holidays | date, name, type | |
| salaryStructures | employeeId, basic, allowances[], deductions[], effectiveFrom | history kept |
| payrollRuns | month, year, status (draft/review/approved/paid), totals, approvedBy | unique (month, year) |
| payslips | payrollRunId, employeeId, earnings[], deductions[], tax, eobi, gross, net, pdfUrl | |
| loans | employeeId, amount, installments, monthlyDeduction, balance, status | |
| expenses | employeeId, category, amount, receiptUrl, status, approvals[] | |
| jobs / candidates | title, departmentId, description, status / name, cvUrl, parsed, aiScore, aiReason, stage | candidates → jobs |
| reviews | employeeId, cycle, goals[], selfRating, managerRating, comments | |
| assets | tag, type, serialNo, assignedTo, history[], warrantyEnd | |
| projects / timesheets | name, client, members[] / employeeId, projectId, date, hours, billable, status | |
| notifications | userId, type, title, body, link, isRead | index (userId, isRead) |
| announcements, surveys, feedback, trainings, chats, messages | per module fields | |
| settings | key, value | company, payroll, tax slabs, geo-fences |
| auditLogs | userId, action, entity, entityId, before, after, ip, at | index (entity, entityId) |

## 5. API Design

All endpoints sit under `/api/v1`, return one JSON shape `{ success, data, message, meta }`, and support `?page=&limit=&search=&sort=` on list routes. Main endpoints by module:

| Method | Endpoint | Permission |
| --- | --- | --- |
| POST | /auth/login, /auth/refresh, /auth/logout | public / logged in |
| POST | /auth/forgot-password, /auth/reset-password | public |
| GET | /auth/me (user + effective permissions) | logged in |
| GET, POST, PATCH, DELETE | /roles, /roles/:id | role.manage |
| GET | /permissions (catalogue) | role.manage |
| PATCH | /users/:id/roles | role.assign |
| GET, POST | /employees | employee.view / employee.create |
| GET, PATCH, DELETE | /employees/:id | employee.view / edit / delete |
| POST | /employees/import (Excel) | employee.create |
| POST | /employees/:id/documents | employee.edit |
| CRUD | /departments, /designations, /shifts | org.manage |
| GET | /org-chart | org.view |
| POST | /attendance/check-in, /attendance/check-out | attendance.mark (own) |
| POST | /attendance/face/enroll, /attendance/face/verify | attendance.mark |
| GET | /attendance/qr/current (kiosk) | attendance.kiosk |
| GET | /attendance?employeeId=&month= | attendance.view (scoped) |
| POST, PATCH | /attendance/corrections, /attendance/corrections/:id/decide | attendance.mark / attendance.approve |
| POST | /attendance/lock?month= | attendance.lock |
| GET, POST | /leaves | leave.view / leave.apply |
| PATCH | /leaves/:id/decide, /leaves/:id/cancel | leave.approve / own |
| GET | /leaves/balance, /leaves/calendar | leave.view |
| CRUD | /leave-types, /holidays | leave.settings |
| CRUD | /salary-structures | payroll.manage |
| POST | /payroll/runs (generate month) | payroll.run |
| PATCH | /payroll/runs/:id/approve, /payroll/runs/:id/mark-paid | payroll.approve |
| GET | /payroll/runs/:id/bank-sheet | payroll.export |
| GET | /payslips/me, /payslips/:id/pdf | own / payroll.view |
| CRUD + decide | /loans, /expenses | loan.*, expense.* |
| CRUD | /jobs, /candidates; POST /candidates/:id/screen (AI) | recruit.* |
| POST | /chatbot/ask | chatbot.use |
| GET | /analytics/attrition | attrition.view |
| CRUD | /reviews, /assets, /projects, /timesheets, /trainings, /surveys, /feedback, /announcements | per module |
| GET | /dashboard, /reports/:type?format=xlsx or pdf | report.view / report.export |
| GET, PATCH | /notifications, /notifications/:id/read | own |
| GET, PATCH | /settings/:key | settings.manage |
| GET | /audit-logs | audit.view |

Socket.io events: `notification:new`, `chat:message`, `attendance:update`, `payroll:progress`. Full request/response examples go in Swagger at `/api/docs`.

## 6. Authentication & Permission Flow

Login returns a short-lived access token plus a long-lived refresh token in an httpOnly cookie; every request is then checked for identity, permission and data scope on the server.

**Login**

1. User submits email + password to `POST /auth/login`.
2. Server checks account is active and not locked, compares password with bcrypt.
3. If 2FA is on, server sends an OTP and waits for `POST /auth/verify-otp`.
4. Server issues an access token (15 minutes) and a refresh token (7 days, httpOnly secure cookie, stored hashed in DB).
5. Frontend calls `GET /auth/me`, receives user profile and effective permissions, and builds the CASL ability.
6. Sidebar menus, buttons and fields render only where the ability allows.
7. When the access token expires, RTK Query calls `/auth/refresh` automatically and retries the request.

**Every protected request**

1. `authenticate` middleware verifies the JWT and loads the user with roles.
2. `checkPermission('leave.approve')` builds the ability from the user's roles and rejects with 403 if missing.
3. The service adds a scope filter to the query: own → `employeeId = me`; team → `managerId = me`; department → `departmentId = mine`; all → no filter.
4. Field-level rules strip hidden fields (salary, CNIC, bank) before the response is sent.
5. Approval limits are checked in the service (e.g. role may approve leave up to N days).
6. Every write is recorded in `auditLogs` with before and after values.

**Seeding:** on first deploy, a seed script creates the permission catalogue, the four default roles with their default permissions (matrix in the Functional Requirements document), and one Super Admin account whose password must be changed at first login.

## 7. Key Business Flows

These five flows touch most modules; build and test them end to end before adding advanced features.

**Smart check-in (Face + GPS / QR + GPS)**

1. Employee opens Attendance and taps Check In; browser asks for camera and location permission.
2. Frontend reads GPS position and accuracy; for Face, face-api.js detects the face, runs a blink liveness check and computes a descriptor; for QR, html5-qrcode reads the signed token from the office screen.
3. Frontend sends `{ lat, lng, accuracy, descriptor | qrToken, snapshot }` to `/attendance/check-in`.
4. Server checks distance to the office with the Haversine formula against the geo-fence radius, compares the descriptor with the stored ones (distance below threshold), or verifies the QR token signature and expiry.
5. Server applies shift rules (late minutes, half day), saves the record, and emits `attendance:update`.
6. Failure at any check → punch is rejected with a reason, or saved as "flagged" for HR review.

**Leave approval**

1. Employee applies; server checks balance, overlap with existing leaves and holidays, and calculates working days.
2. Leave is saved as Pending; approver chain is built from settings (Manager → HR, + Super Admin above limit).
3. Each approver is notified (in-app, email); each decision is appended to `approvals[]`.
4. Final approval deducts the balance and marks the attendance days as Leave; rejection notifies the employee with the reason.

**Monthly payroll run**

1. HR locks the month's attendance (no more edits).
2. HR clicks Generate; a BullMQ job processes each employee: salary structure + overtime + bonuses − unpaid leave − late penalties − loan installment − EOBI − income tax (from slab settings).
3. Draft payslips appear for HR review; HR fixes and regenerates individual slips if needed.
4. Super Admin approves; payslip PDFs are generated and stored.
5. HR downloads the bank transfer sheet, pays, and marks the run Paid.
6. Employees get slips by email/WhatsApp and in the portal; loan balances update.

**Recruitment to employee**

1. Manager raises a requisition; Super Admin approves; HR publishes the job.
2. Candidate applies with CV; AI parses it and scores the match with a short reason.
3. HR shortlists, schedules interviews; interviewers submit feedback.
4. HR sends offer letter; on acceptance, one click creates the employee, user account and onboarding checklist.

**Exit**

1. Employee submits resignation; manager accepts; notice period starts.
2. Offboarding checklist runs: asset return, access revocation, handover, exit interview.
3. HR processes final settlement in payroll; system generates experience letter and deactivates the account on the last day.

## 8. Request Lifecycle & Error Handling

Every request passes the same middleware chain in the same order, and every error leaves through one central handler.

1. React component calls an RTK Query hook (e.g. `useApproveLeaveMutation`).
2. Base query attaches the access token; refreshes it on 401 and retries once.
3. Express global middleware: helmet → cors → rate limit → JSON parser → cookie parser → mongo-sanitize → request logger.
4. Route middleware: `authenticate` → `validate(zodSchema)` → `checkPermission(...)` → (`upload` for files).
5. Controller calls the service; service runs business rules, scoped queries and audit logging inside a MongoDB transaction where several collections change (payroll, leave approval).
6. Response `{ success: true, data, meta }`; RTK Query updates its cache and the UI re-renders.

**Errors**

- Services throw `ApiError(status, message, code)`; an `asyncHandler` wrapper forwards it to the central error handler.
- Error handler maps Zod errors → 400 with field messages, Mongoose duplicate key → 409, JWT errors → 401, permission → 403, not found → 404, everything else → 500 (logged with pino, generic message to client).
- Frontend shows field errors under form inputs and other errors as toast messages; a React error boundary catches crashes per page.

## 9. Local Setup & Environment Variables

A new developer should go from clone to running app in under 15 minutes with Docker.

1. Install Node.js (LTS), Git, Docker Desktop, VS Code, MongoDB Compass.
2. Clone the repo and copy `backend/.env.example` to `backend/.env`, `frontend/.env.example` to `frontend/.env`.
3. Run `docker compose up -d` to start MongoDB (as a replica set, needed for transactions) and Redis.
4. Run `npm install` in `backend/` and `frontend/`.
5. Run `npm run seed` in `backend/` to create permissions, default roles and the Super Admin.
6. Run `npm run dev` in both folders: API on port 5000, React on port 5173.
7. Open Swagger at `localhost:5000/api/docs` to test APIs.

**backend/.env**

```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/hrm?replicaSet=rs0
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
ENCRYPTION_KEY=32-byte-key-for-cnic-and-bank
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
AI_API_KEY=
TZ=Asia/Karachi
```

**frontend/.env**

```
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

Never commit `.env` files; production secrets live in the hosting provider's secret settings.

## 10. Step-by-Step Development Plan

Build in this order; each step ends with a working, demo-able feature and tests, so the client can review progress after every step.

**Phase 1 — Core HR & Payroll**

1. Project setup
    - Monorepo (JavaScript, ES modules), ESLint/Prettier, Husky, Docker Compose, GitHub repo + CI.
    - Express app skeleton: config, error handler, logger, Swagger, health check.
    - React + Vite + Tailwind + shadcn, router, Redux store, layout with sidebar.
    - Done when: both apps run with one command and CI passes.
2. Auth + Roles & Permissions (M1, M26)
    - User and Role models, permission catalogue, seed script.
    - Login, refresh, logout, forgot/reset password, 2FA.
    - `authenticate` + `checkPermission` middlewares, CASL on frontend, protected routes.
    - Roles screen: create role, tick permissions, set scope.
    - Done when: a user with a custom role sees only allowed menus and gets 403 on others.
3. Company Settings + Org (M2, M4)
    - Company profile, working days, shifts, departments, designations, org chart.
4. Employee Management (M3)
    - CRUD, documents upload, encrypted CNIC/bank fields, Excel import, user account creation.
5. Attendance & Shifts (M5)
    - Web check-in/out, late/overtime rules, calendar, corrections, auto-absent cron, month lock.
6. Leave & Holidays (M6)
    - Leave types, balances, apply/approve chain, team calendar, holiday calendar.
7. Notifications (M8)
    - In-app (Socket.io), email templates, announcements.
8. Payroll (M9)
    - Salary structures, tax slab and EOBI settings, payroll job, review/approve, payslip PDF, bank sheet.
    - Done when: a full month runs for test employees and totals match a manual Excel calculation.
9. Dashboards & Reports (M7) + audit log screen.
10. Phase 1 testing and client UAT, then production deployment.

**Phase 2 — Smart Operations**

11. Loans & Expenses (M10, M11), linked to payroll.
12. Smart attendance: GPS geo-fencing (M14) → QR kiosk (M13) → Face enrollment and verify with liveness (M12).
13. Onboarding/Offboarding (M18) and Performance (M19).
14. Projects & Timesheets (M22) and Assets (M23).

**Phase 3 — AI Features**

15. Recruitment pipeline (M15), then AI CV parsing and scoring.
16. HR Chatbot (M16) with tools for own leave balance, payslips and policy search.
17. Attrition risk (M17): start rule-based, improve with data later.

**Phase 4 — Engagement**

18. Rewards & Surveys (M20), Feedback & Grievance (M21), Internal Chat (M24), Training (M25).
19. Urdu language, PWA install, performance tuning, final security review.

## 11. Git Workflow, Testing & Coding Standards

Small branches, reviewed pull requests and automated checks keep a 26-module codebase stable.

**Git**

- Branches: `main` (production), `develop` (staging), `feature/<module>-<task>`, `fix/<issue>`.
- Commit messages follow Conventional Commits: `feat(leave): add approval chain`, `fix(payroll): tax rounding`.
- Every merge into `develop` goes through a pull request with CI green and at least one review.
- Tag releases on `main` (`v1.0.0`) with a changelog.

**Testing**

- Unit tests (Vitest) for calculations: tax, overtime, leave days, Haversine distance, payroll totals.
- API tests (Supertest) for each route: success, validation error, 401, 403 by role and scope.
- End-to-end tests (Playwright) for the five key flows in section 7.
- A separate test database, reset before each run with seed data.

**Coding standards**

- Same module pattern everywhere: routes, controller, service, validation, model.
- Shared Zod schemas and permission names in `shared/`, used by both backend and frontend.
- No business logic in React components; put it in hooks and services.
- Money stored as integers in paisa or as Decimal128, never floating point.
- Dates stored in UTC, shown in Asia/Karachi.
- Every list API paginated; every query filtered by scope.

## 12. Deployment & DevOps

For a paying client, run everything on one VPS with Docker and a managed MongoDB Atlas cluster; free tiers sleep and are not suitable for attendance at 9 a.m.

| Environment | Purpose | Branch | Database |
| --- | --- | --- | --- |
| Local | Development | feature/* | Docker MongoDB |
| Staging | Client testing (UAT) | develop | Atlas staging cluster |
| Production | Live use | main | Atlas production cluster, daily backups |

**Production setup**

- VPS (e.g. 2 vCPU, 4 GB RAM to start) running Docker: backend container, frontend built and served by Nginx, Redis container.
- Nginx as reverse proxy with free Let's Encrypt HTTPS (required for camera and GPS).
- Domain like `hr.clientcompany.com`.
- MongoDB Atlas with IP allow-list, automated backups and point-in-time restore.
- Cloudinary private folders for documents.

**CI/CD (GitHub Actions)**

1. On every pull request: install, lint, run unit and API tests.
2. On merge to `develop`: build Docker images and deploy to staging.
3. On release tag on `main`: deploy to production after manual approval, run database migrations, smoke test `/health`.

**Monitoring**

- Uptime monitor on `/health` with alerts (e.g. UptimeRobot, free).
- Error tracking with Sentry (free tier) on backend and frontend.
- Logs from pino shipped to a log viewer or kept with rotation on the server.

**Handover to client:** admin guide, user guides per role, Swagger API docs, `.env` and server credentials in a password manager, and a backup-restore runbook.
