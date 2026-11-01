# Feature Specification: Module M18 — Onboarding & Offboarding

**Feature Branch**: `feature/19-onboarding-offboarding`  
**Created**: 2026-11-01  
**Status**: Ready for Plan  
**Module Reference**: Module M18 (BUILD-GUIDE Section 21 · Rows 18.1 to 18.11)  
**Functional Requirements Source**: `docs/FRD.md` (Section M18 & Permission Matrix Row 406)  

---

## 1. Executive Summary & Domain Scope

Module M18 governs the complete entry and exit lifecycle of employees within the HRM system. It automates welcoming and provisioning new hires through structured task checklists and ensures safe, legally compliant departures through formal resignation management, departmental handover clearance, asset recovery, automated relieving/experience letters, and automated account deactivation on the employee's last working day.

---

## 2. Prioritized User Stories & Acceptance Criteria

### User Story 1 — Checklist Template Master Authoring (BUILD-GUIDE Row 18.1 · Priority: P1)

**Description**:  
As an **HR Manager** or **Super Admin**, I want to author reusable checklist templates for both *Onboarding* and *Offboarding*, so that every employee joining or leaving the organization undergoes a consistent, structured, and auditable process.

**Why this priority**:  
Templates form the blueprint for all operational checklists. Without templates, automated checklist generation cannot function.

**Independent Test**:  
Can be tested independently by creating an onboarding template with 5 department-specific tasks (e.g., IT provisioning, HR document submission, security badge, manager intro) and verifying that it is saved and retrieved in `ChecklistTemplatesPage.jsx`.

**Acceptance Scenarios**:
1. **Given** an authenticated HR Manager or Super Admin with `onboard.manage` permission, **When** they submit a checklist template with name, type (`onboarding` or `offboarding`), department filter (optional/all), and an array of items (`title`, `description`, `roleOwner` / default owner, `daysToComplete`), **Then** the template is persisted in `checklistTemplate.model.js` with status 201 Created.
2. **Given** an authenticated Department Manager, **When** they attempt to create, modify, or delete a checklist template, **Then** the request is rejected with HTTP 403 Forbidden.
3. **Given** an authenticated Employee, **When** they attempt to access template management endpoints, **Then** the request is rejected with HTTP 403 Forbidden.

---

### User Story 2 — Automated Onboarding Checklist Generation (BUILD-GUIDE Row 18.2 · Priority: P1)

**Description**:  
As an **HR Manager**, when a new employee is registered (BUILD-GUIDE Row 3.2), the system must automatically instantiate an active employee onboarding checklist from the matching department template, populating actionable tasks for IT, HR, the department manager, and the new hire.

**Why this priority**:  
Core automation that eliminates manual onboarding setup and prevents missing essential provisioning tasks.

**Independent Test**:  
Can be tested by creating an employee record and verifying that an `OnboardingProcess` instance is created with all template tasks instantiated and mapped to the new hire.

**Acceptance Scenarios**:
1. **Given** a new employee record created via `employee.service.js:createEmployee()`, **When** the employee is saved, **Then** the onboarding engine looks up the matching active onboarding template for the employee's department (or global fallback) and generates an active checklist instance.
2. **Given** an active onboarding process, **When** the Super Admin or HR Manager views `OnboardingPage.jsx`, **Then** they see the list of all employees in onboarding, their overall completion percentage, pending tasks, and assigned owners.
3. **Given** a Department Manager, **When** they view `OnboardingPage.jsx`, **Then** they only see onboarding instances for new hires belonging to their assigned department.
4. **Given** an Employee, **When** they view their self-service dashboard, **Then** they see only the tasks assigned directly to them (e.g., upload documents, sign NDA).

---

### User Story 3 — Task Ownership, Due Dates & Overdue Alerts (BUILD-GUIDE Row 18.3 · Priority: P1)

**Description**:  
As a **Task Owner** (HR officer, IT admin, Manager, or Employee), I want to see my assigned onboarding/offboarding tasks in `MyTasksPage.jsx` with clear due dates, mark them complete, and receive alerts if any task is overdue.

**Why this priority**:  
Ensures accountability and SLA tracking across departments for equipment provisioning and account access.

**Independent Test**:  
Can be tested by assigning a task with due date $T+2$ days, marking it complete, and verifying completion timestamp and owner record.

**Acceptance Scenarios**:
1. **Given** an onboarding or offboarding task assigned to a specific user (`ownerId`), **When** that user views `MyTasksPage.jsx`, **Then** all tasks pending their action are displayed ordered by due date.
2. **Given** an assigned task, **When** the assigned owner marks the task as completed (`PATCH /onboarding/tasks/:taskId/complete`), **Then** the task state updates to `completed: true`, sets `completedAt`, records `completedBy`, and recalculates the overall checklist progress percentage.
3. **Given** a task whose due date has passed without completion, **When** the daily task reminder job runs, **Then** high-priority notifications are dispatched to the task owner and escalating to the HR Manager.

