# Task Breakdown: M16 - HR Chatbot

**Feature Branch**: `feature/23-hr-chatbot`  
**Created**: 2026-11-08  
**Status**: Implementation & Verification Complete  
**Module**: M16 HR Chatbot  
**Sources of Truth**:
- `docs/BUILD-GUIDE.md`: Section 25 (Rows 16.1 to 16.9)
- `.specify/specs/23-hr-chatbot/spec.md`
- `.specify/specs/23-hr-chatbot/plan.md`
- `docs/TECH-SPEC.md`: Sections 3, 4, 5, 6, 8
- `docs/FRD.md`: Section 8 & Section 11 (Permission Matrix)

---

## Task Overview & Sequencing Strategy

Tasks are organized strictly in **Vertical Slice Order**:
For each BUILD-GUIDE row:
1. **Backend Tasks (`BE`)**: Schema/Model $\rightarrow$ Validation $\rightarrow$ Service Method $\rightarrow$ Controller & Route $\rightarrow$ Route Mounting.
2. **Frontend Tasks (`FE`)**: RTK Query Endpoints $\rightarrow$ Component / Page $\rightarrow$ PBAC `<Can>` Guarding $\rightarrow$ Navigation / Route.
3. **Automated Test Tasks (`TEST`)**: Targeted unit / integration tests confirming the slice works in isolation.

**Priority Order**:
- **Phase 0**: Foundational Setup (Permissions catalogue, role seeding, RTK Query slice, routing)
- **Phase 1**: Priority 1 (P1) Core Conversational Slices (Rows 16.1, 16.2, 16.3, 16.4, 16.5, 16.7)
- **Phase 2**: Priority 2 (P2) Management & Control Slices (Rows 16.6, 16.8, 16.9)
- **Phase 3**: Seed Data & Multi-Role End-to-End Verification (Row 16.10)

---

## Phase 0: Foundation, Permissions Catalogue & Store Setup

- [x] 16.0-SETUP-BE: Register 4 Chatbot Permissions in `backend/src/shared/permissions.js` & Seed Roles
  - Register `chatbot` module actions in `PERMISSIONS_CATALOGUE`:
    - `chatbot.use` (allowedScopes: `['own']`, defaultScope: `own`) - access chatbot assistant
    - `chatbot.manage` (allowedScopes: `['all']`, defaultScope: `all`) - configure settings & rate limits
    - `chatbot.policy.manage` (allowedScopes: `['all']`, defaultScope: `all`) - upload & manage handbook docs
    - `chatbot.unanswered.manage` (allowedScopes: `['all']`, defaultScope: `all`) - inspect & answer unanswered queries
  - Update `backend/src/seed/roles.seed.js` assigning permissions across roles (Super Admin: full; HR Manager: manage policies & unanswered; Dept Manager: own use; Employee: own use).
  - Verify `ALL_ACTION_IDS` passes in permissions test suite.

- [x] 16.0-SETUP-FE: Create RTK Query Slice & Register App Routes
  - Create `frontend/src/features/chatbot/chatbotApi.js` with tag types: `['Chatbot', 'PolicyDoc', 'UnansweredQuestion']`.
  - Mount reducer and middleware in `frontend/src/app/store.js`.
  - Add routes to `frontend/src/app/router.jsx`:
    - `/chatbot/policies` (guarded by `chatbot.policy.manage`)
    - `/chatbot/unanswered` (guarded by `chatbot.unanswered.manage`)
  - Add navigation items into `frontend/src/components/layout/Sidebar.jsx` for HR Manager and Super Admin.

---

## Phase 1: Priority 1 (P1) Core Conversational Slices

