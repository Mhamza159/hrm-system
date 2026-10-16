# HRM System — Full-Stack Build Guide (Backend + Frontend Saath Saath)

Version 1.0 · 7 October 2026 · JavaScript (MERN) · Roman Urdu

Is document mein har feature aik "slice" hai: pehle us ka backend, foran us ka frontend, phir test. Jab tak aik feature ka backend + frontend + test mukammal na ho, agla feature shuru na karein. Functional Requirements document ka har feature yahan aik ID ke saath likha hai, taake koi cheez miss na ho.

## 1. Kaam Karne ka Usool (Vertical Slice)

**Aik feature = Backend + Frontend + Test, aik saath.** Misal: "Employee add karna" = `POST /employees` API + EmployeeFormPage + test. Teeno ho jayein to row ke aakhir wale khane ☐ ko ☑ kar dein.

**Har feature ke 10 qadam (isi tarteeb se)**

1. Backend: model mein zaroori fields add karein (`<module>.model.js`).
2. Backend: Zod validation likhein (`<module>.validation.js`).
3. Backend: service function likhein (asal logic) aur audit log.
4. Backend: controller + route; route par `authenticate` → `validate` → `checkPermission`.
5. Backend: Postman/Swagger se API test (sahi data, ghalat data, bina permission = 403).
6. Frontend: RTK Query hook (`<module>Api.js`).
7. Frontend: page ya component banayein, loading aur error state ke saath.
8. Frontend: button/menu `Can` component se permission ke hisaab se chhupayein.
9. Frontend: route aur sidebar menu add karein.
10. Test: browser mein us feature ko har mutalliqa role se chala kar dekhein, phir Git commit.

**Table ke khanon ka matlab**

| Khana | Matlab |
| --- | --- |
| ID | Feature ka number (jaise 3.4 = M3 ka chautha feature) |
| Feature | Kya banana hai |
| Backend | API endpoint, logic aur permission |
| Frontend | Page / component |
| Test | Kaise pakka karein ke sahi chal raha hai |
| ☐ | Mukammal hone par tick |

## 2. Banane ki Tarteeb

| Step | Module | Phase |
| --- | --- | --- |
| 0 | M0 Foundation | Phase 1 |
| 1 | M1 Authentication | Phase 1 |
| 2 | M26 Roles & Permissions | Phase 1 |
| 3 | M2 Company Settings | Phase 1 |
| 4 | M4 Departments, Designations, Shifts, Org Chart | Phase 1 |
| 5 | M3 Employee Management | Phase 1 |
| 6 | M8 Notifications & Announcements | Phase 1 |
| 7 | M5 Attendance & Shifts | Phase 1 |
| 8 | M6 Leave & Holidays | Phase 1 |
| 9 | M9 Payroll (+ Pakistan compliance) | Phase 1 |
| 10 | M7 Dashboard & Reports | Phase 1 |
| 11 | X1 Security, Audit & Quality (Phase 1 ka aakhri check) | Phase 1 |
| 12 | M10 Loans, M11 Expenses | Phase 2 |
| 13 | M14 GPS, M13 QR, M12 Face | Phase 2 |
| 14 | M23 Assets, M18 Onboarding/Offboarding | Phase 2 |
| 15 | M19 Performance, M22 Projects & Timesheets | Phase 2 |
| 16 | M15 Recruitment, M16 Chatbot, M17 Attrition | Phase 3 |
| 17 | M20 Rewards & Surveys, M21 Feedback, M24 Chat, M25 Training | Phase 4 |
| 18 | X2 Urdu, PWA, Dark mode, Performance | Phase 4 |

## 3. M0 — Foundation

Ye har module ka bunyadi dhancha hai. Isay pehle mukammal karein.

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 0.1 | Project setup | `backend/` Express app, `server.js`, `app.js`, nodemon, ESLint, Prettier, Husky | `frontend/` Vite + React, Tailwind, shadcn/ui | Dono `npm run dev` se chalein | ☐ |
| 0.2 | Database aur Redis | `config/db.js`, `docker-compose.yml` (MongoDB replica set + Redis) | — | Server start par "DB connected" | ☐ |
| 0.3 | Environment | `config/env.js`, `.env.example` | `frontend/.env.example` | Ghalat/khali env par server saaf error de | ☐ |
| 0.4 | Common response aur errors | `utils/ApiError.js`, `asyncHandler.js`, `apiResponse.js`, `middlewares/errorHandler.js` | `lib/baseApi.js` (error ko toast mein dikhana) | Ghalat URL par 404 JSON, toast nazar aaye | ☐ |
| 0.5 | Validation middleware | `middlewares/validate.js` (Zod) | Forms ke liye react-hook-form + zod setup | Ghalat data par 400 aur field messages | ☐ |
| 0.6 | File upload | `middlewares/upload.js` (Multer), `services/storage.service.js` (Cloudinary private) | `components/common/FileUpload.jsx` | File upload ho aur signed link se khule | ☐ |
| 0.7 | Pagination/search | `utils/paginate.js` | `components/common/DataTable.jsx` | 1000 records mein page, search, sort | ☐ |
| 0.8 | Audit log | `models/auditLog.model.js`, `services/audit.service.js` | (screen X1 mein) | Har create/edit/delete ka record bane | ☐ |
| 0.9 | Common services | `services/email.service.js`, `pdf.service.js`, `excel.service.js` | — | Test email, test PDF, test Excel ban jaye | ☐ |
| 0.10 | Background jobs | `config/queue.js` (BullMQ), `jobs/` folder, node-cron | — | Test job queue mein jaye aur chale | ☐ |
| 0.11 | Socket.io | `sockets/index.js` (JWT ke saath connect) | `hooks/useSocket.js` | Browser console mein "connected" | ☐ |
| 0.12 | Layout | — | `AppLayout.jsx`, `Sidebar.jsx`, `Topbar.jsx`, `PageHeader.jsx`, `ConfirmDialog.jsx`, `StatusBadge.jsx` | Layout har screen size par theek | ☐ |
| 0.13 | API docs aur health | `swagger-ui-express` at `/api/docs`, `GET /health` | — | Swagger khule, health "ok" de | ☐ |
| 0.14 | Security base | helmet, cors (sirf CLIENT_URL), rate limit, mongo-sanitize, cookie-parser | — | Doosre origin se request block | ☐ |

**Mukammal tab:** saari 14 rows ☑.

