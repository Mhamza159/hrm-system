# HRM System — Module-wise Breakdown (Frontend + Backend)

Version 1.0 · 7 October 2026 · JavaScript (MERN)

Ye document poore project ko alag alag modules mein todta hai. Har module ka apna backend, apna frontend aur apna flow hai, taake aap aik waqt mein sirf aik module par kaam karein, use mukammal karein, test karein, phir agle par jayein.

## 1. Ye Document Kaise Parhein

Har module isi tarteeb mein likha gaya hai:

- **Maqsad:** module kya karta hai.
- **Pehle ye modules:** kaun se modules is se pehle bane hone chahiyein.
- **Backend:** MongoDB models, APIs (endpoints) aur service functions.
- **Frontend:** pages (screens), components aur API hooks.
- **Flow:** user kya karta hai aur system andar kya karta hai, qadam ba qadam.
- **Mukammal tab:** wo checklist jis ke baad module "done" mana jayega.

**Aik module ki files ka hamesha yehi dhancha hoga**

Backend mein `backend/src/modules/<module>/` ke andar:

| File | Kaam |
| --- | --- |
| `<module>.model.js` | MongoDB schema (data ki shakal) |
| `<module>.validation.js` | Zod se request check (ghalat data andar na aaye) |
| `<module>.service.js` | Asal business logic aur database queries |
| `<module>.controller.js` | Request leta hai, service ko call karta hai, response bhejta hai |
| `<module>.routes.js` | URL, middleware (authenticate, validate, checkPermission) aur controller ko jodta hai |

Frontend mein `frontend/src/features/<module>/` ke andar:

| File / Folder | Kaam |
| --- | --- |
| `<module>Api.js` | RTK Query hooks (backend APIs call karne ke liye) |
| `pages/` | Poori screens (jaise EmployeeListPage.jsx) |
| `components/` | Is module ke chhote hisse (forms, tables, cards) |

**Aik request ka safar (har module mein same)**

1. User page par button dabata hai (React component).
2. RTK Query hook backend API call karta hai.
3. Route par middleware chalte hain: authenticate → validate → checkPermission.
4. Controller service ko call karta hai.
5. Service database se kaam karti hai aur audit log likhti hai.
6. Response wapas aata hai, hook data update karta hai, screen badal jati hai.

## 2. Modules Banane ki Tarteeb

Isi tarteeb se banayein, kyunke har module pichle modules par khara hai.

| Step | Module | Kyun is waqt |
| --- | --- | --- |
| 0 | M0 Project Foundation | Sab kuch isi par chalega |
| 1 | M1 Authentication | Login ke baghair kuch nahi chalta |
| 2 | M26 Roles & Permissions | Har API ko permission check chahiye |
| 3 | M2 Company Settings | Timings, policies, tax settings baqi modules use karte hain |
| 4 | M4 Departments & Org | Employee ko department chahiye |
| 5 | M3 Employee Management | Attendance, leave, payroll sab employee par hain |
| 6 | M8 Notifications | Approvals ke liye notifications chahiye |
| 7 | M5 Attendance & Shifts | Payroll attendance se banta hai |
| 8 | M6 Leave & Holidays | Payroll aur attendance leave se judi hain |
| 9 | M9 Payroll | Attendance aur leave ke baad |
| 10 | M7 Dashboard & Reports | Sab data aa jane ke baad |
| 11 | M10, M11 Loans & Expenses | Payroll se judte hain |
| 12 | M14, M13, M12 Smart Attendance | M5 ke upar izafa |
| 13 | M18, M19 Onboarding & Performance | Employee aur payroll ke baad |
| 14 | M22, M23 Timesheets & Assets | Alag modules |
| 15 | M15, M16, M17 AI Modules | Data jama hone ke baad |
| 16 | M20, M21, M24, M25 Engagement | Aakhir mein |

## 3. M0 — Project Foundation (Common Setup)

**Maqsad:** wo bunyadi dhancha jo har module istemal karega. Ye koi feature nahi, magar sab se pehle banta hai.

**Backend (backend/src/)**

| File | Kaam |
| --- | --- |
| `server.js` | HTTP server aur Socket.io start karta hai |
| `app.js` | Express app, global middleware (helmet, cors, rate limit, json, cookie-parser, mongo-sanitize), routes jodna |
| `config/db.js` | MongoDB connection |
| `config/env.js` | .env variables parhna aur check karna |
| `middlewares/errorHandler.js` | Tamam errors ko aik jaisa JSON bana kar bhejna |
| `middlewares/validate.js` | Zod schema se request check |
| `middlewares/upload.js` | Multer file upload |
| `utils/ApiError.js` | Apna error class (status, message) |
| `utils/asyncHandler.js` | Async controllers ke errors pakarna |
| `utils/apiResponse.js` | `{ success, data, message, meta }` response |
| `utils/paginate.js` | page, limit, search, sort ka common function |
| `models/auditLog.model.js` + `services/audit.service.js` | Har tabdeeli ka record |
| `services/email.service.js`, `pdf.service.js`, `excel.service.js`, `storage.service.js` | Common services |

