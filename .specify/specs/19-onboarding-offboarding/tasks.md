# Implementation Tasks: Module M18 — Onboarding & Offboarding

**Feature Branch**: `feature/19-onboarding-offboarding`  
**Specification**: [`.specify/specs/19-onboarding-offboarding/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/19-onboarding-offboarding/spec.md)  
**Architecture Plan**: [`.specify/specs/19-onboarding-offboarding/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/19-onboarding-offboarding/plan.md)  
**Target BUILD-GUIDE**: Section 21 (Rows 18.1 to 18.11)  

---

## Task Execution Checklist (Vertical Slice Order)

### Phase 0: Permission Catalogue & Seed Setup
- [x] **18.0-PERM**: Add `onboard.view`, `onboard.manage`, `resignation.submit`, `offboard.view`, and `offboard.manage` to `backend/src/shared/permissions.js` and assign appropriate default scopes to Super Admin, HR Manager, Department Manager, and Employee in `backend/src/seed/roles.seed.js`.

---

### Slice 1: Checklist Template Master Authoring (BUILD-GUIDE Row 18.1 · Priority: P1)
- [x] **18.1-BE-MODEL**: Create `backend/src/models/checklistTemplate.model.js` with fields (`name`, `type: ['onboarding', 'offboarding']`, `departmentId`, `tasks[{ title, description, category, roleAssignee, dueDaysOffset, isMandatory }]`, `isActive`, `createdBy`) and unique name index.
- [x] **18.1-BE-VAL**: Create `backend/src/modules/onboarding/onboarding.validation.js` with Zod schemas `createChecklistTemplateSchema`, `updateChecklistTemplateSchema`, and route parameter `objectIdSchema`.
- [x] **18.1-BE-SERVICE**: Implement `createChecklistTemplate`, `getChecklistTemplates`, `getChecklistTemplateById`, `updateChecklistTemplate`, and `deleteChecklistTemplate` in `backend/src/modules/onboarding/onboarding.service.js` with audit logging.
- [x] **18.1-BE-ROUTE**: Create `backend/src/modules/onboarding/onboarding.controller.js` and `backend/src/modules/onboarding/onboarding.routes.js` with endpoints:
  - `GET /api/v1/onboarding/templates` (`checkPermission('onboard.view')`)
  - `POST /api/v1/onboarding/templates` (`checkPermission('onboard.manage')`)
  - `GET /api/v1/onboarding/templates/:id` (`checkPermission('onboard.view')`)
  - `PUT /api/v1/onboarding/templates/:id` (`checkPermission('onboard.manage')`)
  - `DELETE /api/v1/onboarding/templates/:id` (`checkPermission('onboard.manage')`)
  Mount routes in `backend/src/app.js`.
- [x] **18.1-FE-API**: Create `frontend/src/features/onboarding/onboardingApi.js` with RTK Query endpoints for checklist template CRUD and tag `['ChecklistTemplates']`.
- [x] **18.1-FE-UI**: Build `frontend/src/features/onboarding/pages/ChecklistTemplatesPage.jsx` and `components/ChecklistTemplateModal.jsx` displaying template list, task items builder, and department filter.
- [x] **18.1-FE-NAV**: Register `/onboarding/templates` route in `frontend/src/App.jsx` and add "Checklist Templates" under "Lifecycle" in `frontend/src/components/layout/Sidebar.jsx` guarded by `onboard.manage`.
- [x] **18.1-TEST**: Automated test asserting template creation, task array validation, duplicate name rejection (HTTP 409), and role permission checks.

---

