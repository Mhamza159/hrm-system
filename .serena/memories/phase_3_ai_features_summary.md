# Phase 3: AI Features (Intelligence Scope) - Progress & Status Summary

## Progress Overview
- Total Modules: 3 (M15, M16, M17)
- Total Features: 27
- Completed Features: 22 / 27 (81.5%)
- Status: In Progress (M15 & M16 Complete; M17 Pending)

## Completed Modules in Phase 3
### 1. M15 — Recruitment & AI Screening (13/13 Features Complete)
- Requisition & Job Openings workflow with PBAC approvals.
- Candidate application portal with CV upload and resume parsing.
- AI Match Score & Detailed Rationale vs Job Requirements.
- Interactive Kanban candidate pipeline board (Applied -> Screened -> Interviewing -> Offered -> Hired -> Rejected).
- Interview scheduler with evaluator feedback forms and technical assessments.
- Automated offer letter generator and single-click candidate-to-employee onboarding conversion.
- Human-in-the-loop mandate: AI provides analytical match scoring, humans make all hiring decisions.

### 2. M16 — HR Chatbot (9/9 Features Complete)
- Dual-engine architecture supporting Google Gemini 2.5 Flash and OpenAI GPT-4o-mini via native OpenAI-compatible function calling, paired with an offline deterministic heuristic engine.
- Function Tools: `searchPolicy`, `getMyLeaveBalance`, `getMyLastPayslip`, `getNextPayDate`, `applyLeave`.
- Policy document ingestion (`PolicyDoc`) with chunked text extraction and category indexing.
- Human escalation queue (`UnansweredQuestion`) with instant "Ask HR" button for missing handbook topics.
- Multi-tier security: Prompt injection defense, ReDoS immunity via `escapeRegex()`, NoSQL sanitization, per-user daily rate limiting (`dailyLimitPerUser`, default 30).
- Bilingual natural language support: Automatic detection and response in polite English and Roman Urdu.

## Pending Module in Phase 3
### 3. M17 — Attrition Prediction (0/5 Features Pending)
- 17.1: Weekly risk score calculation job (`jobs/attritionScore.job.js`, `attritionScore.model.js`).
- 17.2: Risk tiers (Low, Medium, High) with primary contributing drivers (`AttritionDashboardPage.jsx`).
- 17.3: Department retention trends analytics (`GET /analytics/attrition/departments`).
- 17.4: Retention recommendations & HR intervention action notes (`POST /attrition/:id/notes`).
- 17.5: Confidentiality & scoping (Strict access restricted to HR & Super Admin, 403 for employee).
