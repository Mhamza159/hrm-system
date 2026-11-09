# Work Breakdown & Implementation Tasks: M20 Rewards, Celebrations & Surveys

**Module ID:** M20  
**Module Name:** Rewards, Celebrations & Surveys  
**Phase:** Phase 4 — Engagement & Polish (P3 Scope)  
**Spec Directory:** `.specify/specs/25-rewards-celebrations-surveys/`  
**Sources of Truth:**  
- `docs/BUILD-GUIDE.md`: Section 27 (Rows 20.1 to 20.5)  
- `docs/FRD.md`: Section 9 & 11  
- `.specify/specs/25-rewards-celebrations-surveys/plan.md`  

---

## Task Execution Order (Vertical Slice Architecture)

Execution strictly follows P1 (EOTM Award Cycles, Peer Kudos Wall, Pulse Surveys, Survey Analytics) followed by P2 (Celebration Wall & Automated Wishes), ending with Security & Multi-Role Playwright E2E verification.

```
P1 (20.1): Employee of the Month (Model -> Service -> Voting -> Page -> Test)
   ↓
P1 (20.2): Peer Appreciation Wall & Badges (Model -> Live Sockets -> Feed -> Test)
   ↓
P1 (20.4): Pulse Surveys & Polls (Model -> Anonymity Hash -> Form -> Test)
   ↓
P1 (20.5): Survey Analytics & Charts (Service -> SVG Chart -> Results Page -> Test)
   ↓
P2 (20.3): Celebration Wall & Auto Wishes (Endpoints -> Nightly Cron -> Wall -> Test)
   ↓
Final Security Tests & Module M20 Playwright E2E Verification across all 4 roles
```

---

## Phase 1: High Priority (P1) Tasks

### Row 20.1 (P1): Employee of the Month — Nomination & Voting
- [x] **20.1-BE1 — Model Creation:** Implement `backend/src/models/award.model.js` (cycleMonth, status `'nominating'|'voting'|'completed'`, nominees array with citation, winnerId) and `backend/src/models/awardVote.model.js` with compound unique index `{ awardId: 1, voterId: 1 }` strictly enforcing 1 vote per user at the database engine level.
- [x] **20.1-BE2 — Validations & Service:** Implement Zod schemas in `rewards.validation.js` for cycle creation, nomination, voting, and winner announcement. Implement service functions in `rewards.service.js` verifying team scope on nominations, single-vote integrity, and Socket.io event emissions.
- [x] **20.1-BE3 — Routes & Controller:** Register routes `POST /api/v1/rewards/awards`, `GET /api/v1/rewards/awards`, `POST /api/v1/rewards/awards/:id/nominate`, `POST /api/v1/rewards/awards/:id/vote`, and `PATCH /api/v1/rewards/awards/:id/announce` protected by `authenticate`, `checkPermission`, and `validate`.
- [x] **20.1-FE1 — RTK Query Endpoints:** Add award endpoints (`getAwards`, `createAwardCycle`, `nominateCandidate`, `castAwardVote`, `announceWinner`) in `frontend/src/features/rewards/rewardsApi.js` with `'Awards'` tag cache invalidation.
- [x] **20.1-FE2 — Components:** Create `frontend/src/features/rewards/components/NominateModal.jsx` (scoped team employee selection + citation text) and `frontend/src/features/rewards/components/VotingCard.jsx` (nominee photo, citation, vote button, and live vote counts for admins).
- [x] **20.1-FE3 — Page & Navigation:** Implement `frontend/src/features/rewards/pages/AwardsPage.jsx` displaying active nomination/voting cycles, winner hall of fame banner, and permission-guarded admin action buttons.
- [x] **20.1-TEST — Unit & API Tests:** Write tests in `backend/tests/m20.rewards.test.js` verifying award cycle creation, manager team nomination isolation, single vote casting, and duplicate vote rejection (HTTP 409 Conflict).

---