### Slice 2: Automated Employee Onboarding Checklist Ingestion (BUILD-GUIDE Row 18.2 · Priority: P1)
- [x] **18.2-BE-MODEL**: Create `backend/src/models/checklist.model.js` with fields (`employeeId`, `templateId`, `type`, `status: ['pending', 'in_progress', 'completed', 'cancelled']`, `progressPercent`, `startDate`, `completedDate`, `tasks[{ title, description, category, roleAssignee, ownerId, dueDate, completed, completedAt, completedBy, notes }]`, `isDeleted`).
- [x] **18.2-BE-SERVICE**: Implement `initOnboardingForEmployee({ employee, templateId })` in `onboarding.service.js` resolving task owners (matching department head for manager tasks, employee for self tasks, HR for admin tasks) and due dates. Integrate hook into `employee.service.js:createEmployee()`.
- [x] **18.2-BE-ROUTE**: Register routes `GET /api/v1/onboarding` and `GET /api/v1/onboarding/:id` in `onboarding.routes.js` with horizontal scoping (Department Manager sees department subordinates; HR sees all).
- [x] **18.2-FE-API**: Add `getOnboardingInstances` and `getOnboardingById` queries in `onboardingApi.js`.
- [x] **18.2-FE-UI**: Build `frontend/src/features/onboarding/pages/OnboardingPage.jsx` displaying active employee onboarding progress cards, completion percentages, pending task counts, and detail view.
- [x] **18.2-FE-NAV**: Register `/onboarding` route in `App.jsx` and add "Onboarding" in `Sidebar.jsx`.
- [x] **18.2-TEST**: Automated test asserting that creating an employee automatically instantiates the checklist instance with calculated task due dates and mapped owners.

---

### Slice 3: Task Ownership, Due Dates & Completion Tracking (BUILD-GUIDE Row 18.3 · Priority: P1)
- [x] **18.3-BE-VAL**: Add `completeTaskSchema` in `onboarding.validation.js` with optional completion notes.
- [x] **18.3-BE-SERVICE**: Implement `completeChecklistTask({ checklistId, taskId, user, notes })` atomically updating task completion state, recalculating overall progress percentage, and triggering notification to HR. Implement `getMyAssignedTasks({ user })` filtering by `ownerId: user._id`.
- [x] **18.3-BE-ROUTE**: Register endpoints:
  - `GET /api/v1/onboarding/tasks/my` (`checkPermission('onboard.view', 'own')`)
  - `PATCH /api/v1/onboarding/tasks/:taskId/complete` (`checkPermission('onboard.view')`)
- [x] **18.3-FE-API**: Add `getMyTasks` and `completeTask` endpoints in `onboardingApi.js`.
- [x] **18.3-FE-UI**: Build `frontend/src/features/onboarding/pages/MyTasksPage.jsx` displaying tasks assigned to logged-in user with due-date badges (overdue in red, upcoming in amber), filter by status, and one-click completion button.
- [x] **18.3-FE-NAV**: Register `/onboarding/my-tasks` in `App.jsx` and add "My Lifecycle Tasks" in `Sidebar.jsx`.
- [x] **18.3-TEST**: Automated test verifying task completion updates progress percentage, blocks non-owners from completing other users' tasks without `onboard.manage`, and sorts by due date.

---

### Slice 4: Employee Resignation Submission (BUILD-GUIDE Row 18.5 · Priority: P1)
- [x] **18.5-BE-MODEL**: Create `backend/src/models/resignation.model.js` with attributes (`employeeId`, `submissionDate`, `intendedLastWorkingDay`, `officialLastWorkingDay`, `reason`, `comments`, `status: ['submitted', 'accepted', 'rejected', 'withdrawn']`, `decidedBy`, `decidedAt`, `noticePeriodDays`, `rejectionReason`, `handoverEmployeeId`, `isDeleted`).
- [x] **18.5-BE-VAL**: Add `submitResignationSchema` in `onboarding.validation.js` validating valid date format and reason enums.
- [x] **18.5-BE-SERVICE**: Implement `submitResignation({ employeeId, resignationData, user })` blocking duplicate pending resignations, recording audit log, and notifying Department Manager and HR.
- [x] **18.5-BE-ROUTE**: Register `POST /api/v1/resignations` (`checkPermission('resignation.submit', 'own')`) and `GET /api/v1/resignations/my` in `onboarding.routes.js`.
- [x] **18.5-FE-API**: Add `submitResignation` mutation and `getMyResignation` query in `onboardingApi.js`.
- [x] **18.5-FE-UI**: Build `frontend/src/features/onboarding/pages/ResignationPage.jsx` and `components/ResignationModal.jsx` allowing employees to submit formal resignation, view current status badge, and review notice timeline.
- [x] **18.5-FE-NAV**: Register `/resignations` in `App.jsx` and add "Resignation" in `Sidebar.jsx`.
- [x] **18.5-TEST**: Automated test asserting employee resignation submission, duplicate submission rejection (HTTP 400), and notification triggers.

