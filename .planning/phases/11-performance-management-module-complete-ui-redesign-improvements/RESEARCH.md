# Phase 11: Performance Management Module – Research & Codebase Audit

## 1. Domain Models & Schemas

### `KpiTemplate` (`backend/src/models/kpiTemplate.model.js`)
- **Fields:**
  - `name`: String, required, unique per designation (case-insensitive regex check).
  - `designationId`: ObjectId -> `Designation`, required.
  - `description`: String.
  - `isActive`: Boolean, default `true`.
  - `kpis`: Array of subdocuments:
    - `title`: String, required.
    - `description`: String.
    - `weightage`: Number, min 1, max 100.
    - `targetCriteria`: String, required.
  - `createdBy`: ObjectId -> `User`.
- **Validation Hook:**
  - Pre-save validator computes `kpis.reduce((acc, k) => acc + (k.weightage || 0), 0)`.
  - Must equal exactly 100%, otherwise throws validation error.

### `ReviewCycle` (`backend/src/models/reviewCycle.model.js`)
- **Fields:**
  - `title`: String, required, unique per year.
  - `periodType`: `'quarterly'` | `'annual'`.
  - `periodQuarter`: `'Q1'` | `'Q2'` | `'Q3'` | `'Q4'` | `'None'`.
  - `periodYear`: Number, e.g. 2026.
  - `startDate`, `endDate`: Dates, required.
  - `selfReviewDeadline`: Date, required.
  - `managerReviewDeadline`: Date, required.
  - `status`: `'Draft'` | `'Active'` | `'Closed'`, default `'Active'`.
  - `totalReviewsCount`: Number.
  - `completedReviewsCount`: Number.
  - `createdBy`: ObjectId -> `User`.

### `Review` (`backend/src/models/review.model.js`)
- **Fields:**
  - `cycleId`: ObjectId -> `ReviewCycle`.
  - `employeeId`: ObjectId -> `Employee`.
  - `departmentId`: ObjectId -> `Department`.
  - `designationId`: ObjectId -> `Designation`.
  - `managerId`: ObjectId -> `Employee`.
  - `status`: `'Active'` | `'Manager_Review'` | `'Ready_For_Finalization'` | `'Finalized'`.
  - `kpis`: Array of snapshotted KPI items with `weightage`, `targetCriteria`, `selfRating`, `selfComments`, `managerRating`, `managerComments`.
  - `goals`: Array of personal OKR items with `weightage`, `targetValue`, `metricUnit`, `selfRating`, `managerRating`.
  - `selfReview`: `{ submitted: Boolean, submittedAt: Date, calculatedScore: Number, overallSummary: String }`.
  - `managerReview`: `{ submitted: Boolean, submittedAt: Date, calculatedScore: Number, strengths: String, improvements: String, recommendedIncrementPercent: Number, recommendationNotes: String }`.
  - `finalAppraisal`: `{ finalRating: Number, finalScore: Number, finalComments: String, approvedIncrementPercent: Number, finalizedBy: ObjectId, finalizedAt: Date, salaryRevisionId: ObjectId }`.
  - `peerFeedbacks`: Array of `{ peerEmployeeId, requestedBy, rating, comments, submitted, submittedAt }`.

---

## 2. API Endpoints Audit (`backend/src/modules/performance/performance.routes.js`)

| Method | Endpoint | Permission | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/templates` | `performance.template.view` | List templates with search and designation filter |
| `POST` | `/templates` | `performance.template.manage` | Create template (validates 100% weightage) |
| `GET` | `/templates/:id` | `performance.template.view` | Retrieve template details |
| `PUT` | `/templates/:id` | `performance.template.manage` | Update template |
| `DELETE` | `/templates/:id` | `performance.template.manage` | Soft-delete template |
| `GET` | `/cycles` | `performance.cycle.view` | List cycles |
| `POST` | `/cycles` | `performance.cycle.manage` | Create cycle & auto-instantiate reviews |
| `GET` | `/cycles/:id` | `performance.cycle.view` | Retrieve cycle details |
| `PATCH` | `/cycles/:id/status` | `performance.cycle.manage` | Change status (Draft/Active/Closed) |
| `GET` | `/cycles/:id/progress`| `performance.cycle.manage` | Real-time cycle telemetry & department metrics |
| `GET` | `/reviews` | `performance.review.view` | List reviews (scoped by user role) |
| `GET` | `/reviews/:id` | `performance.review.view` | Single review details |
| `PATCH` | `/reviews/:id/goals` | `performance.review.submit` | Update OKRs (blocked after self-review) |
| `PATCH` | `/reviews/:id/self` | `performance.review.submit` | Submit self-review ratings |
| `PATCH` | `/reviews/:id/manager`| `performance.review.submit` | Submit manager review & increment recommendation |
| `PATCH` | `/reviews/:id/finalize`| `performance.review.finalize`| Final sign-off & M9 salary revision dispatch |
| `POST` | `/reviews/:id/peer-request` | `performance.peer.manage` | Request 360 peer feedback |
| `POST` | `/peer-feedback/:requestId` | `performance.peer.manage` | Submit peer feedback |
| `GET` | `/employees/:id/history` | `performance.review.view` | Historical appraisal timeline |

---

## 3. Frontend Architecture & Design Audit

### Current Pain Points:
1. **Legacy Color Tokens:** All pages and components (`TeamReviewsPage`, `ReviewCyclesPage`, `KpiTemplatesPage`, `ManagerReviewModal`, etc.) currently use `indigo-600`, violating the Forest & Emerald design specification (`DESIGN.md`).
2. **Missing Detail Views:** Clicking a template opens the edit modal directly; clicking an employee review in `TeamReviewsPage` opens the manager review modal or finalize modal without a comprehensive read-only scorecard review modal (`ReviewDetailModal`).
3. **No Dynamic Weightage Visual Feedback:** `KpiTemplateModal.jsx` lacks a running progress indicator showing how close the KPI weights are to 100%. Users have to manually calculate weights.
4. **Crude `window.confirm`:** Action buttons use browser alert dialogs instead of styled enterprise `ConfirmModal` dialogs.
5. **Missing Metric Headers:** Neither `TeamReviewsPage` nor `KpiTemplatesPage` feature summary KPI stat cards.

### Design Tokens to Apply:
- **Primary Brand:** Emerald `emerald-600` (`#047857`, `#10B981`), `emerald-50`, `emerald-700`.
- **Neutrals:** Slate `slate-900` (`#0F172A`), `slate-800`, `slate-700`, `slate-500`, Canvas `slate-50` (`#F8FAFC`).
- **Hairline Borders:** `border-slate-200 dark:border-slate-800`.
- **Status Pills:**
  - Finalized / Completed: Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800`).
  - Manager Review / In Progress: Amber (`bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800`).
  - Active / Pending Self: Sky / Blue (`bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800`).
  - Closed / Draft: Slate (`bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700`).
  - Overdue / Blocked: Rose (`bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800`).
- **Typography:** Outfit / Geist Sans for titles, Tabular Monospace (`tabular-nums font-mono`) for all scores, percentages, and metrics.

---

## 4. Test Suite Diagnostic
- `tests/m19.performance.e2e.test.js`:
  - 22/24 tests currently pass.
  - 2 failures are caused by hardcoded past deadline (`selfReviewDeadline: '2026-11-15'`, where current system date is `2026-11-16`).
  - Updating test cycle deadline dynamically (`new Date(Date.now() + 7 * 86400000)`) restores 100% test pass rate across the entire test suite.
