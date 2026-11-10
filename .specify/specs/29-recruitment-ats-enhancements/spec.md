# Feature Specification: Recruitment & ATS Functional & UI Enhancements

**Feature Branch**: `feature/29-recruitment-ats-enhancements`  
**Created**: 2026-11-10  
**Status**: Ready for Planning  
**Module**: Module M15 — Recruitment & ATS Enhancements  
**Sources of Truth**:
- User Request & Uploaded UI Screenshots (`media_1794297576587_57688068.jpg`, `media_1794297686376_a19e0625.png`, `media_1794298138917_c16ad884.png`, `media_1794298390699_907cd1e5.png`)
- `docs/FRD.md`: Section 5.3 & Section 11 (Permission Matrix Row M15)
- `docs/BUILD-GUIDE.md`: Section 24 (Rows 15.1 – 15.13)
- `.specify/specs/22-recruitment-ai-screening/spec.md`

---

## 1. Executive Summary & Goals

This specification formalizes crucial functional refinements, data integrity constraints, and UI/UX upgrades for the **Recruitment & Applicant Tracking System (ATS)**. These enhancements resolve operational gaps identified during real-world workflow validation:

1. **Global Observability & State Management**: Standardized refresh controls with spinning indicators across all recruitment views and sub-modals.
2. **Requisition Attribution**: Full transparent display of the requesting Department Manager's profile (Name, Employee ID, Designation, Role) for Super Admin review.
3. **Job Lifecycle Lockdown & Deletion**: Prevention of illegal republishing of Closed jobs, alongside direct deletion of closed job records.
4. **Candidate Pipeline Sanitation**: Per-candidate deletion controls on Kanban cards and modals for clean pipeline maintenance.
5. **CV Accessibility**: Immediate one-click opening and previewing of candidate resumes without broken path or authentication failures.
6. **Anti-Collision Interview Scheduling**: Display of candidate interview schedules and strict backend collision prevention against double-booking.
7. **Scorecard Rating Immutability**: Tamper-proof lock on submitted interview ratings with clear modal indicators displaying historical evaluations.
8. **Automated Applicant Communications**: Instant branded transactional emails dispatched to candidates upon interview scheduling and round updates.

---

## 2. Role-Based Access Control (PBAC Matrix)

| Role | Job Requisitions | Job Postings & Deletion | Candidate Pipeline & Deletion | Scorecard Submission & Review | Candidate Emails |
|---|---|---|---|---|---|
| **Super Admin** | Full review, approve/reject with requesting manager identity | Manage, Publish, Close, Delete | View company-wide, delete applicants, view CVs | View all submitted immutable scorecards | Audit all candidate notifications |
| **HR Manager** | Review requests, convert to jobs | Create, Publish, Close, Delete closed jobs | Drag Kanban stages, delete applicants, view CVs | Schedule interviews, view locked scorecards | Trigger interview & assessment emails |
| **Department Manager** | Submit requisitions for own department | View department jobs | View candidates for department jobs | Submit 1-time locked evaluation scorecard | Receive interview schedule alerts |
| **Employee** | No access | View internal openings | Submit referrals only | Submit scorecard if designated interviewer | — |
| **External Candidate** | No access | View public jobs, apply | View application status via email links | — | Receive automated interview & round notices |

---

## 3. Prioritized User Stories

### User Story 1 (ID: ATS-ENH-1) — Headcount Requisition Requestor Attribution (Priority: P1)
**As a** Super Admin reviewing department headcount requests,  
**I want to** dynamically see the full employee details of the department head who submitted the requisition,  
**So that** I know exactly which manager, employee ID, and designation is requesting budget before making an approval decision.

- **Why this priority**: Without requestor identity, Super Admins cannot verify authority, check departmental allocation, or hold managers accountable for requisition justifications.
- **Independent Test**: Calling `GET /api/v1/recruitment/requisitions` returns populated `requestedBy` with `name`, `employeeCode`, `designationId.title`, and `role.name`, which renders on the Requisitions approval card.