---

### Slice 5: Resignation Decision & Notice Period Management (BUILD-GUIDE Row 18.6 · Priority: P1)
- [x] **18.6-BE-VAL**: Add `decideResignationSchema` in `onboarding.validation.js` requiring status (`accepted` or `rejected`), official last working day, and decision notes.
- [x] **18.6-BE-SERVICE**: Implement `decideResignation({ id, decisionData, user })` updating resignation, setting `officialLastWorkingDay`, transitioning employee status to `'Notice'`, and auto-triggering offboarding clearance checklist.
- [x] **18.6-BE-ROUTE**: Register endpoints:
  - `GET /api/v1/resignations` (`checkPermission('offboard.view')`)
  - `PATCH /api/v1/resignations/:id/decide` (`checkPermission('offboard.manage')`)
- [x] **18.6-FE-API**: Add `getResignations` query and `decideResignation` mutation in `onboardingApi.js`.
- [x] **18.6-FE-UI**: Add manager/HR review queue on `ResignationPage.jsx` with "Accept" / "Reject" decision modal, date picker for official last working day, and notice period calculation.
- [x] **18.6-TEST**: Automated test asserting manager can only decide resignations for their department, employee status transitions to `'Notice'`, and Super Admin override for senior staff.

---

### Slice 6: Cross-Departmental Exit Clearance & Asset Return Lock (BUILD-GUIDE Row 18.7 · Priority: P1)
- [x] **18.7-BE-VAL**: Add `exitClearanceSignoffSchema` in `onboarding.validation.js`.
- [x] **18.7-BE-SERVICE**: Implement `signoffDepartmentClearance({ checklistId, departmentCategory, user, notes })` verifying all department tasks. When final HR clearance is triggered, invoke `assertEmployeeAssetClearance(employeeId)` (M23); if company assets are unreturned, throw HTTP 400 listing unreturned asset tags.
- [x] **18.7-BE-ROUTE**: Register endpoints:
  - `GET /api/v1/offboarding` (`checkPermission('offboard.view')`)
  - `POST /api/v1/offboarding/:id/clear` (`checkPermission('offboard.manage')`)
- [x] **18.7-FE-API**: Add `getOffboardingChecklists` and `signoffExitClearance` endpoints in `onboardingApi.js`.
- [x] **18.7-FE-UI**: Build `frontend/src/features/onboarding/pages/OffboardingPage.jsx` and `components/ExitClearanceModal.jsx` displaying departmental clearance tabs (IT, Finance, Admin, HR), asset return status indicators, and final clearance sign-off button.
- [x] **18.7-FE-NAV**: Register `/offboarding` in `App.jsx` and add "Exit Clearance" in `Sidebar.jsx`.
- [x] **18.7-TEST**: Automated test asserting that exit clearance is rejected if employee holds active company assets, and succeeds once all equipment is returned.

---

### Slice 7: Final Settlement Linkage (BUILD-GUIDE Row 18.9 · Priority: P1)
- [x] **18.9-BE-SERVICE**: Implement `getEmployeeSettlementSummary(employeeId)` aggregating prorated final month earnings, leave encashment days (M6), and outstanding loan deductions (M10), preparing payload for M9 Final Settlement (Row 9.13).
- [x] **18.9-BE-ROUTE**: Register `GET /api/v1/offboarding/:id/settlement-summary` (`checkPermission('offboard.manage')`).
- [x] **18.9-FE-API**: Add `getSettlementSummary` endpoint in `onboardingApi.js`.
- [x] **18.9-FE-UI**: Add "Proceed to Final Settlement" link/button in `OffboardingPage.jsx` displayed when clearance status is `cleared`, redirecting to Payroll Final Settlement with pre-filled figures.
- [x] **18.9-TEST**: Automated test asserting settlement summary accurately reflects unpaid loan balance and encashable leaves for cleared staff.

---

