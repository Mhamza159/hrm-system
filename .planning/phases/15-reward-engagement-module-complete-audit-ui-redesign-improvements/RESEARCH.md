# Phase 15: Reward & Engagement Module – Research & Technical Audit

## 1. Executive Summary & Audit Scope
The **Reward & Engagement Module** (M20) is designed to cultivate workplace culture, peer recognition, celebratory milestones, and employee sentiment measurement. It comprises four distinct submodules:
1. **Award & Honors** (`AwardsPage.jsx`): Monthly/periodic award cycles (Employee of the Month, Spot Awards), manager nomination with citations, admin shortlisting, single-ballot voting, winner showcase, and vote statistics.
2. **Appreciation Wall** (`AppreciationWallPage.jsx`): Peer-to-peer recognition feed with structured badges (`Team Player`, `Problem Solver`, `Customer Hero`, etc.), real-time WebSockets, like reactions, and public/private visibility.
3. **Celebration Wall** (`CelebrationsWallPage.jsx`): Automated birthday and work anniversary tracking with today's spotlight, customizable lookahead periods (15, 30, 60, 90 days), and cross-linking to peer recognition.
4. **Pulse Survey** (`SurveysPage.jsx`): Anonymous pulse surveys and company polls, dynamic question builder (5-star rating, single choice, multiple choice, text), cryptographic single-response tracking, department scoping, and analytics visualization.

### Audit Findings & Gaps Identified
- **Design Inconsistencies**: The current UI uses fragmented color palettes (`from-amber-500 via-orange-500 to-rose-500` gradients, generic `indigo-*`, `pink-*`, `slate-900`) instead of the project-wide **Forest & Emerald Enterprise** design system (`#061A14` canvas, `#111D17` dark surface, `#1A3125` hairline border, `#00C471` brand emerald, tabular figures, and pill button tabs).
- **PBAC & RBAC Enforcement**:
  - The UI currently relies on hardcoded role flags (`isSuperAdmin || isHR || isDeptManager`) instead of dynamic capability checks (`hasPermission('rewards.manage')`, `hasPermission('rewards.nominate')`, etc.).
  - Unauthorized buttons (e.g., "Launch Cycle", "Create Survey", "Shortlist", "Announce Winner") must be completely hidden for roles lacking the required permissions.
- **Pulse Survey Anonymity & Data Isolation**:
  - When a survey is marked `isAnonymous: true`, the backend cryptographically hashes responses (`generateSurveyUserHash`) and records `userId: null`. The frontend must strictly respect this: no responder identity can ever be exposed in survey analytics or lists.
- **Celebration Wall Actionability**:
  - Currently, celebration cards are passive. Adding a "Send Kudos" quick action that links directly to `GiveKudosModal` pre-populated with the celebrated employee and a celebratory badge elevates the engagement loop.
- **Code Hygiene**:
  - Zero `prop-types` imports (to prevent Vercel Rollup build failures).
  - Clean Oxlint verification (0 errors, 0 warnings).

---

## 2. Backend Architecture & API Mapping

### Data Models (`backend/src/models/`)
1. **`award.model.js`**:
   - Fields: `title`, `month` (YYYY-MM), `departmentId` (optional), `nominationDeadline`, `votingDeadline`, `prizeDetails`, `status` (`'nomination' | 'voting' | 'announced' | 'closed'`), `nominations` (`[{ employeeId, nominatedBy, reason, shortlisted, createdAt }]`), `winnerId`, `winnerCitation`, `createdBy`, `isDeleted`.
2. **`awardVote.model.js`**:
   - Fields: `awardId`, `userId`, `nomineeId` (unique compound index on `{ awardId, userId }` ensuring strictly 1 vote per employee).
3. **`appreciation.model.js`**:
   - Fields: `senderId` (User), `receiverId` (Employee), `badge` (Enum of 7 badges), `message`, `isPublic`, `likes` (`[UserId]`), `isDeleted`.
4. **`survey.model.js`**:
   - Fields: `title`, `description`, `type` (`'pulse' | 'poll' | 'quarterly' | 'culture'`), `isAnonymous`, `targetAudience` (`'company' | 'department'`), `departmentId`, `expiresAt`, `status` (`'active' | 'closed'`), `questions` (`[{ id, questionText, questionType, options, required }]`), `createdBy`.
5. **`surveyResponse.model.js`**:
   - Fields: `surveyId`, `userHash` (SHA-256 hashed with secret salt), `userId` (null if anonymous), `departmentId`, `answers` (`[{ questionId, answerValue }]`). Unique compound index on `{ surveyId, userHash }`.

