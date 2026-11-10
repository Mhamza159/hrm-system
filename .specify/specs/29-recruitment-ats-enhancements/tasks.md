# Tasks: Recruitment & ATS Functional & UI Enhancements

**Input**: Feature Specification ([`.specify/specs/29-recruitment-ats-enhancements/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/29-recruitment-ats-enhancements/spec.md)) and Implementation Plan ([`.specify/specs/29-recruitment-ats-enhancements/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/29-recruitment-ats-enhancements/plan.md))  
**Feature Branch**: `feature/29-recruitment-ats-enhancements`  
**Organization**: Tasks are structured by prioritized user stories (P1 & P2) to allow incremental vertical-slice implementation, test verification, and immediate progress tracking.

---

## Task Summary Table

| Phase | Story / Topic | Priority | Task Range | Estimated Work |
|---|---|---|---|---|
| **Phase 1** | Baseline Setup & Sanity Checks | Pre-req | `T001` - `T003` | Working tree & environment verification |
| **Phase 2** | US1: Headcount Requisition Requestor Attribution | P1 | `T004` - `T007` | Backend deep populate & Super Admin UI cards |
| **Phase 3** | US2: Job Closure Lockdown & Closed Job Deletion | P1 | `T008` - `T013` | Republish guard, delete endpoint, UI actions |
| **Phase 4** | US3: Kanban Candidate Deletion & Pipeline Cleanup | P1 | `T014` - `T019` | Soft-delete endpoint, Kanban card & modal delete |
| **Phase 5** | US4: Instant CV Document Previewer | P1 | `T020` - `T023` | Absolute URL resolution & new-tab document preview |
| **Phase 6** | US5: Anti-Collision Interview Scheduling | P1 | `T024` - `T028` | Anti-collision check $\pm 45$m, round timeline display |
| **Phase 7** | US6: Immutable Interview Scorecards & Locked Indicator | P1 | `T029` - `T033` | Backend immutability guard & locked UI banner |
| **Phase 8** | US7: Automated Candidate Email Notifications | P2 | `T034` - `T037` | Nodemailer template & scheduling event triggers |
| **Phase 9** | US8: Global Module Refresh Buttons & Loaders | P2 | `T038` - `T042` | `RotateCw` spin state & RTK cache invalidation |
| **Phase 10**| Verification, Automated Testing & Signoff | Verification | `T043` - `T047` | Vitest suites, Vite build, Multi-role walkthrough |

---

## Phase 1: Baseline Setup & Sanity Checks

**Purpose**: Confirm environment readiness, branch state, and active database connection.

- [x] T001 Verify active git branch `feature/29-recruitment-ats-enhancements` is clean and synchronized with `main`.
- [x] T002 [P] Verify backend server is alive on port 5000 connected to MongoDB Atlas `hrm_production` database.
- [x] T003 [P] Verify frontend development build succeeds without missing imports or configuration errors.

**Checkpoint**: Development environment stable, models and routes accessible for enhancement slices.

---

## Phase 2: User Story 1 (ATS-ENH-1) — Headcount Requisition Requestor Attribution (Priority: P1)

**Goal**: Super Admin reviewing headcount requisitions must dynamically see the requesting Department Head's Full Name, Employee Code, Designation Title, and System Role.

**Independent Test**: Calling `GET /api/v1/recruitment/requisitions` returns populated `requestedBy` with `name`, `employeeCode`, `designationId.title`, and `userId.roles.name`; rendered on Requisitions cards in `JobsPage.jsx`.

- [x] T004 [US1] Update `getRequisitions` and `getRequisitionById` in `backend/src/modules/recruitment/recruitment.service.js` to deep-populate `requestedBy`:
  ```javascript
  {
    path: 'requestedBy',
    select: 'name employeeCode email designationId userId',
    populate: [
      { path: 'designationId', select: 'title' },
      { path: 'userId', select: 'roles', populate: { path: 'roles', select: 'name' } }
    ]
  }
  ```
- [x] T005 [P] [US1] Ensure `backend/src/models/requisition.model.js` correctly maintains index on `requestedBy` and handles deleted or transferred employee records gracefully without throwing CastErrors.
- [x] T006 [US1] Update `frontend/src/features/recruitment/pages/JobsPage.jsx` Requisitions Tab to render a dedicated "Requesting Department Head" profile badge displaying:
  - Department Head Full Name (`requestedBy?.name || 'Department Manager'`)
  - Employee Code badge (e.g., `EMP-0004`)
  - Designation Title (`requestedBy?.designationId?.title || 'Department Lead'`)
  - System Role indicator (`Department Manager`).
