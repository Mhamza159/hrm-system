# Functional Specification: Module M19 — Performance & Appraisal

**Feature**: Module M19 — Performance & Appraisal  
**Spec Directory**: `.specify/specs/20-performance-appraisal/`  
**Git Branch**: `feature/20-performance-appraisal`  
**Target BUILD-GUIDE**: Section 22 (Rows 19.1 to 19.9)  
**Target FRD**: `docs/FRD.md` Section 8 (M19) & Section 11 (Permission Matrix Row M19)  
**Execution Standard**: JavaScript ES Modules only (`.js`, `.jsx`). No TypeScript. Strict compliance with Ponytail 7-Rung Ladder.

---

## 1. Executive Summary & System Scope

Module M19 (Performance & Appraisal) delivers the complete quarterly and annual employee evaluation lifecycle for the enterprise HRM system. It establishes designation-linked KPI templates, automates review cycle orchestration across active employees, supports goal/OKR setting, enables self-reviews and manager evaluations with objective scoring, accommodates optional 360° peer feedback, directly links approved ratings to draft salary revisions in Module M9 (Payroll), and preserves immutable appraisal histories on employee profiles.

---

## 2. Roles & PBAC Permissions Matrix

Per `docs/FRD.md` Section 11:
- **Super Admin**: Full access (`manage`). Final appraisal sign-off, organization-wide review cycle management, executive override, and salary revision approvals.
- **HR Manager**: Manage access (`manage`). Master KPI template authoring, review cycle creation, cycle progress tracking, and organization-wide review inspection.
- **Department Manager**: Team scoped access (`team` / `department`). Team goal setting, team review evaluation, 360 peer feedback requests, and increment recommendations.
- **Employee**: Own scoped access (`own`). Self-review submission, personal goal tracking, peer review feedback submission, and appraisal score viewing.

### Permission Identifiers (`backend/src/shared/permissions.js`):
1. `performance.template.manage`: Create, edit, and delete KPI templates (Super Admin, HR Manager).
2. `performance.cycle.manage`: Create, launch, track, and close review cycles (Super Admin, HR Manager).
3. `performance.review.view`: View appraisal reviews (Scoped: `all` for Super Admin/HR; `department` for Managers; `own` for Employees).
4. `performance.review.submit`: Submit self-review or manager review (Employees for self; Managers for subordinates).
5. `performance.review.finalize`: Approve final performance ratings and dispatch salary revision recommendations to M9 Payroll (Super Admin, HR Manager).
6. `performance.peer.manage`: Request and submit 360° peer feedback.

---

## 3. Detailed User Stories & Acceptance Criteria (Vertical Slice Order)

---

### Story 19.1: Designation-Wise KPI Template Master Authoring (Priority: P1)
**BUILD-GUIDE Reference**: Row 19.1  
**Backend**: `kpiTemplate.model.js`, CRUD endpoints under `/api/v1/performance/templates`  
**Frontend**: `KpiTemplatesPage.jsx`, `KpiTemplateModal.jsx`  

#### User Story
As an **HR Manager** or **Super Admin**, I want to create and manage reusable KPI templates linked to specific job designations, so that employees with identical roles are evaluated against consistent, objective metrics whose weightages total exactly 100%.

#### Acceptance Criteria
- **Scenario 1: HR Manager creates a valid KPI template**
  - **Given** an authenticated HR Manager with `performance.template.manage`,
  - **When** they submit a `POST /api/v1/performance/templates` with a template name, designation ID, and an array of KPIs `[{ title, description, weightage, targetCriteria }]` where the sum of weightages equals 100,
  - **Then** the system persists the template, returns HTTP 201 with the created template, and writes an audit log.
- **Scenario 2: Validation rejects weightage not summing to 100%**
  - **Given** an HR Manager submitting a template where KPI weightages total 85% or 110%,
  - **When** the Zod schema validation executes,
  - **Then** the request is rejected with HTTP 400 Bad Request stating `"KPI weightages must total exactly 100%"`.
- **Scenario 3: Role-based boundary enforcement**
  - **Given** an authenticated Employee or Department Manager without `performance.template.manage`,
  - **When** they attempt to `POST` or `PUT` to `/api/v1/performance/templates`,
  - **Then** the system denies access with HTTP 403 Forbidden.

---

### Story 19.2: Review Cycle Management & Automatic Employee Instantiation (Priority: P1)
**BUILD-GUIDE Reference**: Row 19.2  
**Backend**: `reviewCycle.model.js`, `review.model.js`, `POST /api/v1/performance/cycles`  
**Frontend**: `ReviewCyclesPage.jsx`, `ReviewCycleModal.jsx`  

