# Feature Specification: M15 - Recruitment & AI Screening

**Feature Branch**: `feature/22-recruitment-ai-screening`  
**Created**: 2026-11-08  
**Status**: Draft  
**Module**: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Rows 15.1 to 15.13)  
**Sources of Truth**:
- `docs/FRD.md`: Section 5.3 (Recruitment & AI Resume Screening)
- `docs/FRD.md`: Section 11 (Permission Matrix Row M15: Super Admin `Full`, HR Manager `Manage`, Dept Manager `Team`, Employee `View/Refer`)
- `docs/BUILD-GUIDE.md`: Section 24 (Rows 15.1 to 15.13)
- `DESIGN.md`: Forest & Emerald Palette (`#111D17` Dark Surface, `#1A3125` Dark Border, `#00C471` Emerald Accent)

---

## 1. Role-Based Access Control (PBAC Matrix)

Per `docs/FRD.md` Section 11:
- **Super Admin**: Authorize job requisitions, approve executive salary offers, and access complete company-wide hiring pipelines and audit trails.
- **HR Manager**: Post and manage job openings, review applicant CVs, trigger AI screening, move candidate stages in Kanban, schedule interviews, and issue offer letters.
- **Department Manager**: Raise departmental hiring requisitions (`team`), review candidates for own department's open jobs, and submit interviewer feedback scorecards.
- **Employee**: Browse internal job postings (`/jobs/internal`), submit employee referrals with candidate CV, and track referral status.
- **Public / Unauthenticated**: Access the public careers portal (`/careers`), view published job listings, and submit employment applications with CV attachments.

---

## 2. Prioritized User Stories (BUILD-GUIDE Rows 15.1 to 15.13)

### User Story 1 (ID: 15.1) - Job Requisition Creation (Priority: P1)
As a Department Manager, I want to submit a formal job requisition for my department so that new headcount can be officially requested with designated criteria, budget, and justification.

- **Independent Test**: Manager submits a requisition with designation, openings count, salary range, and justification; document is created in `requisition.model.js` with status `Pending_Approval`.
- **Acceptance Criteria**:
  - **Given** an authenticated Department Manager, **When** they fill out `RequisitionForm.jsx` with designation, department, number of openings, required experience, and salary band (min/max PKR paisa) and click "Submit Requisition", **Then** a requisition is created with status `Pending_Approval` and an alert notification is sent to HR and Super Admin.
  - **Given** an Employee without managerial rights, **When** they attempt to access requisition creation, **Then** the action is blocked with HTTP 403 Forbidden.
  - **Given** a Super Admin or HR Manager, **When** they view requisitions, **Then** all pending departmental requests appear in their approval queue.

---

### User Story 2 (ID: 15.2) - Requisition Decision & Job Draft Creation (Priority: P1)
As a Super Admin, I want to review and approve or reject pending job requisitions so that verified positions can proceed to public recruitment.

- **Independent Test**: Calling `PATCH /requisitions/:id/decide` with `decision: "approved"` updates the requisition and automatically generates a draft Job record (`job.model.js`).
- **Acceptance Criteria**:
  - **Given** a requisition with status `Pending_Approval`, **When** the Super Admin approves it via the approvals queue, **Then** the requisition transitions to `Approved`, and a corresponding `Job` document is automatically created in `Draft` status for HR to finalize and publish.
  - **Given** a Department Manager who raised the requisition, **When** the Super Admin decides on the request, **Then** the Department Manager receives an in-app notification with the decision and remarks.
  - **Given** a rejection decision, **When** Super Admin specifies rejection notes, **Then** status becomes `Rejected` and no draft job is spawned.

---

### User Story 3 (ID: 15.3) - Job Publishing & Public Careers Portal (Priority: P1)
As an HR Manager, I want to publish approved job openings to a public careers portal so that external candidates can view positions without needing an account.