- [x] T007 [US1] Add unit test in `backend/tests/recruitment/requisitionAttribution.test.js` verifying populated manager details across `GET /api/v1/recruitment/requisitions`.

**Checkpoint**: Super Admin sees exact manager details for all pending and historical requisitions.

---

## Phase 3: User Story 2 (ATS-ENH-2) — Job Closure Lockdown & Closed Job Deletion (Priority: P1)

**Goal**: Prevent Closed jobs from being republished (hide button in UI, reject `PATCH` in API); provide direct deletion action for closed jobs.

**Independent Test**: Closed job cards in `JobsPage.jsx` display NO "Publish" button; clicking "Delete Job" permanently deletes/soft-deletes the job via `DELETE /api/v1/recruitment/jobs/:id`; direct API call to republish returns `400 Bad Request`.

- [x] T008 [US2] Update `updateJob` in `backend/src/modules/recruitment/recruitment.service.js` to reject any attempt to transition a job from `status: 'Closed'` to `status: 'Published'` with `400 Bad Request` ("Closed jobs cannot be republished. A new requisition or job opening must be initiated.").
- [x] T009 [US2] Implement `deleteJob(jobId, actor)` in `backend/src/modules/recruitment/recruitment.service.js`:
  - Validate job exists and is in `Closed` status (or `Draft`).
  - Reject deletion if job is actively `Published`.
  - Mark `isDeleted: true` (soft delete) or remove if zero associated active candidates.
- [x] T010 [US2] Add controller handler `deleteJob` in `backend/src/modules/recruitment/recruitment.controller.js` and mount `DELETE /jobs/:id` in `backend/src/modules/recruitment/recruitment.routes.js` guarded by `checkPermission('recruitment.job.manage')`.
- [x] T011 [US2] Add `deleteJob` mutation to `frontend/src/features/recruitment/recruitmentApi.js` with automatic cache invalidation for `['Job', 'Candidate']`.
- [x] T012 [US2] Update `frontend/src/features/recruitment/pages/JobsPage.jsx`:
  - Completely remove/hide the green "Publish" button on any job card where `job.status === 'Closed'` (resolving screenshot issue `media_1794297576587_57688068.jpg`).
  - Add a red "Delete Job" action button with confirmation dialog (`AlertDialog`) on Closed and Draft job cards.
- [x] T013 [US2] Add integration test in `backend/tests/recruitment/jobLifecycle.test.js` asserting closed job republishing rejection and successful deletion.

**Checkpoint**: Closed jobs cannot be republished and can be safely purged from the management console.

---

## Phase 4: User Story 3 (ATS-ENH-3) — Kanban Candidate Deletion & Pipeline Cleanup (Priority: P1)

**Goal**: Add direct per-card and modal deletion actions allowing HR and Super Admins to clean up candidate applications and sync pipeline board state.

**Independent Test**: Clicking "Delete" on candidate card or inside `CandidateDetailModal.jsx` calls `DELETE /api/v1/recruitment/candidates/:id`, removes candidate from Kanban columns, updates applicant count, and cascades cancellation to scheduled interviews.

- [x] T014 [US3] Implement `deleteCandidate(candidateId, actor)` in `backend/src/modules/recruitment/recruitment.service.js`:
  - Verify candidate exists and actor has `recruitment.candidate.manage` permission.
  - Soft-delete candidate (`isDeleted: true`).
  - Cascade update associated active interviews to `status: 'Cancelled'` with reason `"Candidate record removed"`.
- [x] T015 [US3] Add controller handler `deleteCandidate` in `backend/src/modules/recruitment/recruitment.controller.js` and mount `DELETE /candidates/:id` in `backend/src/modules/recruitment/recruitment.routes.js`.
- [x] T016 [US3] Add `deleteCandidate` mutation to `frontend/src/features/recruitment/recruitmentApi.js` invalidating `['Candidate', 'Interview']`.
- [x] T017 [US3] Update `frontend/src/features/recruitment/pages/CandidatePipelinePage.jsx`:
  - Add a subtle trash/delete icon on candidate Kanban cards with confirmation modal.
  - Animate card removal optimistically and update column badge counters.
- [x] T018 [US3] Update `frontend/src/features/recruitment/components/CandidateDetailModal.jsx`:
  - Add a red danger action button "Delete Candidate" in `RECRUITMENT ACTIONS` footer.
  - Trigger confirmation dialog before dispatching delete mutation and auto-closing the drawer.
