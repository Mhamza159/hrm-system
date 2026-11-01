# Implementation Tasks: Module M19 — Performance & Appraisal

**Feature Branch**: `feature/20-performance-appraisal`  
**Specification**: [`.specify/specs/20-performance-appraisal/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/20-performance-appraisal/spec.md)  
**Architecture Plan**: [`.specify/specs/20-performance-appraisal/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/20-performance-appraisal/plan.md)  
**Target BUILD-GUIDE**: Section 22 (Rows 19.1 to 19.9)  

---

## Task Execution Checklist (Vertical Slice Order)

### Phase 0: Permission Catalogue & Seed Setup
- [x] **19.0-PERM**: Register `performance.template.view`, `performance.template.manage`, `performance.cycle.view`, `performance.cycle.manage`, `performance.review.view`, `performance.review.submit`, `performance.review.finalize`, and `performance.peer.manage` in `backend/src/shared/permissions.js` and assign default scopes to Super Admin, HR Manager, Department Manager, and Employee in `backend/src/seed/roles.seed.js`.

---

### Slice 1: Designation-Wise KPI Template Master Authoring (BUILD-GUIDE Row 19.1 · Priority: P1)
- [x] **19.1-BE-MODEL**: Create `backend/src/models/kpiTemplate.model.js` with fields (`name`, `designationId`, `description`, `kpis[{ title, description, weightage, targetCriteria }]`, `isActive`, `createdBy`, `isDeleted`) and unique compound index on `{ name: 1, designationId: 1, isDeleted: 1 }`.
- [x] **19.1-BE-VAL**: Create `backend/src/modules/performance/performance.validation.js` with Zod schemas `createKpiTemplateSchema`, `updateKpiTemplateSchema` (enforcing weightage sum = 100%), and route parameter `objectIdSchema`.
- [x] **19.1-BE-SERVICE**: Implement `createKpiTemplate`, `getKpiTemplates`, `getKpiTemplateById`, `updateKpiTemplate`, and `deleteKpiTemplate` in `backend/src/modules/performance/performance.service.js` with immutable audit logging.
- [x] **19.1-BE-ROUTE**: Create `backend/src/modules/performance/performance.controller.js` and `backend/src/modules/performance/performance.routes.js` with endpoints:
  - `GET /api/v1/performance/templates` (`checkPermission('performance.template.view')`)
  - `POST /api/v1/performance/templates` (`checkPermission('performance.template.manage')`)
  - `GET /api/v1/performance/templates/:id` (`checkPermission('performance.template.view')`)
  - `PUT /api/v1/performance/templates/:id` (`checkPermission('performance.template.manage')`)
  - `DELETE /api/v1/performance/templates/:id` (`checkPermission('performance.template.manage')`)  
  Mount router in `backend/src/app.js`.
- [x] **19.1-FE-API**: Create `frontend/src/features/performance/performanceApi.js` with RTK Query endpoints for KPI template CRUD and tag `['KpiTemplates']`.
- [x] **19.1-FE-UI**: Build `frontend/src/features/performance/pages/KpiTemplatesPage.jsx` and `components/KpiTemplateModal.jsx` displaying template list, designation selector, and dynamic KPI items builder.
- [x] **19.1-FE-NAV**: Register `/performance/templates` route in `frontend/src/App.jsx` and add "KPI Templates" under "Performance" in `frontend/src/components/layout/Sidebar.jsx` guarded by `performance.template.view`.
- [x] **19.1-TEST**: Automated test asserting KPI template creation, 100% weightage validation enforcement, duplicate template rejection (HTTP 409), and role authorization checks.

---

### Slice 2: Review Cycles Orchestrator & Automatic Employee Instantiation (BUILD-GUIDE Row 19.2 · Priority: P1)
- [x] **19.2-BE-MODEL**: Create `backend/src/models/reviewCycle.model.js` and `backend/src/models/review.model.js` with full lifecycle fields, unique compound indexes, and subdocument schemas.
- [x] **19.2-BE-VAL**: Add `createReviewCycleSchema` in `performance.validation.js` validating chronological deadlines (`selfReviewDeadline < managerReviewDeadline <= endDate`).
- [x] **19.2-BE-SERVICE**: Implement `launchReviewCycle` in `performance.service.js` creating cycle, querying active employees, cloning corresponding designation KPI templates into individualized `Review` records, and dispatching announcements.
- [x] **19.2-BE-ROUTE**: Register endpoints in `performance.routes.js`:
  - `GET /api/v1/performance/cycles` (`checkPermission('performance.cycle.view')`)
  - `POST /api/v1/performance/cycles` (`checkPermission('performance.cycle.manage')`)
  - `GET /api/v1/performance/cycles/:id` (`checkPermission('performance.cycle.view')`)
  - `PATCH /api/v1/performance/cycles/:id/status` (`checkPermission('performance.cycle.manage')`)
