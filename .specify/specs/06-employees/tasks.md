# Tasks Breakdown: M3 Employee Management

**Feature Identifier**: `06-employees`  
**Feature Branch**: `feature/06-employees`  
**Target Module**: Module M3 (Employee Management · Core HR Group)  
**Spec Document**: [`.specify/specs/06-employees/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/06-employees/spec.md)  
**Plan Document**: [`.specify/specs/06-employees/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/06-employees/plan.md)  
**Governing Guide**: [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 8 (Rows 3.1–3.17)  
**Architecture Rules**: Plain JavaScript only (`.js` / `.jsx`), Vertical Slice order (BE $\rightarrow$ FE $\rightarrow$ Row Test), P1 first then P2.

---

## Phase 1: Core Master & Personal Records (Priority P1)

### Slice 3.1: Employee Model & AES-256-GCM Field-Level Encryption (BUILD-GUIDE ID 3.1)
- [x] **3.1-BE**: Create `backend/src/utils/crypto.js` implementing authenticated AES-256-GCM field encryption (`encrypt`, `decrypt`) using `node:crypto` with 16-byte random IV and auth tags. Extend `backend/src/models/employee.model.js` with comprehensive schema fields (`dob`, `gender`, `address`, `emergencyContact`, `bankDetails`, `skills`, `documents`, `probationEndDate`, `statusReason`) storing `cnic` and `bankDetails.iban` as encrypted hex strings. Register `report.export` in `backend/src/shared/permissions.js`.
- [x] **3.1-FE**: Create `frontend/src/features/employees/employeesApi.js` with RTK Query base injection and initial endpoints. Add reusable CNIC and IBAN mask/display helper in `frontend/src/lib/formatters.js` to automatically mask sensitive strings (`35202-*******-1`, `PK**MEZN****5678`) when rendered on UI.
- [x] **3.1-TEST**: Unit & model integration test in `backend/tests/employee-crypto.test.js`: verify plaintext strings roundtrip accurately through `encrypt` and `decrypt`; verify raw MongoDB document stores encrypted cipher text without plaintext leakage; verify tampering with auth tag rejects with error.

---

### Slice 3.2: Comprehensive Employee Onboarding & User Account Provisioning (BUILD-GUIDE ID 3.2)
- [x] **3.2-BE**: In `backend/src/modules/employees/employee.validation.js`, define `createEmployeeSchema` with nested steps validation. In `employee.service.js`, implement `createEmployee(payload, actor)`: validate uniqueness of `employeeCode`, `email`, and `cnic`; encrypt CNIC and IBAN; create employee record; when `createAccount: true`, provision a matching `User` account with role `Employee` and random temporary password; dispatch welcome onboarding email via `email.service.js`; write audit log. In `employee.routes.js`, implement `POST /api/v1/employees` guarded by `authenticate` and `checkPermission('employee.create')`. Mount in `backend/src/app.js`.
- [x] **3.2-FE**: Create `frontend/src/features/employees/pages/EmployeeFormPage.jsx` featuring a responsive 5-step wizard:
  1. Personal Details (Full Name, Code, Email, Phone, DOB, Gender)
  2. Contact & Emergency (Address, Emergency contact person, relationship, phone)
  3. Job Assignment (Department dropdown, Designation selector, Shift picker, Reporting Manager selector, Employment Type, Joining Date, Probation End Date)
  4. Bank & Financials (Bank Name, Account Title, Account Number, IBAN)
  5. Account Option (`createAccount` checkbox).
  Register `/employees/new` in `frontend/src/App.jsx`.
- [x] **3.2-TEST**: Integration test in `backend/tests/employees.api.test.js`: verify Super Admin and HR Manager create new employee with user account (HTTP 201); verify welcome email trigger; verify duplicate employee code or email returns HTTP 400; verify Department Manager and Employee receive HTTP 403 Forbidden.

---

### Slice 3.3: Pakistani CNIC Validation & Expiry Monitoring (BUILD-GUIDE ID 3.3)
- [x] **3.3-BE**: In `employee.validation.js`, add strict Zod regex refinement validating Pakistani 13-digit CNIC format (`^\d{5}-\d{7}-\d{1}$`) and valid future/past date check for `cnicExpiry`. In `employee.service.js`, add utility querying employees whose CNIC expires within 30 days.
- [x] **3.3-FE**: In `EmployeeFormPage.jsx`, implement automatic input masking for the CNIC field (auto-inserting dashes after 5th and 12th digits: `XXXXX-XXXXXXX-X`) with real-time format validation. Add CNIC expiry date picker with warning pill when date is near.
- [x] **3.3-TEST**: Test CNIC validation: verify invalid CNIC strings (missing dashes, letters, less/more than 13 digits) return HTTP 400 Bad Request; verify valid CNIC passes and is encrypted; verify CNIC expiry near warning flag.

---

### Slice 3.4: Scoped Employee Directory, Search & Faceted Filtering (BUILD-GUIDE ID 3.4)
- [x] **3.4-BE**: In `employee.service.js`, implement `getEmployees({ page, limit, search, departmentId, designationId, status, employmentType, skill }, actor, scope)`: execute horizontal scope filtering (`all` for HR/Admin, `department` for Dept Manager, `team` for Team Lead, `own` for Employee); execute text regex search on name, code, email; apply pagination metadata. Implement `GET /api/v1/employees` in `employee.routes.js` with `checkPermission('employee.view')`.
- [x] **3.4-FE**: Add `getEmployees` query in `employeesApi.js`. Create `frontend/src/features/employees/pages/EmployeeListPage.jsx` featuring `DataTable` with columns (Avatar, Code, Name, Department, Designation, Shift, Status, Actions), search bar, department filter pills, status dropdown, and "Add Employee" button wrapped in `<Can I="employee.create" a="Employee">`. Register `/employees` route in `App.jsx` and add nav link in `Sidebar.jsx`.
- [x] **3.4-TEST**: Test scoped directory: verify HR Manager queries and receives full company list (HTTP 200); verify Department Manager only receives staff within their department (HTTP 200); verify Employee only receives their own record (HTTP 200); verify search by name and code filters correctly.

---

### Slice 3.5: Comprehensive Employee Profile & Modular Tab Views (BUILD-GUIDE ID 3.5)
- [x] **3.5-BE**: In `employee.service.js`, implement `getEmployeeById(id, actor, scope)`: query employee with populated department, designation, shift, and manager; apply field-level authorization filter (`fieldFilter`) stripping salary and unmasking bank details only if actor holds `employee.salary.view` or is viewing own record. Implement `GET /api/v1/employees/:id` in `employee.routes.js`.
- [x] **3.5-FE**: Add `getEmployeeById` query in `employeesApi.js`. Create `frontend/src/features/employees/pages/EmployeeProfilePage.jsx` with header card (avatar, name, code, title, department, status badge) and modular tab navigation:
  - `ProfileOverviewTab.jsx` (Personal info, Contact, Emergency contact, Job metadata)
  - `ProfileDocumentsTab.jsx` (Document vault cards)
  - `ProfileHistoryTab.jsx` (Career timeline)
  - `ProfileSalaryTab.jsx` (Compensation history, rendered only if permitted).
  Register `/employees/:id` in `App.jsx`.
- [x] **3.5-TEST**: Test profile view: verify HR Manager views complete profile with decrypted CNIC and bank details (HTTP 200); verify Department Manager views subordinate profile with salary and bank details masked/omitted (HTTP 200); verify Employee attempting to view another employee's profile returns HTTP 403.

---

### Slice 3.6: Employee Profile Updating & Audit Trail (BUILD-GUIDE ID 3.6)
- [x] **3.6-BE**: In `employee.validation.js`, define `updateEmployeeSchema`. In `employee.service.js`, implement `updateEmployee(id, payload, actor)`: re-encrypt CNIC/IBAN if changed; check uniqueness if email/code modified; save updates and record pre- and post-mutation snapshot in `AuditLog`. In `employee.routes.js`, implement `PATCH /api/v1/employees/:id` guarded by `checkPermission('employee.edit')`.
- [x] **3.6-FE**: Add `updateEmployee` mutation in `employeesApi.js`. Enable edit mode in `EmployeeFormPage.jsx` pre-filling fields from `useGetEmployeeByIdQuery`. Add "Edit Profile" button on `EmployeeProfilePage.jsx` wrapped in `<Can I="employee.edit" a="Employee">`. Register `/employees/:id/edit` in `App.jsx`.
- [x] **3.6-TEST**: Test profile update: verify HR Manager edits employee contact and job assignment (HTTP 200); verify audit log entry is recorded with before and after state; verify non-admin mutation is rejected with HTTP 403 Forbidden.

---

### Slice 3.7: Employee Status Lifecycle & Automated Login Revocation (BUILD-GUIDE ID 3.7)
- [x] **3.7-BE**: In `employee.validation.js`, define `updateStatusSchema` requiring `status` enum (`Active`, `Probation`, `Notice`, `Resigned`, `Terminated`, `Suspended`) and mandatory `reason` string. In `employee.service.js`, implement `updateEmployeeStatus(id, { status, reason }, actor)`: update status; when status is `Terminated` or `Resigned`, find linked `User` record, set `isActive: false`, purge refresh tokens; record audit log. In `employee.routes.js`, implement `PATCH /api/v1/employees/:id/status`.
- [x] **3.7-FE**: Create `frontend/src/features/employees/components/StatusChangeModal.jsx` featuring status selector, mandatory reason textarea, and warning alert when selecting "Terminated". Add "Change Status" trigger on `EmployeeProfilePage.jsx`.
- [x] **3.7-TEST**: Test status transition: verify HR Manager transitions active employee to `Terminated` with reason (HTTP 200); verify linked user account is deactivated (`isActive: false`); verify terminated employee's login attempt returns HTTP 401; verify empty reason on termination returns HTTP 400.

---

### Slice 3.8: Employee Archival & Soft Deletion (BUILD-GUIDE ID 3.8)
- [x] **3.8-BE**: In `employee.service.js`, implement `deleteEmployee(id, actor)`: verify employee exists, set `isDeleted: true`, deactivate linked `User` record (`isActive: false`), record audit log. In `employee.routes.js`, implement `DELETE /api/v1/employees/:id` guarded by `checkPermission('employee.delete')`.
- [x] **3.8-FE**: Add `deleteEmployee` mutation in `employeesApi.js`. Add "Archive Employee" action with `ConfirmDialog` on `EmployeeProfilePage.jsx` and `EmployeeListPage.jsx` wrapped in `<Can I="employee.delete" a="Employee">`.
- [x] **3.8-TEST**: Test soft deletion: verify HR Manager soft deletes employee (HTTP 200); verify employee no longer appears in default directory list; verify raw DB record retains `isDeleted: true` for payroll/attendance audit history; verify Employee role receives HTTP 403.

---

### Slice 3.9: Employee Document Vault with Private Access (BUILD-GUIDE ID 3.9)
- [x] **3.9-BE**: Configure Multer middleware for document uploads with disk storage in `uploads/documents/`, 5MB limit, and PDF/JPG/PNG filter. In `employee.service.js`, implement `uploadDocument(employeeId, { type, title }, file, actor)` and `deleteDocument(employeeId, docId, actor)`. In `employee.routes.js`, implement `POST /api/v1/employees/:id/documents` and `DELETE /api/v1/employees/:id/documents/:docId` guarded by `checkPermission('employee.edit')`.
- [x] **3.9-FE**: Create `frontend/src/features/employees/components/DocumentUploadModal.jsx` with file dropzone, document type selector (`CNIC Copy`, `Degree Certificate`, `Employment Contract`, `NDA`, `Experience Letter`), and title input. In `ProfileDocumentsTab.jsx`, display document cards with download/view action and delete button.
- [x] **3.9-TEST**: Test document vault: verify uploading a valid PDF stores file and adds entry to `employee.documents` (HTTP 201); verify unsupported file format returns HTTP 400; verify deleting a document removes entry and unlinks file (HTTP 200); verify non-permitted role cannot upload or delete documents.

---

### Slice 3.13: Excel Bulk Employee Ingestion with Row-Level Error Reports (BUILD-GUIDE ID 3.13)
- [x] **3.13-BE**: Configure Multer memory storage for spreadsheet uploads (`.xlsx`). In `employee.service.js`, implement `importEmployeesFromExcel(buffer, actor)` using ExcelJS: parse rows, validate each row against Zod schema, resolve department and designation codes to ObjectIds, encrypt CNIC/IBAN, batch insert valid rows, and collect row-by-row error report for invalid rows; record audit log. In `employee.routes.js`, implement `POST /api/v1/employees/import` guarded by `checkPermission('employee.create')`.
- [x] **3.13-FE**: Add `importEmployees` mutation in `employeesApi.js`. Create `frontend/src/features/employees/pages/EmployeeImportPage.jsx` featuring sample template download button, drag-and-drop file upload, upload progress indicator, import summary card (Total, Succeeded, Failed), and detailed row-level error table. Register `/employees/import` in `App.jsx`.
- [x] **3.13-TEST**: Test Excel import: verify uploading 50-row test sheet with 45 valid rows and 5 invalid rows (invalid CNIC, duplicate email) imports 45 employees and returns HTTP 200 with error report detailing the 5 rejected rows; verify non-admin roles receive HTTP 403.

---

### Slice 3.14: Employee Directory Excel Export (BUILD-GUIDE ID 3.14)
- [x] **3.14-BE**: In `employee.service.js`, implement `exportEmployeesToExcel(queryFilters, actor)` using ExcelJS: query scoped employees matching filters, construct styled worksheet with auto-width headers, stream binary buffer. In `employee.routes.js`, implement `GET /api/v1/employees/export` guarded by `checkPermission('report.export')` setting `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and `Content-Disposition: attachment; filename="employees-directory.xlsx"`.
- [x] **3.14-FE**: In `EmployeeListPage.jsx`, add an "Export to Excel" action button in the table header. Clicking triggers streaming download with loading indicator toast.
- [x] **3.14-TEST**: Test Excel export: verify HR Manager requests export and receives valid binary Excel buffer with HTTP 200; verify file parses with ExcelJS with correct column headers and row count; verify Employee role receives HTTP 403.

---

### Slice 3.15: Self-Service "My Profile" Portal (BUILD-GUIDE ID 3.15)
- [x] **3.15-BE**: In `employee.service.js`, implement `getMyProfile(userId)`: locate employee record where `userId == req.user._id`, populate department, designation, shift, and manager; return personal record without administrative salary restrictions for self. In `employee.routes.js`, implement `GET /api/v1/employees/me` guarded by `authenticate`.
- [x] **3.15-FE**: Add `getMyProfile` query in `employeesApi.js`. Create `frontend/src/features/employees/pages/MyProfilePage.jsx` displaying employee's personal profile card, emergency contact, shift hours, manager details, and "Request Info Update" button. Register `/me` in `App.jsx` and add nav link in `Sidebar.jsx`.
- [x] **3.15-TEST**: Test self-service profile: verify authenticated employee queries `GET /api/v1/employees/me` and receives their own linked profile (HTTP 200); verify unauthenticated request returns HTTP 401.

---

## Phase 2: Career History & Advanced Workflows (Priority P2)

### Slice 3.10: Career & Promotional Job History Timeline (BUILD-GUIDE ID 3.10)
- [x] **3.10-BE**: Create `backend/src/models/employeeHistory.model.js` with schema `{ employeeId: ObjectId, eventType: String, previousDepartmentId: ObjectId, newDepartmentId: ObjectId, previousDesignationId: ObjectId, newDesignationId: ObjectId, effectiveDate: Date, remarks: String, createdBy: ObjectId }`. In `employee.service.js`, implement `recordJobHistory(employeeId, payload, actor)` and `getJobHistory(employeeId)`. In `employee.routes.js`, implement `POST /api/v1/employees/:id/history` and `GET /api/v1/employees/:id/history` guarded by `checkPermission('employee.edit')`.
- [x] **3.10-FE**: Add `recordJobHistory` and `getJobHistory` in `employeesApi.js`. In `ProfileHistoryTab.jsx`, display vertical chronological milestone timeline with department/designation badges, date chips, and remarks. Add "Record Promotion / Transfer" modal for HR.
- [x] **3.10-TEST**: Test job history: verify HR Manager records promotion with new designation (HTTP 201); verify employee's designation is updated; verify history tab renders milestone event; verify Employee role receives HTTP 403 on mutation.

---

### Slice 3.11: Salary Revision History (Permission Guarded) (BUILD-GUIDE ID 3.11)
- [x] **3.11-BE**: In `employee.service.js`, implement `getSalaryHistory(employeeId, actor)`: verify actor holds `employee.salary.view` or is viewing own profile; query salary revision events from history collection. In `employee.routes.js`, implement `GET /api/v1/employees/:id/salary-history` guarded by `checkPermission('employee.salary.view')`.
- [x] **3.11-FE**: In `ProfileSalaryTab.jsx`, display salary increment history table (Effective Date, Previous Base, New Base, Increment Amount, Percentage, Remarks). Guard entire tab with `<Can I="employee.salary.view" a="Employee">`.
- [x] **3.11-TEST**: Test salary history: verify Super Admin and HR Manager access salary history (HTTP 200); verify Department Manager receives HTTP 403 Forbidden.

---

### Slice 3.12: Skills Taxonomy & Tech Stack Tagging (BUILD-GUIDE ID 3.12)
- [x] **3.12-BE**: In `employee.service.js`, implement `updateSkills(employeeId, skillsArray, actor)`. In `employee.routes.js`, implement `PATCH /api/v1/employees/:id/skills` (or `/employees/me/skills` for self-service). Update directory query filter to match `skills: { $in: [querySkill] }`.
- [x] **3.12-FE**: Add interactive skill tag input component with badge removal and enter-to-add. Display skill chips on `ProfileOverviewTab.jsx` and add skill filter dropdown in `EmployeeListPage.jsx`.
- [x] **3.12-TEST**: Test skills taxonomy: verify employee updates own skills array (HTTP 200); verify filtering employee directory by skill `React` returns only matched employees; verify invalid non-array input returns HTTP 400.

---

### Slice 3.16: Sensitive Field Profile Change Request Workflow (BUILD-GUIDE ID 3.16)
- [x] **3.16-BE**: Create `backend/src/models/profileChangeRequest.model.js` with schema `{ employeeId: ObjectId, requestedBy: ObjectId, requestedFields: Object, reason: String, status: enum ['pending', 'approved', 'rejected'], decidedBy: ObjectId, decidedAt: Date, rejectionReason: String }`. In `employee.service.js`, implement `submitChangeRequest(userId, payload)`, `getPendingChangeRequests()`, and `decideChangeRequest(id, decision, actor)`: on approval, apply requested field changes to `Employee` model and record audit log. In `employee.routes.js`, implement `POST /api/v1/employees/me/change-request`, `GET /api/v1/change-requests`, and `PATCH /api/v1/change-requests/:id/decide`.
- [x] **3.16-FE**: Create `frontend/src/features/employees/components/ChangeRequestModal.jsx` allowing employees to submit proposed updates to Bank IBAN, Address, or Emergency Contact. Create `frontend/src/features/employees/pages/ChangeRequestsPage.jsx` for HR Managers to inspect pending diffs, approve with one click, or reject with reason. Register `/change-requests` in `App.jsx`.
- [x] **3.16-TEST**: Test profile change requests: verify employee submits request to update bank IBAN (HTTP 201); verify HR Manager approves request (HTTP 200); verify employee model is updated with new IBAN; verify rejecting request keeps original data intact.

---

### Slice 3.17: Scheduled Probation Period Expiry Alerts (BUILD-GUIDE ID 3.17)
- [x] **3.17-BE**: Create `backend/src/jobs/probation.job.js`: scheduled node-cron job executing daily at 09:00 PKT; query active employees where `probationEndDate` is exactly 7 days in the future; dispatch notification and email to HR Manager and direct reporting manager. Provide manual trigger endpoint `POST /api/v1/employees/jobs/check-probation` for automated testing.
- [x] **3.17-FE**: Display an amber "Probation Ending in X Days" alert banner on `ProfileOverviewTab.jsx` when `probationEndDate` is within 14 days.
- [x] **3.17-TEST**: Test probation job: create employee with `probationEndDate` set to 7 days from today; execute manual probation check endpoint; verify system notifications and emails are queued for HR Manager and reporting manager.

---

## Phase 3: Multi-Role End-to-End Verification (`E2E-M3`)

### Slice E2E-M3: Multi-Role Live End-to-End Playwright Verification (All 4 Default Roles)
- [x] **E2E-M3**: Create automated test `backend/tests/m3.employees.e2e.test.js` verifying complete end-to-end user journeys:
  1. **Super Admin Flow**: Log in $\rightarrow$ navigate to `/employees/new` $\rightarrow$ complete 5-step wizard to onboard employee "Zubair Hashmi" with user provisioning $\rightarrow$ upload CNIC copy to document vault $\rightarrow$ record promotional milestone in history $\rightarrow$ export directory to Excel $\rightarrow$ inspect full profile including unmasked salary and decrypted bank details.
  2. **HR Manager Flow**: Log in $\rightarrow$ bulk import employees via Excel spreadsheet $\rightarrow$ verify row-by-row error report $\rightarrow$ review pending profile change request from employee and approve it $\rightarrow$ transition leaving employee status to `Terminated` with mandatory reason $\rightarrow$ verify terminated user login account is automatically locked out.
  3. **Department Manager Flow**: Log in $\rightarrow$ navigate to `/employees` $\rightarrow$ verify directory list is strictly scoped to own department staff $\rightarrow$ inspect subordinate profile $\rightarrow$ verify personal contact and attendance tabs are visible while sensitive salary and bank IBAN are masked $\rightarrow$ verify attempt to mutate employee record returns HTTP 403 Forbidden.
  4. **Employee Flow**: Log in with onboarded credentials $\rightarrow$ navigate to `/me` $\rightarrow$ verify self-service personal profile, assigned shift, and manager $\rightarrow$ update personal skill tags $\rightarrow$ submit profile change request for bank IBAN $\rightarrow$ verify attempt to access `/employees/new` or view peer employee profiles returns HTTP 403 Forbidden.