**Frontend (frontend/src/)**

| File | Kaam |
| --- | --- |
| `main.jsx` | App start, Redux Provider, Router |
| `app/store.js` | Redux store |
| `app/router.jsx` | Tamam routes aur ProtectedRoute |
| `lib/baseApi.js` | RTK Query base (token lagana, 401 par refresh) |
| `components/layout/AppLayout.jsx` | Sidebar + Topbar + page area |
| `components/layout/Sidebar.jsx` | Menu (permission ke hisaab se) |
| `components/ui/` | shadcn components (Button, Input, Dialog, Table, Badge) |
| `components/common/DataTable.jsx` | Search, sort, pagination wala common table |
| `components/common/PageHeader.jsx`, `ConfirmDialog.jsx`, `FileUpload.jsx`, `StatusBadge.jsx` | Baar baar istemal hone wale hisse |

**Mukammal tab**

- `npm run dev` se backend aur frontend dono chal jayein.
- `/api/v1/health` "ok" de.
- Khali layout (sidebar + topbar) browser mein nazar aaye.

## 4. Core HR Modules

### M1 — Authentication

**Maqsad:** login, logout, password reset aur 2FA.

**Pehle ye modules:** M0.

**Backend — Models**

- `user.model.js`: email, passwordHash, roles[], employeeId, isActive, failedAttempts, lockUntil, twoFactorEnabled, refreshTokenHash, lastLoginAt.
- `loginHistory.model.js`: userId, ip, device, at, success.

**Backend — APIs**

| Method | Endpoint | Kaam | Permission |
| --- | --- | --- | --- |
| POST | /auth/login | Login, tokens dena | Public |
| POST | /auth/verify-otp | 2FA code check | Public |
| POST | /auth/refresh | Naya access token | Refresh cookie |
| POST | /auth/logout | Logout, cookie saaf | Logged in |
| POST | /auth/forgot-password | Reset link/OTP email | Public |
| POST | /auth/reset-password | Naya password set | Public (token ke saath) |
| PATCH | /auth/change-password | Password badalna | Logged in |
| GET | /auth/me | User + permissions | Logged in |
| GET | /auth/login-history | Login record | Own / admin |

**Backend — Service functions:** login(), verifyOtp(), refreshToken(), logout(), forgotPassword(), resetPassword(), changePassword(), getMe().

**Backend — Middleware:** `middlewares/authenticate.js` (JWT check kar ke `req.user` set karta hai).

**Frontend — Pages**

| Page | Route | Kaun dekhega |
| --- | --- | --- |
| LoginPage.jsx | /login | Sab |
| OtpPage.jsx | /verify-otp | 2FA wale users |
| ForgotPasswordPage.jsx | /forgot-password | Sab |
| ResetPasswordPage.jsx | /reset-password/:token | Sab |
| ChangePasswordPage.jsx | /settings/password | Logged in |

**Frontend — Doosri files:** `authApi.js` (useLoginMutation, useMeQuery...), `authSlice.js` (user, token, permissions), `ProtectedRoute.jsx`, `useAuth.js` hook.

**Flow — Login**

1. User email aur password likh kar Login dabata hai.
2. Backend account check karta hai (active hai? lock to nahi?), bcrypt se password milata hai.
3. Sahi ho to access token (response mein) aur refresh token (cookie mein) milta hai.
4. Frontend `/auth/me` se user aur permissions leta hai aur dashboard par bhej deta hai.
5. 5 ghalat koshishon par account 15 minute ke liye lock.

**Mukammal tab**

- Login, logout, refresh, forgot/reset password kaam karein.
- Login ke baghair koi page na khule.
- Lock aur 2FA test ho jayein.

### M26 — Roles & Permissions

**Maqsad:** kaun kya kar sakta hai, ye tay karna (custom roles, scopes, field permissions).

**Pehle ye modules:** M1.

**Backend — Models**

- `role.model.js`: name, description, isSystem, permissions[{ action, subject, scope, fields[], limit }].
- `shared/permissions.js`: tamam permissions ki list (jaise `employee.view`, `leave.approve`, `payroll.run`).

**Backend — APIs**