- **Independent Test**: Public endpoint `GET /public/jobs` returns only `Published` jobs without requiring an authentication token, rendered on `CareersPublicPage.jsx`.
- **Acceptance Criteria**:
  - **Given** an unauthenticated visitor navigating to `/careers`, **When** they view the page, **Then** they see all active published jobs filtered by department, employment type (Full-time, Contract, Remote), and location.
  - **Given** a published job, **When** the public visitor clicks on a job card, **Then** `CareersPublicPage.jsx` displays complete job details, responsibilities, requirements, and an "Apply Now" button.
  - **Given** an HR Manager in the admin console (`JobsPage.jsx`), **When** they toggle a job from `Draft` to `Published` or `Closed`, **Then** the public visibility updates immediately.

---

### User Story 4 (ID: 15.4) - Candidate Application & CV Ingestion (Priority: P1)
As an external candidate, I want to submit my job application with personal details and upload my CV (PDF/DOCX) so that I can be considered for the opening.

- **Independent Test**: Calling `POST /public/jobs/:id/apply` with multipart form data parses the CV file, validates file type and size (<= 5MB), and creates a `Candidate` document in `Applied` stage.
- **Acceptance Criteria**:
  - **Given** a valid job posting, **When** an applicant submits `ApplyPage.jsx` with full name, email, phone, LinkedIn/GitHub URL, and CV file (PDF/DOCX <= 5MB), **Then** a candidate record is created with stage `Applied`, an automated confirmation email is sent, and rate limiting protects against bot spam.
  - **Given** an invalid file (e.g. `.exe` or > 5MB), **When** uploaded, **Then** Multer rejects the request with HTTP 400 and an informative error message.
  - **Given** a duplicate email applying for the same job within 30 days, **When** submitted, **Then** the system detects the existing application and prevents duplicate spam.

---

### User Story 5 (ID: 15.5) - AI Resume Parsing Engine (Priority: P1)
As an HR Manager, I want the system to parse candidate CV text into structured JSON (skills, years of experience, education degrees, certifications) so that candidate profiles are immediately searchable and comparable.

- **Independent Test**: `ai.service.js` parses resume text through OpenAI `response_format: { type: "json_schema" }` into strict `{ skills: [], experienceYears: number, education: [], summary: string }`.
- **Acceptance Criteria**:
  - **Given** a newly ingested CV document, **When** the parser executes, **Then** candidate fields `parsedSkills`, `totalExperienceYears`, `highestEducation`, and `executiveSummary` are populated as structured data on the `Candidate` document.
  - **Given** a corrupted or unparseable document, **When** parsing fails, **Then** the candidate record is saved with `parsingStatus: "failed"` and the raw file is retained for manual HR review.

---

### User Story 6 (ID: 15.6) - AI Match Score & Fit Reasoning (Priority: P1)
As an HR Manager or Department Manager, I want AI to score each applicant's CV against the job description (0–100) with a concise bulleted rationale so that recruiters can quickly identify top talent.

- **Independent Test**: Calling `POST /candidates/:id/screen` evaluates candidate skills/experience against Job requirements and records `aiScore` (0-100) and `aiScreeningReason` string.
- **Acceptance Criteria**:
  - **Given** a candidate in `Applied` stage, **When** screening is triggered (or auto-queued on apply), **Then** OpenAI evaluates matching criteria and returns an integer score (0–100) with matching strengths, missing skills, and an overall suitability summary.
  - **Given** the candidate card in the UI, **When** viewed by HR or Department Manager, **Then** an emerald score badge (e.g. `92% Match`) is displayed alongside the explanation modal.

---

### User Story 7 (ID: 15.7) - Interactive Kanban Candidate Pipeline Board (Priority: P1)
As an HR Manager, I want a visual drag-and-drop Kanban pipeline board (`Applied` -> `Shortlisted` -> `Interview` -> `Technical_Test` -> `Offer` -> `Hired` / `Rejected`) so that our recruitment workflow is managed collaboratively and efficiently.

- **Independent Test**: Dragging or patching a candidate's stage via `PATCH /candidates/:id/stage` validates permitted stage transitions and updates the board in real-time.
- **Acceptance Criteria**:
  - **Given** candidates in various stages, **When** an HR Manager drags a candidate card from `Applied` to `Shortlisted`, **Then** the stage updates, the candidate's activity history logs the change, and the column count updates.
  - **Given** a Department Manager viewing the board, **When** inspecting openings, **Then** they only see candidate pipelines belonging to their department's jobs.

