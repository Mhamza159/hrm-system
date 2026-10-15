# Feature Specification: Module M3 — Employee Management

**Feature Branch**: `feature/06-employees`  
**Created**: 2026-10-14  
**Status**: Ready for Architectural Planning & Implementation  
**Module ID**: M3  
**Module Name**: Employee Management  
**Spec Folder**: `.specify/specs/06-employees`  
**Governing Documents**:
- [`docs/FRD.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/FRD.md) Section 5 (M3. Employee Management) & Section 11 (Permission Matrix M3 Row)
- [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 8 (Rows 3.1 to 3.17)
- [`docs/TECH-SPEC.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/TECH-SPEC.md) Section 1, 2, 4, 5, 8 & 9

---

## 1. Executive Summary & Architecture Integration

Module M3 is the master data anchor for personnel records across the HRM system. It captures the complete lifecycle of staff members from initial onboarding to offboarding, archiving, and alumni tracking. It provides secure storage for personal data, encrypted identity/financial information (Pakistani CNIC and Bank IBAN), job allocations, document vaults, promotional job histories, skills inventories, Excel bulk data ingestion, self-service profile requests, and probation alerts.

### Architectural Invariants & Dependencies
- **M0 Foundation**: Reuses centralized utilities (`ApiError`, `asyncHandler`, `recordAuditLog`, `DataTable`, `ConfirmDialog`, `Can`, `PageHeader`, `StatCard`, `StatusBadge`).
- **M1 Authentication**: Creating an employee record can optionally provision a matching user login account in `users` collection, dispatching a welcome onboarding email. Terminating an employee automatically deactivates their user account (`isActive: false`) and invalidates active sessions.
- **M26 RBAC & Permissions**: Enforces permissions `employee.view`, `employee.create`, `employee.edit`, `employee.delete`, `report.export`. Data scopes (`all`, `department`, `team`, `own`) govern list visibility. Sensitive fields (`salary`, `bankAccount`, `cnic`) are strictly masked for non-authorized roles using field-level authorization filters.
- **M4 Organization**: Directly links employees to operational `Department`, `Designation`, `Shift`, and hierarchical `managerId`.
- **M5, M6 & M9 Downstream Integrations**: Provides employee identity, assigned shifts, and bank details to Attendance (M5), Leave (M6), and Payroll (M9).

---

## 2. Context7 Verified Library Syntax Patterns

### 2.1 AES-256-GCM Field-Level Encryption (`node:crypto`)
*Source: Node.js Crypto Standard Library Documentation via Context7*
Pakistani CNIC and Bank Account/IBAN must be encrypted at rest in MongoDB.
```javascript
import crypto from 'node:crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt sensitive string value with AES-256-GCM
 * @param {string} text - Raw plaintext value
 * @returns {string} ivHex:authTagHex:encryptedHex
 */
export const encrypt = (text) => {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex'); // 32 bytes hex key
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt AES-256-GCM ciphertext
 * @param {string} cipherText - Formatted as ivHex:authTagHex:encryptedHex
 * @returns {string} Plaintext string
 */
export const decrypt = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string' || !cipherText.includes(':')) {
    return cipherText;
  }
  const parts = cipherText.split(':');
  if (parts.length !== 3) return cipherText;
  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

### 2.2 ExcelJS Bulk Import & Export (`/exceljs/exceljs`)
*Source: Official ExcelJS Documentation via Context7 (`/exceljs/exceljs`)*
```javascript
import ExcelJS from 'exceljs';

/**
 * Parse uploaded Excel file buffer into structured JSON rows
 * @param {Buffer} buffer 
 * @returns {Promise<Array<Object>>}
 */
export const parseEmployeeExcel = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet(1) || workbook.worksheets[0];

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip Header row
    const values = row.values;
    rows.push({
      employeeCode: values[1]?.toString()?.trim(),
      name: values[2]?.toString()?.trim(),
      email: values[3]?.toString()?.trim(),
      phone: values[4]?.toString()?.trim(),
      cnic: values[5]?.toString()?.trim(),
      departmentCode: values[6]?.toString()?.trim(),
      designationCode: values[7]?.toString()?.trim(),
      employmentType: values[8]?.toString()?.trim() || 'Full-time',
      joiningDate: values[9]
    });
  });
  return rows;
};