| Method | Endpoint | Kaam | Permission |
| --- | --- | --- | --- |
| GET | /permissions | Permissions ki list | role.manage |
| GET, POST | /roles | Roles dekhna / banana | role.manage |
| GET, PATCH, DELETE | /roles/:id | Role dekhna / badalna / delete | role.manage |
| POST | /roles/:id/clone | Role ki copy | role.manage |
| PATCH | /users/:id/roles | User ko roles dena | role.assign |
| GET | /users/:id/effective-permissions | "View as user" | role.manage |
| POST | /delegations | Approvals kuch din ke liye dena | Own |

**Backend — Middleware:** `middlewares/checkPermission.js` (CASL ability bana kar check), `utils/scopeFilter.js` (own/team/department/all ke mutabiq query filter), `utils/fieldFilter.js` (chhupe fields hatana).

**Backend — Seed:** `seed/roles.seed.js` (4 default roles + Super Admin user).

**Frontend — Pages**

| Page | Route | Kaun dekhega |
| --- | --- | --- |
| RolesListPage.jsx | /roles | Super Admin |
| RoleFormPage.jsx | /roles/new, /roles/:id | Super Admin |
| UserRolesPage.jsx | /users | Super Admin, HR |

**Frontend — Doosri files:** `rolesApi.js`, `components/PermissionMatrix.jsx` (module x action checkboxes + scope dropdown), `lib/ability.js` (CASL), `hooks/usePermission.js`, `components/Can.jsx` (button/menu tabhi dikhe jab permission ho).

**Flow — Naya role banana**

1. Super Admin "New Role" kholta hai, naam likhta hai.
2. PermissionMatrix mein har module ke saamne actions tick karta hai aur scope chunta hai.
3. Save par backend role save karta hai aur audit log likhta hai.
4. Users page se kisi user ko ye role diya jata hai.
5. Us user ke agle login par sirf ijazat wale menus nazar aate hain; baqi APIs par 403.

**Mukammal tab**

- Custom role bane, user ko diya jaye, aur menus/APIs dono us ke hisaab se chalein.
- Team scope wala manager sirf apni team ka data dekhe.

### M2 — Company Settings

**Maqsad:** company ki maloomat aur tamam policies aik jagah.

**Pehle ye modules:** M1, M26.

**Backend:** `setting.model.js` (key, value). Keys: company, workingDays, officeHours, lateRules, leavePolicy, payrollCycle, taxSlabs, eobi, geoFences, templates. APIs: `GET /settings`, `GET /settings/:key`, `PATCH /settings/:key` (settings.manage). Service: getSetting(), updateSetting() (cache ke saath).

**Frontend:** `SettingsPage.jsx` (/settings) tabs ke saath: Company, Working Hours, Attendance Rules, Leave Policy, Payroll & Tax, Geo-fences, Templates. Har tab aik form component (`CompanyForm.jsx`, `TaxSlabsForm.jsx`...).

**Flow**

1. Super Admin settings kholta hai, tab chunta hai, form bharta hai.
2. Save par setting update aur audit log.
3. Doosre modules (attendance, payroll) apna kaam karte waqt yahi settings parhte hain.

**Mukammal tab:** har tab save ho, aur doosre modules nayi value istemal karein.

### M4 — Departments, Designations & Org Chart

**Maqsad:** company ka dhancha.

**Pehle ye modules:** M2.

**Backend:** models `department.model.js` (name, headId, parentId), `designation.model.js` (title, grade, departmentId), `shift.model.js` (name, startTime, endTime, graceMinutes, workDays[]). APIs: CRUD `/departments`, `/designations`, `/shifts` (org.manage), `GET /org-chart` (org.view).

**Frontend:** `DepartmentsPage.jsx`, `DesignationsPage.jsx`, `ShiftsPage.jsx` (table + add/edit dialog), `OrgChartPage.jsx` (tree view).

**Flow**

1. HR departments banata hai aur head chunta hai.
2. Har department ki designations banti hain.
3. Shifts banti hain (morning, evening, flexible).
4. Org chart employees ke managerId se khud ban jata hai.

**Mukammal tab:** CRUD chale, jis department mein employees hon wo delete na ho, org chart sahi dikhe.

### M3 — Employee Management

**Maqsad:** har employee ka mukammal record.

**Pehle ye modules:** M1, M26, M4.

**Backend — Models:** `employee.model.js` (employeeCode, naam, cnic encrypted, cnicExpiry, phone, address, emergencyContact, bank encrypted, joiningDate, probationEnd, employmentType, status, departmentId, designationId, managerId, shiftId, skills[], documents[]), `employeeHistory.model.js` (promotion, transfer, salary badalna).

**Backend — APIs**

