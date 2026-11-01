# Module M18: Onboarding & Offboarding Lifecycle

## Overview
Module M18 covers comprehensive employee lifecycle onboarding and offboarding management (BUILD-GUIDE Section 21 · Rows 18.1 - 18.11).

## Models
- `ChecklistTemplate` (`checklistTemplate.model.js`): Reusable onboarding/offboarding templates with department filters, default flag, and itemized task definitions.
- `Checklist` (`checklist.model.js`): Instantiated checklist tied to an employee, with progress percentage, department clearance categories, and granular task completion status.
- `Resignation` (`resignation.model.js`): Employee resignation submission, manager/HR approval workflow, proposed/official last working days, and cancellation tracking.
- `ExitInterview` (`exitInterview.model.js`): Confidential exit survey feedback collected during notice period, restricted to HR/Super Admin review.

## Permissions Added
- `onboard.view`: View onboarding checklists and assigned tasks
- `onboard.manage`: Create/edit templates and manage onboarding checklists
- `resignation.submit`: Submit and track personal resignation
- `offboard.view`: View offboarding checklists and resignation requests
- `offboard.manage`: Decide resignations, clear checklist items, and generate letters

## Key APIs
- `GET /api/v1/onboarding/templates`, `POST /api/v1/onboarding/templates`, `PUT /api/v1/onboarding/templates/:id`
- `GET /api/v1/onboarding`, `GET /api/v1/onboarding/:id`, `PATCH /api/v1/onboarding/:id/tasks/:taskId`
- `GET /api/v1/onboarding/my-tasks`
- `POST /api/v1/resignations`, `GET /api/v1/resignations/my`, `GET /api/v1/resignations`, `PATCH /api/v1/resignations/:id/decide`
- `GET /api/v1/offboarding`, `GET /api/v1/offboarding/:id`, `PATCH /api/v1/offboarding/:id/clearance`
- `POST /api/v1/exit-interviews`, `GET /api/v1/exit-interviews/employee/:employeeId`
- `GET /api/v1/employees/:id/letters/:type` (streams PDF for `experience` or `relieving`)

## Architecture Decisions & Integrity Locks
- **M23 Asset Return Lock**: `assertEmployeeAssetClearance` invoked from asset service before exit clearance sign-off completes. Unreturned assets block clearance with HTTP 400.
- **Automated Deactivation Job**: `backend/src/jobs/deactivate.job.js` daily cron deactivates User credentials (`isActive: false`), revokes refresh tokens, and transitions Employee status to `Resigned` once official last working day is reached.
- **Zero-Disk Streaming**: Relieving and Experience letters generated via `pdfkit` and piped directly to HTTP response stream without creating temporary files on disk.