/**
 * Generate formatted Excel buffer for employee export
 * @param {Array<Object>} employees 
 * @returns {Promise<Buffer>}
 */
export const generateEmployeeExportExcel = async (employees) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Staff Directory');

  worksheet.columns = [
    { header: 'Employee Code', key: 'employeeCode', width: 16 },
    { header: 'Full Name', key: 'name', width: 26 },
    { header: 'Official Email', key: 'email', width: 28 },
    { header: 'Phone Number', key: 'phone', width: 18 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Designation', key: 'designation', width: 22 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Employment Type', key: 'employmentType', width: 16 },
    { header: 'Joining Date', key: 'joiningDate', width: 16 }
  ];

  employees.forEach((emp) => worksheet.addRow(emp));
  return await workbook.xlsx.writeBuffer();
};
```

### 2.3 Multer Memory Storage & File Filter (`/expressjs/multer`)
*Source: Official Multer Documentation via Context7 (`/expressjs/multer`)*
```javascript
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

// Memory storage for Excel imports and document validation
const storage = multer.memoryStorage();

export const uploadExcel = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid file format. Please upload an Excel document (.xlsx / .xls).'));
    }
  }
});
```

---

## 3. Detailed User Stories & Acceptance Criteria

---

### User Story 1 (P1): Employee Schema & AES-256-GCM Field-Level Encryption
**BUILD-GUIDE ID**: `3.1`  
**Description**: As the HRM Platform, I require an encrypted MongoDB employee model that stores sensitive Pakistani personal records (CNIC and Bank Account/IBAN) using authenticated AES-256-GCM encryption at rest so that confidential identity and financial details are protected against unauthorized database inspection or data dumping.

#### Acceptance Criteria (Given $\rightarrow$ When $\rightarrow$ Then):
- **Super Admin**:
  - **Given** an authenticated Super Admin creating or editing an employee record with CNIC `35202-1234567-1` and Bank IBAN `PK36SCBL0000001123456701`,
  - **When** the payload is saved through `employee.service.js`,
  - **Then** the raw MongoDB document in the `employees` collection stores `cnic` and `bankDetails.iban` as encrypted hex strings (`iv:tag:cipher`), but Super Admin API responses decrypt and return valid plaintext values.
- **HR Manager**:
  - **Given** an authenticated HR Manager querying an employee profile,
  - **When** the service fetches the record,
  - **Then** the service transparently decrypts the CNIC and bank details, rendering them in the HR Manager profile view.
- **Department Manager**:
  - **Given** an authenticated Department Manager querying subordinates in their department,
  - **When** the employee data is processed through `fieldFilter.js`,
  - **Then** `cnic`, `bankDetails`, and `salary` fields are completely stripped from the response object or replaced with `"—"`, preventing access to personal financial credentials.
- **Employee**:
  - **Given** an authenticated Employee querying their own profile (`/employees/me`),
  - **When** the record is returned,
  - **Then** their own CNIC is shown masked (`35202-*******-1`) and IBAN is partially masked for privacy.

---

### User Story 2 (P1): Comprehensive Employee Onboarding & User Account Provisioning
**BUILD-GUIDE ID**: `3.2`  
**Description**: As an HR Manager, I want a multi-step onboarding wizard to register new employees across Personal, Contact, Job, Bank, and Document steps, automatically provisioning their system login account and dispatching a welcome email so that new hires can seamlessly onboard.

#### Acceptance Criteria:
- **Super Admin & HR Manager**:
  - **Given** an authenticated HR Manager with `employee.create` permission submitting the 5-step onboarding form with `{ name, email, phone, cnic, departmentId, designationId, shiftId, managerId, employmentType, joiningDate, createAccount: true }`,
  - **When** `POST /api/v1/employees` is submitted,
  - **Then** an `Employee` document is created, an associated `User` document is created with a secure temporary password and role `Employee`, a welcome email is queued via Nodemailer, and an audit log `employee.create` is written.
- **Department Manager & Employee**:
  - **Given** an authenticated Department Manager or Employee attempting to call `POST /api/v1/employees`,
  - **When** the request reaches `checkPermission('employee.create')`,
  - **Then** the server rejects the request with HTTP 403 Forbidden.

---

### User Story 3 (P1): Pakistani CNIC Validation & Expiry Monitoring
**BUILD-GUIDE ID**: `3.3`  
**Description**: As an HR Manager, I want input validation enforcing the 13-digit Pakistani CNIC standard (`XXXXX-XXXXXXX-X`) along with CNIC expiry date tracking so that identity documentation adheres to NADRA compliance.

#### Acceptance Criteria:
- **All Roles (Validation Rule)**:
  - **Given** an employee creation or update request with an invalid CNIC format (e.g., `12345` or letters or incorrect dashes),
  - **When** Zod validation executes on `cnic`,
  - **Then** the request is rejected with HTTP 400 Bad Request: `"CNIC must match format XXXXX-XXXXXXX-X (13 digits)"`.
- **HR Manager & Super Admin**:
  - **Given** a valid CNIC `42101-9876543-2` and `cnicExpiry` date,
  - **When** submitted,
  - **Then** the payload passes validation and is encrypted and saved. The UI displays an alert badge if `cnicExpiry` is within 30 days.

---

### User Story 4 (P1): Scoped Employee Directory, Search & Faceted Filtering
**BUILD-GUIDE ID**: `3.4`  
**Description**: As a system user, I want a paginated and searchable employee directory with department, designation, and status filters respecting CASL horizontal data scopes so that users only see the employees they are authorized to view.

#### Acceptance Criteria:
- **Super Admin & HR Manager**:
  - **Given** an authenticated Super Admin or HR Manager querying `GET /api/v1/employees`,
  - **When** executing list search with query parameters `?page=1&limit=10&departmentId=&status=active&search=ali`,
  - **Then** the API returns all company-wide matching employees with pagination metadata `{ page, limit, total, totalPages }`.
- **Department Manager**:
  - **Given** an authenticated Department Manager querying `GET /api/v1/employees`,
  - **When** `scopeFilter.js` processes the request,
  - **Then** the database query is automatically scoped to `departmentId: req.user.departmentId` or direct subordinates, preventing visibility into other departments.
- **Employee**:
  - **Given** an authenticated Employee querying `GET /api/v1/employees`,
  - **When** `scopeFilter.js` executes with scope `own`,
  - **Then** the employee only receives their own record.

---

### User Story 5 (P1): Comprehensive Employee Profile & Modular Tab Views
**BUILD-GUIDE ID**: `3.5`  
**Description**: As an authorized user, I want to view an employee's unified profile segmented into tabs (Overview, Documents, Attendance, Leaves, Payslips, History) with field-level access control.

#### Acceptance Criteria:
- **Super Admin & HR Manager**:
  - **Given** querying `GET /api/v1/employees/:id`,
  - **When** the profile data loads,
  - **Then** all profile tabs and fields are accessible, including full salary structure, bank IBAN, and emergency contacts.
- **Department Manager**:
  - **Given** viewing a subordinate's profile within their department,
  - **When** `EmployeeProfilePage.jsx` renders,
  - **Then** personal contact, job timeline, attendance, and leave tabs are visible, while salary details and bank accounts are omitted.
- **Employee**:
  - **Given** an employee attempting to access another staff member's profile via direct ID URL,
  - **When** CASL scope evaluation runs,
  - **Then** the request returns HTTP 403 Forbidden unless the `:id` matches their own employee ID.

---

### User Story 6 (P1): Employee Profile Updating & Audit Trail
**BUILD-GUIDE ID**: `3.6`  
**Description**: As an HR Manager, I want to edit existing employee records with changes logged to the audit trail so that administrative adjustments are tracked.

#### Acceptance Criteria:
- **HR Manager & Super Admin**:
  - **Given** an employee record with ID `:id`,
  - **When** sending `PATCH /api/v1/employees/:id` with modified job title, department, or contact details,
  - **Then** the employee record updates, and an entry is created in `auditLogs` containing `before` and `after` snapshots.
- **Department Manager & Employee**:
  - **Given** a Department Manager or Employee calling `PATCH /api/v1/employees/:id`,
  - **When** the permission gate checks `employee.edit`,
  - **Then** the mutation is blocked with HTTP 403 Forbidden.

---

### User Story 7 (P1): Employee Status Lifecycle & Automated Login Revocation
**BUILD-GUIDE ID**: `3.7`  
**Description**: As an HR Manager, I want to update an employee's employment status (`active`, `on_notice`, `resigned`, `terminated`) with mandatory status change reasons, automatically deactivating login access when an employee is terminated.

#### Acceptance Criteria:
- **HR Manager & Super Admin**:
  - **Given** an active employee with a linked `User` login account,
  - **When** HR submits `PATCH /api/v1/employees/:id/status` with `{ status: 'terminated', reason: 'Violation of company policy' }`,
  - **Then** the employee status updates to `terminated`, the associated `User.isActive` is set to `false`, all active refresh tokens for the user are invalidated, and an audit log entry is recorded.
- **Terminated Employee**:
  - **Given** an employee whose status is set to `terminated`,
  - **When** they attempt to authenticate via `/api/v1/auth/login`,
  - **Then** the login fails with HTTP 401 Unauthorized: `"Account deactivated. Contact HR."`

---

### User Story 8 (P1): Employee Archival & Soft Deletion
**BUILD-GUIDE ID**: `3.8`  
**Description**: As an HR Manager, I want to archive an employee via soft deletion (`isDeleted: true`) so that historic payroll, tax, and attendance records remain intact for compliance without polluting active directory listings.

#### Acceptance Criteria:
- **HR Manager & Super Admin**:
  - **Given** an employee record,
  - **When** sending `DELETE /api/v1/employees/:id`,
  - **Then** `isDeleted` is set to `true`, the linked user account is deactivated, the employee is excluded from standard directory listings, and historical attendance and payroll links remain preserved.
- **Non-Admin Roles**:
  - **Given** an Employee or Department Manager attempting deletion,
  - **When** executed,
  - **Then** the server returns HTTP 403 Forbidden.

---

### User Story 9 (P1): Employee Document Vault
**BUILD-GUIDE ID**: `3.9`  
**Description**: As an HR Manager or Employee, I want a secure document vault to upload and manage employee files (CNIC copy, degree certificates, appointment contract, NDA) with strict filetype verification and private access.

#### Acceptance Criteria:
- **HR Manager & Super Admin**:
  - **Given** an authenticated HR Manager uploading a document via `POST /api/v1/employees/:id/documents` with `{ type: 'contract', title: 'Employment Contract 2026', file }`,
  - **When** Multer validates the file (PDF, PNG, JPG $\le 5$ MB),
  - **Then** the file is stored securely in `/uploads/documents/`, a document descriptor is appended to `employee.documents[]`, and an audit log is emitted.
- **Employee**:
  - **Given** an authenticated Employee accessing their own vault,
  - **When** downloading their NDA or Degree,
  - **Then** the server verifies ownership and serves the file. Attempts to view another employee's document vault return HTTP 403 Forbidden.

---

### User Story 10 (P2): Career & Promotional Job History Timeline
**BUILD-GUIDE ID**: `3.10`  
**Description**: As an HR Manager, I want to record historical career milestones (promotions, transfers, designation upgrades, department shifts) in a dedicated history model so that career trajectories are visible on a visual timeline.

#### Acceptance Criteria:
- **HR Manager & Super Admin**:
  - **Given** an employee being promoted,
  - **When** submitting `POST /api/v1/employees/:id/history` with `{ eventType: 'promotion', previousDesignationId, newDesignationId, previousDepartmentId, newDepartmentId, effectiveDate, remarks }`,
  - **Then** an `EmployeeHistory` record is created, the employee's current designation is updated, and the History tab displays the event chronologically.
- **Department Manager & Employee**:
  - **Given** a Manager or Employee viewing the profile History tab,
  - **When** the history renders,
  - **Then** the promotion timeline is visible as read-only. Direct mutation endpoints return HTTP 403 Forbidden.

---

### User Story 11 (P2): Historical Compensation & Salary Revision Timeline
**BUILD-GUIDE ID**: `3.11`  
**Description**: As an HR Manager, I want to track historical salary adjustments and structure revisions in the employee profile, guarded strictly by permission so that financial compensation history is only accessible to authorized roles.

#### Acceptance Criteria:
- **Super Admin & HR Manager**:
  - **Given** viewing the Salary History subsection of an employee profile,
  - **When** the component requests compensation history,
  - **Then** past increments, effective dates, and revised base amounts are rendered.
- **Department Manager & Employee**:
  - **Given** a Department Manager or Employee inspecting the profile,
  - **When** the page loads,
  - **Then** the Salary History tab is completely hidden, and direct API requests to compensation history endpoints return HTTP 403 Forbidden.

---

### User Story 12 (P2): Skills Taxonomy & Tech Stack Tagging
**BUILD-GUIDE ID**: `3.12`  
**Description**: As an HR Manager or Employee, I want to assign skill tags and technical competencies (`skills: [String]`) to employee profiles so that the organization can search and filter talent by technology stack.

#### Acceptance Criteria:
- **Employee**:
  - **Given** an employee updating their personal competencies,
  - **When** submitting `PATCH /api/v1/employees/me/skills` with `['React', 'Node.js', 'MongoDB', 'Docker']`,
  - **Then** the tags are sanitized and saved to `employee.skills`.
- **HR Manager & Department Manager**:
  - **Given** searching the employee directory with `?skill=React`,
  - **When** the query executes,
  - **Then** only employees tagged with the skill are returned in the filtered list.

---

### User Story 13 (P1): Excel Bulk Employee Ingestion & Row-Level Error Reporting
**BUILD-GUIDE ID**: `3.13`  
**Description**: As an HR Manager, I want to upload an Excel spreadsheet (`.xlsx`) to bulk import employee records, with row-by-row validation, transactional creation, and a downloadable error report for invalid rows so that large cohorts can be onboarded without manual data entry.

#### Acceptance Criteria:
- **HR Manager & Super Admin**:
  - **Given** an Excel file containing 50 employee rows where 45 rows have valid data and 5 rows have duplicate emails or invalid CNIC numbers,
  - **When** HR uploads the file via `POST /api/v1/employees/import`,
  - **Then** the server parses the sheet using ExcelJS, imports the 45 valid rows into MongoDB, logs `employee.import`, and returns a detailed summary: `{ totalRows: 50, successCount: 45, errorCount: 5, errors: [{ row: 12, column: 'cnic', message: 'Invalid CNIC format' }, ...] }`.
- **Department Manager & Employee**:
  - **Given** non-admin users attempting to call `/employees/import`,
  - **When** the route executes,
  - **Then** the server returns HTTP 403 Forbidden.

---

### User Story 14 (P1): Employee Directory Excel Export
**BUILD-GUIDE ID**: `3.14`  
**Description**: As an HR Manager or Super Admin, I want to export the filtered employee directory to a formatted Excel file (`.xlsx`) so that offline reporting and compliance submissions are supported.

#### Acceptance Criteria:
- **HR Manager & Super Admin**:
  - **Given** an authenticated user with `report.export` permission,
  - **When** requesting `GET /api/v1/employees/export?departmentId=&status=active`,
  - **Then** the server generates a styled Excel workbook with column headers (Code, Name, Email, Phone, Department, Designation, Status, Joining Date) and streams it with headers `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and `Content-Disposition: attachment; filename="employees-export.xlsx"`.
