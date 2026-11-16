# Phase 10: AI Resume Screening Accuracy, Candidate Data Parsing & UI Improvements — Context

## 1. Problem Statement & Root Cause Findings

When clicking on an Applied Candidate in the Candidate Pipeline (e.g. for the Full Stack Developer job), the screening modal exhibits two critical defects:
1. **Degree Hallucination**:
   - Candidates whose resumes explicitly state a Bachelor's degree (e.g., `BS Computer Science`, `Bachelor of Science (Computer Science)`) are displayed with `Highest Education: Master's Degree`.
   - **Root Cause Identified**: In [backend/src/services/ai.service.js](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/services/ai.service.js) lines 70–73:
     ```javascript
     } else if (/master|m\.?sc|m\.?s|mba/i.test(text)) {
       highestEducation = 'Master’s Degree';
     }
     ```
     Because the regex lacks word boundaries on `m\.?s` and checks before Bachelor's, any CV containing English words like `"Systems Engineer"`, `"CMS"`, `"Forms"`, `"Terms"`, or `"Scrum Master"` triggers a positive match for `Master's Degree`!
2. **Experience Calculation Discrepancies**:
   - The regex matches generic year spans (`2018 - 2022`) which conflates academic degree timelines with employment history, resulting in incorrect experience totals (e.g. 0 or inflated years).
3. **Skills Matching Inversion & Requirement Clumping**:
   - When jobs have requirements entered as comma-separated or space-separated lists (e.g., `'Node Js Html Css Javascript Mongo DB MYSQL Tailwind Css Bootstrap'`), the matcher in `screenCandidateFit` did:
     `const isMatched = candSkills.some((s) => s.includes(req) || req.includes(s));`
     Since the long requirement string includes `"css"` or `"html"`, matching `req.includes("css")` evaluated to `true`, mistakenly marking the ENTIRE clumped string as a "matching strength" and reporting 0 missing skills!
4. **Target Modal Identification**:
   - The modal currently used when clicking any candidate in the Candidate Pipeline is **[CandidateDetailModal.jsx](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/recruitment/components/CandidateDetailModal.jsx)**, located at `frontend/src/features/recruitment/components/CandidateDetailModal.jsx`.
   - It is driven by the backend endpoint `GET /api/v1/recruitment/candidates/:id` (`getCandidateById` in `recruitment.service.js`).
   - It displays a combination of raw extracted resume attributes (`candidate.parsedProfile`) and AI-generated screening scores (`candidate.aiScore`, `candidate.aiScreeningReason`).

---

## 2. Technical Architecture & Constraints
- **Design System**: Forest & Emerald (`#00C471` brand primary, `#111D17` dark surface, `#1A3125` hairline border, `#061A14` deep canvas) per `DESIGN.md` and `docs/UI-REFERENCE.md`.
- **RBAC & PBAC Permissions**:
  - `recruitment.candidate.view`: Required to view candidate details and download original CV document.
  - `recruitment.candidate.screen`: Required to trigger manual re-screening.
  - `recruitment.candidate.stage`: Required to advance candidate through pipeline stages.
  - `recruitment.candidate.hire`: Required to convert candidate into employee.
  - `recruitment.candidate.delete`: Restricted to Super Admin / HR Manager.
- **Zero Hallucination Mandate**: If an education level or experience period cannot be identified with high confidence, set to `"Not Specified / Verification Required"` instead of guessing. Never convert Bachelor's into Master's.
- **Matched vs. Missing Separation**:
  - Tokenize job requirements into individual skills.
  - Separate matched skills (emerald pills with checkmarks) from missing required skills (rose pills with alert icons).