#### User Story
As an **HR Manager**, I want to launch quarterly or annual appraisal cycles with distinct deadlines for self-review and manager review, so that review instances are automatically instantiated for all eligible active employees.

#### Acceptance Criteria
- **Scenario 1: HR Manager launches an appraisal cycle**
  - **Given** an authenticated HR Manager with `performance.cycle.manage`,
  - **When** they submit `POST /api/v1/performance/cycles` specifying `title`, `periodType` (`quarterly`, `annual`), `startDate`, `endDate`, `selfReviewDeadline`, and `managerReviewDeadline`,
  - **Then** the system creates the cycle, queries active employees (`status: 'Active'`), clones corresponding designation KPI templates into individualized `Review` records, sets status to `'Active'`, and returns HTTP 201 with count of created reviews.
- **Scenario 2: Chronological deadline validation**
  - **Given** an input where `selfReviewDeadline >= managerReviewDeadline` or `endDate < startDate`,
  - **When** the request is parsed,
  - **Then** Zod validation rejects with HTTP 400 Bad Request.
- **Scenario 3: Employee checks active cycles**
  - **Given** an active Employee,
  - **When** they query `GET /api/v1/performance/my-reviews`,
  - **Then** they see their instantiated review record with their pre-loaded designation KPIs and cycle deadlines.

---

### Story 19.3: Goal / OKR Definition & Weightage Tracking (Priority: P1)
**BUILD-GUIDE Reference**: Row 19.3  
**Backend**: `review.model.js`, `PATCH /api/v1/performance/reviews/:id/goals`  
**Frontend**: `GoalsEditor.jsx`  

#### User Story
As an **Employee** or **Department Manager**, I want to define and adjust key goals and OKRs for the review period, so that progress against specific initiatives is formally assessed alongside standard KPIs.

#### Acceptance Criteria
- **Scenario 1: Employee adds personal goals during the cycle setup window**
  - **Given** an authenticated Employee viewing their active review in `'Active'` status,
  - **When** they send `PATCH /api/v1/performance/reviews/:id/goals` with an array of goals `[{ title, description, targetValue, metricUnit, weightage }]`,
  - **Then** the goals are saved, the review document is updated, and the manager is notified.
- **Scenario 2: Department Manager edits or approves subordinate goals**
  - **Given** a Department Manager viewing a subordinate's review,
  - **When** they adjust goal targets or approve the goal list,
  - **Then** the update is persisted with `lastUpdatedBy` recorded in the review.
- **Scenario 3: Modifying goals after self-review submission is locked**
  - **Given** a review where `selfReviewSubmitted: true`,
  - **When** a user attempts to modify goals,
  - **Then** the request is rejected with HTTP 400 Bad Request indicating goals cannot be altered once evaluation has started.

---

### Story 19.4: Employee Self-Review Submission with Deadline Enforcement (Priority: P1)
**BUILD-GUIDE Reference**: Row 19.4  
**Backend**: `PATCH /api/v1/performance/reviews/:id/self`  
**Frontend**: `MyReviewPage.jsx`  

#### User Story
As an **Employee**, I want to submit my self-evaluation ratings (1–5 scale) and qualitative feedback before the self-review deadline, so that my perspective is recorded prior to managerial scoring.

#### Acceptance Criteria
- **Scenario 1: Employee submits self-review on time**
  - **Given** an Employee with an assigned review where `now <= selfReviewDeadline`,
  - **When** they submit `PATCH /api/v1/performance/reviews/:id/self` providing `kpiRatings: [{ kpiId, rating, comments }]`, `goalRatings: [{ goalId, rating, comments }]`, and `overallSummary`,
  - **Then** the system calculates the weighted self-score, sets `selfReviewSubmitted: true` and `selfReviewSubmittedAt: new Date()`, advances status to `'Manager_Review'`, and notifies the Department Manager.
- **Scenario 2: Submission blocked after deadline**
  - **Given** an Employee attempting to submit when `now > selfReviewDeadline`,
  - **When** the request reaches the service,
  - **Then** the system rejects with HTTP 400 Bad Request stating `"Self-review deadline has passed"`.
- **Scenario 3: Non-owner employee blocked**
  - **Given** Employee A attempting to submit self-review for Employee B's review ID,
  - **When** horizontal security scoping checks ownership,
  - **Then** the system returns HTTP 403 Forbidden.

---

### Story 19.5: Department Manager Review & Scoring (Priority: P1)
**BUILD-GUIDE Reference**: Row 19.5  
**Backend**: `PATCH /api/v1/performance/reviews/:id/manager`  
**Frontend**: `TeamReviewsPage.jsx`, `ManagerReviewModal.jsx`  