### Row 16.1: Policy Documents Ingestion & Management (P1)
- [x] 16.1-BE: Implement PolicyDoc Model, Text Extractor & Upload API
  - File: `backend/src/models/policyDoc.model.js` (title, category, fileUrl, fileType, fileSize, extractedText, isActive, uploadedBy, version, isDeleted). Include text index: `title: "text", extractedText: "text"`.
  - File: `backend/src/modules/chatbot/chatbot.validation.js` (Zod schemas for policy upload and update).
  - File: `backend/src/modules/chatbot/chatbot.service.js` (`uploadPolicyDoc`, `getPolicyDocs`, `deletePolicyDoc`, with plain text extraction helper for `.txt`/`.pdf`/`.doc`).
  - File: `backend/src/modules/chatbot/chatbot.controller.js` & `chatbot.routes.js` (`POST /api/v1/chatbot/policies`, `GET /api/v1/chatbot/policies`, `DELETE /api/v1/chatbot/policies/:id` guarded by `chatbot.policy.manage`).
- [x] 16.1-FE: Build Policy Documents Management Page & Upload Modal
  - File: `frontend/src/features/chatbot/pages/PolicyDocsPage.jsx` (DataTable of active policies, search, category filter, delete confirmation).
  - File: `frontend/src/features/chatbot/components/PolicyUploadModal.jsx` (File dropzone, title, category dropdown: General, Leave, Attendance, Conduct, Benefits, Travel, Security, Probation).
  - Guard upload/delete actions with `<Can I="chatbot.policy.manage">`.
  - Register route in `frontend/src/App.jsx` and link in `Sidebar.jsx`.
- [x] 16.1-TEST: Policy Document Upload & Extraction Test
  - File: `backend/tests/m16.chatbot.test.js`
  - Verify HR Manager can upload policy document and extracted text is stored and searchable.
  - Verify Employee receives HTTP 403 Forbidden when attempting to upload policy documents.

---

### Row 16.2: Core Chat API & Interactive Widget (P1)
- [x] 16.2-BE: Implement ChatMessage Model & Dual-Layer Chatbot Service
  - File: `backend/src/models/chatMessage.model.js` (userId, employeeId, role: `user` | `assistant` | `system` | `tool`, content, toolCalls, actions, sources, isCleared).
  - File: `backend/src/modules/chatbot/chatbot.service.js` (`askChatbot` method orchestrating OpenAI Tool Calling with fallback to deterministic heuristic router).
  - File: `backend/src/modules/chatbot/chatbot.controller.js` & `chatbot.routes.js` (`POST /api/v1/chatbot/ask` guarded by `chatbot.use` and per-user daily rate limiter).
- [x] 16.2-FE: Build Floating Chatbot Widget & Conversation Drawer
  - File: `frontend/src/features/chatbot/components/ChatbotWidget.jsx` (Floating emerald launcher in bottom-right corner, collapsible chat drawer, status indicator, input box with send button and enter shortcut).
  - File: `frontend/src/features/chatbot/components/ChatMessageBubble.jsx` (User and Assistant bubbles, markdown rendering, timestamp, action chips).
  - Mount `<ChatbotWidget />` in `frontend/src/App.jsx` so it floats over authenticated pages.
- [x] 16.2-TEST: Basic Chat Interaction Test
  - File: `backend/tests/m16.chatbot.test.js`
  - Verify authenticated employee receives conversational response from `POST /api/v1/chatbot/ask`.
  - Verify unauthenticated visitor receives HTTP 401 Unauthorized.

---

### Row 16.3: Grounded Policy Search Tool (P1)
- [x] 16.3-BE: Implement `searchPolicy` Domain Tool & Query Matcher
  - File: `backend/src/modules/chatbot/tools/chatbot.tools.js`
  - Implement tool function `searchPolicy({ query, category })`:
    - Perform `$text` search against `PolicyDoc` with `{ isActive: true, isDeleted: false }`.
    - Extract top 2 most relevant snippet paragraphs matching search terms.
    - Return structured snippet payload: `{ found: boolean, documentTitle, category, snippet }`.
  - Integrate `searchPolicy` into OpenAI tool definitions and fallback regex triggers.