## 4. M1 — Authentication

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 1.1 | User model | `user.model.js` (email, passwordHash, roles[], employeeId, isActive, failedAttempts, lockUntil, twoFactorEnabled, refreshTokenHash, mustChangePassword) | — | Compass mein collection | ☑ |
| 1.2 | Login (JWT access + refresh) | `POST /auth/login`: bcrypt, access token 15 min, refresh 7 din httpOnly cookie | `LoginPage.jsx` | Sahi/ghalat password dono | ☑ |
| 1.3 | Account lock (5 ghalat koshishein) | failedAttempts++, 5 par lockUntil = 15 min | Login par "account locked" message | 5 ghalat koshishon ke baad lock | ☑ |
| 1.4 | Auto refresh token | `POST /auth/refresh` (token rotation) | `baseApi.js`: 401 par refresh aur retry | Access token expire ke baad bhi kaam chale | ☑ |
| 1.5 | Logout | `POST /auth/logout` (cookie aur hash saaf) | Topbar user menu → Logout | Logout ke baad pichla page na khule | ☑ |
| 1.6 | Current user | `GET /auth/me` (user + permissions) | `authSlice.js`, `useAuth.js`, `ProtectedRoute.jsx` | Bina login har page /login par jaye | ☑ |
| 1.7 | Forgot password (email OTP) | `POST /auth/forgot-password` (OTP email, 10 min) | `ForgotPasswordPage.jsx` | Email mein OTP aaye | ☑ |
| 1.8 | Reset password | `POST /auth/reset-password` | `ResetPasswordPage.jsx` | Purana OTP dobara na chale | ☑ |
| 1.9 | Change password + pehle login par lazmi | `PATCH /auth/change-password`, mustChangePassword | `ChangePasswordPage.jsx`, force redirect | Naya user pehle password badle | ☑ |
| 1.10 | Two-factor authentication | `POST /auth/2fa/enable`, `POST /auth/verify-otp` | `OtpPage.jsx`, profile mein 2FA toggle | 2FA on user OTP ke baghair na ghuse | ☑ |
| 1.11 | Auto logout (inactivity) | — | `useIdleTimer` hook (jaise 30 min) | Khali chhorne par logout | ☑ |
| 1.12 | Login history (device, IP) | `loginHistory.model.js`, `GET /auth/login-history` (own / auth.history) | `LoginHistoryPage.jsx` | Har login darj ho | ☑ |
| 1.13 | Account activate/deactivate | `PATCH /users/:id/status` (user.manage) | Users page par toggle | Deactivated user login na kar sake | ☑ |
| 1.14 | HR: password reset karna | `POST /users/:id/reset-password` (user.manage) | Users page par "Reset Password" | Employee ko naya temp password email | ☑ |

**Mukammal tab:** 14 rows ☑; Super Admin aur Employee dono se login test.

## 5. M26 — Roles & Permissions

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 26.1 | Permission catalogue | `shared/permissions.js` (har module ke actions), `GET /permissions` | — | List mein tamam modules | ☑ |
| 26.2 | Role model + seed | `role.model.js`, `seed/roles.seed.js` (Super Admin, HR Manager, Department Manager, Employee + admin user) | — | `npm run seed` se 4 roles | ☑ |
| 26.3 | checkPermission middleware | `middlewares/checkPermission.js` (CASL) | — | Bina permission 403 | ☑ |
| 26.4 | Data scope (own/team/department/all) | `utils/scopeFilter.js` har list query mein | — | Manager ko sirf team ka data | ☑ |
| 26.5 | Field-level permission | `utils/fieldFilter.js` (salary, CNIC, bank chhupana) | Chhupe fields ki jagah "—" | Manager ko salary na dikhe | ☑ |
| 26.6 | UI mein permission | `/auth/me` permissions bhejta hai | `lib/ability.js`, `Can.jsx`, `usePermission.js`, Sidebar filter | Employee ko admin menus na dikhein | ☑ |
| 26.7 | Roles list + banana/edit/delete | CRUD `/roles` (role.manage) | `RolesListPage.jsx`, `RoleFormPage.jsx` | Naya role save ho | ☑ |
| 26.8 | Permission matrix screen | role.permissions[] save | `PermissionMatrix.jsx` (module × action checkbox + scope dropdown) | Tick/untick sahi save ho | ☑ |
| 26.9 | Approval limits | permission mein `limit` (jaise leave din, expense raqam) | Matrix mein limit input | Had se upar approval reject | ☑ |
| 26.10 | Role clone | `POST /roles/:id/clone` | "Copy" button | Copy mein same permissions | ☑ |
| 26.11 | User ko aik ya zyada roles | `PATCH /users/:id/roles` (role.assign) | `UsersPage.jsx` multi-select | Do roles ki permissions jud jayein | ☑ |
| 26.12 | HR sirf apni permissions de sake | service check: grant ⊆ apni permissions | Na milne wale roles disabled | HR Super Admin role na de sake | ☑ |
| 26.13 | Super Admin role mehfooz | isSystem role delete/kam nahi | Delete button disabled | API se bhi delete na ho | ☑ |
| 26.14 | Approvals delegation | `delegation.model.js`, `POST /delegations` (from, to, start, end) | `DelegationPage.jsx` | Muddat mein doosra manager approve kare | ☑ |
| 26.15 | View as user | `GET /users/:id/effective-permissions` | "View permissions" dialog | Sahi mili-juli list | ☑ |
| 26.16 | Permission change audit | har role/user-role tabdeeli audit log mein | (X1 audit screen) | Log mein purani/nayi value | ☑ |
| 26.17 | Employee apne roles dekhe | `/auth/me` | My Profile → "My Access" tab | Employee ko apne roles nazar aayein | ☑ |

**Mukammal tab:** custom role "Finance Officer" bana kar sirf payroll view do; us user se test karo ke baqi sab band hai.