---

### User Story 4 — Automated New-Hire Welcome & Orientation Dispatch (BUILD-GUIDE Row 18.4 · Priority: P2)

**Description**:  
As a **New Hire**, upon successful account activation, I want to receive an automated welcome email containing company orientation information, portal login instructions, and my onboarding checklist link.

**Why this priority**:  
First impressions matter for employee experience and self-service onboarding velocity.

**Independent Test**:  
Can be tested by triggering the welcome email service and verifying email payload format, credentials instructions, and link to `/onboarding/my`.

**Acceptance Scenarios**:
1. **Given** an onboarding checklist generated for a new hire with a valid email, **When** onboarding is initiated, **Then** the system renders the company welcome template (from M2 Company Settings) and dispatches it via `email.service.js`.
2. **Given** an HR Manager, **When** inspecting onboarding detail, **Then** they can manually re-trigger the welcome email if delivery previously failed.

---

### User Story 5 — Employee Resignation Submission (BUILD-GUIDE Row 18.5 · Priority: P1)

**Description**:  
As an **Employee**, I want to formally submit my resignation via the self-service portal (`ResignationPage.jsx`), specifying my proposed last working day, reason, and transition comments, so that my departure is formally tracked.

**Why this priority**:  
Initiates the offboarding lifecycle with immutable audit timestamps and statutory notice tracking.

**Independent Test**:  
Can be tested by submitting a resignation as an employee, asserting that status becomes `submitted`, and checking that the manager and HR receive notifications.

**Acceptance Scenarios**:
1. **Given** an authenticated Employee with `offboard.own` permission, **When** they submit a resignation form (`POST /api/v1/resignations`) with `intendedLastWorkingDay`, `reason`, and `comments`, **Then** a resignation record is created with `status: 'submitted'` and notifications are dispatched to their Department Manager and HR.
2. **Given** an Employee with an already pending or approved resignation, **When** they attempt to submit a duplicate resignation, **Then** the system rejects the submission with HTTP 400 Bad Request.
3. **Given** a Department Manager or HR Manager, **When** a resignation is submitted by a subordinate, **Then** they receive an in-app and email alert linking directly to the decision screen.

---

### User Story 6 — Resignation Decision & Notice Period Management (BUILD-GUIDE Row 18.6 · Priority: P1)

**Description**:  
As a **Department Manager** or **HR Manager / Super Admin**, I want to review submitted resignations, accept or reject them, adjust the official `lastWorkingDay` based on employment contract notice periods, or approve early release.

**Why this priority**:  
Legal and contractual gate: locks the official final day of employment for payroll, handover, and system deactivation.

**Independent Test**:  
Can be tested by deciding a resignation via `PATCH /api/v1/resignations/:id/decide` with status `accepted` and verifying `lastWorkingDay` is set and employee status changes to `Notice`.

**Acceptance Scenarios**:
1. **Given** an active resignation in `submitted` state, **When** the Department Manager (for team members) or HR Manager / Super Admin approves it with official `lastWorkingDay` and notice period waiver notes, **Then** the resignation transitions to `accepted`, the employee's status in `employee.model.js` updates to `'Notice'`, and an offboarding checklist is automatically triggered.
2. **Given** a resignation of senior staff or executive grade, **When** approval is evaluated, **Then** only Super Admin has authority to accept the resignation.
3. **Given** an Employee, **When** they attempt to approve their own resignation, **Then** the request is blocked with HTTP 403 Forbidden.

---

### User Story 7 — Cross-Departmental Exit Clearance & Asset Return Lock (BUILD-GUIDE Row 18.7 · Priority: P1)

**Description**:  
As an **HR Manager**, I want an exit clearance checklist spanning IT (account revocation), Finance (loans/advances clearance), Department (knowledge handover), and Administration (asset recovery), with a strict system lock that blocks finalizing clearance if active company assets are still held.

**Why this priority**:  
Prevents corporate asset theft, data leakage, and uncollected company debts. Directly integrates with Module M23 Asset Management and Module M10 Loans.

**Independent Test**:  
Can be tested by attempting to finalize offboarding clearance while an asset is assigned to the employee; asserting that the system throws HTTP 400, and allows clearance only after the asset is returned.

