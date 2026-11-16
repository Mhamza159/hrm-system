# Phase 10: Research & Investigation Notes

## 1. Candidate CV Analysis & Forensic Verification

We inspected the actual raw text extracted from the three candidates who applied to the Full Stack Developer job in the database:

### Candidate 1: Noraiz Ali (`norezali.dev@gmail.com`)
- **Original Document Text**:
  - *"ABOUT ME: I hold a BS in Computer Science, and I'm passionate about software engineering..."*
  - *"[ 30/07/2023 ] Bachelor of Science ( Computer Science) National University of Computer & Emerging Sciences City: Faisalabad"*
  - *"WORK EXPERIENCE: [ 05/2024 - 11/2024 ] Front-end Development Intern (6 months), [ 01/01/2025 - Current ] Web developer"*
- **Previously Displayed in Modal**:
  - `Highest Education: Master's Degree` (FAILED - Hallucination)
  - `Total Experience: 1 Years` (Under-represented intern + developer span)
- **Why It Happened**:
  - In `heuristicResumeParser`: `/master|m\.?sc|m\.?s|mba/i.test(text)` matched words in the document body.
  - LLM failed due to HTTP 429 quota exhaustion on Gemini, dropping to this buggy heuristic parser.

### Candidate 2: Muhammad Naik (`hamihakim33@gmail.com`)
- **Original Document Text**:
  - *"Mohammad Hamza Hakim — Software Engineer (MERN Stack)... Education: Bachelor of Science in Computer Science, National University of Computer & Emerging Sciences (FAST-NUCES), Faisalabad"*
  - Experience: Independent Full Stack Developer, A to Z Coders, multiple production MERN apps (Hotel PMS, Enterprise Banking API, VYBE).
- **Previously Displayed in Modal**:
  - `Highest Education: Master's Degree` (FAILED - Hallucination)
  - `Total Experience: 0 Years` (FAILED - missed experience because duration was in months/project sections)
- **Why It Happened**:
  - Same regex substring match for `m\.?s` on words like `"MERN Stack"` and `"Systems"`.

### Candidate 3: Muhammad Adnan (`boyg1866@gmail.com`)
- **Original Document Text**:
  - *"BS Computer Science (BSCS) with knowledge of software development... Bachelors Of Computer Science Virtual University"*
  - Experience: *"Worked as a Junior Laravel Developer for 1 year... UnitSol (1 year), XLOGIC Solutions (3 months), Cubix Solutions (1 year)"*
- **Previously Displayed in Modal**:
  - `Highest Education: Master's Degree` (FAILED - Hallucination)
  - `Total Experience: 4 Years` (Matched 2018-2020 intermediate college span instead of work experience)
- **Why It Happened**:
  - Word `"management systems"` and `"algorithms"` triggered the unanchored `m\.?s` regex.

---

## 2. Requirement Tokenization Forensic Investigation
- In MongoDB, Job Opening `Full Stack Developer` has `requirements`:
  - `['React Js', 'Node Js Html Css Javascript Mongo DB MYSQL Tailwind Css Bootstrap']`
- In `ai.service.js:316`:
  ```javascript
  reqLower.forEach((req) => {
    const isMatched = candSkills.some((s) => s.includes(req) || req.includes(s));
    ...
  });
  ```
- Because `req = 'node js html css javascript mongo db mysql tailwind css bootstrap'`, and the candidate has `'css'` in `candSkills`, `req.includes('css')` is TRUE!
- This falsely reported that the candidate matched ALL of those skills, completely suppressing missing skills detection.

## 3. Targeted Fix Strategy
1. **Degree Resolution Engine**:
   - Check strict educational section anchors or exact degree abbreviations (`BSCS`, `BSIT`, `BSSE`, `Bachelor of Science`, `B.Sc`, `B.S.`).
   - For Master's, require explicit phrase `Master of Science`, `M.Sc`, `M.Phil`, `MBA`, or `Master's in/of` with word boundaries `\b`.
   - Never default to assuming a degree if not found; return `'Not Specified / Verification Required'`.
2. **Experience Calculator**:
   - Parse explicitly stated experience headers (`X years experience`, `X months`).
   - When scanning date spans, differentiate job experience from educational spans (e.g. discard spans appearing immediately under `Education`, `FSc`, `Matric`, `Degree`).
3. **Smart Requirement Tokenizer**:
   - Split compound requirement lines containing multiple known tech keywords into separate individual requirements.
   - Exact bidirectional token matching to prevent substring subsumption.
4. **CandidateDetailModal Segmentation**:
   - Organize into clean tabs or well-demarcated sections:
     - **Header**: Candidate Name, Stage pill, Applied Job, Contact, CV link, Match Score, Re-screen button.
     - **Extracted Profile**: Total Experience, Highest Education, Sourced Via, AI Engine badge.
     - **Skills Analysis (Side-by-side or distinct grids)**:
       - **Matched Skills**: Emerald badges with checkmarks (`React`, `Node.js`, `Tailwind CSS`).
       - **Missing Skills**: Rose badges with alert icons (`Docker`, `GraphQL`).
     - **AI Fit Assessment**: Concise rationale, strengths, missing qualifications.
     - **Interview & Recruitment Actions**: Schedule, Test, Offer, Hire, Reject, Delete.