## 6. M2 — Company Settings

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 2.1 | Settings model | `setting.model.js` (key, value), `GET/PATCH /settings/:key` (settings.manage), cache | `SettingsPage.jsx` (tabs) | Save ke baad reload par wahi value | ☑ |
| 2.2 | Company profile aur logo | key `company` (naam, address, NTN, logo url) | `CompanyForm.jsx` + logo upload | Logo payslip/topbar mein aaye | ☑ |
| 2.3 | Kaam ke din aur office timings | key `workingDays`, `officeHours` | `WorkingHoursForm.jsx` | Attendance in se chale | ☑ |
| 2.4 | Late rules (grace, katoti) | key `lateRules` (grace min, kitne late = half day, katoti) | `AttendanceRulesForm.jsx` | Late hisaab badle | ☑ |
| 2.5 | Leave policy | key `leavePolicy` (approval chain, carry forward, encashment) | `LeavePolicyForm.jsx` | M6 isi ko parhe | ☑ |
| 2.6 | Payroll cycle aur pay date | key `payrollCycle` | `PayrollSettingsForm.jsx` | M9 isi mahine ko le | ☑ |
| 2.7 | Tax, EOBI, PESSI, PF settings | keys `taxSlabs` (tax year wise), `eobi`, `pessi`, `providentFund` | `TaxSlabsForm.jsx` (rows add/remove) | Naya slab payroll mein lage | ☑ |
| 2.8 | Office location aur geo-fence radius | key `geoFences` (lat, lng, radius) | `GeoFenceMapEditor.jsx` (Leaflet map) | Map par circle | ☑ |
| 2.9 | Email/WhatsApp templates | key `templates` (welcome, leave, payslip...) | `TemplatesForm.jsx` ({{name}} placeholders) | Test email mein template | ☑ |
| 2.10 | Data backup | `jobs/backup.job.js` (rozana mongodump, 30 din), `POST /settings/backup-now` | Backup tab: aakhri backup ka waqt + "Backup Now" | Backup file bane | ☑ |
| 2.11 | Policies dekhna (sab) | `GET /settings/public-policies` | `PoliciesPage.jsx` (sirf parhna) | Employee policy parh sake | ☑ |

## 7. M4 — Departments, Designations, Shifts & Org Chart

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 4.1 | Departments | `department.model.js`, CRUD `/departments` (org.manage) | `DepartmentsPage.jsx` + dialog | Employees wala department delete na ho | ☐ |
| 4.2 | Department head / manager | department.headId | Form mein employee select | Head sahi dikhe | ☐ |
| 4.3 | Designations + grades | `designation.model.js`, CRUD `/designations` | `DesignationsPage.jsx` | Grade dropdown | ☐ |
| 4.4 | Shifts (fixed, flexible, night) | `shift.model.js`, CRUD `/shifts` | `ShiftsPage.jsx` | Night shift raat 12 ke paar sahi | ☐ |
| 4.5 | Org chart | `GET /org-chart` (managerId se tree) | `OrgChartPage.jsx` (tree, zoom) | Reporting lines sahi | ☐ |
| 4.6 | Manager ki team view | `GET /teams/my` | `MyTeamPage.jsx` | Manager ko apni team | ☐ |
| 4.7 | Employee apni reporting line dekhe | org-chart mein highlight | Org chart par "Me" | Employee ko apni line nazar aaye | ☐ |

## 8. M3 — Employee Management

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 3.1 | Employee model + encryption | `employee.model.js`, `utils/crypto.js` (CNIC, bank AES encrypt) | — | DB mein CNIC encrypted | ☑ |
| 3.2 | Employee add + user account | `POST /employees` (employee.create): employee + user + welcome email | `EmployeeFormPage.jsx` (steps: Personal, Contact & Emergency, Job, Bank, Documents) | Naye employee ko email | ☑ |
| 3.3 | CNIC validation + expiry | Zod: 13 digits; cnicExpiry field | Masked input `xxxxx-xxxxxxx-x` | Ghalat CNIC reject | ☑ |
| 3.4 | Employee list, search, filters | `GET /employees` (scoped; filter department, status, designation) | `EmployeeListPage.jsx` (DataTable) | Manager ko sirf team | ☑ |
| 3.5 | Profile view | `GET /employees/:id` (fieldFilter) | `EmployeeProfilePage.jsx` (tabs: Overview, Documents, Attendance, Leaves, Payslips, History, Assets) | Tabs mein sahi data | ☑ |
| 3.6 | Edit | `PATCH /employees/:id` (employee.edit) | Same form edit mode | Audit log mein tabdeeli | ☑ |
| 3.7 | Status (active, notice, resigned, terminated) | `PATCH /employees/:id/status` | Status dropdown + reason | Terminated ka login band | ☑ |
| 3.8 | Archive (soft delete) | `DELETE /employees/:id` → isDeleted | Archive button + confirm | List se hate, DB mein rahe | ☑ |
| 3.9 | Document vault | `POST/DELETE /employees/:id/documents` (type: CNIC, degree, contract, NDA) | `DocumentList.jsx` + upload | Private link expire ho | ☑ |
| 3.10 | Job history (promotion, transfer) | `employeeHistory.model.js`, `POST /employees/:id/history` | History tab timeline | Promotion darj ho | ☑ |
| 3.11 | Salary history | salaryStructures se (M9) | History tab mein salary changes | Sirf permission walon ko | ☑ |
| 3.12 | Skills aur tech stack | employee.skills[] | Tags input | Skill se search ho | ☑ |
| 3.13 | Excel bulk import | `POST /employees/import` (ExcelJS, row-wise errors) | `EmployeeImportPage.jsx` (template download, preview, errors) | 50 rows import, ghalat rows ki report | ☑ |
| 3.14 | Excel export | `GET /employees/export` (report.export) | Export button | File khule | ☑ |
| 3.15 | My Profile | `GET /employees/me` | `MyProfilePage.jsx` | Employee apni profile dekhe | ☑ |
| 3.16 | Profile edit request (sensitive fields) | `profileChangeRequest.model.js`, `POST /employees/me/change-request`, `PATCH /change-requests/:id/decide` | My Profile "Request change", `ChangeRequestsPage.jsx` (HR) | Approve par hi tabdeeli | ☑ |
| 3.17 | Probation end alert | `jobs/probation.job.js` | Notification | 7 din pehle HR ko alert | ☑ |

## 9. M8 — Notifications & Announcements

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 8.1 | Notify service | `services/notify.service.js` (save + Socket.io + email/WhatsApp job) | — | Aik call se teeno channels | ☐ |
| 8.2 | In-app bell | `GET /notifications`, `PATCH /:id/read`, `PATCH /read-all` | `NotificationBell.jsx` (unread ginti, dropdown), `NotificationsPage.jsx` | Live aaye, click par page khule | ☐ |
| 8.3 | Email notifications | email job + templates (2.9) | — | Leave approve par email | ☐ |
| 8.4 | WhatsApp notifications | `services/whatsapp.service.js` (Cloud API) | — | Test number par message | ☐ |
| 8.5 | Notification preferences | user.notificationPrefs | `NotificationSettingsPage.jsx` (har type ke liye app/email/WhatsApp) | Band channel par na aaye | ☐ |
| 8.6 | Announcements (company/department) | `announcement.model.js`, CRUD `/announcements` (announce.company / announce.team) | `AnnouncementsPage.jsx`, `AnnouncementForm.jsx` | Sirf chuna hua audience dekhe | ☐ |
| 8.7 | Notice board + pin | announcement.pinned | Dashboard par pinned cards | Pinned upar | ☐ |
| 8.8 | Read receipts | `PATCH /announcements/:id/read`, readBy[] | "Seen by 23/40" | Ginti sahi | ☐ |