### Slice 8: Automated Account Deactivation on Last Working Day (BUILD-GUIDE Row 18.11 · Priority: P1)
- [x] **18.11-BE-JOB**: Create `backend/src/jobs/deactivate.job.js` scanning employees with status `'Notice'` or accepted resignation where `officialLastWorkingDay <= today`. Sets linked `user.isActive = false`, purges `user.refreshTokenHash`, and transitions `employee.status = 'Resigned'` / `'Terminated'`.
- [x] **18.11-BE-ROUTE**: Register manual trigger endpoint `POST /api/v1/offboarding/trigger-deactivation` (`checkPermission('offboard.manage')`) for Super Admin verification.
- [x] **18.11-TEST**: Automated test verifying that running the deactivation job disables the user account, prevents subsequent login, and records audit logs.

---

### Slice 9: Automated New-Hire Welcome & Orientation Dispatch (BUILD-GUIDE Row 18.4 · Priority: P2)
- [x] **18.4-BE-SERVICE**: Implement `sendWelcomeEmail({ employee, onboardingInstance })` rendering corporate welcome template (M2) and sending credentials and checklist link via `email.service.js`.
- [x] **18.4-BE-ROUTE**: Register `POST /api/v1/onboarding/:id/welcome-email` (`checkPermission('onboard.manage')`).
- [x] **18.4-FE-UI**: Add "Resend Welcome Email" button in `OnboardingPage.jsx` detail card.
- [x] **18.4-TEST**: Automated test verifying welcome email trigger and template rendering with personalized employee details.

---

### Slice 10: Confidential Exit Interview Questionnaire (BUILD-GUIDE Row 18.8 · Priority: P2)
- [x] **18.8-BE-MODEL**: Create `backend/src/models/exitInterview.model.js` with fields (`employeeId`, `resignationId`, `submittedAt`, `ratings`, `primaryReason`, `feedbackManagement`, `feedbackCompany`, `wouldRecommend`, `isConfidential`).
- [x] **18.8-BE-VAL**: Add `submitExitInterviewSchema` in `onboarding.validation.js` with 1-5 integer rating validation.
- [x] **18.8-BE-SERVICE**: Implement `submitExitInterview` and `getExitInterviewByResignation` strictly restricting reading access to HR Manager and Super Admin (Department Managers receive HTTP 403).
- [x] **18.8-BE-ROUTE**: Register endpoints:
  - `POST /api/v1/exit-interviews` (`checkPermission('offboard.view', 'own')`)
  - `GET /api/v1/exit-interviews/:resignationId` (`checkPermission('offboard.manage')`)
- [x] **18.8-FE-API**: Add `submitExitInterview` and `getExitInterview` endpoints in `onboardingApi.js`.
- [x] **18.8-FE-UI**: Build `components/ExitInterviewModal.jsx` with 5-star ratings, candid feedback textareas, and confidential submission badge.
- [x] **18.8-TEST**: Automated test asserting exit interview submission and verifying Department Manager is blocked from viewing feedback (HTTP 403).

---

### Slice 11: Automated Experience & Relieving Letter PDF Generation (BUILD-GUIDE Row 18.10 · Priority: P2)
- [x] **18.10-BE-SERVICE**: Implement PDF generation using `pdfkit` in `onboarding.service.js` streaming official letterhead, corporate reference number, dates of service, and official signature block directly into response stream. Block generation if exit clearance is not yet completed.
- [x] **18.10-BE-ROUTE**: Register `GET /api/v1/employees/:id/letters/:type` (`checkPermission('offboard.view')`) validating `:type` enum (`experience` or `relieving`).
- [x] **18.10-FE-UI**: Build `components/LettersModal.jsx` with "Download Experience Letter" and "Download Relieving Letter" PDF download action buttons on `OffboardingPage.jsx`.
- [x] **18.10-TEST**: Automated test requesting PDF letter, verifying HTTP 200 with `Content-Type: application/pdf`, and asserting rejection if exit clearance is incomplete.

---

### Slice 12: End-to-End Multi-Role Playwright Test Suite
- [x] **18.12-TEST-E2E**: Module M18 end-to-end Playwright test, chaaron roles se (`Super Admin`, `HR Manager`, `Department Manager`, `Employee`) verifying template authoring, automatic onboarding checklist instantiation, task completion, employee resignation, notice period acceptance, asset return lock, experience letter PDF download, and final deactivation.

