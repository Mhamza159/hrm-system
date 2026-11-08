# Task Breakdown: M15 - Recruitment & AI Screening

**Feature Branch**: `feature/22-recruitment-ai-screening`  
**Created**: 2026-11-08  
**Status**: Ready for Implementation  
**Module**: M15 Recruitment & AI Resume Screening  
**Sources of Truth**:
- `docs/BUILD-GUIDE.md`: Section 24 (Rows 15.1 to 15.13)
- `.specify/specs/22-recruitment-ai-screening/spec.md`
- `.specify/specs/22-recruitment-ai-screening/plan.md`
- `docs/TECH-SPEC.md`: Sections 3, 4, 5, 6, 8
- `docs/FRD.md`: Section 5.3 & Section 11

---

## Task Overview & Sequencing Strategy

Tasks are organized strictly in **Vertical Slice Order**:
For each BUILD-GUIDE row:
1. **Backend Tasks (`BE`)**: Schema/Model $\rightarrow$ Validation $\rightarrow$ Service Method $\rightarrow$ Controller & Route $\rightarrow$ Route Mounting.
2. **Frontend Tasks (`FE`)**: RTK Query Endpoints $\rightarrow$ Component / Page $\rightarrow$ PBAC `<Can>` Guarding $\rightarrow$ Navigation / Route.
3. **Automated Test Tasks (`TEST`)**: Targeted unit / integration tests confirming the slice works in isolation.

P1 (Core ATS, AI Screening, Kanban, Offer & Hire) precedes P2 (Employee Referrals & Internal Mobility).  
The final task executes an end-to-end Playwright test across all 4 system roles.

---

## Phase 0: Foundation & Permissions Catalogue

- [x] 15.0-SETUP-BE: Register 14 Recruitment Permissions in `backend/src/shared/permissions.js`
  - Add `recruitment` module definition to `PERMISSIONS_CATALOGUE` with actions:
    `recruitment.requisition.create`, `recruitment.requisition.view`, `recruitment.requisition.decide`,
    `recruitment.job.view`, `recruitment.job.manage`, `recruitment.candidate.view`, `recruitment.candidate.screen`,
    `recruitment.candidate.stage`, `recruitment.interview.manage`, `recruitment.interview.evaluate`,
    `recruitment.offer.manage`, `recruitment.offer.view`, `recruitment.hire`, `recruitment.referral.submit`.
  - Update `ALL_ACTION_IDS` test suite to verify catalogue integrity.
- [x] 15.0-SETUP-FE: Create RTK Query API Slice `frontend/src/features/recruitment/recruitmentApi.js`
  - Define `recruitmentApi` with tags: `['Job', 'Candidate', 'Requisition', 'Interview']`.
  - Mount reducer and middleware in `frontend/src/app/store.js`.
  - Add Recruitment routes to `frontend/src/app/router.jsx` (`/recruitment/jobs`, `/recruitment/pipeline`, `/recruitment/requisitions`, `/careers`, `/careers/:slug`, `/jobs/internal`).
  - Add Recruitment navigation items into `frontend/src/components/layout/Sidebar.jsx` guarded by RBAC permissions.

---

## Phase 1: Core ATS & Headcount Requisitions (P1)

### Row 15.1: Job Requisition Creation
- [x] 15.1-BE: Implement Requisition Model, Validation & Creation Endpoint
  - File: `backend/src/models/requisition.model.js` (departmentId, designationId, requestedBy, openingsCount, justification, minSalaryPaisa, maxSalaryPaisa, status: `Pending_Approval`).
  - File: `backend/src/modules/recruitment/recruitment.validation.js` (Zod schema for requisition creation).
  - File: `backend/src/modules/recruitment/recruitment.service.js` (`createRequisition` method with scope resolution and manager audit tracking).
  - File: `backend/src/modules/recruitment/recruitment.controller.js` & `recruitment.routes.js` (`POST /requisitions` guarded by `recruitment.requisition.create`).
- [x] 15.1-FE: Build Requisition Modal & List Component
  - File: `frontend/src/features/recruitment/components/RequisitionModal.jsx` (department, designation, openings count, salary band in PKR, justification).
  - Integrate RTK Query mutation `useCreateRequisitionMutation` with success toast.
  - Guard submission action with `<Can I="recruitment.requisition.create">`.