## 10. M5 — Attendance & Shifts

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 5.1 | Attendance model | `attendance.model.js` (unique employeeId + date) | — | Aik din ki do entries na banein | ☐ |
| 5.2 | Shift assign | employee.shiftId, `PATCH /employees/:id/shift` | Employee form / bulk assign | Sahi shift timings | ☐ |
| 5.3 | Web check-in | `POST /attendance/check-in` (attendance.mark) | `MyAttendancePage.jsx` + `CheckInButton.jsx` | Waqt aur method save | ☐ |
| 5.4 | Check-out | `POST /attendance/check-out` | Same button "Check Out" | Kul ghante | ☐ |
| 5.5 | Break tracking | `POST /attendance/break-start`, `/break-end` | Break button | Break minutes katein | ☐ |
| 5.6 | Late / early leave / half day | service: shift + lateRules (2.4) | Status badges | 20 min late = Late | ☐ |
| 5.7 | Overtime | check-out par shift se zyada minutes | Calendar mein OT | OT ghante sahi | ☐ |
| 5.8 | Work-from-home request | `wfhRequest.model.js`, `POST /attendance/wfh`, `PATCH /wfh/:id/decide` | WFH request form + manager approval list | Approved din WFH check-in | ☐ |
| 5.9 | Mahana calendar | `GET /attendance?employeeId=&month=` | `AttendanceCalendar.jsx` (rang: present, late, absent, leave, holiday) | Mahina sahi | ☐ |
| 5.10 | Team attendance | scoped list | `TeamAttendancePage.jsx` (aaj kaun aaya) | Manager ko team | ☐ |
| 5.11 | HR: sab dekhna/edit | `PATCH /attendance/:id` (attendance.edit) + reason | `AttendanceAdminPage.jsx` | Edit audit log mein | ☐ |
| 5.12 | Correction request | `attendanceCorrection.model.js`, `POST /attendance/corrections`, `PATCH /:id/decide` | `CorrectionForm.jsx`, `CorrectionsPage.jsx` | Approve par record badle | ☐ |
| 5.13 | Auto-absent | `jobs/autoAbsent.job.js` (raat ko; leave/holiday ho to woh) | — | Bina check-in = Absent | ☐ |
| 5.14 | Month lock | `POST /attendance/lock` (attendance.lock) | Lock button + confirm | Lock ke baad edit band | ☐ |
| 5.15 | Attendance report | `GET /reports/attendance` | Reports page (M7) | Excel sahi | ☐ |

## 11. M6 — Leave & Holidays

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 6.1 | Leave types | `leaveType.model.js`, CRUD `/leave-types` (annual, casual, sick, maternity, paternity, unpaid, comp-off) | `LeaveTypesPage.jsx` | Types ban jayein | ☐ |
| 6.2 | Salana quota + carry forward | `leaveBalance.model.js`, `jobs/yearlyLeave.job.js` | — | Naye saal balance + carry | ☐ |
| 6.3 | Leave apply | `POST /leaves` (balance, takrao, holidays, working days) | `MyLeavesPage.jsx` + `ApplyLeaveForm.jsx` | Zyada din par error | ☐ |
| 6.4 | Half-day leave | halfDay (first/second half) | Toggle | 0.5 din kate | ☐ |
| 6.5 | Sick leave attachment | requiresAttachment rule | File upload | Bina file reject | ☐ |
| 6.6 | Multi-level approval | `buildApprovalChain()` (Manager → HR → Super Admin over limit), delegation (26.14) | `LeaveApprovalsPage.jsx` | Teen level chalein | ☐ |
| 6.7 | Approve/reject + reason | `PATCH /leaves/:id/decide` | Approve/Reject dialog | Reject reason employee ko | ☐ |
| 6.8 | Cancel | `PATCH /leaves/:id/cancel` (pending; approved par balance wapas) | Cancel button | Balance wapas | ☐ |
| 6.9 | Balance | `GET /leaves/balance` | Balance cards | Sahi ginti | ☐ |
| 6.10 | Team leave calendar | `GET /leaves/calendar` | `TeamLeaveCalendarPage.jsx` (react-big-calendar) | Takrao nazar aaye | ☐ |
| 6.11 | Holiday calendar | `holiday.model.js`, CRUD `/holidays`, Pakistan holidays seed | `HolidaysPage.jsx` | Eid tareekh edit | ☐ |
| 6.12 | Attendance se link | final approval par attendance = Leave | Calendar mein Leave | Absent na lage | ☐ |
| 6.13 | Leave encashment | `POST /leaves/encash` (year end), payroll earning | `EncashmentPage.jsx` (HR) | Payslip mein raqam | ☐ |
| 6.14 | HR balance override | `PATCH /leave-balances/:id` + reason | Balance edit dialog | Audit log | ☐ |
| 6.15 | Leave report | `GET /reports/leaves` | Reports page | Excel sahi | ☐ |

## 12. M9 — Payroll (Pakistan Compliance Samait)

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 9.1 | Salary structure | `salaryStructure.model.js` (basic, house rent, medical, conveyance, others), CRUD `/salary-structures` (payroll.manage); paisa integers | `SalaryStructuresPage.jsx`, `SalaryForm.jsx` | Total sahi | ☐ |
| 9.2 | Increment / revision (effective date) | naya structure effectiveFrom; purana history | "Revise Salary" dialog | Beech mahine increment ka hisaab | ☐ |
| 9.3 | Earnings | overtime (M5), bonus, arrears, commission, encashment (6.13) | Slip edit mein earnings | Har earning slip mein | ☐ |
| 9.4 | Deductions | unpaid leave, late penalty, loan (M10), advance | Slip mein deductions | Sahi katoti | ☐ |
| 9.5 | Income tax (FBR slabs) | `utils/taxCalculator.js` (salana taxable / 12, tax year July–June) | — | Unit test: har slab | ☐ |
| 9.6 | EOBI, PESSI, PF, gratuity | `utils/contributions.js` (settings 2.7 se, optional on/off) | — | Unit test | ☐ |
| 9.7 | Payroll generate | `POST /payroll/runs` → BullMQ job, `payroll:progress` socket | `PayrollRunsPage.jsx` + progress bar | 100 employees ka run | ☐ |
| 9.8 | Draft → review → approve → paid | `PATCH /runs/:id/approve` (payroll.approve), `/mark-paid` | `PayrollRunDetailPage.jsx` (status steps) | Approve se pehle release na ho | ☐ |
| 9.9 | Slip theek karna/regenerate | `PATCH /runs/:id/payslips/:slipId`, `POST .../regenerate` | Slip edit drawer | Sirf draft mein | ☐ |
| 9.10 | Payslip PDF (branding) | `pdf.service.js` (logo, company, breakdown) | PDF preview/download | PDF sahi | ☐ |
| 9.11 | Slip delivery: portal, email, WhatsApp | approve par notify job | `MyPayslipsPage.jsx` | Teeno jagah slip | ☐ |
| 9.12 | Bank transfer sheet | `GET /runs/:id/bank-sheet?bank=` (ExcelJS, bank formats) | Download dropdown | Bank format sahi | ☐ |
| 9.13 | Final settlement | `POST /payroll/final-settlement/:employeeId` (bache din, leave encash, loan baqaya) | `FinalSettlementPage.jsx` | M18 exit se jude | ☐ |
| 9.14 | Salana tax certificate | `GET /payslips/tax-certificate?year=` | My Payslips → Tax Certificate | PDF mein saal ka tax | ☐ |
| 9.15 | Withholding aur EOBI reports | `GET /reports/tax`, `/reports/eobi` | Reports page | Totals runs se milein | ☐ |
| 9.16 | Manager: team overtime (salary nahi) | `GET /payroll/team-overtime` | Team page par OT ghante | Salary na dikhe | ☐ |
| 9.17 | Payroll cost report | `GET /reports/payroll-cost` (department wise) | Reports + Admin dashboard | Totals sahi | ☐ |