#### User Story
As a **Department Manager**, I want to evaluate my department subordinates on their KPIs and goals, provide 1–5 ratings with written justifications, and recommend promotions or increment percentages.

#### Acceptance Criteria
- **Scenario 1: Department Manager rates a subordinate**
  - **Given** a Department Manager whose department matches the employee's department,
  - **When** they submit `PATCH /api/v1/performance/reviews/:id/manager` with `managerKpiRatings: [{ kpiId, rating, comments }]`, `managerGoalRatings`, `strengths`, `improvements`, and `recommendedIncrementPercent`,
  - **Then** the system calculates the manager weighted score, stores ratings, transitions review status to `'Ready_For_Finalization'`, and records audit trails.
- **Scenario 2: Manager blocked from rating employees outside their department**
  - **Given** Manager of Sales attempting to evaluate an engineer in Engineering,
  - **When** horizontal scoping evaluates the review target,
  - **Then** the API rejects with HTTP 403 Forbidden.
- **Scenario 3: Rating scale boundary validation**
  - **Given** a manager input containing a rating of 0 or 6,
  - **When** Zod schema validates the payload,
  - **Then** the request fails with HTTP 400 (`"Rating must be an integer between 1 and 5"`).

---

### Story 19.6: Optional 360° Peer Feedback (Priority: P2)
**BUILD-GUIDE Reference**: Row 19.6  
**Backend**: `POST /api/v1/performance/reviews/:id/peer-request`, `POST /api/v1/performance/peer-feedback/:requestId`  
**Frontend**: `PeerFeedbackModal.jsx`, `PeerRequestsList.jsx`  

#### User Story
As a **Department Manager** or **HR Manager**, I want to invite peers to provide confidential 360° feedback on an employee, so that multi-dimensional feedback is available during appraisal.

#### Acceptance Criteria
- **Scenario 1: Manager requests peer feedback**
  - **Given** an authenticated Department Manager,
  - **When** they submit `POST /api/v1/performance/reviews/:id/peer-request` specifying `peerEmployeeId`,
  - **Then** a peer feedback request is created and socket/email notification is dispatched to the chosen peer.
- **Scenario 2: Peer submits confidential feedback**
  - **Given** the nominated peer employee,
  - **When** they submit `POST /api/v1/performance/peer-feedback/:requestId` with qualitative comments on collaboration, delivery, and culture,
  - **Then** the feedback is attached anonymously/confidentially to the review record.
- **Scenario 3: Employee cannot view raw peer identity**
  - **Given** an Employee viewing their own review,
  - **When** peer feedback is present,
  - **Then** peer reviewer identities are masked/anonymized to preserve candidness.

---

### Story 19.7: Final Appraisal & Salary Revision Draft Linkage (Priority: P1)
**BUILD-GUIDE Reference**: Row 19.7  
**Backend**: `PATCH /api/v1/performance/reviews/:id/finalize` $\rightarrow$ Module M9 (`salaryRevision` draft)  
**Frontend**: `FinalizeReviewModal.jsx`, Link to Payroll Revision  

#### User Story
As a **Super Admin** or **HR Manager**, I want to approve final overall ratings and automatically generate a salary revision draft in Module M9 (Payroll), so that approved increments flow seamlessly into compensation without manual data re-entry.

#### Acceptance Criteria
- **Scenario 1: Super Admin finalizes appraisal with salary increment**
  - **Given** an authenticated Super Admin or HR Manager with `performance.review.finalize`,
  - **When** they submit `PATCH /api/v1/performance/reviews/:id/finalize` with `finalRating` (1–5), `finalScore`, `finalComments`, and `approvedIncrementPercent: 12`,
  - **Then**:
    1. The review status transitions to `'Finalized'`.
    2. A draft salary revision record is created via Module M9 (`createSalaryRevisionDraft({ employeeId, effectiveDate, incrementPercent, reason: 'Annual Performance Appraisal' })`).
    3. An audit log is generated.
    4. The employee and department manager receive final appraisal notifications.
- **Scenario 2: Department Manager barred from finalization**
  - **Given** a Department Manager attempting to call `/finalize`,
  - **When** RBAC checks permissions,
  - **Then** the request is rejected with HTTP 403 Forbidden.

---

### Story 19.8: Historical Performance Appraisal Timeline (Priority: P2)
**BUILD-GUIDE Reference**: Row 19.8  
**Backend**: `GET /api/v1/employees/:id/performance-history`  
**Frontend**: Profile Tab `EmployeePerformanceTab.jsx`  

#### User Story
As an **HR Manager**, **Department Manager**, or **Employee**, I want to view historical appraisal scores and cycle ratings on the employee profile, so that long-term career growth and performance trends are readily accessible.