- [x] 15.1-TEST: Requisition Creation Unit & Scope Test
  - File: `backend/tests/recruitment/requisition.test.js`
  - Verify Department Manager can create requisition with `Pending_Approval` status.
  - Verify non-manager employee receives HTTP 403 Forbidden.

---

### Row 15.2: Position Approval & Job Draft Creation
- [x] 15.2-BE: Implement Requisition Decision Logic & Automatic Job Draft
  - File: `backend/src/modules/recruitment/recruitment.service.js` (`decideRequisition` method).
  - On approval (`decision === 'approved'`), atomically create draft `Job` document (`status: 'Draft'`) linked to requisition.
  - On rejection, record `decisionRemarks` and set status to `Rejected`.
  - File: `backend/src/modules/recruitment/recruitment.controller.js` & `recruitment.routes.js` (`PATCH /requisitions/:id/decide` guarded by `recruitment.requisition.decide` with `all` scope).
- [x] 15.2-FE: Build Super Admin Requisitions Approval Queue
  - Add "Requisitions Queue" tab to `frontend/src/features/recruitment/pages/JobsPage.jsx`.
  - Render pending cards with Approve and Reject actions, reason prompt modal, and salary band display.
  - Guard action buttons with `<Can I="recruitment.requisition.decide">`.
- [x] 15.2-TEST: Requisition Approval & Job Draft Integration Test
  - Verify Super Admin approval transitions requisition to `Approved` and creates `Job` in `Draft` status.
  - Verify rejection sets `Rejected` without creating a draft job.

---

### Row 15.3: Job Posting CRUD & Public Careers Portal
- [x] 15.3-BE: Implement Job Model, CRUD Endpoints & Public Listing Route
  - File: `backend/src/models/job.model.js` (title, slug [unique], departmentId, designationId, employmentType, location, description, requirements, responsibilities, minExperienceYears, status: `Draft | Published | Closed`, closingDate).
  - Validation schemas for job creation and update in `recruitment.validation.js`.
  - Service methods: `getJobs`, `getJobById`, `createJob`, `updateJob`, `getPublicJobs`, `getPublicJobBySlug`.
  - Endpoints: `GET /jobs`, `POST /jobs`, `PATCH /jobs/:id` (guarded by `recruitment.job.manage`) and unauthenticated public endpoints `GET /public/jobs`, `GET /public/jobs/:slug`.
- [x] 15.3-FE: Build Admin Job Management & Public Careers Portal Pages
  - File: `frontend/src/features/recruitment/pages/JobsPage.jsx` (metric summary cards, job table, status badges, create job action).
  - File: `frontend/src/features/recruitment/pages/JobFormPage.jsx` (rich job authoring form).
  - File: `frontend/src/features/recruitment/pages/CareersPublicPage.jsx` (external career page with department/employment filters, search bar, and clean responsive layout).
- [x] 15.3-TEST: Public vs Internal Job Listings Test
  - File: `backend/tests/recruitment/job.test.js`
  - Verify public endpoint returns only `Published` jobs and omits `Draft` and `Closed` jobs.
  - Verify slug generation and retrieval.

---

### Row 15.4: Candidate Application & CV Ingestion
- [x] 15.4-BE: Implement Candidate Model, Multer File Upload & Public Application Route
  - File: `backend/src/models/candidate.model.js` (jobId, name, email, phone, cvUrl, linkedinUrl, portfolioUrl, stage: `Applied`, aiScore, aiScreeningReason, parsedProfile, stageHistory).
  - File: `backend/src/middlewares/upload.js` (`uploadResume`: MemoryStorage, fileFilter PDF/DOC/DOCX, 5MB limit).
  - File: `backend/src/modules/recruitment/recruitment.service.js` (`applyForJob` with 30-day anti-duplicate throttle per job+email).
  - File: `backend/src/modules/recruitment/recruitment.controller.js` & `recruitment.routes.js` (`POST /public/jobs/:id/apply` with `express-rate-limit`).
- [x] 15.4-FE: Build Public Candidate Application Page
  - File: `frontend/src/features/recruitment/pages/ApplyPage.jsx` (full name, email, phone, URLs, drag-and-drop CV upload with progress, terms checkbox).
  - Client-side size (< 5MB) and mime-type check before submission.
  - Confirmation screen with application reference code.