**Mukammal tab:** 5 test employees ka poora mahina manual Excel se match ho.

## 13. M7 — Dashboard & Reports

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 7.1 | Admin dashboard | `GET /dashboard` (role: admin) aggregation | `DashboardPage.jsx` → `AdminDashboard.jsx` | Numbers DB se milein | ☐ |
| 7.2 | HR dashboard | role: hr | `HrDashboard.jsx` | Pending approvals sahi | ☐ |
| 7.3 | Manager dashboard | role: manager (scoped) | `ManagerDashboard.jsx` | Sirf team | ☐ |
| 7.4 | Employee dashboard | role: employee | `EmployeeDashboard.jsx` (attendance, balance, aakhri slip, tasks) | Apna data | ☐ |
| 7.5 | Widgets: headcount, aaj ki attendance, pending approvals, birthdays, open positions, payroll cost | har widget ki aggregation | `StatCard.jsx`, `AttendanceChart.jsx`, `PendingList.jsx`, `BirthdaysCard.jsx` | Har widget | ☐ |
| 7.6 | Reports: attendance, leave, payroll, headcount, turnover, department cost | `GET /reports/:type` | `ReportsPage.jsx` | Har report | ☐ |
| 7.7 | Filters | from, to, departmentId, employeeId | Filter bar | Filter ke mutabiq data | ☐ |
| 7.8 | Export Excel/PDF | `?format=xlsx` ya `pdf` (report.export) | Export buttons | File khule | ☐ |

## 14. X1 — Security, Audit & Quality (Phase 1 ka aakhri check)

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| X1.1 | Audit log screen | `GET /audit-logs` (audit.view, filters) | `AuditLogsPage.jsx` (before/after diff) | Har tabdeeli nazar aaye | ☐ |
| X1.2 | Soft delete aur finalized payroll lock | sab models isDeleted; paid run delete band | — | Paid run delete na ho | ☐ |
| X1.3 | Encryption at rest | CNIC, bank, salary fields encrypted | — | DB mein parhne ke qabil na ho | ☐ |
| X1.4 | Server par har API ka permission | har route mein checkPermission | — | Har route ka 403 test | ☐ |
| X1.5 | Rate limit, sanitize, XSS | middlewares | React escape (dangerouslySetInnerHTML nahi) | Script input na chale | ☐ |
| X1.6 | Private files | signed, expire hone wale links | — | Purana link band | ☐ |
| X1.7 | Backups + restore test | 2.10 + restore script | — | Restore kar ke data check | ☐ |
| X1.8 | Performance | indexes, pagination, lean queries | Lazy loading pages | 500 employees par page < 3 sec | ☐ |
| X1.9 | Responsive | — | Har page mobile/tablet par | Phone par check-in aur leave | ☐ |
| X1.10 | Tests | Vitest (calculations), Supertest (APIs) | Playwright (login, leave, check-in, payroll) | CI green | ☐ |

## 15. M10 — Loans & Advances

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 10.1 | Loan/advance request | `loan.model.js`, `POST /loans` (amount, reason, installments) | `MyLoansPage.jsx` + form | Request ban jaye | ☐ |
| 10.2 | Had (limit) | policy: jaise 1 mahine ki salary; role limit (26.9) | Form mein max | Had se zyada reject | ☐ |
| 10.3 | Approval chain | Manager recommend → HR → Super Admin | `LoanApprovalsPage.jsx` | Chain chale | ☐ |
| 10.4 | Qiston ka plan | `GET /loans/:id/schedule` | Schedule table | Qistein sahi | ☐ |
| 10.5 | Payroll mein auto katoti | payroll service (9.4) | Slip mein "Loan" | Balance kam ho | ☐ |
| 10.6 | Baqaya aur jaldi wapsi | `POST /loans/:id/prepay` | Balance + "Pay early" (HR) | Zero par Closed | ☐ |

## 16. M11 — Expense Claims

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 11.1 | Categories aur limits | `expenseCategory.model.js`, CRUD (expense.settings) | `ExpenseCategoriesPage.jsx` | Limit set | ☐ |
| 11.2 | Claim + raseed | `expense.model.js`, `POST /expenses` (upload) | `MyExpensesPage.jsx`, `ExpenseForm.jsx` | Bina raseed reject | ☐ |
| 11.3 | Approval chain | `PATCH /expenses/:id/decide` (limit check) | `ExpenseApprovalsPage.jsx` | Bari raqam Super Admin tak | ☐ |
| 11.4 | Reimbursement (payroll ya alag) | `PATCH /expenses/:id/reimburse` (method) | HR "Mark reimbursed" | Payroll mein earning | ☐ |
| 11.5 | Mahana expense report | `GET /reports/expenses` | Reports page | Totals sahi | ☐ |