---

### User Story 8 (ID: 15.8) - Interview Scheduling & Evaluator Feedback (Priority: P2)
As an HR Manager and Interviewer, I want to schedule interview rounds with Google/Outlook calendar invites and record structured evaluation feedback scorecards (1-5 rating on technical skills, communication, culture fit).

- **Independent Test**: Calling `POST /candidates/:id/interviews` schedules a round and notifies the interviewer; `PATCH /interviews/:id/feedback` captures interviewer rating and recommendation.
- **Acceptance Criteria**:
  - **Given** a candidate in `Interview` stage, **When** HR schedules a round with an assigned employee interviewer, date, time, and meeting link, **Then** the interviewer receives an in-app and email notification.
  - **Given** an assigned interviewer, **When** they complete the interview and submit `FeedbackForm.jsx`, **Then** scores (1-5), recommendation (`Strong Hire`, `Hire`, `Hold`, `No Hire`), and notes are permanently appended to the candidate's interview timeline.

---

### User Story 9 (ID: 15.9) - Technical Assessment Link Dispatch (Priority: P2)
As an HR Manager, I want to send technical coding or test links to shortlisted candidates via automated email so that candidate technical competence can be verified before final rounds.

- **Independent Test**: Triggering "Send Test" updates candidate `testLink` and dispatches branded email with instructions.
- **Acceptance Criteria**:
  - **Given** a candidate in `Shortlisted` or `Technical_Test` stage, **When** HR inputs a test URL and deadline and clicks "Send Assessment", **Then** an automated email is dispatched to the candidate and candidate status records the test dispatch timestamp.

---

### User Story 10 (ID: 15.10) - Branded Offer Letter Generation (Priority: P2)
As an HR Manager and Super Admin, I want to generate a formal PDF offer letter with corporate branding, salary breakdown, joining date, and designation, and email it to the candidate.

- **Independent Test**: Calling `POST /candidates/:id/offer` generates a styled PDF stream using PDFKit, attaches it to an email, and records offer terms (`baseSalaryPaisa`, `joiningDate`, `validUntil`).
- **Acceptance Criteria**:
  - **Given** a candidate in `Offer` stage, **When** HR enters agreed base pay (PKR), allowances, joining date, and expiration date, **Then** a branded corporate PDF is generated with PDFKit and sent via email for candidate acceptance.
  - **Given** an offer letter, **When** candidate status is updated to `Offer_Accepted` or `Offer_Declined`, **Then** the pipeline reflects the candidate's decision.

---

### User Story 11 (ID: 15.11) - One-Click Conversion of Hired Candidate to Employee (Priority: P1)
As an HR Manager, I want to convert an accepted candidate directly into an active Employee profile with one click so that manual re-entry of data is completely eliminated and onboarding begins automatically.

- **Independent Test**: Calling `POST /candidates/:id/hire` creates a new `Employee` document (M3 Row 3.2), auto-generates their `employeeCode`, links their designation and department, initializes onboarding tasks (M18 Row 18.2), and updates candidate stage to `Hired`.
- **Acceptance Criteria**:
  - **Given** a candidate with `Offer_Accepted`, **When** HR clicks "Convert to Employee", **Then**:
    1. A new `Employee` document is created with their name, email, phone, departmentId, and designationId.
    2. An official `employeeCode` (e.g. `EMP-0018`) is auto-generated.
    3. An initial salary structure is drafted from the accepted offer terms.
    4. Module M18 Onboarding checklist is automatically instantiated for the employee.
    5. Candidate stage becomes `Hired` with a direct link to the new employee record.

---

### User Story 12 (ID: 15.12) - Internal Job Openings & Employee Referrals (Priority: P2)
As a company Employee, I want to browse internal job openings and submit referrals with my friend/colleague's resume so that I can participate in company growth and referral rewards.