- [x] 15.4-TEST: Candidate Ingestion & Duplicate Throttle Test
  - File: `backend/tests/recruitment/candidateApplication.test.js`
  - Test valid application returns 201 Created and saves candidate in `Applied` stage.
  - Test uploading invalid file format (.exe) returns 400 Bad Request.
  - Test duplicate application with same email within 30 days is rejected.

---

## Phase 2: AI Resume Parsing, Scoring & Interactive Pipeline (P1)

### Row 15.5: AI CV Parsing Engine
- [x] 15.5-BE: Build AI Service with OpenAI Structured Outputs & Fallback
  - File: `backend/src/services/ai.service.js`
  - Implement `parseResumeText(cvBuffer)` using OpenAI Structured Outputs (`json_schema` with strict schema: `candidateName`, `parsedSkills`, `experienceYears`, `highestEducation`, `summary`).
  - Implement robust fallback parser if OpenAI API key is missing or quota is exhausted.
  - Update `Candidate` document with `parsedProfile` fields (`parsedSkills`, `totalExperienceYears`, `highestEducation`, `executiveSummary`).
- [x] 15.5-FE: Build Candidate Parsed Profile Viewer in Drawer
  - File: `frontend/src/features/recruitment/components/CandidateDetailModal.jsx`
  - Display parsed skills as interactive chips, experience timeline, and education summary.
  - Include "Download Original CV" button.
- [x] 15.5-TEST: AI Parsing Schema & Resilience Test
  - File: `backend/tests/recruitment/aiParsing.test.js`
  - Test parsing returns strictly compliant JSON structure.
  - Test graceful fallback without throwing unhandled exceptions.

---

### Row 15.6: AI Match Score & Fit Reasoning
- [x] 15.6-BE: Implement AI Candidate Screening & Scoring Endpoint
  - File: `backend/src/services/ai.service.js` (`screenCandidateFit` method comparing candidate parsed profile vs Job requirements).
  - Calculate integer score (0–100), `matchingStrengths` array, and `missingSkills` array.
  - File: `backend/src/modules/recruitment/recruitment.service.js` (`screenCandidate` method).
  - Endpoint: `POST /candidates/:id/screen` guarded by `recruitment.candidate.screen`.
- [x] 15.6-FE: Build AI Match Score Badge & Rationale Popover
  - File: `frontend/src/features/recruitment/components/AIScreeningBadge.jsx`
  - Color-coded match badge: $\ge 80\%$ Forest Emerald, $60-79\%$ Amber, $<60\%$ Slate.
  - Popover modal showing matching strengths, missing skills, and AI summary.
  - Add "Re-run AI Screening" action button in `CandidateDetailModal.jsx`.
- [x] 15.6-TEST: AI Screening Score Range & Persistence Test
  - File: `backend/tests/recruitment/aiScreening.test.js`
  - Verify AI score is integer between 0 and 100.
  - Verify strengths and missing skills persist to `candidate.model.js`.

---

### Row 15.7: Interactive Kanban Candidate Pipeline Board
- [x] 15.7-BE: Implement Kanban Stage Transition & History Logging
  - Allowed stages: `Applied` $\rightarrow$ `Shortlisted` $\rightarrow$ `Interview` $\rightarrow$ `Technical_Test` $\rightarrow$ `Offer` $\rightarrow$ `Hired` (or `Rejected` from any stage).
  - Service method `updateCandidateStage` validating permitted transitions.
  - Log stage transition in `candidate.stageHistory` (`stage`, `changedBy`, `timestamp`, `notes`).
  - Endpoint: `PATCH /candidates/:id/stage` guarded by `recruitment.candidate.stage`.
- [x] 15.7-FE: Build Drag-and-Drop Candidate Kanban Board
  - File: `frontend/src/features/recruitment/pages/CandidatePipelinePage.jsx`
  - 6-column Kanban layout (`Applied`, `Shortlisted`, `Interview`, `Technical_Test`, `Offer`, `Hired`).
  - Drag-and-drop card interaction with optimistic UI update and server synchronization.
  - Filter by Job Opening, Department, and minimum AI Score.
- [x] 15.7-TEST: Kanban Stage Transition Whitelist Test
  - File: `backend/tests/recruitment/candidatePipeline.test.js`
  - Verify valid forward transitions succeed and log history entry.
  - Verify arbitrary invalid skips return 400 Bad Request.