## 17. M14 — GPS / Geo-fencing

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 14.1 | Haversine faasla | `utils/haversine.js` | — | Unit test (do known points) | ☐ |
| 14.2 | Location ke saath check-in | check-in mein lat, lng, accuracy; geoFences (2.8) se check | `useGeolocation.js` → check-in ke saath bhejna | Fence se bahar reject | ☐ |
| 14.3 | Accuracy / fake-GPS check | accuracy > had, mock location ishare → flagged | Location na mile to message | Kam accuracy flagged | ☐ |
| 14.4 | WFH approved locations | `wfhLocation.model.js`, CRUD + approve | `WfhLocationsPage.jsx` (map par pin) | Approved ghar se check-in | ☐ |
| 14.5 | Client-site check-in (sales) | role/permission `attendance.fieldCheckIn` + note | "Client visit" option | Field staff ko ijazat | ☐ |
| 14.6 | Flagged punches review | `GET /attendance/flagged`, `PATCH /:id/review` | `FlaggedPunchesPage.jsx` | Approve/reject | ☐ |
| 14.7 | Punch map | `GET /attendance/locations?date=` (scoped) | `PunchMap.jsx` (Leaflet) | Manager ko sirf check-in point | ☐ |
| 14.8 | Privacy | location sirf punch par; koi live tracking API nahi | Attendance policy notice | Background location na li jaye | ☐ |

## 18. M13 — QR Code Attendance

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 13.1 | Kiosk devices | `kiosk.model.js` (naam, type entry/exit, secret), CRUD (attendance.kiosk.manage) | `KiosksPage.jsx` | Kiosk register | ☐ |
| 13.2 | Dynamic QR | `GET /attendance/qr/current` (signed token, interval settings se) | `KioskQrPage.jsx` (khud refresh) | Har 30 sec naya | ☐ |
| 13.3 | Scan se check-in | check-in: token signature + expiry + kiosk type | `QrScanner.jsx` (html5-qrcode) | Purana screenshot reject | ☐ |
| 13.4 | Device binding | user.deviceId; pehli scan par bind | — | Doosre phone se reject | ☐ |
| 13.5 | Binding reset | `POST /users/:id/reset-device` (HR) | Users page button | Naya phone bind ho | ☐ |
| 13.6 | On/off aur interval | settings `qrAttendance` (Super Admin) | Settings tab | Off par QR option chhup jaye | ☐ |

## 19. M12 — Face Recognition Attendance

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 12.1 | Models load | — | `public/models/`, `useFaceApi.js` | Models load hon | ☐ |
| 12.2 | Enrollment (3–5 photos) | `POST /attendance/face/enroll` (descriptors save, status pending) | `FaceEnrollPage.jsx` | Descriptors save | ☐ |
| 12.3 | HR approval / re-enroll | `PATCH /face/:userId/approve`, `DELETE /face/:userId` | `FaceEnrollmentsPage.jsx` | Approve ke baad hi istemal | ☐ |
| 12.4 | Liveness check | — | `FaceCheckIn.jsx`: aankh jhapakna detect | Photo dikhane par fail | ☐ |
| 12.5 | Face se check-in | check-in: descriptor distance < threshold, snapshot save | Camera + check-in | Sahi chehra pass, ghalat fail | ☐ |
| 12.6 | Threshold aur on/off | settings `faceAttendance` (Super Admin) | Settings tab | Threshold badle | ☐ |
| 12.7 | Nakam/mashkook koshishein | failed attempts log, flagged | `FlaggedPunchesPage.jsx` mein photo | HR ko nazar aaye | ☐ |
| 12.8 | Fallback manual request | nakami par correction request (5.12) | "Request manual attendance" | Request bane | ☐ |
| 12.9 | Manager: flagged snapshots | scoped | Team page par flagged | Sirf team | ☐ |

## 20. M23 — Asset Management

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 23.1 | Asset register | `asset.model.js`, CRUD `/assets` (tag, type, serial, license) | `AssetsPage.jsx`, `AssetForm.jsx` | Asset bane | ☐ |
| 23.2 | Assign / return + history | `POST /assets/:id/assign`, `/return`, history[] | `AssetDetailPage.jsx` | History sahi | ☐ |
| 23.3 | Warranty / license alerts | `jobs/assetExpiry.job.js` | Notification | 30 din pehle alert | ☐ |
| 23.4 | Kharabi / marammat | `POST /assets/:id/repairs` | Repair log | Record bane | ☐ |
| 23.5 | Manager request | `assetRequest.model.js`, `POST /asset-requests` | Request form + HR list | Request se assign | ☐ |
| 23.6 | Employee: mere assets + issue | `GET /assets/my`, `POST /assets/:id/issue` | `MyAssetsPage.jsx` | Issue HR tak | ☐ |

## 21. M18 — Onboarding & Offboarding

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 18.1 | Checklist templates | `checklistTemplate.model.js`, CRUD (onboard.manage) | `ChecklistTemplatesPage.jsx` | Template bane | ☐ |
| 18.2 | Onboarding auto checklist | employee create (3.2) par template se checklist | `OnboardingPage.jsx` | Naye employee ki list | ☐ |
| 18.3 | Task owner aur due date | tasks[{ownerId, dueDate, done}], overdue alert | `MyTasksPage.jsx` | Owner ko notification | ☐ |
| 18.4 | Welcome email | template 2.9 | — | Email jaye | ☐ |
| 18.5 | Resignation submit | `resignation.model.js`, `POST /resignations` | `ResignationPage.jsx` | Request bane | ☐ |
| 18.6 | Accept + notice period | `PATCH /resignations/:id/decide` (manager; senior par Super Admin) | Approval list | lastWorkingDay set | ☐ |
| 18.7 | Exit checklist | offboarding template (assets 23.2 return, access band, handover) | `OffboardingPage.jsx` | Asset wapsi ke baghair close na ho | ☐ |
| 18.8 | Exit interview | `exitInterview.model.js` | `ExitInterviewForm.jsx` | Form save | ☐ |
| 18.9 | Final settlement | 9.13 | Link | Settlement ho | ☐ |
| 18.10 | Experience / relieving letter | `GET /employees/:id/letters/:type` (PDF) | Download buttons | PDF sahi | ☐ |
| 18.11 | Aakhri din account band | `jobs/deactivate.job.js` | — | Agle din login fail | ☐ |

## 22. M19 — Performance & Appraisal

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 19.1 | KPI templates (designation wise) | `kpiTemplate.model.js`, CRUD | `KpiTemplatesPage.jsx` | Template bane | ☐ |
| 19.2 | Review cycles (quarterly/annual) | `reviewCycle.model.js`, `POST /review-cycles` (sab ke reviews bana de) | `ReviewCyclesPage.jsx` | Cycle se reviews banein | ☐ |
| 19.3 | Goals / OKRs | review.goals[], `PATCH /reviews/:id/goals` | `GoalsEditor.jsx` | Goals save | ☐ |
| 19.4 | Self review | `PATCH /reviews/:id/self` | `MyReviewPage.jsx` | Deadline ke baad band | ☐ |
| 19.5 | Manager review + rating | `PATCH /reviews/:id/manager` | `TeamReviewsPage.jsx` | Sirf apni team | ☐ |
| 19.6 | 360° peer feedback (optional) | `POST /reviews/:id/peer` | Peer request + form | Peers ki raye | ☐ |
| 19.7 | Final + increment/promotion sifarish | `PATCH /reviews/:id/finalize` → salary revision draft (9.2) | Finalize dialog | Payroll mein draft increment | ☐ |
| 19.8 | Performance history | `GET /employees/:id/reviews` | Profile tab | Purane cycles | ☐ |
| 19.9 | Completion tracking | `GET /review-cycles/:id/progress` | Progress bar | Pending list | ☐ |