**Acceptance Scenarios**:
1. **Given** an offboarding clearance checklist in progress, **When** the administrator attempts to sign off on exit clearance, **Then** the system invokes `assertEmployeeAssetClearance(employeeId)` (from M23 Asset Service).
2. **Given** an employee holding active company equipment (e.g. laptop, monitor), **When** exit clearance is submitted, **Then** the clearance fails with HTTP 400 and lists the specific unreturned asset tags.
3. **Given** all assets returned and all departmental items signed off (`IT`, `Finance`, `Department`, `HR`), **When** clearance is approved, **Then** the offboarding process transitions to `cleared`.

---

### User Story 8 — Confidential Exit Interview Questionnaire (BUILD-GUIDE Row 18.8 · Priority: P2)

**Description**:  
As an **Offboarding Employee**, I want to complete a confidential exit interview form (`ExitInterviewForm.jsx`) assessing company culture, management feedback, compensation sentiment, and primary reasons for leaving.

**Why this priority**:  
Provides critical HR feedback and feeds into the Phase 3 Attrition & Retention model (M17).

**Independent Test**:  
Can be tested by submitting exit interview responses as an employee, and asserting HR Managers can review aggregated and individual responses while direct managers are restricted.

**Acceptance Scenarios**:
1. **Given** an employee serving notice period, **When** they submit `POST /api/v1/exit-interviews` with Likert-scale ratings and text feedback, **Then** the response is saved in `exitInterview.model.js`.
2. **Given** an HR Manager or Super Admin, **When** viewing the employee's offboarding record, **Then** the exit interview response is accessible.
3. **Given** a Department Manager, **When** attempting to read exit interview feedback for their subordinate, **Then** access is restricted (HTTP 403) to preserve candid employee feedback.

---

### User Story 9 — Final Settlement Integration Linkage (BUILD-GUIDE Row 18.9 · Priority: P1)

**Description**:  
As an **HR / Payroll Officer**, I want a one-click transition from approved exit clearance to Module M9 Final Settlement (Row 9.13), calculating prorated salary for worked days in the final month, encashment of unused leave balances, and deduction of unpaid loan balances.

**Why this priority**:  
Guarantees Pakistan statutory compliance (payment within statutory final settlement window) and closes the loop between HR operations and finance.

**Independent Test**:  
Can be tested by verifying that an employee with status `cleared` generates a final settlement payload with prorated earnings and loan deduction offsets.

**Acceptance Scenarios**:
1. **Given** an employee whose offboarding clearance is marked `cleared`, **When** the HR officer navigates to Final Settlement, **Then** the system surfaces the settlement button pre-populating final working day, unpaid loan balances (M10), and encashable leave days (M6).
2. **Given** an offboarding process that is NOT yet cleared, **When** attempting to generate final settlement, **Then** the action is blocked with an informative message.

---

### User Story 10 — Automated Experience & Relieving Letter PDF Generation (BUILD-GUIDE Row 18.10 · Priority: P2)

**Description**:  
As an **Employee** or **HR Manager**, upon successful clearance, I want to download official, branded PDF documents (`Experience Letter` and `Relieving Letter`) streamed via `PDFKit` with verified joining date, designation, and exit date.

**Why this priority**:  
Standard corporate documentation required by departing staff for new employers.

**Independent Test**:  
Can be tested by requesting `GET /api/v1/employees/:id/letters/experience` and verifying HTTP 200 with `Content-Type: application/pdf` and valid PDF stream headers.

**Acceptance Scenarios**:
1. **Given** an employee whose exit clearance is approved, **When** they or HR request `GET /api/v1/employees/:id/letters/relieving`, **Then** the server renders an official PDF letter using `pdfkit`, streams it with `Content-Disposition: attachment; filename="relieving-letter-...pdf"`, and includes corporate header, employee code, designation, joining date, and last working day.
2. **Given** an employee whose exit is NOT cleared, **When** requesting letters, **Then** the server rejects the request with HTTP 400 Bad Request ("Exit clearance must be completed before issuing letters").

---

### User Story 11 — Automated Account Deactivation on Last Working Day (BUILD-GUIDE Row 18.11 · Priority: P1)

**Description**:  
As a **Security Officer / System**, I want a nightly automated background job (`jobs/deactivate.job.js`) that checks for employees whose `lastWorkingDay` has passed, automatically deactivates their user account, revokes all active refresh tokens, and transitions employee status to `'Resigned'` / `'Terminated'`.

**Why this priority**:  
Critical perimeter security requirement preventing former employees from accessing company portals or APIs post-departure.

**Independent Test**:  
Can be tested by scheduling an employee with `lastWorkingDay = yesterday`, triggering the deactivation job, and asserting that `user.isActive` becomes `false`, refresh tokens are purged, and subsequent login attempts fail with HTTP 401.