- **Employee**:
  - **Given** an Employee attempting to export the directory,
  - **When** evaluated,
  - **Then** the request is rejected with HTTP 403 Forbidden.

---

### User Story 15 (P1): Self-Service "My Profile" Portal
**BUILD-GUIDE ID**: `3.15`  
**Description**: As an Employee, I want a dedicated "My Profile" self-service page (`GET /api/v1/employees/me`) to view my personal details, job designation, assigned shift, manager, and documents so that I have full visibility into my company record.

#### Acceptance Criteria:
- **Employee**:
  - **Given** an authenticated employee navigating to `/my-profile`,
  - **When** `GET /api/v1/employees/me` executes using `req.user.employeeId`,
  - **Then** their complete verified record is returned, displaying their manager, department head, shift hours, and document vault.
- **Unauthenticated Visitor**:
  - **Given** an unauthenticated request to `/api/v1/employees/me`,
  - **When** processed,
  - **Then** the request returns HTTP 401 Unauthorized.

---

### User Story 16 (P2): Sensitive Field Profile Change Request Workflow
**BUILD-GUIDE ID**: `3.16`  
**Description**: As an Employee, I want to submit change requests for sensitive personal or banking details (phone, address, emergency contact, bank IBAN) that require HR Manager review and approval before mutating the official employee record so that data integrity is maintained.