### Row 20.2 (P1): Peer Appreciation Wall & Badges
- [x] **20.2-BE1 — Model Creation:** Implement `backend/src/models/appreciation.model.js` with `senderId`, `recipientId`, `badge` enum (`'Team Player'`, `'Problem Solver'`, `'Above & Beyond'`, `'Innovation Champion'`, `'Customer Hero'`, `'Leadership'`), `message`, and `likes` array. Add index `{ createdAt: -1 }`.
- [x] **20.2-BE2 — Service, Controller & Routes:** Implement `POST /api/v1/rewards/kudos`, `GET /api/v1/rewards/kudos`, and `POST /api/v1/rewards/kudos/:id/like`. Sanitize messages against HTML/XSS and broadcast new kudos globally via `io.emit('kudos:created')`.
- [x] **20.2-FE1 — RTK Query Endpoints:** Add kudos endpoints (`getKudos`, `giveKudos`, `toggleLikeKudos`) in `rewardsApi.js` with optimistic like updates and tag invalidation.
- [x] **20.2-FE2 — Components:** Create `frontend/src/features/rewards/components/GiveKudosModal.jsx` (colleague picker, badge selector cards with icons, message textarea) and `frontend/src/features/rewards/components/KudosCard.jsx` (sender/recipient avatars, badge pill, reaction like button).
- [x] **20.2-FE3 — Page & Live Listener:** Implement `frontend/src/features/rewards/pages/AppreciationWallPage.jsx` rendering the chronological recognition social feed and listening to Socket.io `kudos:created` events for real-time card prepending.
- [x] **20.2-TEST — Kudos Tests:** In `backend/tests/m20.rewards.test.js`, write test cases for kudos submission, like reaction toggling (no duplicate likes), and self-kudos rejection.

---

### Row 20.4 (P1): Pulse Surveys & Company Polls
- [x] **20.4-BE1 — Model Creation:** Implement `backend/src/models/survey.model.js` (title, description, questions array with types `'rating_5'|'single_choice'|'multiple_choice'|'text'`, `isAnonymous`, `status`, `expiresAt`) and `backend/src/models/surveyResponse.model.js` with compound unique index `{ surveyId: 1, userHash: 1 }` guaranteeing single response idempotency while preserving anonymity.
- [x] **20.4-BE2 — Service & Controller:** Implement `POST /api/v1/rewards/surveys`, `GET /api/v1/rewards/surveys`, and `POST /api/v1/rewards/surveys/:id/respond`. Compute `userHash = sha256(userId + surveyId + salt)` when `isAnonymous: true`.
- [x] **20.4-FE1 — RTK Query Endpoints:** Add survey endpoints (`getSurveys`, `createSurvey`, `submitSurveyResponse`) in `rewardsApi.js`.
- [x] **20.4-FE2 — Components & Forms:** Create `frontend/src/features/rewards/components/SurveyBuilderModal.jsx` (question builder with type toggles and anonymous checkbox) and `frontend/src/features/rewards/pages/SurveyFillPage.jsx` (interactive form with star ratings, radios, and textareas).
- [x] **20.4-FE3 — Page & Listing:** Implement `frontend/src/features/rewards/pages/SurveysPage.jsx` showing active and closed surveys with participation badges and status pills.
- [x] **20.4-TEST — Survey Tests:** Write test cases verifying survey creation, anonymous response hash generation (verifying `userId` is null on response document), and second-response rejection (HTTP 409 Conflict).

---

### Row 20.5 (P1): Survey Analytics & Participation Tracking
- [x] **20.5-BE — Aggregation Analytics Endpoint:** Implement `GET /api/v1/rewards/surveys/:id/results` in `rewards.service.js` aggregating total respondents, response percentage, average rating scores, and option breakdown distributions. Enforce PBAC check (employees blocked unless `resultsPublic === true`).
- [x] **20.5-FE1 — SVG Chart Component:** Create `frontend/src/features/rewards/components/RatingBreakdownChart.jsx` rendering native responsive SVG percentage bar charts for rating scales and multiple choice selections (zero external charting dependencies).
- [x] **20.5-FE2 — Page:** Implement `frontend/src/features/rewards/pages/SurveyResultsPage.jsx` displaying executive KPI cards (Response Rate, Average Score, Total Submissions), question-by-question breakdown charts, and qualitative text response cards.
- [x] **20.5-TEST — Analytics Tests:** In `backend/tests/m20.rewards.test.js`, verify calculation math for average ratings and choice distributions, and ensure regular employees receive HTTP 403 Forbidden on private survey results.