**Acceptance Scenarios**:
1. **Given** a Department Manager (e.g. Huzaifa Hakim, `EMP-0004`, Lead Architect) submits a headcount requisition,  
   **When** Super Admin views the Headcount Requisitions tab in `JobsPage.jsx`,  
   **Then** the requisition card dynamically displays:
     - Requesting Head: `Huzaifa Hakim`
     - Employee ID: `EMP-0004`
     - Designation: `Lead Architect`
     - System Role: `Department Manager`.
2. **Given** an authenticated Department Manager viewing their own submitted requisitions,  
   **When** viewing the tab,  
   **Then** they see their own details with status badge (`Pending_Approval`, `Approved`, `Rejected`).
3. **Given** a requisition where the requesting employee record has missing nested relations,  
   **When** fetched from backend,  
   **Then** safe fallbacks prevent UI crashes and display `Employee (ID)` gracefully.

---

### User Story 2 (ID: ATS-ENH-2) — Job Closure Lockdown & Closed Job Deletion (Priority: P1)
**As an** HR Manager or Super Admin managing job listings,  
**I want** closed jobs to be strictly locked from being republished and provide a direct deletion option for closed jobs,  
**So that** obsolete openings are not accidentally made public and the job catalog remains organized.

- **Why this priority**: Re-publishing a closed job without a fresh requisition violates hiring governance and leaks outdated hiring criteria. Redundant closed jobs clutter the management dashboard.
- **Independent Test**: Verify that a job in `Closed` status renders NO "Publish" button (or disabled with tooltip), and exhibits a functional "Delete Job" action triggering `DELETE /api/v1/recruitment/jobs/:id`.

**Acceptance Scenarios**:
1. **Given** a job with `status: 'Closed'` in `JobsPage.jsx`,  
   **When** viewed in the job grid or details view,  
   **Then** the green "Publish" button is completely removed/hidden from the card.
2. **Given** a job with `status: 'Closed'`,  
   **When** an HR Manager or Super Admin clicks the "Delete Job" action and confirms the confirmation dialog,  
   **Then** the backend marks `isDeleted: true` (or purges if no active hires exist), removes the card from the UI, and displays a success toast.
3. **Given** an adversary attempting a direct API call `PATCH /api/v1/recruitment/jobs/:id` with `{ status: 'Published' }` on a closed job,  
   **When** received by backend,  
   **Then** the request is rejected with `HTTP 400 Bad Request`: *"Closed jobs cannot be republished. A new requisition or job must be initiated."*
4. **Given** a job in `Draft` or `Published` status,  
   **When** viewed,  
   **Then** "Delete" is restricted or warns if applicants exist, but `Closed` jobs always present an explicit deletion option.

---

### User Story 3 (ID: ATS-ENH-3) — Kanban Candidate Deletion & Pipeline Cleanup (Priority: P1)
**As an** HR Manager,  
**I want** a direct "Delete" action on candidate Kanban cards and within candidate profile modals,  
**So that** invalid submissions, withdrawn applicants, or test records can be cleanly pruned from the pipeline.

- **Why this priority**: Once jobs are closed or candidates withdraw, orphan applicants clutter the Kanban board and distort recruitment pipeline analytics.
- **Independent Test**: Clicking "Delete Candidate" on a Kanban card or candidate drawer removes the candidate record via `DELETE /api/v1/recruitment/candidates/:id` and updates the column counter.

**Acceptance Scenarios**:
1. **Given** any candidate card on `CandidatePipelinePage.jsx`,  
   **When** HR hovers over the card or opens the card action menu / detail modal,  
   **Then** an option "Delete Candidate" (red danger button/icon) is visible.
2. **Given** HR clicks "Delete Candidate",  
   **When** confirmed in the confirmation dialog,  
   **Then** `DELETE /api/v1/recruitment/candidates/:id` is dispatched, candidate `isDeleted` is set to `true`, associated interview sessions are cleaned up, and the card disappears immediately from the Kanban column.
3. **Given** an Employee or Department Manager without candidate management permissions,  
   **When** viewing candidate details,  
   **Then** the Delete option is completely hidden.

---