- [x] **19.2-FE-API**: Add `getReviewCycles`, `getReviewCycleById`, and `createReviewCycle` queries/mutations in `performanceApi.js` with tag `['ReviewCycles']`.
- [x] **19.2-FE-UI**: Build `frontend/src/features/performance/pages/ReviewCyclesPage.jsx` and `components/ReviewCycleModal.jsx` displaying appraisal cycle timeline, status badges, and launch action.
- [x] **19.2-FE-NAV**: Register `/performance/cycles` route in `App.jsx` and add "Appraisal Cycles" in `Sidebar.jsx`.
- [x] **19.2-TEST**: Automated test verifying cycle creation, automated review instantiation for all active staff, and chronological deadline validation.

---

### Slice 3: Goals / OKRs Management & Period Setup (BUILD-GUIDE Row 19.3 · Priority: P1)
- [x] **19.3-BE-VAL**: Add `setGoalsSchema` in `performance.validation.js` validating goal title, metric units, target values, and optional weightages.
- [x] **19.3-BE-SERVICE**: Implement `updateReviewGoals` in `performance.service.js` permitting employee and manager to define period goals; enforce lockout once self-review has been submitted.
- [x] **19.3-BE-ROUTE**: Register `PATCH /api/v1/performance/reviews/:id/goals` (`checkPermission('performance.review.submit')`) in `performance.routes.js`.
- [x] **19.3-FE-API**: Add `updateGoals` mutation in `performanceApi.js`.
- [x] **19.3-FE-UI**: Build `frontend/src/features/performance/components/GoalsEditor.jsx` embedded within review screens allowing dynamic addition, removal, and editing of period OKRs.
- [x] **19.3-TEST**: Automated test asserting goals creation, metric unit validation, and verification that goals cannot be modified after self-review submission.

---

### Slice 4: Employee Self-Review Submission with Deadline Locking (BUILD-GUIDE Row 19.4 · Priority: P1)
- [x] **19.4-BE-VAL**: Add `submitSelfReviewSchema` in `performance.validation.js` requiring 1–5 ratings and qualitative comments across KPIs and goals.
- [x] **19.4-BE-SERVICE**: Implement `submitSelfReview` in `performance.service.js` calculating weighted self-score, verifying `now <= selfReviewDeadline`, advancing review status to `'Manager_Review'`, and notifying the department manager.
- [x] **19.4-BE-ROUTE**: Register endpoints in `performance.routes.js`:
  - `GET /api/v1/performance/reviews/my` (`checkPermission('performance.review.view', 'own')`)
  - `PATCH /api/v1/performance/reviews/:id/self` (`checkPermission('performance.review.submit', 'own')`)
- [x] **19.4-FE-API**: Add `getMyReviews` query and `submitSelfReview` mutation in `performanceApi.js`.
- [x] **19.4-FE-UI**: Build `frontend/src/features/performance/pages/MyReviewPage.jsx` displaying assigned KPIs, rating sliders/radios (1–5), reflection notes textarea, and deadline countdown badge.
- [x] **19.4-FE-NAV**: Register `/performance/my-review` in `App.jsx` and add "My Appraisal" in `Sidebar.jsx`.
- [x] **19.4-TEST**: Automated test verifying employee self-review submission, weighted score calculation, deadline expiration lockout (HTTP 400), and non-owner blocking (HTTP 403).

---

### Slice 5: Department Manager Review & Scoring (BUILD-GUIDE Row 19.5 · Priority: P1)
- [x] **19.5-BE-VAL**: Add `submitManagerReviewSchema` in `performance.validation.js` requiring 1–5 manager ratings, strengths, improvements, and recommended increment percent.
- [x] **19.5-BE-SERVICE**: Implement `submitManagerReview` in `performance.service.js` enforcing horizontal scoping (manager can only evaluate department subordinates), calculating manager weighted score, and advancing status to `'Ready_For_Finalization'`.
- [x] **19.5-BE-ROUTE**: Register endpoints in `performance.routes.js`:
  - `GET /api/v1/performance/reviews` (`checkPermission('performance.review.view')` with data scope injection)
  - `GET /api/v1/performance/reviews/:id` (`checkPermission('performance.review.view')`)
  - `PATCH /api/v1/performance/reviews/:id/manager` (`checkPermission('performance.review.submit')`)
- [x] **19.5-FE-API**: Add `getReviews` query and `submitManagerReview` mutation in `performanceApi.js`.
- [x] **19.5-FE-UI**: Build `frontend/src/features/performance/pages/TeamReviewsPage.jsx` and `components/ManagerReviewModal.jsx` displaying department subordinates queue, self-score preview, manager rating inputs, and increment recommendations.
- [x] **19.5-FE-NAV**: Register `/performance/team-reviews` in `App.jsx` and add "Team Reviews" in `Sidebar.jsx` guarded by `department` scope.
- [x] **19.5-TEST**: Automated test asserting manager can only review subordinates in their department, rating boundary validation (1–5), and status transition.

---