---

## Phase 2: Medium Priority (P2) Tasks

### Row 20.3 (P2): Birthday & Work Anniversary Celebration Wall + Auto Wishes
- [x] **20.3-BE1 — Milestones API:** Implement `GET /api/v1/rewards/celebrations/today` and `GET /api/v1/rewards/celebrations/upcoming` matching `Employee.dateOfBirth` and `Employee.joiningDate` against current day/month in Pakistan timezone (`Asia/Karachi`).
- [x] **20.3-BE2 — Nightly Celebrations Cron Job:** Implement `backend/src/jobs/celebrations.job.js` scheduled at 00:01 PKT daily. Sends automated greeting notifications to celebrants, creates announcement records, and broadcasts `celebration:today` via Socket.io. Register in `backend/src/server.js`.
- [x] **20.3-FE1 — Components & Wall:** Create `frontend/src/features/rewards/components/CelebrationCard.jsx` (celebrant photo, badge, milestone text e.g. "3rd Work Anniversary!", quick "Send Kudos" button) and `frontend/src/features/rewards/pages/CelebrationsWallPage.jsx`.
- [x] **20.3-TEST — Celebrations Tests:** Write tests verifying birthday/anniversary date matching logic, leap year edge cases, and automated notification trigger.

---

## Phase 3: Permissions, Routing & Security Hardening

- [x] **20.PERM — Permissions & Seeds:** Register `rewards` module with actions `rewards.view`, `rewards.nominate`, `rewards.vote`, `rewards.kudos`, `rewards.respond`, `rewards.manage` in `backend/src/shared/permissions.js`. Seed permissions in `backend/src/seed/roles.seed.js`.
- [x] **20.ROUTE — Routing & Sidebar:** Mount `/api/v1/rewards` in `backend/src/app.js`. Register routes (`/rewards/awards`, `/rewards/kudos`, `/rewards/celebrations`, `/rewards/surveys`, `/rewards/surveys/:id/fill`, `/rewards/surveys/:id/results`) in `frontend/src/App.jsx`. Add "Rewards & Engagement" section in `frontend/src/components/layout/Sidebar.jsx`.
- [x] **20.SEC-TEST — Security Test Suite:** Implement `backend/tests/m20.rewards.security.test.js` verifying:
  - SEC-1: Unauthenticated requests return HTTP 401 Unauthorized.
  - SEC-2: Regular Employee cannot create surveys, delete kudos, or announce awards (HTTP 403).
  - SEC-3: Department Manager cross-department nomination rejection (HTTP 403).
  - SEC-4: Double-vote & double-survey submission rejection (HTTP 409).
  - SEC-5: Stored XSS sanitization on kudos messages and survey text answers.
  - SEC-6: ReDoS & NoSQL injection sanitization on query filters.

---

## Final Verification & E2E Testing

- [x] **20.E2E-TEST — Module M20 End-to-End Playwright Verification:** Implement `tests/e2e/m20-rewards.spec.js` running real Chromium browser tests across all four roles:
  - Super Admin: Creates award cycle, announces winner, creates survey, views results.
  - HR Manager: Closes nomination, publishes survey, inspects live analytics.
  - Department Manager: Nominates team member, posts kudos, views scoped team milestones.
  - Employee: Casts 1 vote (verifies second vote disabled/prevented), submits peer kudos with badge, completes survey.
  - Mobile Viewport (390px): Verifies mobile responsive layout across awards, kudos feed, and survey forms.