---

### Row 15.8: Interview Scheduling & Evaluator Scorecards
- [x] 15.8-BE: Implement Interview Model, Scheduling & Scorecard Endpoints
  - File: `backend/src/models/interview.model.js` (candidateId, jobId, roundNumber, roundType, interviewers[], scheduledDate, durationMinutes, meetingLink, status, scorecards[]).
  - Service methods: `scheduleInterview`, `submitScorecard`, `getInterviewsForCandidate`.
  - Trigger email notification to interviewers and candidate on schedule.
  - Endpoints: `POST /candidates/:id/interviews` (`recruitment.interview.manage`) and `POST /interviews/:id/scorecard` (`recruitment.interview.evaluate`).
- [x] 15.8-FE: Build Interview Scheduler & Evaluator Scorecard Modals
  - File: `frontend/src/features/recruitment/components/InterviewScheduleModal.jsx` (date/time, panelist multi-select, meeting link, round type).
  - File: `frontend/src/features/recruitment/components/ScorecardModal.jsx` (1-5 star ratings for Technical, Communication, Cultural Fit, Recommendation dropdown, notes).
  - Display aggregated scorecard badge on candidate detail drawer.
- [x] 15.8-TEST: Interview Scheduling & Scorecard Aggregation Test
  - File: `backend/tests/recruitment/interview.test.js`
  - Verify interview scheduling links candidate and panel.
  - Verify multiple interviewer scorecards calculate average ratings accurately.

---

### Row 15.9: Technical Test Link & Email Dispatch
- [x] 15.9-BE: Implement Technical Test Assignment & Notification
  - Update `Candidate` schema with `technicalTest: { testUrl, assignedDate, status, score }`.
  - Service method `assignTechnicalTest(candidateId, { testUrl, instructions })`.
  - Trigger automated test invitation email via `email.service.js`.
  - Endpoint: `POST /candidates/:id/technical-test` guarded by `recruitment.candidate.stage`.
- [x] 15.9-FE: Add Technical Test Dispatch Dialog
  - Add "Send Technical Test" button to `CandidateDetailModal.jsx` when candidate is in `Technical_Test` stage.
  - Modal to input test URL (e.g. HackerRank / GitHub repo) and custom instructions.
  - Display test submission status pill on candidate card.
- [x] 15.9-TEST: Technical Test Dispatch & Notification Test
  - File: `backend/tests/recruitment/technicalTest.test.js`
  - Verify test URL is recorded and status transitions to `Pending_Submission`.

---

## Phase 3: Offer Management & One-Click Hire (P1)

### Row 15.10: Offer Letter Generation & PDF Issuance
- [x] 15.10-BE: Implement PDFKit Offer Letter Generator & Offer Endpoints
  - File: `backend/src/services/offerPdf.service.js` (PDFKit stream with corporate letterhead, candidate details, joining date, base salary paisa, allowances table, signatures).
  - Service method `issueOfferLetter(candidateId, offerPayload, actor)`.
  - Endpoints: `POST /candidates/:id/offer` (`recruitment.offer.manage`) and `GET /candidates/:id/offer/pdf` (`recruitment.offer.view`).
- [x] 15.10-FE: Build Offer Letter Issuance Modal & PDF Downloader
  - File: `frontend/src/features/recruitment/components/OfferLetterModal.jsx` (monthly salary in PKR, allowances breakdown, joining date, probation duration).
  - "Generate & Preview PDF" button streaming offer letter in browser.
  - "Send Formal Offer" button transitioning candidate stage to `Offer`.
- [x] 15.10-TEST: PDF Offer Letter Stream & Content Test
  - File: `backend/tests/recruitment/offerLetter.test.js`
  - Verify PDF generation produces valid binary PDF buffer with correct candidate compensation.

---

### Row 15.11: One-Click Hire to M3 Employee & M18 Onboarding
- [x] 15.11-BE: Implement One-Click Hire Transaction with Cross-Module Linking
  - File: `backend/src/modules/recruitment/recruitment.service.js` (`hireCandidate` method).
  - Use MongoDB transaction session:
    1. Verify candidate is in `Offer` stage.
    2. Call Module M3 `employee.service.js` `createEmployee` (generates `EMP-XXXX`, department, designation, salary).
    3. Call Module M18 Onboarding service to initialize onboarding checklist for the new employee.
    4. Update candidate status to `Hired` and set `hiredEmployeeId`.
  - Endpoint: `POST /candidates/:id/hire` guarded by `recruitment.hire`.