### API Endpoints (`backend/src/modules/rewards/rewards.routes.js`)
| Method | Endpoint | Permission Required | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/rewards/awards` | `rewards.manage` | Create new award cycle |
| `GET` | `/rewards/awards` | `rewards.view` | List award cycles with status filter |
| `GET` | `/rewards/awards/:id` | `rewards.view` | Get award details |
| `POST` | `/rewards/awards/:id/nominate` | `rewards.nominate` | Nominate an employee with citation |
| `PATCH` | `/rewards/awards/:id/nominations/:nominationId/shortlist` | `rewards.manage` | Shortlist a nominee for voting |
| `PATCH` | `/rewards/awards/:id/status` | `rewards.manage` | Progress status (`nomination` -> `voting` -> `announced`) |
| `POST` | `/rewards/awards/:id/vote` | `rewards.vote` | Cast single ballot vote |
| `POST` | `/rewards/awards/:id/announce` | `rewards.manage` | Announce winner and citation |
| `GET` | `/rewards/awards/:id/stats` | `rewards.manage` | Get vote tally & percentage breakdown |
| `POST` | `/rewards/kudos` | `rewards.kudos` | Post peer appreciation kudos |
| `GET` | `/rewards/kudos` | `rewards.view` | Get kudos feed with pagination & badge filter |
| `POST` | `/rewards/kudos/:id/like` | `rewards.kudos` | Toggle like/heart on kudos |
| `GET` | `/rewards/celebrations/today` | `rewards.view` | Get today's birthdays & work anniversaries |
| `GET` | `/rewards/celebrations/upcoming`| `rewards.view` | Get upcoming celebrations (15/30/60/90 days) |
| `POST` | `/rewards/surveys` | `rewards.manage` | Create pulse survey or company poll |
| `GET` | `/rewards/surveys` | `rewards.view` | List surveys with user response state |
| `GET` | `/rewards/surveys/:id` | `rewards.view` | Get survey details and questions |
| `POST` | `/rewards/surveys/:id/respond` | `rewards.respond` | Submit response answers |
| `GET` | `/rewards/surveys/:id/analytics`| `rewards.manage` | Get participation rate & answer distributions |

---

## 3. Role & Permission Matrix (PBAC)

| Action / Capability | Super Admin | HR Manager | Department Manager | Regular Employee | Custom Roles (w/ permission) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View Rewards Hub & Feed** | Yes | Yes | Yes | Yes | `rewards.view` |
| **Launch Award Cycle** | Yes | Yes | No | No | `rewards.manage` |
| **Nominate Candidate** | Yes | Yes | Yes (Team) | No* | `rewards.nominate` |
| **Shortlist Nominees** | Yes | Yes | No | No | `rewards.manage` |
| **Cast Ballot Vote** | Yes | Yes | Yes | Yes | `rewards.vote` |
| **Announce Winner & Prize** | Yes | Yes | No | No | `rewards.manage` |
| **Inspect Vote Tally Stats** | Yes | Yes | No | No | `rewards.manage` |
| **Send Kudos & React** | Yes | Yes | Yes | Yes | `rewards.kudos` |
| **View Celebrations Wall** | Yes | Yes | Yes | Yes | `rewards.view` |
| **Create Pulse Surveys** | Yes | Yes | No | No | `rewards.manage` |
| **Participate in Survey** | Yes | Yes | Yes | Yes | `rewards.respond` |
| **View Survey Analytics** | Yes | Yes | No | No | `rewards.manage` |

*\*Regular employees cannot nominate unless granted the `rewards.nominate` permission by HR or Admin.*

---

## 4. UI Design System Guidelines for Module M20

1. **Brand Theme**: Forest & Emerald Enterprise Craft.
   - Light Canvas: `#F8FAFC`, Surface: `#FFFFFF`, Border: `#EAECF0`, Muted: `#64748B`, Primary: `#00C471`.
   - Dark Canvas: `#0A110D`, Surface: `#111D17`, Card: `#13221B`, Border: `#1A3125`, Muted: `#7E9E8F`, Primary: `#00C471`.
2. **Tabular Numerics**: Monospace styling for all vote tallies, percentage distributions, employee codes, and dates (`font-mono tabular-nums`).
3. **Status Badges**:
   - `Nomination`: Violet (`bg-violet-50 text-violet-700 border-violet-200` / dark: `bg-violet-950/40 text-violet-400 border-violet-800/60`)
   - `Voting Open`: Amber (`bg-amber-50 text-amber-700 border-amber-200` / dark: `bg-amber-950/40 text-amber-400 border-amber-800/60`)
   - `Announced / Active`: Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200` / dark: `bg-emerald-950/40 text-emerald-400 border-emerald-800/60`)
   - `Closed / Expired`: Slate (`bg-slate-100 text-slate-700 border-slate-200` / dark: `bg-slate-800 text-slate-400 border-slate-700`)
4. **Form Inputs & Modals**:
   - Standardized input fields with dark mode emerald focus ring (`focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471]`).
   - Clean modal headers with icon badge, title, subtitle, and close button.
   - Distinct sections with clear visual dividers (`border-slate-100 dark:border-[#1A3125]`).

---

## 5. Risk Assessment & Verification Strategy
- **Risk 1: Ballot Tampering or Multiple Votes**: Guarded on backend by `AwardVote` unique compound index `{ awardId, userId }`. Frontend should visually disable the ballot button once cast and show "Vote Recorded".
- **Risk 2: Anonymous Survey Breach**: Ensure frontend never sends or receives identity data in anonymous survey responses.
- **Risk 3: Self-Kudos & Spam**: Backend blocks self-kudos with a 400 error. Rate limiters prevent spam. Frontend excludes current user from receiver selector.
- **Verification Gate**:
  - Run `tests/e2e/m20-rewards.spec.js` with Playwright.
  - Run Oxlint on all changed files in `frontend/src/features/rewards`.
  - Execute `npm run build` in `frontend` to guarantee 0 Rollup or Vite errors.
