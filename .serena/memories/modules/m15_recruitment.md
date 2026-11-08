# Module M15 — Recruitment & AI Resume Screening

## Overview
- Module ID: M15
- Phase: Phase 3
- Specification: docs/BUILD-GUIDE.md Section 24 (Rows 15.1 - 15.13)
- Status: Completed & Verified (100% tests pass, Playwright automated verification passed)

## Models Created
1. `backend/src/models/requisition.model.js`:
   - Headcount opening requests with requestedBy, openingsCount, min/maxSalaryPaisa, justification, requiredSkills, status (`Pending_Approval`, `Approved`, `Rejected`), decidedBy, decidedAt, decisionRemarks, jobId.
2. `backend/src/models/job.model.js`:
   - Published, Draft, or Closed job postings with unique SEO slug, departmentId, designationId, requirements, responsibilities, location, salary range in paisa, createdBy.
3. `backend/src/models/candidate.model.js`:
   - Job applicants with stage (`Applied`, `Shortlisted`, `Interview`, `Technical_Test`, `Offer`, `Hired`, `Rejected`), aiScore (0-100), aiScreeningReason, parsedProfile (candidateName, parsedSkills, totalExperienceYears, highestEducation, executiveSummary), technicalTest, offerDetails (baseSalaryPaisa, allowances [{ name, amountPaisa }], letterUrl, status), stageHistory, hiredEmployeeId.
4. `backend/src/models/interview.model.js`:
   - Interview scheduling with roundNumber, roundType (`Screening`, `Technical`, `Cultural`, `Executive`, `HR`), interviewers, scheduledDate, meetingLink, status, and scorecards (ratings 1-5, recommendation `Strong_Hire`, `Hire`, `Hold`, `No_Hire`, notes).

## Architecture & Integration Decisions
1. **AI Parsing & Screening (`backend/src/services/ai.service.js`)**:
   - Primary: OpenAI `gpt-4o-mini` with strict structured outputs (`response_format: { type: 'json_schema', ... }`).
   - Delimiters `[CANDIDATE_RESUME_DATA_START]` and `[CANDIDATE_RESUME_DATA_END]` neutralize prompt injection inside resumes.
   - Secondary: Deterministic regex heuristics when `OPENAI_API_KEY` is not provided.
   - Human-in-the-loop: AI only scores and reasons; stages are transitioned by HR/recruiter.
2. **One-Click Hire Concurrency Lock**:
   - `hireCandidate` uses an atomic check-and-set state transition: `findOneAndUpdate({ _id: candidateId, stage: 'Offer' }, { $set: { stage: 'Hiring_In_Progress' } })`. Concurrent duplicate calls receive HTTP 409 Conflict without spawning duplicate employees.
   - Successfully invokes M3 `employeeService.createEmployee`, which initializes initial leave balances and triggers M18 onboarding checklist.
3. **Horizontal PBAC Scoping**:
   - Resolved via `resolveActorDepartmentId(actor)`. Restricts Department Managers to candidates and requisitions in their department.
   - Blocks unauthorized access to candidate offer letters and downloads.
4. **Security & File Ingestion**:
   - Strict whitelist on resume upload MIME types and file extensions (`.pdf`, `.doc`, `.docx`, `.txt`).
   - Buffer magic bytes verification for PDF header `%PDF-`.
   - 30-day anti-duplicate throttle per email & opening.
   - `checkPermission` evaluated before Multer file buffering on `/referrals`.

## Frontend Features
- Public Portal: `/careers` (openings browse) and `/careers/:slug/apply` (application form with CV upload).
- Protected Workforce:
  - `/recruitment/jobs`: Requisition management, approvals, and job CRUD.
  - `/recruitment/pipeline`: Interactive drag-and-drop Kanban board with candidate profile drawer, AI match badge, interview scheduler, scorecard form, technical test dispatch, offer letter generator, and One-Click Hire.
  - `/jobs/internal`: Internal company job board and employee referral submissions.