| Method | Endpoint | Kaam | Permission |
| --- | --- | --- | --- |
| GET | /employees | List (search, filter, pagination) | employee.view (scoped) |
| POST | /employees | Naya employee + user account | employee.create |
| GET | /employees/:id | Profile | employee.view |
| PATCH | /employees/:id | Edit | employee.edit |
| DELETE | /employees/:id | Archive (soft delete) | employee.delete |
| PATCH | /employees/:id/status | Active / notice / resigned | employee.edit |
| POST | /employees/:id/documents | Document upload | employee.edit |
| DELETE | /employees/:id/documents/:docId | Document hatana | employee.edit |
| POST | /employees/import | Excel se bulk | employee.create |
| GET | /employees/export | Excel download | report.export |
| POST | /employees/me/change-request | Employee ki edit request | Own |

**Backend — Service:** createEmployee() (employee + user account + welcome email), updateEmployee(), changeStatus(), uploadDocument(), importFromExcel(), encrypt/decrypt CNIC aur bank.

**Frontend — Pages**

| Page | Route | Kaun dekhega |
| --- | --- | --- |
| EmployeeListPage.jsx | /employees | HR, Admin, Manager (team) |
| EmployeeFormPage.jsx | /employees/new, /employees/:id/edit | HR, Admin |
| EmployeeProfilePage.jsx | /employees/:id | Scope ke mutabiq |
| MyProfilePage.jsx | /me | Har employee |
| EmployeeImportPage.jsx | /employees/import | HR |

**Frontend — Components:** `EmployeeForm.jsx` (steps: Personal, Job, Bank, Documents), `EmployeeTable.jsx`, `ProfileTabs.jsx` (Overview, Documents, Attendance, Leaves, Payslips, History), `DocumentList.jsx`.

**Flow — Naya employee**

1. HR "Add Employee" form bharta hai (4 steps).
2. Backend employee save karta hai, CNIC/bank encrypt karta hai, user account banata hai.
3. Employee ko login details ka email jata hai.
4. Employee pehle login par password badalta hai.

**Mukammal tab:** add/edit/archive, documents, Excel import chale; manager ko salary/bank nazar na aaye.

### M8 — Notifications & Announcements

**Maqsad:** app, email aur WhatsApp par ittila.

**Pehle ye modules:** M1, M3.

**Backend:** models `notification.model.js` (userId, type, title, body, link, isRead), `announcement.model.js` (title, body, audience, pinned, readBy[]). Service `notify(userIds, payload)` jo database mein save kare, Socket.io se live bheje aur zaroorat par email/WhatsApp job daale. APIs: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, CRUD `/announcements`.

**Frontend:** `NotificationBell.jsx` (topbar mein, unread ginti), `NotificationsPage.jsx`, `AnnouncementsPage.jsx`, `hooks/useSocket.js`.

**Flow**

1. Koi module `notify()` call karta hai (jaise leave approve hui).
2. Notification save hoti hai aur Socket.io se foran bell par aati hai.
3. User click karta hai to related page khulta hai aur notification read ho jati hai.

**Mukammal tab:** live notification aaye, email jaye, announcement sab ko dikhe.

### M5 — Attendance & Shifts

**Maqsad:** rozana haziri, late, overtime.

**Pehle ye modules:** M3, M4 (shifts), M2 (rules).

**Backend — Models:** `attendance.model.js` (employeeId, date, checkIn{time, method, lat, lng, photoUrl}, checkOut{...}, breaks[], status, lateMinutes, overtimeMinutes, isLocked), `attendanceCorrection.model.js` (attendanceId, requestedIn, requestedOut, reason, status, approverId).

**Backend — APIs**

| Method | Endpoint | Kaam | Permission |
| --- | --- | --- | --- |
| POST | /attendance/check-in | Haziri lagana | attendance.mark |
| POST | /attendance/check-out | Chhutti ka waqt | attendance.mark |
| GET | /attendance/today | Aaj ka status | Own |
| GET | /attendance | Mahina / employee wise | attendance.view (scoped) |
| PATCH | /attendance/:id | HR ki tabdeeli | attendance.edit |
| POST | /attendance/corrections | Correction request | Own |
| PATCH | /attendance/corrections/:id/decide | Approve / reject | attendance.approve |
| POST | /attendance/lock | Mahina lock | attendance.lock |

**Backend — Service:** checkIn() (shift se late minutes), checkOut() (overtime), calculateDayStatus() (present, late, half day), applyCorrection(), lockMonth().

**Backend — Jobs:** `jobs/autoAbsent.job.js` (raat ko jinhon ne check-in nahi kiya, unhein absent ya leave mark karna).