- [x] T019 [US3] Add integration test in `backend/tests/recruitment/candidateDelete.test.js` validating authorization checks, cascade interview cancellation, and soft-delete flag.

**Checkpoint**: Pipeline Kanban cards and candidate drawers can be cleanly deleted with instant board sync.

---

## Phase 5: User Story 4 (ATS-ENH-4) — Instant CV Document Previewer (Priority: P1)

**Goal**: Clicking "View CV Document" must reliably preview/open the candidate's CV document immediately in a new tab without broken path or authentication failures.

**Independent Test**: Clicking "View CV Document" in `CandidateDetailModal.jsx` resolves absolute HTTPS or local server URL and triggers `window.open(resolvedUrl, '_blank', 'noopener,noreferrer')`.

- [x] T020 [US4] Create URL normalization utility `resolveCvUrl(resumeUrl)` in `frontend/src/features/recruitment/utils/recruitmentUtils.js` (or inline helper) handling:
  - Full Cloudinary URLs (`https://res.cloudinary.com/...`) $\rightarrow$ opened directly.
  - Relative backend uploads (`/uploads/...`) $\rightarrow$ prefixed with `import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'`.
  - Empty or invalid URLs $\rightarrow$ gracefully flagged.
- [x] T021 [US4] Update `frontend/src/features/recruitment/components/CandidateDetailModal.jsx`:
  - Bind "View CV Document" button to `handleOpenCv` handler using `resolveCvUrl`.
  - If `candidate.resumeUrl` is missing or null, render a muted badge *"No CV Attached"* instead of a dead clickable link.
  - Add a hover tooltip displaying document filename or preview action hint.
- [x] T022 [US4] Verify static file serving in `backend/src/app.js` allows access to `/uploads/recruitment` with proper `Content-Disposition: inline` headers for PDF/Word previews.
- [x] T023 [US4] Add automated component test / e2e check verifying clicking "View CV Document" executes `window.open` with valid absolute URL.

**Checkpoint**: CV preview operates reliably across all candidates without 404 or broken file paths.

---

## Phase 6: User Story 5 (ATS-ENH-5) — Anti-Collision Interview Scheduling & Schedule Transparency (Priority: P1)

**Goal**: Display candidate interview schedules prominently in their profile, and enforce backend validation preventing double-booking overlapping interviews.

**Independent Test**: Candidate drawer displays all interview rounds with dates and status; scheduling an interview colliding within $\pm 45$ minutes of an existing scheduled round throws `400 Bad Request`.

- [x] T024 [US5] Update `scheduleInterview` in `backend/src/modules/recruitment/recruitment.service.js`:
  - Calculate target start time and end time window (`targetDate` to `targetDate + durationMinutes`).
  - Query existing interviews for `candidateId` with `status: 'Scheduled'`.
  - If any existing session overlaps within $\pm 45$ minutes, reject with `400 Bad Request`: `"Candidate already has an interview scheduled at [Time]. Please choose a non-conflicting time."`.
  - Check interviewer availability collision if designated interviewer has an existing session.
- [x] T025 [US5] Update `frontend/src/features/recruitment/components/CandidateDetailModal.jsx`:
  - In "INTERVIEW ROUNDS" section, map through candidate's interviews and render rich round cards:
    - Round number & type badge (Screening, Technical, Cultural, Executive, HR)
    - Formatted Pakistan Standard Time (`DD/MM/YYYY hh:mm A`)
    - Assigned interviewer avatars and names
    - Meeting link (clickable with Google Meet/Zoom icon) or location
    - Status badge (`Scheduled`, `Completed`, `Cancelled`).
- [x] T026 [US5] Update `frontend/src/features/recruitment/components/InterviewScheduleModal.jsx`:
  - Fetch and render existing scheduled rounds at the top of the modal before scheduling form.
  - Implement client-side conflict warning if the selected date and time falls within 1 hour of an existing round.
- [x] T027 [US5] Add integration test in `backend/tests/recruitment/interviewCollision.test.js` confirming overlapping time slots are rejected with `400 Bad Request`.
- [x] T028 [US5] Add unit test asserting candidate detail modal displays populated interview rounds with correct PST date formatting.

**Checkpoint**: Candidate profiles transparently exhibit scheduled rounds and double-booking is blocked at API boundary.

---