### Slice 6: Final Appraisal & M9 Salary Revision Draft Linkage (BUILD-GUIDE Row 19.7 · Priority: P1)
- [x] **19.7-BE-VAL**: Add `finalizeReviewSchema` in `performance.validation.js` requiring `finalRating` (1–5), `finalComments`, and optional `approvedIncrementPercent`.
- [x] **19.7-BE-SERVICE**: Implement `finalizeReview` in `performance.service.js` transitioning review status to `'Finalized'`, recording audit logs, and automatically creating a draft salary revision in Module M9 (`salaryRevision.model.js`) when `approvedIncrementPercent > 0`.
- [x] **19.7-BE-ROUTE**: Register `PATCH /api/v1/performance/reviews/:id/finalize` (`checkPermission('performance.review.finalize')`) in `performance.routes.js`.
- [x] **19.7-FE-API**: Add `finalizeReview` mutation in `performanceApi.js`.
- [x] **19.7-FE-UI**: Build `frontend/src/features/performance/components/FinalizeReviewModal.jsx` on `ReviewCyclesPage.jsx` and `TeamReviewsPage.jsx` displaying executive summary, final rating tier selector, approved increment percent field, and link to Payroll.
- [x] **19.7-TEST**: Automated test verifying final appraisal approval, status transition to `'Finalized'`, and automated draft salary revision creation in Module M9.

---

### Slice 7: Review Cycle Progress & Completion Tracking (BUILD-GUIDE Row 19.9 · Priority: P1)
- [x] **19.9-BE-SERVICE**: Implement `getReviewCycleProgress` in `performance.service.js` aggregating total reviews, self-reviews completed, manager reviews completed, finalized counts, department breakdown, and overdue reviewers.
- [x] **19.9-BE-ROUTE**: Register `GET /api/v1/performance/cycles/:id/progress` (`checkPermission('performance.cycle.manage')`) in `performance.routes.js`.
- [x] **19.9-FE-API**: Add `getCycleProgress` query in `performanceApi.js`.
- [x] **19.9-FE-UI**: Build `frontend/src/features/performance/pages/CycleProgressPage.jsx` displaying circular completion charts, department breakdown tables, and list of pending reviewers with overdue badges.
- [x] **19.9-FE-NAV**: Register `/performance/cycles/:id/progress` in `App.jsx` with direct navigation button from `ReviewCyclesPage.jsx`.
- [x] **19.9-TEST**: Automated test verifying cycle progress calculation, completion percentage accuracy, and delinquent reviewer flagging.

---

### Slice 8: 360° Peer Feedback (BUILD-GUIDE Row 19.6 · Priority: P2)
- [x] **19.6-BE-VAL**: Add `peerFeedbackRequestSchema` and `submitPeerFeedbackSchema` in `performance.validation.js`.
- [x] **19.6-BE-SERVICE**: Implement `requestPeerFeedback` and `submitPeerFeedback` in `performance.service.js` attaching peer ratings and qualitative commentary while masking reviewer identity from the employee.
- [x] **19.6-BE-ROUTE**: Register endpoints in `performance.routes.js`:
  - `POST /api/v1/performance/reviews/:id/peer-request` (`checkPermission('performance.peer.manage')`)
  - `POST /api/v1/performance/peer-feedback/:requestId` (`checkPermission('performance.peer.manage', 'own')`)
- [x] **19.6-FE-API**: Add `requestPeerFeedback` and `submitPeerFeedback` endpoints in `performanceApi.js`.
- [x] **19.6-FE-UI**: Build `frontend/src/features/performance/components/PeerFeedbackModal.jsx` and peer pending requests queue.
- [x] **19.6-TEST**: Automated test asserting peer feedback invitation, submission, and confirmation that peer identity is confidential/anonymized from employee views.

---

### Slice 9: Historical Performance Appraisal Timeline (BUILD-GUIDE Row 19.8 · Priority: P2)
- [x] **19.8-BE-SERVICE**: Implement `getEmployeePerformanceHistory` in `performance.service.js` returning finalized appraisals chronologically with rating badges, scores, and approved increments.
- [x] **19.8-BE-ROUTE**: Register `GET /api/v1/performance/employees/:id/history` (`checkPermission('performance.review.view')` with data scope injection) in `performance.routes.js`.
- [x] **19.8-FE-API**: Add `getEmployeePerformanceHistory` query in `performanceApi.js`.
- [x] **19.8-FE-UI**: Build `frontend/src/features/performance/components/EmployeePerformanceTab.jsx` embedded into `EmployeeDetailPage.jsx` multi-tab view.
- [x] **19.8-TEST**: Automated test verifying historical appraisal timeline retrieval and asserting HTTP 403 when an employee attempts to view another employee's performance history.

---

### Slice 10: Multi-Role End-to-End Playwright Test Suite
- [x] **19.10-TEST-E2E**: Module M19 end-to-end Playwright test, chaaron roles se (`Super Admin`, `HR Manager`, `Department Manager`, `Employee`) verifying template authoring, review cycle launch, employee auto-instantiation, goals setting, self-review submission, manager scoring, peer feedback, final appraisal sign-off, and draft salary revision linkage in M9.