#### Acceptance Criteria:
- **Employee**:
  - **Given** an employee wanting to update their Bank IBAN or Emergency Contact,
  - **When** submitting `POST /api/v1/employees/me/change-request` with `{ field: 'bankDetails', requestedValue: { bankName: 'Meezan Bank', iban: 'PK12MEZN0000112233445566' }, reason: 'Switched salary account' }`,
  - **Then** a `ProfileChangeRequest` document is created with status `pending`, notifying HR.
- **HR Manager & Super Admin**:
  - **Given** pending profile change requests,
  - **When** HR reviews the change and submits `PATCH /api/v1/change-requests/:id/decide` with `{ action: 'approved' }`,
  - **Then** the requested changes are applied to the `Employee` model, the request status transitions to `approved`, an audit log is created, and the employee receives an in-app notification.
  - **When** HR submits `{ action: 'rejected', rejectionReason: 'Invalid IBAN title match' }`,
  - **Then** the employee record remains unchanged and the employee is notified with the rejection reason.

---

### User Story 17 (P2): Automated Probation Period Expiry Alerts
**BUILD-GUIDE ID**: `3.17`  
**Description**: As an HR Manager, I want the system to monitor upcoming probation end dates and trigger notifications 7 days before an employee's probation expires so that HR and managers can conduct timely performance reviews.

