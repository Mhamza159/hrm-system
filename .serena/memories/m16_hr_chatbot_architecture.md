# Module M16: HR Chatbot (Completed)

## Overview & Architecture Decisions
- Dual-Engine AI Architecture:
  - Primary Layer: Google Gemini 2.5 Flash / OpenAI GPT-4o-mini with native Tool Calling (function declarations) and natural bilingual generation (English + Roman Urdu).
  - Fallback Layer: Deterministic regex and heuristic search engine for offline and automated test environments.
- Identity & Security Isolation:
  - Actors can only fetch their own leave balances, salary slips, and payroll schedules using `req.user.employeeId`.
  - Adversarial prompt injection attempting to leak peer records (e.g. Ali's salary) is blocked with confidential policy refusal.
  - NoSQL injection protection using recursive object key sanitizer.
  - ReDoS protection via `escapeRegex()` before text search.
  - Daily query rate limiting (`dailyLimitPerUser`, default 30) configurable by Super Admin.
  - Two-step confirmation gate before executing leave applications (`applyLeave`).

## Models Added
1. `PolicyDoc` (`backend/src/models/policyDoc.model.js`):
   - Stores company policy PDFs/docs, extracted text chunks, category, version, and active status.
2. `ChatMessage` (`backend/src/models/chatMessage.model.js`):
   - Tracks chat history per user, role (user/assistant/tool), tool call records, sources, and language detection.
3. `UnansweredQuestion` (`backend/src/models/unanswered.model.js`):
   - Human escalation queue for unanswered or unindexed queries, tracking status, HR answer, and resolution timestamp.

## Endpoints Added
- `POST /api/v1/chatbot/ask` (`CHATBOT_ASK`, Scope: Self)
- `GET /api/v1/chatbot/history` (`CHATBOT_HISTORY`, Scope: Self)
- `DELETE /api/v1/chatbot/clear` (`CHATBOT_CLEAR`, Scope: Self)
- `POST /api/v1/chatbot/escalate` (`CHATBOT_ASK`, Scope: Self)
- `GET /api/v1/chatbot/policies` (`CHATBOT_POLICY_READ`, Scope: Company)
- `POST /api/v1/chatbot/policies` (`CHATBOT_POLICY_MANAGE`, Scope: Company)
- `DELETE /api/v1/chatbot/policies/:id` (`CHATBOT_POLICY_MANAGE`, Scope: Company)
- `GET /api/v1/chatbot/unanswered` (`CHATBOT_UNANSWERED_MANAGE`, Scope: Company)
- `PATCH /api/v1/chatbot/unanswered/:id/answer` (`CHATBOT_UNANSWERED_MANAGE`, Scope: Company)
- `GET /api/v1/chatbot/settings` (`CHATBOT_SETTINGS_VIEW`, Scope: Company)
- `PATCH /api/v1/chatbot/settings` (`CHATBOT_SETTINGS_MANAGE`, Scope: Company)

## Frontend Features Added
- `ChatbotWidget.jsx`: Floating interactive AI assistant with quick prompts, tool actions, and Roman Urdu support.
- `PolicyDocsPage.jsx`: HR portal to upload and manage searchable policy documents.
- `UnansweredQuestionsPage.jsx`: HR escalation queue to review and answer employee queries.
- `ChatbotSettingsTab.jsx`: Super Admin global toggle and daily query limit controls.