### User Story 4 (ID: ATS-ENH-4) — Instant CV Document Previewer (Priority: P1)
**As an** HR Manager or Interviewer reviewing candidate profiles,  
**I want** clicking on "View CV Document" to reliably open and preview the candidate's CV document immediately,  
**So that** I can review candidate qualifications without encountering broken links, download failures, or blank screens.

- **Why this priority**: The CV is the primary asset in recruitment screening. If the document link is broken or misconfigured, recruitment evaluation stalls.
- **Independent Test**: Clicking "View CV Document" in `CandidateDetailModal.jsx` reliably resolves the absolute HTTPS file URL or Cloudinary asset and opens it in a new browser tab with proper Content-Type headers.

**Acceptance Scenarios**:
1. **Given** a candidate with an uploaded CV (`resumeUrl`),  
   **When** the user clicks "View CV Document" on `CandidateDetailModal.jsx`,  
   **Then** the document opens directly in a new browser window/tab, displaying the PDF or Word document preview cleanly.
2. **Given** a candidate whose resume is stored locally (`/uploads/recruitment/...`),  
   **When** clicked,  
   **Then** the client properly prefixes the backend server origin (`http://localhost:5000` or production domain) so that relative paths resolve correctly.
3. **Given** a candidate record with no resume uploaded,  
   **When** viewing the profile,  
   **Then** the "View CV Document" link is replaced with a disabled badge stating *"No CV Attached"*.

---

### User Story 5 (ID: ATS-ENH-5) — Anti-Collision Interview Scheduling & Schedule Transparency (Priority: P1)
**As an** HR Manager scheduling candidate rounds,  
**I want** candidate interview schedules to be clearly visible in their profile and protected against double-booking,  
**So that** candidates and interviewers are never double-scheduled for overlapping interview sessions.

- **Why this priority**: Double-booking creates embarrassing operational errors with candidates, wastes interviewer time, and damages the company's employer brand.
- **Independent Test**: Attempting to schedule an interview for a candidate who already has an overlapping active session is rejected with `HTTP 400 Bad Request`: *"Candidate already has an interview scheduled within this time window."*

**Acceptance Scenarios**:
1. **Given** a candidate in `CandidateDetailModal.jsx`,  
   **When** the user views the "INTERVIEW ROUNDS" section,  
   **Then** all scheduled and completed interview rounds are displayed with:
     - Round Number & Type (Screening, Technical, Cultural, Executive, HR)
     - Scheduled Date & Time (formatted in Pakistan Standard Time: `DD/MM/YYYY hh:mm A`)
     - Assigned Interviewer Names
     - Meeting Link / Location
     - Status Badge (`Scheduled`, `Completed`, `Cancelled`).
2. **Given** a candidate with an existing interview on `2026-11-15 14:00`,  
   **When** an HR Manager attempts to schedule another interview for the same candidate between `13:30` and `14:45`,  
   **Then** the backend rejects the request with `HTTP 400 Bad Request` and frontend displays a clear validation toast alert.
3. **Given** the schedule interview modal (`InterviewScheduleModal.jsx`),  
   **When** opened,  
   **Then** it lists any previously scheduled active rounds at the top so HR has full context before selecting date and time.

---

### User Story 6 (ID: ATS-ENH-6) — Immutable Interview Scorecards & Locked Rating Indicator (Priority: P1)
**As a** Department Head or Interviewer,  
**I want** submitted interview ratings and scorecards to be permanently locked from modification,  
**So that** candidate evaluation integrity is preserved and ratings cannot be tampered with after the fact.

- **Why this priority**: Performance and hiring audits require that once an interviewer formally submits their assessment, it cannot be edited to bias hiring outcomes.
- **Independent Test**: Calling `PATCH /api/v1/recruitment/interviews/:id/feedback` when the interviewer has already submitted a scorecard returns `HTTP 400 Bad Request`: *"Interview evaluation is locked. Submitted ratings cannot be modified."*

**Acceptance Scenarios**:
1. **Given** an interviewer who has completed an interview and submitted ratings (Technical: 4, Communication: 5, Cultural: 4, Recommendation: `Hire`),  
   **When** any user attempts to open the evaluation modal (`ScorecardModal.jsx`) for that round,  
   **Then** the modal renders in read-only / locked mode:
     - Banner indicator: *"Evaluation Completed: Candidate has already been evaluated with an overall rating of 4.3/5 (Hire). Ratings are locked."*
     - All rating stars/sliders and recommendation dropdowns are disabled.
     - The submit button is hidden or replaced with a "Close" button.