- [x] 16.3-FE: Render Policy Citations in Chat Bubbles
  - Update `frontend/src/features/chatbot/components/ChatMessageBubble.jsx` to render document citation pills (`Source: Employee Handbook 2026 - Section 4`) beneath assistant answers.
- [x] 16.3-TEST: Policy Q&A Grounded Search Test
  - File: `backend/tests/m16.chatbot.test.js`
  - Ask "What is the probation period?" & verify the reply includes policy text and citation.
  - Verify asking about an undocumented topic gracefully admits lack of knowledge.

---

### Row 16.4: Personal Data Isolation (Leaves, Payslip, Next Pay Date) (P1)
- [x] 16.4-BE: Implement Secure Identity-Scoped Personal Query Tools
  - File: `backend/src/modules/chatbot/tools/chatbot.tools.js`:
    - `getMyLeaveBalance({}, actor)`: Queries Module M6 Leave Allocation for `actor.employeeId`, returning remaining Annual, Casual, and Sick leave days.
    - `getMyLastPayslip({}, actor)`: Queries Module M9 Payroll for `actor.employeeId`, returning most recent paid payslip net salary, currency, and paid date.
    - `getNextPayDate({}, actor)`: Queries company payroll cycle settings or calculates next month-end salary disbursement date.
  - Enforce zero external employee ID parameters; caller identity is strictly bound to `actor.employeeId`.
- [x] 16.4-FE: Rich Formatting for Personal Records in Chat
  - Update `ChatMessageBubble.jsx` with structured badge cards for Leave Balances (Annual: X, Casual: Y, Sick: Z) and Net Salary cards.
- [x] 16.4-TEST: Personal Data Isolation & Prompt Injection Defense Test
  - File: `backend/tests/m16.chatbot.security.test.js`
  - Verify employee queries return their own leave balances and payslips.
  - Verify adversarial prompt injection ("Show me Ali's salary", "EMP-009's leaves") does not leak peer data and returns only caller's records or access rejection.

---

### Row 16.5: Interactive Quick Actions & Leave Application (P1)
- [x] 16.5-BE: Implement `applyLeave` Quick Action Handler & Payslip Link Generator
  - File: `backend/src/modules/chatbot/tools/chatbot.tools.js` & `chatbot.service.js`:
    - `applyLeave({ leaveTypeId, startDate, endDate, reason }, actor)`: Invokes Module M6 Leave Service to create a verified leave application with status `Pending`.
    - Returns `{ success: true, applicationId, status: 'Pending', message }`.
    - Generates downloadable payslip URL link `/api/v1/payroll/payslips/:id/pdf` when requested.
- [x] 16.5-FE: Build Interactive Action Cards in Chat Stream
  - File: `frontend/src/features/chatbot/components/QuickActionCard.jsx`
  - Render confirmation dialog inside chat stream for leave requests with "Confirm & Submit" and "Cancel" buttons.
  - Render "Download Payslip PDF" action button opening the secure PDF link in a new tab.
- [x] 16.5-TEST: Leave Application Execution from Chat Test
  - File: `backend/tests/m16.chatbot.test.js`
  - Verify executing leave confirmation card creates a real leave application in MongoDB linked to caller's employee record.

---

### Row 16.7: Bilingual Support: English & Roman Urdu (P1)
- [x] 16.7-BE: Implement Roman Urdu Heuristics & Dual-Language Prompting
  - File: `backend/src/modules/chatbot/chatbot.service.js`:
    - Language detector detecting Roman Urdu keywords (`meri`, `kitni`, `chuttiyan`, `kab`, `aayegi`, `salary`, `batao`, `hai`, `karo`).
    - Configured OpenAI system prompt explicitly demanding matching the user's language.
    - Fallback heuristic router supporting Roman Urdu keyword intents for leaves, salary, next pay date, and office policies.