**Acceptance Scenarios**:
1. **Given** an employee with accepted resignation and `lastWorkingDay <= today`, **When** the nightly deactivation job runs, **Then** the system sets `employee.status = 'Resigned'`, sets linked `user.isActive = false`, nullifies `user.refreshTokenHash`, and records an audit log entry.
2. **Given** a deactivated user account, **When** the ex-employee attempts to login, **Then** authentication is rejected with HTTP 401 ("Account is deactivated").

---

## 3. Official Context7 Library Syntax Patterns

### 3.1 PDFKit Dynamic Streaming Syntax (`/foliojs/pdfkit`)

```javascript
import PDFDocument from 'pdfkit';

/**
 * Generate official corporate letter and stream directly to Express response
 */
export const generateLetterStream = (res, { title, employee, company, content, letterType }) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Stream output directly into Express HTTP response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${letterType}-${employee.employeeCode}.pdf"`
  );
  doc.pipe(res);

  // Corporate Header
  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .text(company.name.toUpperCase(), { align: 'center' });
  doc
    .fontSize(10)
    .font('Helvetica')
    .text(company.address || 'Corporate Headquarters', { align: 'center' })
    .moveDown(2);

  // Date & Reference
  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Date: ${new Date().toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' })}`)
    .text(`Ref: ${letterType.toUpperCase()}/${employee.employeeCode}/${new Date().getFullYear()}`)
    .moveDown(2);

  // Title
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(title.toUpperCase(), { align: 'center', underline: true })
    .moveDown(1.5);

  // Body
  doc
    .fontSize(11)
    .font('Helvetica')
    .text(content, {
      align: 'justify',
      lineGap: 4,
      paragraphGap: 10
    })
    .moveDown(3);

  // Signatures
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Authorized Signatory')
    .font('Helvetica')
    .text(company.name)
    .text('Human Resources Department');

  // Finalize document stream
  doc.end();
};
```

### 3.2 Zod Runtime Validation Patterns (`/colinhacks/zod`)

```javascript
import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

export const createChecklistTemplateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3).max(100),
    type: z.enum(['onboarding', 'offboarding']),
    departmentId: objectIdSchema.nullable().optional(),
    tasks: z.array(
      z.object({
        title: z.string().trim().min(3).max(150),
        description: z.string().trim().max(500).optional().default(''),
        category: z.enum(['it', 'hr', 'department', 'finance', 'admin']),
        roleAssignee: z.enum(['employee', 'manager', 'hr', 'it_admin']),
        dueDaysOffset: z.number().int().min(0).max(90).default(3)
      })
    ).min(1, 'Checklist template must have at least one task')
  })
});

export const submitResignationSchema = z.object({
  body: z.object({
    intendedLastWorkingDay: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    reason: z.enum([
      'better_opportunity',
      'career_change',
      'higher_education',
      'personal_reasons',
      'relocation',
      'health_reasons',
      'other'
    ]),
    comments: z.string().trim().min(10, 'Please provide transition notes or reason details').max(1000)
  })
});
```

---

## 4. Role-Wise Permission Matrix (Module M18)

Conforming strictly to `docs/FRD.md` Section 11:

| Operation | Super Admin | HR Manager | Department Manager | Employee |
|---|:---:|:---:|:---:|:---:|
| **Checklist Templates** | Full (Manage) | Full (Manage) | None (403) | None (403) |
| **Onboarding Run** | All | All | Team (Own Department) | Own Tasks Only |
| **Resignation Submission** | Direct | Direct | Direct | Own (`POST /resignations`) |
| **Resignation Decision** | Senior / All | All Staff | Team Members Only | None (403) |
| **Exit Clearance** | All (Final Sign) | All (Final Sign) | Team Handover Sign | View Progress |
| **Exit Interview** | Full View | Full View | Restricted (403) | Submit Own |
| **Letters Download** | Any Employee | Any Employee | Team (with notice) | Own Approved Letters |
| **Deactivation Job** | Trigger / View | Trigger / View | None | None |

---

## 5. Non-Functional & Security Constraints

1. **Horizontal PBAC Scoping**: Department managers must never view, approve, or sign off on resignations or onboarding instances outside their assigned department.
2. **Confidentiality of Exit Interviews**: Department Managers must NOT be able to view exit interview text of departing team members to avoid retaliation and protect candid feedback.
3. **Asset Invariant Check**: The exit checklist cannot be marked completed if `assertEmployeeAssetClearance(employeeId)` reveals unreturned hardware.
4. **Idempotent Deactivation**: The nightly deactivation cron must be idempotent; multiple executions on the same day must not corrupt audit trails or state.
5. **PDF Streaming Security**: PDFs are rendered dynamically into memory streams and piped to HTTP response headers. No temporary unencrypted PDF files are written to public directories.