**Frontend — Pages:** `MyAttendancePage.jsx` (bara Check In/Out button + mahana calendar), `TeamAttendancePage.jsx` (manager), `AttendanceAdminPage.jsx` (HR: sab employees, edit, lock), `CorrectionsPage.jsx` (requests aur approvals).

**Frontend — Components:** `CheckInButton.jsx`, `AttendanceCalendar.jsx`, `CorrectionForm.jsx`.

**Flow — Rozana haziri**

1. Employee "Check In" dabata hai.
2. Backend waqt save karta hai aur shift ke mutabiq late minutes nikalta hai.
3. Shaam ko "Check Out" par kul ghante aur overtime.
4. Bhool jaye to correction request; manager approve karta hai.
5. Raat ko job khali dinon ko absent ya leave mark karta hai.
6. Mahine ke aakhir mein HR attendance lock karta hai.

**Mukammal tab:** check in/out, late/overtime ka hisaab, corrections, auto-absent aur lock theek chalein.

### M6 — Leave & Holidays

**Maqsad:** chhuttiyan, balance aur approvals.

**Pehle ye modules:** M3, M5, M8.

**Backend — Models:** `leaveType.model.js`, `leaveBalance.model.js` (employeeId, leaveTypeId, year, allotted, used, carried), `leave.model.js` (from, to, days, halfDay, reason, attachment, status, approvals[]), `holiday.model.js`.

**Backend — APIs**

| Method | Endpoint | Kaam | Permission |
| --- | --- | --- | --- |
| POST | /leaves | Apply | leave.apply |
| GET | /leaves | Meri / team / sab leaves | leave.view (scoped) |
| GET | /leaves/pending | Mere approval wali | leave.approve |
| PATCH | /leaves/:id/decide | Approve / reject | leave.approve |
| PATCH | /leaves/:id/cancel | Cancel | Own |
| GET | /leaves/balance | Balance | Own / scoped |
| GET | /leaves/calendar | Team calendar | leave.view |
| CRUD | /leave-types, /holidays | Settings | leave.settings |

**Backend — Service:** applyLeave() (balance, takrao, kaam ke din), buildApprovalChain(), decideLeave() (balance katna, attendance mark), yearlyAllocation() (naye saal par balance).

**Frontend — Pages:** `MyLeavesPage.jsx` (balance cards + apply form + history), `LeaveApprovalsPage.jsx`, `TeamLeaveCalendarPage.jsx`, `LeaveTypesPage.jsx`, `HolidaysPage.jsx`.

**Flow — Leave apply se approve tak**

1. Employee tareekhein aur qism chunta hai; form balance dikhata hai.
2. Backend check kar ke Pending save karta hai aur manager ko notify karta hai.
3. Manager approve karta hai; agla approver (HR) notify hota hai.
4. Final approval par balance katta hai aur attendance mein Leave lag jata hai.
5. Employee ko notification milti hai.

**Mukammal tab:** apply, multi-level approval, balance, calendar aur holidays theek chalein.

### M9 — Payroll

**Maqsad:** mahana tankhwah, slips aur bank sheet.

**Pehle ye modules:** M3, M5, M6, M2 (tax/EOBI settings).

**Backend — Models:** `salaryStructure.model.js` (basic, allowances[], deductions[], effectiveFrom), `payrollRun.model.js` (month, year, status, totals, approvedBy), `payslip.model.js` (earnings[], deductions[], tax, eobi, gross, net, pdfUrl).

**Backend — APIs**

| Method | Endpoint | Kaam | Permission |
| --- | --- | --- | --- |
| CRUD | /salary-structures | Salary set karna | payroll.manage |
| POST | /payroll/runs | Mahine ka payroll banana | payroll.run |
| GET | /payroll/runs, /payroll/runs/:id | Runs aur slips | payroll.view |
| PATCH | /payroll/runs/:id/payslips/:slipId | Slip theek karna | payroll.run |
| PATCH | /payroll/runs/:id/approve | Approve | payroll.approve |
| PATCH | /payroll/runs/:id/mark-paid | Paid mark | payroll.approve |
| GET | /payroll/runs/:id/bank-sheet | Bank Excel | payroll.export |
| GET | /payslips/me | Meri slips | Own |
| GET | /payslips/:id/pdf | PDF download | Own / payroll.view |

**Backend — Service aur utils:** generatePayroll() (BullMQ job), calculatePayslip(employee, month), `utils/taxCalculator.js` (FBR slabs), `utils/eobiCalculator.js`, generatePayslipPdf(), generateBankSheet().

**Frontend — Pages:** `SalaryStructuresPage.jsx`, `PayrollRunsPage.jsx` (mahinon ki list + Generate), `PayrollRunDetailPage.jsx` (sab slips, totals, Approve), `MyPayslipsPage.jsx`.