## 23. M22 — Projects & Timesheets

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 22.1 | Clients aur projects | `client.model.js`, `project.model.js`, CRUD | `ProjectsPage.jsx` | Project bane | ☐ |
| 22.2 | Members assign | project.members[] | Members picker | Sirf members ghante dalein | ☐ |
| 22.3 | Timesheet entry | `timesheet.model.js`, `POST /timesheets` (date, project, task, hours, billable) | `MyTimesheetPage.jsx` (hafte ka grid) | 24 ghante se zyada reject | ☐ |
| 22.4 | Submit + approve | `PATCH /timesheets/submit`, `/:id/decide` | `TimesheetApprovalsPage.jsx` | Approve ke baad lock | ☐ |
| 22.5 | Utilization report | `GET /reports/utilization` | Report + chart | Billable % sahi | ☐ |
| 22.6 | Project cost / profitability | ghante × hourly cost (salary se) | Admin report | Sirf Super Admin | ☐ |
| 22.7 | HR compliance | `GET /timesheets/missing` | Missing list | Jinhon ne nahi bhari | ☐ |

## 24. M15 — Recruitment & AI Screening

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 15.1 | Job requisition | `requisition.model.js`, `POST /requisitions` (manager) | `RequisitionForm.jsx` | Request bane | ☐ |
| 15.2 | Position approval | `PATCH /requisitions/:id/decide` (Super Admin) | Approvals list | Approve par job draft | ☐ |
| 15.3 | Job post + careers page | `job.model.js`, CRUD, `GET /public/jobs` | `JobsPage.jsx`, `CareersPublicPage.jsx` (bina login) | Public link khule | ☐ |
| 15.4 | Application form + CV | `candidate.model.js`, `POST /public/jobs/:id/apply` (rate limit, file check) | `ApplyPage.jsx` | Application save | ☐ |
| 15.5 | AI CV parsing | `services/ai.service.js`: CV text → skills, tajurba, taleem (JSON) | Parsed details card | Fields sahi | ☐ |
| 15.6 | AI match score + wajah | `POST /candidates/:id/screen` | Score badge + reason | Score aur wajah | ☐ |
| 15.7 | Pipeline board | `PATCH /candidates/:id/stage` | `CandidatePipelinePage.jsx` (Kanban drag) | Stage badle | ☐ |
| 15.8 | Interview schedule + feedback | `POST /candidates/:id/interviews`, `PATCH /interviews/:id/feedback` | `InterviewScheduler.jsx`, `FeedbackForm.jsx` | Interviewer ko notification | ☐ |
| 15.9 | Technical test link | candidate.testLink, email | "Send test" button | Email jaye | ☐ |
| 15.10 | Offer letter | `POST /candidates/:id/offer` (PDF + email) | Offer dialog | PDF sahi | ☐ |
| 15.11 | Hire → employee | `POST /candidates/:id/hire` → 3.2 + 18.2 | "Convert to Employee" | Employee + checklist bane | ☐ |
| 15.12 | Andarooni jobs + referral | `GET /jobs/internal`, `POST /referrals` | `InternalJobsPage.jsx` | Referral darj | ☐ |
| 15.13 | Insani faisla lazmi | AI sirf score de, stage HR badle | — | Auto reject na ho | ☐ |

## 25. M16 — HR Chatbot

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 16.1 | Policy documents | `policyDoc.model.js`, upload + text extract (HR) | `PolicyDocsPage.jsx` | Doc upload | ☐ |
| 16.2 | Chat API | `POST /chatbot/ask` (AI + tools) | `ChatbotWidget.jsx` | Jawab aaye | ☐ |
| 16.3 | Policy sawal | tool `searchPolicy` | — | Handbook se jawab | ☐ |
| 16.4 | Zaati sawal | tools `getMyLeaveBalance`, `getMyLastPayslip`, `getNextPayDate` (sirf req.user) | — | Doosre ka data na de | ☐ |
| 16.5 | Quick actions | tool `applyLeave` (confirm ke baad), `downloadSlip` | Action buttons in chat | Leave apply ho | ☐ |
| 16.6 | HR ko hand-off | jawab na ho to `unanswered.model.js` + HR notify | "Ask HR" button | HR list mein | ☐ |
| 16.7 | English + Roman Urdu | system prompt | — | Roman Urdu sawal ka jawab | ☐ |
| 16.8 | Chat history | `chatMessage.model.js` | Widget history | Purani chat | ☐ |
| 16.9 | On/off + data limits | settings `chatbot` (Super Admin) | Settings tab | Off par widget gayab | ☐ |

## 26. M17 — Attrition Prediction

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 17.1 | Weekly risk score | `jobs/attritionScore.job.js`, `attritionScore.model.js` (absences, late, increment ka waqt, appraisal, surveys) | — | Score bane | ☐ |
| 17.2 | Risk levels + wajuhaat | score → Low/Medium/High, top factors | `AttritionDashboardPage.jsx` | Wajuhaat dikhein | ☐ |
| 17.3 | Department trends | `GET /analytics/attrition/departments` | Chart | Trend sahi | ☐ |
| 17.4 | Retention tajweezein + action notes | suggestions rules, `POST /attrition/:id/notes` | Notes panel | Note save | ☐ |
| 17.5 | Scope aur khufia | manager = team, employee = koi rasai nahi | Menu chhupa | Employee ko 403 | ☐ |

## 27. M20 — Rewards, Celebrations & Surveys

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 20.1 | Employee of the Month: nomination + voting | `award.model.js`, `POST /awards/:id/nominate`, `/vote` | `AwardsPage.jsx` | Aik vote per user | ☐ |
| 20.2 | Appreciation posts + badges | `appreciation.model.js` | `AppreciationWall.jsx` | Post dikhe | ☐ |
| 20.3 | Birthday / anniversary wall + auto wishes | `jobs/celebrations.job.js` | `CelebrationsWall.jsx` | Subah wish jaye | ☐ |
| 20.4 | Surveys aur polls | `survey.model.js`, `surveyResponse.model.js`, `POST /surveys/:id/respond` | `SurveysPage.jsx`, `SurveyForm.jsx` | Aik jawab per user | ☐ |
| 20.5 | Survey results | `GET /surveys/:id/results` | `SurveyResultsPage.jsx` (charts) | Charts sahi | ☐ |