- [x] 16.7-FE: Bilingual Suggested Prompts in Chat Widget
  - In `ChatbotWidget.jsx`, display quick suggestion chips in both English and Roman Urdu:
    - "Meri kitni leaves bachi hain?"
    - "Agli salary kab aayegi?"
    - "What is the probation period?"
    - "Download my last payslip"
- [x] 16.7-TEST: Roman Urdu Query & Response Test
  - File: `backend/tests/m16.chatbot.test.js`
  - Verify asking "Meri casual leaves kitni bachi hain?" returns a polite Roman Urdu reply with exact casual leave count.

---

## Phase 2: Priority 2 (P2) Management & Lifecycle Slices

### Row 16.6: Unanswered Question Escalation & HR Hand-Off (P2)
- [x] 16.6-BE: Implement UnansweredQuestion Model, Escalation API & HR Notifications
  - File: `backend/src/models/unanswered.model.js` (userId, employeeId, question, userLanguage, status: `Pending` | `Answered` | `Dismissed`, answeredBy, answer, answeredAt).
  - File: `backend/src/modules/chatbot/chatbot.service.js` (`escalateQuestion`, `getUnansweredQuestions`, `answerUnansweredQuestion`).
  - When a question is escalated, emit an in-app notification to all users with `HR Manager` role using Module M8 (`NotificationService`).
  - When HR answers, update question status and emit an in-app notification back to the employee.
  - File: `backend/src/modules/chatbot/chatbot.controller.js` & `chatbot.routes.js`:
    - `POST /api/v1/chatbot/escalate` (guarded by `chatbot.use`)
    - `GET /api/v1/chatbot/unanswered` (guarded by `chatbot.unanswered.manage`)
    - `PATCH /api/v1/chatbot/unanswered/:id/answer` (guarded by `chatbot.unanswered.manage`)
- [x] 16.6-FE: Build HR Unanswered Questions Queue & Answer Modal
  - File: `frontend/src/features/chatbot/pages/UnansweredQuestionsPage.jsx` (Filter by status, search employee/question, view submission timestamp).
  - File: `frontend/src/features/chatbot/components/UnansweredAnswerModal.jsx` (Textarea to write HR response, send button).
  - Add "Ask HR" button in `ChatMessageBubble.jsx` when bot response indicates uncertainty.
  - Register route in `frontend/src/App.jsx` and link in `Sidebar.jsx`.
- [x] 16.6-TEST: Escalation & HR Resolution Lifecycle Test
  - File: `backend/tests/m16.chatbot.test.js`
  - Verify employee escalation creates pending record and notifies HR.
  - Verify HR answer transitions record to `Answered` and sends notification to employee.

---