## Phase 7: User Story 6 (ATS-ENH-6) — Immutable Interview Scorecards & Locked Rating Indicator (Priority: P1)

**Goal**: Submitted interview ratings are permanently locked and cannot be edited. Evaluation modal displays an informative locked indicator banner with historical rating.

**Independent Test**: Submitting scorecard locks round for interviewer; re-opening `ScorecardModal.jsx` displays locked banner with rating; `PATCH /interviews/:id/feedback` throws `400 Bad Request` if already submitted.

- [x] T029 [US6] Update `submitScorecard` in `backend/src/modules/recruitment/recruitment.service.js`:
  - Locate interview by ID.
  - Check if `interview.scorecards` already contains an entry for `interviewerEmpId`.
  - If existing scorecard found, reject with `400 Bad Request`: `"Interview evaluation is locked. Submitted ratings cannot be modified."`.
  - Recalculate candidate overall rating immutably and advance candidate status if required.
- [x] T030 [US6] Update `frontend/src/features/recruitment/components/ScorecardModal.jsx`:
  - Detect if current logged-in employee has already submitted feedback for this interview round.
  - If evaluated, display top alert banner:
    > *"Candidate has already been evaluated with an overall rating of X/5.0. Ratings are locked."*
  - Disable all star rating inputs, competency sliders, recommendation radios, and note textareas.
  - Hide "Submit Evaluation" button and render a "Close Evaluation" button instead.
- [x] T031 [US6] Update `CandidateDetailModal.jsx` round items to render submitted scorecard summary badges (e.g., `⭐ 4.5/5 • Recommended`) when completed.
- [x] T032 [US6] Add backend integration test in `backend/tests/recruitment/scorecardLock.test.js` asserting second submission attempt returns `400 Bad Request`.
- [x] T033 [US6] Add frontend test verifying `ScorecardModal.jsx` renders locked state and disabled controls when scorecard is present.

**Checkpoint**: Interview scorecards and ratings are tamper-proof and visually transparent.

---

## Phase 8: User Story 7 (ATS-ENH-7) — Automated Candidate Email Notifications for Interviews & Rounds (Priority: P2)

**Goal**: Automatically dispatch styled email notifications to candidate upon interview scheduling or round updates.

**Independent Test**: Scheduling an interview triggers `sendInterviewScheduledEmail` with candidate name, position, round type, date/time in PKT, duration, and meeting link.

- [x] T034 [US7] Implement `sendInterviewScheduledEmail({ candidate, interview, job, meetingDetails })` in `backend/src/services/email.service.js`:
  - Styled HTML template with Elvara Forest & Emerald header branding.
  - Candidate Greeting & Position Title.
  - Round Number, Round Type, and Mode (Online / On-site).
  - Date & Time formatted in PKT (`Asia/Karachi`).
  - Meeting URL / Office address and preparation instructions.
  - Support non-blocking dispatch with error logging fallback.
- [x] T035 [US7] Hook `sendInterviewScheduledEmail` into `scheduleInterview` in `backend/src/modules/recruitment/recruitment.service.js` immediately after interview persistence.
- [x] T036 [US7] Add email dispatch upon interview rescheduling/updating in `recruitment.service.js`.
- [x] T037 [US7] Add test in `backend/tests/recruitment/recruitmentEmail.test.js` asserting email payload formatting, PKT date rendering, and safe error suppression if SMTP is unreachable.

**Checkpoint**: Candidates receive immediate automated transactional notifications whenever interview rounds are scheduled or modified.

---

## Phase 9: User Story 8 (ATS-ENH-8) — Global Module Refresh Buttons & Unified Loading States (Priority: P2)

**Goal**: Standardized refresh button equipped with spinning state across all Recruitment & ATS pages and sub-views.

**Independent Test**: Clicking Refresh on `JobsPage.jsx`, `CandidatePipelinePage.jsx`, and `InternalJobsPage.jsx` shows continuous spinning animation, triggers RTK Query `refetch()`, and restores idle state upon resolution.

- [x] T038 [US8] Create reusable `RefreshButton.jsx` component in `frontend/src/components/common/RefreshButton.jsx` (or `frontend/src/features/recruitment/components/RefreshButton.jsx`):
  - Lucide `RotateCw` icon.
  - Prop `onRefresh` (async function or refetch trigger).
  - Prop `isFetching` or internal spinning timer.
  - Tailwind styling aligned with Emerald & Forest theme (`hover:bg-[#1A3125] text-slate-300 hover:text-emerald-400 transition-colors`).
  - Spinning animation `animate-spin` active while fetching.