#### Acceptance Criteria
- **Scenario 1: HR Manager views full employee appraisal history**
  - **Given** an HR Manager viewing an employee profile,
  - **When** they request `GET /api/v1/employees/:id/performance-history`,
  - **Then** all historical `'Finalized'` review summaries (cycle title, date, final score, rating tier, increment percent) are returned chronologically.
- **Scenario 2: Employee views own history only**
  - **Given** an Employee viewing the performance tab,
  - **When** they fetch their performance history,
  - **Then** their own reviews are returned; attempting to fetch another employee's history returns HTTP 403 Forbidden.

---

### Story 19.9: Review Cycle Progress & Completion Tracking (Priority: P1)
**BUILD-GUIDE Reference**: Row 19.9  
**Backend**: `GET /api/v1/performance/cycles/:id/progress`  
**Frontend**: `CycleProgressWidget.jsx`, `CyclePendingListPage.jsx`  

#### User Story
As an **HR Manager**, I want a visual progress dashboard tracking review submission percentages, pending reviews by department, and overdue flags, so that I can identify bottlenecks and follow up with delinquent reviewers.

#### Acceptance Criteria
- **Scenario 1: HR Manager inspects cycle metrics**
  - **Given** an HR Manager querying `GET /api/v1/performance/cycles/:id/progress`,
  - **When** the query executes,
  - **Then** the API returns aggregate counts: `{ totalReviews, selfSubmitted, managerSubmitted, finalized, pendingSelfCount, pendingManagerCount, completionRatePercent, departmentBreakdown: [...] }`.
- **Scenario 2: Overdue reviewer flag**
  - **Given** reviews where `selfReviewDeadline < now` and `selfReviewSubmitted: false`,
  - **When** the progress report is generated,
  - **Then** those reviews are tagged with `isOverdue: true` with employee and manager contact details for follow-up.

---

## 4. Technical Architecture Patterns & Context7 Integrations

### Zod Validation Schema Patterns (`/colinhacks/zod`)
```javascript
import { z } from 'zod';

export const kpiItemSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).optional(),
  weightage: z.number().int().min(1).max(100),
  targetCriteria: z.string().trim().min(3).max(300)
});

export const createKpiTemplateSchema = z.object({
  name: z.string().trim().min(3).max(100),
  designationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid designation ID'),
  description: z.string().trim().max(500).optional(),
  kpis: z.array(kpiItemSchema).min(1).superRefine((kpis, ctx) => {
    const totalWeight = kpis.reduce((sum, item) => sum + item.weightage, 0);
    if (totalWeight !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `KPI weightages must total exactly 100% (currently ${totalWeight}%)`
      });
    }
  })
});
```

### Mongoose Subdocument & Score Calculation Patterns (`/automattic/mongoose`)
```javascript
const ReviewKpiSchema = new mongoose.Schema({
  title: { type: String, required: true },
  weightage: { type: Number, required: true, min: 1, max: 100 },
  targetCriteria: { type: String, required: true },
  selfRating: { type: Number, min: 1, max: 5 },
  selfComments: { type: String, maxlength: 1000 },
  managerRating: { type: Number, min: 1, max: 5 },
  managerComments: { type: String, maxlength: 1000 }
}, { _id: true });
```

### RTK Query Tag Invalidation Patterns (`/reduxjs/redux-toolkit`)
```javascript
export const performanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKpiTemplates: builder.query({
      query: (params) => ({ url: '/performance/templates', params }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'KpiTemplates', id: _id })), { type: 'KpiTemplates', id: 'LIST' }]
          : [{ type: 'KpiTemplates', id: 'LIST' }]
    }),
    createKpiTemplate: builder.mutation({
      query: (body) => ({ url: '/performance/templates', method: 'POST', body }),
      invalidatesTags: [{ type: 'KpiTemplates', id: 'LIST' }]
    })
  })
});
```

---

## 5. Non-Functional & Security Constraints

1. **JavaScript ES Modules Only**: All code strictly `.js` and `.jsx`.
2. **Horizontal Data Scoping**:
   - `Super Admin` / `HR Manager`: Full organization scope (`all`).
   - `Department Manager`: Restricted to subordinates within their managed department (`department`).
   - `Employee`: Restricted strictly to own reviews (`own`).
3. **Audit Trails**: All template edits, cycle state transitions, score submissions, and final approvals record immutable entries in `auditLogs`.
4. **Soft Deletes**: Templates and cycles use `isDeleted: true` to preserve historical referential integrity.
5. **NoSQL Sanitization & Rate Limiting**: All user input validated against Zod schemas; rate limiting enforced on creation and submission endpoints.