- **Independent Test**: Calling `GET /jobs/internal` lists published jobs for authenticated employees; `POST /referrals` links referring employee ID to the new candidate profile.
- **Acceptance Criteria**:
  - **Given** an authenticated Employee navigating to `InternalJobsPage.jsx`, **When** they view open positions, **Then** they can click "Refer a Candidate" to upload a resume and contact info.
  - **Given** a referred candidate, **When** viewed on the HR pipeline board, **Then** a "Referred by [Employee Name]" badge is displayed.

---

### User Story 13 (ID: 15.13) - Human-in-the-Loop Governance (Priority: P1)
As a System Compliance Rule, AI match scoring must strictly act as an advisor; the system must NEVER automatically reject or advance candidates without human confirmation.

- **Independent Test**: Even if AI match score is 0% or 100%, candidate stage remains `Applied` until an authorized HR Manager or Super Admin manually takes action.
- **Acceptance Criteria**:
  - **Given** any candidate screened by AI, **When** the score is computed, **Then** no automatic state transition to `Rejected` or `Hired` occurs; the decision is exclusively manual.

---

## 3. Official Context7 Library Syntax & Architecture Patterns

### A. OpenAI Structured Outputs (`/websites/developers_openai_api`)
Strict JSON Schema response format enforces guaranteed structured CV parsing and match scoring without hallucinated JSON strings:

```javascript
import OpenAI from 'openai';
import { env } from '../config/env.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// AI CV Parsing Pattern
export const parseResumeWithAI = async (resumeText) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an enterprise talent intelligence parser. Extract structured candidate credentials strictly adhering to the schema.'
      },
      {
        role: 'user',
        content: resumeText
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'resume_parser',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            skills: { type: 'array', items: { type: 'string' } },
            experienceYears: { type: 'number' },
            highestEducation: { type: 'string' },
            summary: { type: 'string' }
          },
          required: ['skills', 'experienceYears', 'highestEducation', 'summary'],
          additionalProperties: false
        }
      }
    }
  });

  return JSON.parse(completion.choices[0].message.content);
};
```

### B. PDFKit Document Generation (`/foliojs/pdfkit`)
Corporate Offer Letter PDF streaming with branding, margins, font sizing, and response piping:

```javascript
import PDFDocument from 'pdfkit';

export const generateOfferLetterPdf = (res, { candidateName, designationTitle, joiningDate, salaryPkr, companyName }) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Stream directly to HTTP response or writable file stream
  doc.pipe(res);

  // Corporate Header
  doc
    .fontSize(22)
    .fillColor('#111D17')
    .text(companyName, { align: 'left' })
    .fontSize(10)
    .fillColor('#7E9E8F')
    .text('OFFICIAL EMPLOYMENT OFFER & APPOINTMENT LETTER', { align: 'left' })
    .moveDown(1.5);

  // Body content
  doc
    .fontSize(11)
    .fillColor('#2D3748')
    .text(`Dear ${candidateName},`)
    .moveDown(0.8)
    .text(`We are pleased to extend this formal offer of employment for the position of ${designationTitle}.`)
    .moveDown(0.8)
    .text(`Starting Compensation: PKR ${Number(salaryPkr).toLocaleString()}`)
    .text(`Anticipated Joining Date: ${new Date(joiningDate).toLocaleDateString()}`)
    .moveDown(2);

  // Sign-off
  doc
    .fontSize(10)
    .fillColor('#718096')
    .text('Authorized Signatory: Human Resources Department');

  // Finalize PDF stream
  doc.end();
};
```

### C. Multer Upload & File Validation (`/expressjs/multer`)
Secure resume upload handling (PDF & DOCX only, <= 5MB limit):

```javascript
import multer from 'multer';
import path from 'path';
import { ApiError } from '../utils/ApiError.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.pdf', '.docx', '.doc'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file format. Only PDF, DOC, and DOCX resumes are accepted.'), false);
  }
};

export const resumeUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB ceiling
  fileFilter
});
```

---

## 4. Next Step
Specification is complete and verified against `docs/FRD.md` and `docs/BUILD-GUIDE.md`.  
Proceed by running `/speckit-plan` to generate the technical architecture blueprint, schema contract, and API routes.