## 28. M21 — Anonymous Feedback & Grievance

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 21.1 | Gumnaam mashwara | `feedback.model.js` (isAnonymous → userId save nahi, trackingCode) | `SubmitFeedbackPage.jsx` | DB mein user ka nishan na ho | ☐ |
| 21.2 | Baqaida shikayat + case tracking | category, status, caseNotes[] | `GrievanceAdminPage.jsx` | Status badle | ☐ |
| 21.3 | Harassment → sirf committee | permission `grievance.committee` | Committee ka alag view | HR/manager ko na dikhe | ☐ |
| 21.4 | Gumnaam status update | `GET /feedback/track/:code` | `TrackFeedbackPage.jsx` | Code se status | ☐ |
| 21.5 | Escalation | `PATCH /feedback/:id/escalate` → Super Admin | Escalate button | Super Admin ko nazar aaye | ☐ |
| 21.6 | Manager apni team ki shikayat na dekhe | scope rule | — | Manager ko 403 | ☐ |

## 29. M24 — Internal Chat

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 24.1 | One-to-one chat | `conversation.model.js`, `message.model.js`, socket `chat:message` | `ChatPage.jsx` | Live message | ☐ |
| 24.2 | Group chat | `POST /conversations` (group) | New group dialog | Group mein sab ko | ☐ |
| 24.3 | Department channels auto | department/employee change par member update | Channels list | Naya employee channel mein | ☐ |
| 24.4 | File sharing | upload (0.6) | Attach button | File khule | ☐ |
| 24.5 | Online status + read | socket `presence`, `chat:read` | Green dot, ticks | Status sahi | ☐ |
| 24.6 | Message search | `GET /messages/search?q=` | Search box | Purana message mile | ☐ |
| 24.7 | Admin: channel band/archive | `PATCH /conversations/:id/archive` | Admin menu | Archived mein message band | ☐ |

## 30. M25 — Training & Learning

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| 25.1 | Training catalog | `training.model.js`, CRUD | `TrainingsPage.jsx` | Training bane | ☐ |
| 25.2 | Budget approval | training.cost, `PATCH /trainings/:id/approve` (Super Admin) | Approve button | Approve ke baad enroll | ☐ |
| 25.3 | Enroll + nominate | `POST /trainings/:id/enroll`, `/nominate` (manager) | Enroll button, nominate dialog | Enrollment bane | ☐ |
| 25.4 | Haziri aur completion | `PATCH /enrollments/:id` | Attendance tick | Complete mark | ☐ |
| 25.5 | Certificates upload | enrollment.certificateUrl | `MyLearningPage.jsx` | File khule | ☐ |
| 25.6 | Skill matrix | employee.skills + levels | `SkillMatrixPage.jsx` | Skill gaps nazar aayein | ☐ |
| 25.7 | Training cost report | `GET /reports/training-cost` | Reports page | Totals sahi | ☐ |

## 31. X2 — Urdu, PWA, Theme aur Final Polish

| ID | Feature | Backend | Frontend | Test | ☐ |
| --- | --- | --- | --- | --- | --- |
| X2.1 | Urdu labels + RTL | user.language | i18next, `locales/en.json`, `ur.json`, `dir="rtl"` | Urdu mein layout theek | ☐ |
| X2.2 | Pakistani formats | dates UTC save, Asia/Karachi | `utils/format.js` (PKR, DD/MM/YYYY, +92) | Har jagah same format | ☐ |
| X2.3 | PWA install | — | vite-plugin-pwa, icons, manifest | Phone par install | ☐ |
| X2.4 | Light / dark mode | user.theme | Tailwind dark mode toggle | Dono mein parhne layak | ☐ |
| X2.5 | Accessibility | — | labels, keyboard navigation, focus | Sirf keyboard se form bhar sakein | ☐ |
| X2.6 | Final security review | dependencies audit (`npm audit`), secrets check | — | Koi high issue nahi | ☐ |

## 32. Koi Feature Miss na Ho — Aakhri Checklist

Har module "done" tab hai jab:

1. Us module ki table ki har row ☑ ho.
2. Har API Postman/Swagger mein teen tarah test ho: sahi data, ghalat data (400), bina permission (403).
3. Chaaron roles (Super Admin, HR Manager, Department Manager, Employee) se login kar ke screen check ho.
4. Har create/edit/delete audit log mein nazar aaye.
5. Mobile screen par page theek dikhe.
6. Client ne staging par dekh kar manzoori di ho.

**Coverage**

| Module | Features (slices) |
| --- | --- |
| M0 — Foundation | 14 |
| M1 — Authentication | 14 |
| M26 — Roles & Permissions | 17 |
| M2 — Company Settings | 11 |
| M4 — Departments, Designations, Shifts & Org Chart | 7 |
| M3 — Employee Management | 17 |
| M8 — Notifications & Announcements | 8 |
| M5 — Attendance & Shifts | 15 |
| M6 — Leave & Holidays | 15 |
| M9 — Payroll (Pakistan Compliance Samait) | 17 |
| M7 — Dashboard & Reports | 8 |
| X1 — Security, Audit & Quality (Phase 1 ka aakhri check) | 10 |
| M10 — Loans & Advances | 6 |
| M11 — Expense Claims | 5 |
| M14 — GPS / Geo-fencing | 8 |
| M13 — QR Code Attendance | 6 |
| M12 — Face Recognition Attendance | 9 |
| M23 — Asset Management | 6 |
| M18 — Onboarding & Offboarding | 11 |
| M19 — Performance & Appraisal | 9 |
| M22 — Projects & Timesheets | 7 |
| M15 — Recruitment & AI Screening | 13 |
| M16 — HR Chatbot | 9 |
| M17 — Attrition Prediction | 5 |
| M20 — Rewards, Celebrations & Surveys | 5 |
| M21 — Anonymous Feedback & Grievance | 6 |
| M24 — Internal Chat | 7 |
| M25 — Training & Learning | 7 |
| X2 — Urdu, PWA, Theme aur Final Polish | 6 |
| **Kul** | **278** |

Ye tables Functional Requirements document ke har feature ko cover karti hain. 100% perfection ka asal raaz yehi hai ke koi row ☑ tabhi ho jab uska Test khana sach mein pass ho jaye.