- [x] T039 [US8] Integrate `RefreshButton` into `frontend/src/features/recruitment/pages/JobsPage.jsx` header next to "Create Requisition" / "Post Job".
- [x] T040 [US8] Integrate `RefreshButton` into `frontend/src/features/recruitment/pages/CandidatePipelinePage.jsx` toolbar next to stage filters.
- [x] T041 [US8] Integrate `RefreshButton` into `frontend/src/features/recruitment/pages/InternalJobsPage.jsx` header.
- [x] T042 [US8] Ensure RTK Query tags `['Job', 'Candidate', 'Requisition', 'Interview']` properly trigger refetch and loading states across tables and Kanban board.

**Checkpoint**: Global refresh controls allow one-click data synchronization across all ATS views.

---

## Phase 10: Verification, Automated Testing & Cross-Role Signoff

**Purpose**: Execute end-to-end multi-role verification, verify zero build regressions, and finalize documentation.

- [x] T043 Run backend test suite:
  ```powershell
  npm --prefix backend test -- recruitment
  ```
  Verify 100% test pass across all requisition attribution, closed job guards, candidate deletion, collision prevention, and scorecard lock tests.
- [x] T044 Execute frontend production build:
  ```powershell
  npm --prefix frontend run build
  ```
  Verify 0 TypeScript/ESLint/Vite bundle errors.
- [x] T045 Multi-role E2E browser verification:
  - **Super Admin** (`boyg1866@gmail.com`): Verify Headcount Requisition shows requesting Department Head details (Name, Code, Designation, Role).
  - **HR Manager** (`muhammadsajwarbabar@gmail.com`): Verify Closed job has no Publish button, verify Delete Job action, verify candidate deletion on Kanban card, verify CV preview button, verify anti-collision error on overlapping interview.
  - **Department Manager / Interviewer**: Open Scorecard modal, submit ratings, re-open modal, verify locked indicator banner with disabled controls.
- [x] T046 [P] Capture UI proof screenshots across desktop and mobile (390px) viewports for verification artifacts.
- [x] T047 Update `docs/BUILD-GUIDE.md` Section 24 and mark all recruitment enhancement rows completed.
- [x] T045 Multi-role E2E browser verification:
  - **Super Admin** (`boyg1866@gmail.com`): Verify Headcount Requisition shows requesting Department Head details (Name, Code, Designation, Role).
  - **HR Manager** (`muhammadsajwarbabar@gmail.com`): Verify Closed job has no Publish button, verify Delete Job action, verify candidate deletion on Kanban card, verify CV preview button, verify anti-collision error on overlapping interview.
  - **Department Manager / Interviewer**: Open Scorecard modal, submit ratings, re-open modal, verify locked indicator banner with disabled controls.
- [x] T046 [P] Capture UI proof screenshots across desktop and mobile (390px) viewports for verification artifacts.
- [x] T047 Update `docs/BUILD-GUIDE.md` Section 24 and mark all recruitment enhancement rows completed.

---

## Dependencies & Execution Order

```
Phase 1: Setup & Environment
   └── Phase 2: US1 Requisition Attribution (Backend -> Frontend)
   └── Phase 3: US2 Closed Job Lockdown & Deletion (Backend -> Frontend)
   └── Phase 4: US3 Candidate Deletion (Backend -> Frontend)
   └── Phase 5: US4 CV Document Previewer (Frontend -> Backend headers)
   └── Phase 6: US5 Anti-Collision Scheduling (Backend -> Frontend)
   └── Phase 7: US6 Immutable Scorecards (Backend -> Frontend)
   └── Phase 8: US7 Candidate Email Notifications (Backend Email Service)
   └── Phase 9: US8 Global Refresh Buttons (Frontend Component & Integration)
   └── Phase 10: Verification & E2E Signoff
```

- **Parallel Opportunities**:
  - `T002`, `T003` in Phase 1 run concurrently.
  - Phase 2 (US1), Phase 3 (US2), and Phase 4 (US3) backend changes touch distinct methods within `recruitment.service.js`.
  - Phase 5 (US4) and Phase 9 (US8) are primarily frontend UI improvements and can be implemented in parallel with backend test updates.
- **Critical Path**:
  - Backend validation & mutations $\rightarrow$ Frontend API slice bindings $\rightarrow$ UI components $\rightarrow$ E2E validation.