**Flow — Mahana payroll**

1. HR attendance lock karta hai (M5).
2. HR "Generate" dabata hai; job har employee ka hisaab karta hai: basic + allowances + overtime − unpaid leave − late − loan − EOBI − tax.
3. HR draft slips check kar ke zaroorat ho to theek karta hai.
4. Super Admin approve karta hai; PDFs banti hain.
5. HR bank sheet download kar ke adaigi karta hai aur Paid mark karta hai.
6. Employees ko slips email aur portal par milti hain.

**Mukammal tab:** test employees ka poora mahina chale aur totals manual Excel hisaab se milein.

### M7 — Dashboard & Reports

**Maqsad:** har role ke liye khulasa aur reports.

**Pehle ye modules:** M3, M5, M6, M9.

**Backend:** `GET /dashboard` (role ke mutabiq widgets ka data, MongoDB aggregation), `GET /reports/:type?from=&to=&departmentId=&format=` (attendance, leave, payroll, headcount, turnover; JSON, xlsx ya pdf). Service: dashboardForAdmin(), dashboardForManager(), dashboardForEmployee(), buildReport().

**Frontend:** `DashboardPage.jsx` (role ke hisaab se widgets: StatCard, AttendanceChart, PendingApprovals, Birthdays), `ReportsPage.jsx` (report chunna, filters, table, Excel/PDF button).

**Flow:** user login karta hai → dashboard apne role ke widgets dikhata hai → Reports mein filter laga kar export.

**Mukammal tab:** chaaron roles ke dashboards sahi data dikhayein; reports export hon.

## 5. Payroll & Finance Modules

### M10 — Loans & Advances

**Maqsad:** advance/loan aur qiston ki katoti.

**Pehle ye modules:** M9.

**Backend:** `loan.model.js` (amount, installments, monthlyDeduction, balance, status, approvals[]). APIs: `POST /loans`, `GET /loans`, `PATCH /loans/:id/decide`, `GET /loans/:id/schedule`. Payroll service har mahine qist kaat kar balance kam karti hai.

**Frontend:** `MyLoansPage.jsx` (apply + schedule), `LoanApprovalsPage.jsx`.

**Flow:** employee apply → manager recommend → HR/Admin approve → payroll mein har mahine qist → balance zero par Closed.

**Mukammal tab:** approve shuda loan ki qist payslip mein nazar aaye.

### M11 — Expense Claims

**Maqsad:** kharchon ki wapsi.

**Pehle ye modules:** M9.

**Backend:** `expense.model.js` (category, amount, date, receiptUrl, status, approvals[], reimbursedIn). APIs: `POST /expenses` (raseed upload), `GET /expenses`, `PATCH /expenses/:id/decide`, `PATCH /expenses/:id/reimburse`.

**Frontend:** `MyExpensesPage.jsx`, `ExpenseApprovalsPage.jsx`, `ExpenseForm.jsx`.

**Flow:** employee raseed ke saath claim → manager approve → HR reimburse (payroll ya alag) → employee ko ittila.

**Mukammal tab:** category limits check hon aur approved claim payroll mein aaye.

## 6. Smart Attendance Modules

Ye teeno M5 ke check-in ke andar hi izafa hain; alag page nahi balki check-in ke naye tareeqay hain.

### M14 — GPS / Geo-fencing

**Pehle ye modules:** M5, M2 (geoFences setting).

**Backend:** `utils/haversine.js` (do points ka faasla meter mein). Check-in service mein: office ka faasla > radius ho to reject ya flagged. APIs: `GET /attendance/flagged`, `PATCH /attendance/:id/review`, CRUD `/wfh-locations`.

**Frontend:** `hooks/useGeolocation.js`, `GeoFenceMapEditor.jsx` (settings mein map par office aur radius), `PunchMap.jsx` (HR ke liye punch locations).

**Flow:** Check In → browser location → backend faasla check → andar ho to haziri, bahar ho to rejected/flagged.

**Mukammal tab:** office se door check-in reject ho; WFH approved location se qubool ho.

### M13 — QR Code Attendance

**Pehle ye modules:** M5.

**Backend:** `GET /attendance/qr/current` (kiosk ke liye har 30 second naya signed token), check-in mein token ka signature aur waqt check. `device` binding user model mein.

**Frontend:** `KioskQrPage.jsx` (office screen par QR, khud refresh), `QrScanner.jsx` (employee ke phone par html5-qrcode).

**Flow:** office screen par QR → employee scan → token + location backend → token sahi aur taaza ho to haziri.

**Mukammal tab:** purana screenshot wala QR kaam na kare.