#### Acceptance Criteria:
- **System Job (`jobs/probation.job.js`)**:
  - **Given** active employees whose `probationEndDate` is exactly 7 days in the future,
  - **When** the scheduled cron job runs daily at 09:00 PKT,
  - **Then** system notifications and emails are dispatched to the HR Manager and the employee's direct reporting manager with details of the upcoming probation milestone.

---

## 4. BUILD-GUIDE ID Coverage Verification Table

| BUILD-GUIDE ID | User Story Number | Priority | Feature Description | Core Components & Routes |
| :---: | :---: | :---: | :--- | :--- |
| **3.1** | **User Story 1** | **P1** | Employee Model & AES-256-GCM Encryption | `employee.model.js`, `utils/crypto.js` |
| **3.2** | **User Story 2** | **P1** | Employee Add & User Account Creation | `POST /api/v1/employees`, `EmployeeFormPage.jsx` |
| **3.3** | **User Story 3** | **P1** | Pakistani CNIC Validation (13-digit) & Expiry | Zod refinement, masked UI input |
| **3.4** | **User Story 4** | **P1** | Scoped Employee Directory, Search & Filters | `GET /api/v1/employees`, `EmployeeListPage.jsx` |
| **3.5** | **User Story 5** | **P1** | Profile View with Modular Tabs & Field Filter | `GET /api/v1/employees/:id`, `EmployeeProfilePage.jsx` |
| **3.6** | **User Story 6** | **P1** | Profile Edit & Audit Trail | `PATCH /api/v1/employees/:id`, `auditLogs` integration |
| **3.7** | **User Story 7** | **P1** | Status Lifecycle & Account Revocation | `PATCH /api/v1/employees/:id/status`, User deactivation |
| **3.8** | **User Story 8** | **P1** | Employee Archival & Soft Delete | `DELETE /api/v1/employees/:id` (`isDeleted: true`) |
| **3.9** | **User Story 9** | **P1** | Employee Document Vault | `POST/DELETE /api/v1/employees/:id/documents` |
| **3.10** | **User Story 10** | **P2** | Career & Promotional Job History | `employeeHistory.model.js`, `POST /:id/history` |
| **3.11** | **User Story 11** | **P2** | Salary Revision History (Permission Guarded) | `GET /api/v1/employees/:id/salary-history` |
| **3.12** | **User Story 12** | **P2** | Skills Taxonomy & Tech Stack Tagging | `employee.skills[]`, `PATCH /me/skills` |
| **3.13** | **User Story 13** | **P1** | Excel Bulk Ingestion with Row-Level Errors | `POST /api/v1/employees/import`, ExcelJS |
| **3.14** | **User Story 14** | **P1** | Employee Directory Excel Export | `GET /api/v1/employees/export`, ExcelJS |
| **3.15** | **User Story 15** | **P1** | Self-Service "My Profile" Portal | `GET /api/v1/employees/me`, `MyProfilePage.jsx` |
| **3.16** | **User Story 16** | **P2** | Sensitive Field Profile Change Request Workflow | `profileChangeRequest.model.js`, `ChangeRequestsPage.jsx` |
| **3.17** | **User Story 17** | **P2** | Automated Probation Expiry Alerts | `jobs/probation.job.js`, Notification dispatch |

**Verification Confirmation**: Exactly 17 of 17 BUILD-GUIDE rows (IDs 3.1 through 3.17) are mapped to user stories with zero omission.
