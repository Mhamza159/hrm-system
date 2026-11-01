# Module M19: Performance & Appraisal Implementation Summary

## 1. Scope & Coverage
- Implemented BUILD-GUIDE Section 22 (Rows 19.1 through 19.9).
- Feature branch: feature/20-performance-appraisal.

## 2. Models & Database
- KpiTemplate (`kpiTemplate.model.js`): Designation-wise template with compound unique index on `{ name: 1, designationId: 1, isDeleted: 1 }` and 100% total weightage validation.
- ReviewCycle (`reviewCycle.model.js`): Orchestrator for quarterly/annual appraisal cycles, status tracking (Draft, Active, Closed), and chronological deadline validation (`selfReviewDeadline < managerReviewDeadline <= endDate`).
- Review (`review.model.js`): Individual appraisal instance containing cloned KPIs, custom OKRs, selfReview (score, comments, submission lock), managerReview (ratings, strengths, improvements, increment recommendation), peerFeedbacks (confidential ratings), and finalAppraisal (final rating, approved increment, salaryRevisionId link).

## 3. Core APIs & Routes
Mounted at `/api/v1/performance`:
- Templates: GET/POST `/templates`, GET/PUT/DELETE `/templates/:id`
- Review Cycles: GET/POST `/cycles`, GET `/cycles/:id`, PATCH `/cycles/:id/status`, GET `/cycles/:id/progress`
- Reviews & Goals: GET `/reviews`, GET `/reviews/:id`, PATCH `/reviews/:id/goals`
- Reviews Execution: PATCH `/reviews/:id/self`, PATCH `/reviews/:id/manager`, PATCH `/reviews/:id/finalize`
- 360 Peer Feedback: POST `/reviews/:id/peer-request`, POST `/peer-feedback/:requestId`
- History: GET `/employees/:id/history`

## 4. Cross-Module Integrations
- Module M9 Payroll: When final appraisal approves an increment (`approvedIncrementPercent > 0`), automatically supersedes active `SalaryStructure` and drafts a revised structure with increment applied to base pay and allowances.
- Module M8 Notifications: Dispatches announcements and notifications on cycle launch, self-review submission, manager review readiness, and final sign-off.
- Module M0 Audit: Immutable audit trails recorded for all state mutations.

## 5. Security & PBAC
- Registered 8 permissions in `shared/permissions.js` with CASL MongoAbility evaluation and horizontal data scopes ('own', 'department', 'all').