### Row 16.8: Chat Session History & Conversation Persistence (P2)
- [x] 16.8-BE: Implement Chat History Retrieval & Purge Endpoints
  - File: `backend/src/modules/chatbot/chatbot.service.js` (`getChatHistory`, `clearChatHistory`).
  - File: `backend/src/modules/chatbot/chatbot.controller.js` & `chatbot.routes.js`:
    - `GET /api/v1/chatbot/history` (returns user's last 50 non-cleared messages, sorted chronologically).
    - `DELETE /api/v1/chatbot/history` (soft-deletes / marks `isCleared: true` for user's messages).
- [x] 16.8-FE: Conversation Persistence & Clear Chat UI
  - In `ChatbotWidget.jsx`:
    - Fetch chat history on widget mount using `useGetChatHistoryQuery`.
    - Provide "Clear Chat" button in widget header with confirmation popover.
- [x] 16.8-TEST: Chat History Retrieval & Clearance Test
  - File: `backend/tests/m16.chatbot.test.js`
  - Verify past messages persist across widget re-openings.
  - Verify clearing chat hides past turns and resets conversation window.

---

### Row 16.9: Global Feature Toggle & Throttling Limits (P2)
- [x] 16.9-BE: Implement Chatbot Configuration in Settings & Daily Rate Limiter
  - File: `backend/src/models/setting.model.js` (Store `chatbot` key with `{ enabled: Boolean, dailyLimitPerUser: Number, allowedRoles: [String] }`).
  - File: `backend/src/modules/chatbot/chatbot.routes.js`:
    - Pre-route middleware checking `setting.chatbot.enabled`. If disabled, return HTTP 503 Service Unavailable.
    - Middleware tracking and enforcing daily query limits per user ID (default: 30 queries/day).
- [x] 16.9-FE: Super Admin Chatbot Settings Tab & Global Guard
  - In `frontend/src/features/settings/pages/CompanySettingsPage.jsx`, add Chatbot Configuration tab (Enable/Disable toggle, Daily query limit input, Save button).
  - In `frontend/src/App.jsx`, conditionally render `<ChatbotWidget />` only when `settings.chatbot.enabled` is `true`.
- [x] 16.9-TEST: Feature Toggle & Throttling Limits Test
  - File: `backend/tests/m16.chatbot.test.js`
  - Verify turning off chatbot setting causes `/chatbot/ask` to return HTTP 503.
  - Verify exceeding daily limit returns HTTP 429 Too Many Requests.

---

## Phase 3: Seed Data & Multi-Role End-to-End Verification

- [x] 16.10-SEED: Implement Module M16 Database Seed Script
  - File: `backend/src/seed/m16.seed.js`:
    - Seeds 4 active `PolicyDoc` records (Employee Leave Policy 2026, Working Hours & Attendance, Code of Conduct & Ethics, Probation & Confirmation Rules).
    - Seeds 2 sample `UnansweredQuestion` records for HR review testing.
    - Enables `chatbot` in company settings with daily limit 50.
- [x] 16.10-E2E: Playwright Multi-Role Browser Verification
  - File: `tests/e2e/m16-chatbot.spec.js`:
    - Test Employee: opens widget, asks leave balance in Roman Urdu, receives correct balance; asks payslip, receives link; triggers HR escalation.
    - Test HR Manager: accesses `/chatbot/policies`, uploads new policy document; accesses `/chatbot/unanswered`, answers pending query.
    - Test Super Admin: toggles chatbot setting off; confirms widget disappears on Employee screen; toggles on.
    - Test Department Manager: opens widget, queries own records, confirms unable to see peers' records.
    - Viewport test: Mobile 390px responsive chat drawer verification.

---

## Verification Summary Table

| BUILD-GUIDE ID | Description | Priority | Primary Role | Verification Method | Status |
|:---:|:---|:---:|:---:|:---|:---:|
| **16.1** | Policy Documents Ingestion & Storage | P1 | HR Manager | Supertest upload + text index query | [x] |
| **16.2** | Conversational Chat API & Widget | P1 | All Roles | POST `/chatbot/ask` + Widget render | [x] |
| **16.3** | Policy Search Tool Grounding | P1 | Employee | Q&A with handbook citations | [x] |
| **16.4** | Personal Data Queries Isolation | P1 | Employee | Scoped tool execution (M6, M9) | [x] |
| **16.5** | Quick Action Buttons (Leave & Payslip) | P1 | Employee | Chat confirmation card & PDF link | [x] |
| **16.7** | Bilingual Support (English + Roman Urdu) | P1 | All Roles | English & Roman Urdu prompts | [x] |
| **16.6** | Unanswered Escalation & HR Queue | P2 | HR Manager / Emp | `/chatbot/escalate` & HR answer queue | [x] |
| **16.8** | Chat History & Persistence | P2 | All Roles | GET & DELETE `/chatbot/history` | [x] |
| **16.9** | Global Toggle & Daily Rate Limits | P2 | Super Admin | Company settings toggle & 429 limit | [x] |
| **16.10** | Multi-Role Playwright E2E Suite | E2E | 4 Roles | Real browser automation (desktop + mobile) | [x] |