- [x] 15.11-FE: Build "Convert to Employee" Action & Success Redirect
  - Add "Convert to Employee" button on candidate card in `CandidatePipelinePage.jsx` and `CandidateDetailModal.jsx`.
  - Confirmation modal displaying generated employee preview and salary confirmation.
  - Upon success, show celebratory toast and direct link to new profile in Directory (`/employees/:id`).
- [x] 15.11-TEST: One-Click Hire Integration Test
  - File: `backend/tests/recruitment/oneClickHire.test.js`
  - Verify atomic creation of `Employee` document with valid employee code and linking to `Candidate`.
  - Verify rollback if employee creation fails.

---

### Row 15.13: Human-in-the-Loop Safeguards
- [x] 15.13-BE: Enforce Anti-Auto-Rejection Architecture Guard
  - Ensure backend screening worker strictly scores candidates and NEVER mutates candidate stage to `Rejected`.
  - Rejection requires explicit `PATCH /candidates/:id/stage` call by authenticated HR Manager with recorded `decisionReason`.
- [x] 15.13-FE: Human Decision Confirmation UI Guard
  - Candidate rejection requires explicit HR confirmation modal with rejection reason selection and optional email feedback.
- [x] 15.13-TEST: Anti-Auto-Rejection Verification Test
  - File: `backend/tests/recruitment/humanInTheLoop.test.js`
  - Verify candidate with AI score < 30 remains in `Applied` stage until HR manually rejects.

---

## Phase 4: Internal Mobility & Employee Referrals (P2)

### Row 15.12: Internal Job Board & Employee Referrals
- [x] 15.12-BE: Implement Internal Job Board & Referral Endpoints
  - Endpoint: `GET /jobs/internal` (returns published jobs open for internal transfers or referrals).
  - Endpoint: `POST /referrals` (multipart form with candidate info + CV, records `referredBy: actor.employeeId`).
  - Guard `POST /referrals` with `recruitment.referral.submit` (default `own` scope for all active employees).
- [x] 15.12-FE: Build Internal Mobility & Referral Portal
  - File: `frontend/src/features/recruitment/pages/InternalJobsPage.jsx` (open positions, "Refer a Candidate" button, "My Submitted Referrals" tab).
  - File: `frontend/src/features/recruitment/components/EmployeeReferralModal.jsx` (referral form with relationship notes and CV file attachment).
- [x] 15.12-TEST: Employee Referral Integration Test
  - File: `backend/tests/recruitment/employeeReferral.test.js`
  - Verify regular employee can submit referral and candidate record contains `referredBy` linkage.

---

## Phase 5: Verification & End-to-End Playwright Testing

- [x] 15.14-E2E: Module M15 End-to-End Playwright Test Across All 4 Roles
  - File: `e2e/m15-recruitment.spec.js`
  - **Department Manager Flow**: Logs in $\rightarrow$ submits headcount requisition for Senior Frontend Engineer $\rightarrow$ verifies `Pending_Approval` status.
  - **Super Admin Flow**: Logs in $\rightarrow$ reviews approvals queue $\rightarrow$ approves requisition $\rightarrow$ verifies draft Job is spawned.
  - **HR Manager Flow**: Logs in $\rightarrow$ publishes Job to public careers portal $\rightarrow$ monitors Kanban pipeline.
  - **Public External Flow**: Visits `/careers` $\rightarrow$ views job listing $\rightarrow$ submits application with CV on `/careers/apply`.
  - **Recruiter Flow**: HR opens `CandidatePipelinePage.jsx` $\rightarrow$ verifies candidate card with AI match score badge $\rightarrow$ schedules interview $\rightarrow$ moves to Interview $\rightarrow$ submits scorecard $\rightarrow$ generates and previews PDF offer letter $\rightarrow$ executes One-Click Hire.
  - **Verification**: Confirms new employee profile is active in `/employees` and linked to candidate record.
  - **Employee Flow**: Logs in $\rightarrow$ visits `/jobs/internal` $\rightarrow$ submits referral for peer $\rightarrow$ verifies referral appears in "My Referrals" list.