### M12 — Face Recognition Attendance

**Pehle ye modules:** M5.

**Backend:** user model mein `faceDescriptors[]`. APIs: `POST /attendance/face/enroll`, `PATCH /attendance/face/:userId/approve`, check-in mein descriptor ka faasla (Euclidean) threshold se kam ho to match.

**Frontend:** `public/models/` (face-api model files), `FaceEnrollPage.jsx` (3–5 photos), `FaceCheckIn.jsx` (camera, liveness: aankh jhapakna), `hooks/useFaceApi.js`.

**Flow:** pehli dafa enroll → HR approve → rozana camera kholna → aankh jhapkana → descriptor backend → match ho to haziri aur photo save.

**Mukammal tab:** sahi chehra qubool, doosra chehra aur photo reject.

## 7. AI Modules

### M15 — Recruitment & AI Resume Screening

**Pehle ye modules:** M3, M4, M8.

**Backend:** models `job.model.js` (title, departmentId, description, status), `candidate.model.js` (name, email, cvUrl, parsed, aiScore, aiReason, stage, interviews[]). APIs: CRUD `/jobs`, `POST /public/jobs/:id/apply` (bina login), `GET /candidates`, `PATCH /candidates/:id/stage`, `POST /candidates/:id/screen` (AI), `POST /candidates/:id/interviews`, `POST /candidates/:id/offer`, `POST /candidates/:id/hire` (employee bana dena). Service: `services/ai.service.js` (CV text + job description AI ko bhej kar score aur wajah JSON mein lena).

**Frontend:** `JobsPage.jsx`, `JobFormPage.jsx`, `CandidatePipelinePage.jsx` (Kanban: Applied → Shortlisted → Interview → Offer → Hired), `CandidateDetailPage.jsx`, `CareersPublicPage.jsx` (bahar walon ke liye).

**Flow:** job post → candidate apply → AI score → HR shortlist → interview + feedback → offer → Hire par employee ban jata hai.

**Mukammal tab:** pipeline chale aur hire karne par M3 mein employee ban jaye.

### M16 — HR Chatbot

**Pehle ye modules:** M6, M9, M2.

**Backend:** `chatMessage.model.js`. API: `POST /chatbot/ask`. Service: user ka sawal + allowed tools (getMyLeaveBalance, getMyLastPayslip, searchPolicy) AI ko bhejna; sirf usi user ka data. Policy documents `policyDoc.model.js` mein.

**Frontend:** `ChatbotWidget.jsx` (kone mein chat button), `PolicyDocsPage.jsx` (HR upload).

**Flow:** employee pochta hai "meri leaves kitni hain?" → AI tool call karta hai → backend sirf us user ka balance deta hai → jawab Roman Urdu/English mein.

**Mukammal tab:** chatbot sirf apna data bataye, kisi aur ka nahi.

### M17 — Attrition Prediction

**Pehle ye modules:** M5, M6, M19.

**Backend:** `jobs/attritionScore.job.js` (har hafte har employee ka score: absences, late, increment ka waqt, surveys), `attritionScore.model.js`. API: `GET /analytics/attrition` (scoped).

**Frontend:** `AttritionDashboardPage.jsx` (risk list, wajuhaat, department chart).

**Flow:** job score banata hai → HR/manager risk list dekhte hain → action notes likhte hain.

**Mukammal tab:** score aur wajuhaat dikhein; employee ko apna score nazar na aaye.

## 8. Employee Experience Modules

### M18 — Onboarding & Offboarding

**Pehle ye modules:** M3, M23.

**Backend:** `checklistTemplate.model.js`, `checklist.model.js` (employeeId, type, tasks[{title, ownerId, dueDate, done}]), `resignation.model.js`. APIs: CRUD `/checklist-templates`, `GET /checklists`, `PATCH /checklists/:id/tasks/:taskId`, `POST /resignations`, `PATCH /resignations/:id/decide`, `GET /employees/:id/letters/experience` (PDF).

**Frontend:** `OnboardingPage.jsx`, `MyChecklistPage.jsx`, `ResignationPage.jsx`, `OffboardingPage.jsx`.

**Flow:** naya employee → template se checklist khud bane → har task ka owner tick kare. Istifa → manager qubool → exit checklist → final settlement (M9) → experience letter.

**Mukammal tab:** dono checklists chalein aur letter PDF bane.

### M19 — Performance & Appraisal

**Pehle ye modules:** M3, M4.

**Backend:** `reviewCycle.model.js`, `review.model.js` (goals[], selfRating, managerRating, comments, recommendation). APIs: CRUD `/review-cycles`, `GET /reviews`, `PATCH /reviews/:id/self`, `PATCH /reviews/:id/manager`, `PATCH /reviews/:id/finalize`.