2. **Given** an adversary attempting a direct API PATCH request to update an existing scorecard on that interview,  
   **When** processed by `recruitment.service.js`,  
   **Then** the request is blocked with `HTTP 400 Bad Request`.
3. **Given** an interview with multiple assigned interviewers,  
   **When** Interviewer A submits their scorecard,  
   **Then** Interviewer A's scorecard is locked for Interviewer A, while Interviewer B can still submit their own independent scorecard until they submit.

---

### User Story 7 (ID: ATS-ENH-7) — Automated Candidate Email Notifications for Interviews & Evaluation Rounds (Priority: P2)
**As an** external candidate,  
**I want** to receive an automated, professionally formatted email whenever an interview or evaluation round is scheduled or updated,  
**So that** I have instant written confirmation of the date, time, interview mode, and meeting instructions.

- **Why this priority**: Candidates must be kept informed in real-time. Automated dispatch removes manual email drafting overhead from HR.
- **Independent Test**: Scheduling an interview triggers `sendInterviewInvitationEmail` to `candidate.email` with styled HTML details and Google Calendar / meeting link.

**Acceptance Scenarios**:
1. **Given** HR schedules a new interview round (Round 1: Technical Interview) for a candidate,  
   **When** the interview record is saved,  
   **Then** an automated email is dispatched to `candidate.email` containing:
     - Candidate Full Name
     - Position & Department
     - Round Type & Round Number
     - Scheduled Date & Time (in `Asia/Karachi` PKT timezone)
     - Duration (e.g. 45 minutes)
     - Meeting Link (Google Meet / Zoom URL) or Office Location
     - Preparatory Notes / Instructions.
2. **Given** HR reschedules an existing interview round with a new date/time,  
   **When** updated,  
   **Then** an updated rescheduling notification email is sent to `candidate.email`.
3. **Given** candidate email delivery fails due to SMTP timeout,  
   **When** logging occurs,  
   **Then** the error is captured in server logs without failing the database transaction, and HR is notified in the UI.

---

### User Story 8 (ID: ATS-ENH-8) — Global Module Refresh Buttons & Unified Loading States (Priority: P2)
**As an** HR Manager, Department Manager, or Super Admin navigating Recruitment & ATS,  
**I want** a standardized refresh button equipped with a responsive loading indicator on every page and sub-view,  
**So that** I can manually refetch the latest data instantly and have clear visual feedback while data loads.

- **Why this priority**: In collaborative hiring where multiple managers and HR personnel move candidates and submit requisitions simultaneously, stale data causes confusion.
- **Independent Test**: Clicking the Refresh button on `JobsPage.jsx`, `CandidatePipelinePage.jsx`, or `InternalJobsPage.jsx` sets spinning state, invalidates RTK Query cache tags, refetches data, and stops spinning upon completion.

**Acceptance Scenarios**:
1. **Given** any page in Recruitment & ATS (`JobsPage`, `CandidatePipelinePage`, `InternalJobsPage`),  
   **When** viewing the header toolbar,  
   **Then** a standardized "Refresh" button (with `RotateCw` icon) is prominent next to filters/actions.
2. **Given** user clicks the "Refresh" button,  
   **When** data is refetching,  
   **Then** the `RotateCw` icon animates with continuous spin, the button becomes temporarily disabled, and table/board components render sleek pulse skeletons or loading overlays.
3. **Given** data refetch completes (either successfully or with error),  
   **When** response arrives,  
   **Then** the icon stops spinning, the button re-enables, and the latest records are displayed with a brief unobtrusive feedback toast.

---

## 4. Technical Architecture & File Impact Matrix

