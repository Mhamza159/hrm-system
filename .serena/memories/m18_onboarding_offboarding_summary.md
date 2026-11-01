# Module M18: Onboarding & Offboarding Lifecycle Summary

## Status
- **Status**: Completed (BUILD-GUIDE Section 21 · Rows 18.1 to 18.11)
- **Branch**: feature/19-onboarding-offboarding
- **E2E Tests**: 25/25 Passed (backend/tests/m18.onboarding.e2e.test.js)

## Data Models
1. **ChecklistTemplate** (`backend/src/models/checklistTemplate.model.js`):
   - Configures reusable task workflows for `onboarding` and `offboarding`.
   - Fields: `name`, `type`, `departmentId`, `tasks[{ title, description, category, roleAssignee, dueDaysOffset, isMandatory }]`, `isActive`, `createdBy`.
2. **Checklist** (`backend/src/models/checklist.model.js`):
   - Instantiated workflow tracking progress percent, task assignees, and completion dates.
   - Fields: `employeeId`, `templateId`, `type`, `status`, `progressPercent`, `startDate`, `completedDate`, `tasks[{ title, description, category, roleAssignee, ownerId, dueDate, completed, completedAt, completedBy, notes }]`.
3. **Resignation** (`backend/src/models/resignation.model.js`):
   - Formal resignation lifecycle tracking submission, manager decision, notice period calculation, and official last working day.
   - Partial unique index on `{ employeeId: 1 }` where status in `['submitted', 'accepted']` and `isDeleted: false` prevents concurrent double submissions.
4. **ExitInterview** (`backend/src/models/exitInterview.model.js`):
   - Confidential feedback questionnaire restricted exclusively to HR Manager and Super Admin.

## Permissions (PBAC)
- `onboard.view`: View onboarding templates and instances (scopes: `own`, `department`, `company`).
- `onboard.manage`: Author templates, manage instances, mark tasks complete.
- `resignation.submit`: Submit formal resignation (`own`).
- `offboard.view`: View resignations and offboarding checklist status.
- `offboard.manage`: Accept/reject resignations, sign off exit clearances, trigger deactivation, view exit interviews.

## Integration Decisions
1. **Employee Onboarding Hook**: `employee.service.js:createEmployee` invokes `initOnboardingForEmployee` to instantiate checklist template automatically.
2. **Asset Return Assertion**: `onboarding.service.js` invokes `assertEmployeeAssetClearance` (M23) before allowing HR exit clearance sign-off.
3. **Automated Deactivation Job**: `backend/src/jobs/deactivate.job.js` deactivates user accounts and revokes refresh tokens on their official last working day.
4. **Final Settlement Aggregation**: `getEmployeeSettlementSummary` aggregates prorated base salary, outstanding loan balances (M10), and leave encashment calculations (M6) to feed into M9 Payroll Final Settlement.
5. **PDF Streaming**: Official Experience and Relieving letters generated dynamically via `pdfkit` once exit clearances are complete.