**Frontend:** `ReviewCyclesPage.jsx`, `MyReviewPage.jsx`, `TeamReviewsPage.jsx`.

**Flow:** HR cycle shuru → goals set → employee self-review → manager rating → Super Admin final → increment ki sifarish payroll ko.

**Mukammal tab:** poora cycle aik employee ke liye shuru se aakhir tak chale.

### M20 — Rewards, Celebrations & Surveys

**Backend:** `award.model.js`, `appreciation.model.js`, `survey.model.js`, `surveyResponse.model.js`. APIs: `/awards`, `/appreciations`, `/surveys`, `/surveys/:id/respond`, `/surveys/:id/results`. Job: rozana birthday/anniversary mubarakbad.

**Frontend:** `CelebrationsWall.jsx`, `AwardsPage.jsx`, `SurveysPage.jsx`, `SurveyResultsPage.jsx`.

**Mukammal tab:** survey ka jawab aur nataij chart mein; birthday wishes khud jayein.

### M21 — Anonymous Feedback & Grievance

**Backend:** `feedback.model.js` (isAnonymous, category, body, status, caseNotes[], trackingCode). Gumnaam feedback mein userId save na ho, sirf trackingCode. APIs: `POST /feedback`, `GET /feedback/track/:code`, `GET /feedback` (committee), `PATCH /feedback/:id`.

**Frontend:** `SubmitFeedbackPage.jsx`, `TrackFeedbackPage.jsx`, `GrievanceAdminPage.jsx`.

**Mukammal tab:** gumnaam shikayat ka database mein bhi user se rishta na ho.

## 9. Office Management Modules

### M22 — Projects & Timesheets

**Backend:** `project.model.js` (name, client, members[], status), `timesheet.model.js` (employeeId, projectId, date, hours, task, billable, status). APIs: CRUD `/projects`, `POST /timesheets`, `GET /timesheets`, `PATCH /timesheets/:id/decide`, `GET /reports/utilization`.

**Frontend:** `ProjectsPage.jsx`, `MyTimesheetPage.jsx` (hafte ka grid), `TimesheetApprovalsPage.jsx`.

**Mukammal tab:** hafte ki timesheet bhari aur approve ho; utilization report bane.

### M23 — Asset Management

**Backend:** `asset.model.js` (tag, type, serialNo, assignedTo, history[], warrantyEnd, status). APIs: CRUD `/assets`, `POST /assets/:id/assign`, `POST /assets/:id/return`. Job: warranty/license expiry alert.

**Frontend:** `AssetsPage.jsx`, `AssetDetailPage.jsx`, `MyAssetsPage.jsx`.

**Mukammal tab:** assign/return ki history bane; offboarding mein wapsi check ho.

### M24 — Internal Chat

**Backend:** `conversation.model.js` (type: direct/group/department, members[]), `message.model.js` (conversationId, senderId, text, fileUrl, readBy[]). Socket events: `chat:join`, `chat:message`, `chat:typing`, `chat:read`. APIs: `GET /conversations`, `GET /conversations/:id/messages`, `POST /conversations`.

**Frontend:** `ChatPage.jsx` (left: conversations, right: messages), `MessageInput.jsx`.

**Mukammal tab:** do users ke beech live message aur file share.

### M25 — Training & Learning

**Backend:** `training.model.js`, `enrollment.model.js`, `skill` fields employee mein. APIs: CRUD `/trainings`, `POST /trainings/:id/enroll`, `PATCH /enrollments/:id/complete` (certificate upload).

**Frontend:** `TrainingsPage.jsx`, `MyLearningPage.jsx`, `SkillMatrixPage.jsx`.

**Mukammal tab:** enroll, complete aur certificate ka record.

## 10. Har Module ke Liye Kaam ki Checklist

Har naya module shuru karte waqt yehi qadam isi tarteeb mein karein:

1. Model banayein (`<module>.model.js`) aur MongoDB Compass mein check karein.
2. Validation (`<module>.validation.js`) mein Zod schemas likhein.
3. Service functions likhein (asal logic yahin).
4. Controller aur routes banayein; har route par `authenticate`, `validate`, `checkPermission` lagayein.
5. Permissions `shared/permissions.js` mein add karein aur seed dobara chalayein.
6. Postman ya Swagger se har API test karein (sahi data, ghalat data, bina permission).
7. Frontend mein `<module>Api.js` hooks banayein.
8. Pages aur components banayein; buttons `Can` component se chhupayein.
9. Sidebar mein menu add karein (permission ke saath).
10. Poora flow browser mein chaar roles se test karein, phir Git commit aur pull request.