| Area | Target File | Nature of Change |
|---|---|---|
| **Backend Model** | `backend/src/models/requisition.model.js` | Ensure `requestedBy` references `Employee` with clean indexes. |
| **Backend Model** | `backend/src/models/interview.model.js` | Enforce unique interviewer per round, add validation hooks. |
| **Backend Service** | `backend/src/modules/recruitment/recruitment.service.js` | Deep-populate `requestedBy` with name, code, designation, role. Add `deleteJob(id, actor)` with closed job guard. Add `deleteCandidate(id, actor)` with cascading interview cleanup. Implement double-booking validation in `scheduleInterview`. Enforce immutability in `submitScorecard`. |
| **Backend Controller** | `backend/src/modules/recruitment/recruitment.controller.js` | Add `deleteJob` and `deleteCandidate` handlers. |
| **Backend Routes** | `backend/src/modules/recruitment/recruitment.routes.js` | Mount `DELETE /jobs/:id` and `DELETE /candidates/:id` with permission guards. |
| **Backend Email Service** | `backend/src/services/email.service.js` | Add `sendInterviewScheduledEmail(candidate, interview, job)` template. |
| **Frontend API Slice** | `frontend/src/features/recruitment/recruitmentApi.js` | Add `deleteJob`, `deleteCandidate` mutations. Invalidate `Job`, `Candidate`, `Requisition` tags cleanly. |
| **Frontend UI Page** | `frontend/src/features/recruitment/pages/JobsPage.jsx` | Add Refresh button with spinner. Hide/disable "Publish" on Closed jobs. Add "Delete Job" action for Closed jobs. Enhance Requisition tab to render full requestor profile (Name, Code, Designation, Role). |
| **Frontend UI Page** | `frontend/src/features/recruitment/pages/CandidatePipelinePage.jsx` | Add Refresh button with spinner. Add Delete action to Kanban cards with confirmation modal. |
| **Frontend UI Component**| `frontend/src/features/recruitment/components/CandidateDetailModal.jsx` | Add reliable "View CV Document" preview/open handler. Add "Delete Candidate" button. Display all interview rounds with PST dates and status badges. |
| **Frontend UI Component**| `frontend/src/features/recruitment/components/ScorecardModal.jsx` | Check if caller already evaluated; render locked banner with previous rating; disable inputs. |
| **Frontend UI Component**| `frontend/src/features/recruitment/components/InterviewScheduleModal.jsx` | Show existing schedules; validate against double-booking before submission. |

---

## 5. Non-Functional Requirements & Design Principles

1. **Pakistani Corporate Localization**: Dates formatted in `DD/MM/YYYY hh:mm A` (Pakistan Standard Time, `Asia/Karachi`).
2. **Design Palette**: Adhere strictly to `DESIGN.md` Forest & Emerald palette (`#111D17` dark surface, `#1A3125` dark border, `#00C471` emerald accent).
3. **Ponytail Ladder Principles**: Standard library first, zero new external npm dependencies, minimal clean diffs.
4. **Security & Trust Boundaries**: Soft-delete enforcement (`isDeleted: true`), authorization boundary check (`recruitment.job.manage`, `recruitment.candidate.manage`).
5. **Human-in-the-Loop Mandate**: AI match scoring remains purely advisory; deletion and scheduling require human confirmation.

---

## 6. Verification & Automated Test Strategy

1. **Vitest Backend Tests**:
   - Closed job republish rejection (`400 Bad Request`).
   - Closed job deletion (`DELETE /jobs/:id` $\rightarrow$ `200 OK`).
   - Candidate deletion with cascading interview updates.
   - Anti-collision double-booking rejection on `scheduleInterview`.
   - Scorecard immutability lock on `submitScorecard`.
   - Deep-populated `requestedBy` attribution in `getRequisitions`.
2. **Frontend Production Build**: Zero Vite bundle or ESLint compilation errors (`npm --prefix frontend run build`).
3. **Playwright E2E Multi-Role Flow**:
   - Super Admin inspects Requisition: verifies Department Head Full Name, Code, Designation, and Role are displayed.
   - HR Manager views Job Openings: verifies Closed job has no Publish button and can be deleted.
   - HR Manager views Candidate Pipeline: clicks Refresh, verifies spinner, clicks View CV, deletes a test candidate.
   - Department Manager opens Scorecard: submits rating, re-opens modal, verifies locked rating indicator.

