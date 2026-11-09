# Feature Specification: Module M20 — Rewards, Celebrations & Surveys

**Module ID:** M20  
**Module Name:** Rewards, Celebrations & Surveys  
**Phase:** Phase 4 — Engagement & Polish (P3 Scope)  
**Spec Directory:** `.specify/specs/25-rewards-celebrations-surveys/`  
**Sources of Truth:**  
- `docs/FRD.md`: Section 9 (M20 Rewards, Celebrations & Surveys) & Section 11 (Permission Matrix)  
- `docs/BUILD-GUIDE.md`: Section 27 (Rows 20.1 to 20.5)  
- `docs/TECH-SPEC.md`: Sections 3 (Architecture), 4 (Database), 5 (API), 6 (PBAC)  

---

## 1. Overview & Business Objectives

Module M20 provides the core employee engagement and recognition hub for the enterprise HRM system. It enables positive workplace culture through peer appreciation, transparent monthly award cycles, automated milestones (birthdays and anniversaries), and real-time pulse feedback.

### Key Value Pillars
1. **Employee of the Month (EOTM)**: Structured monthly award cycles with Department Manager nominations, transparent company-wide employee voting (strictly 1 vote per user with atomic idempotency), and executive winner announcement.
2. **Peer Appreciation Wall ("Kudos")**: Real-time social feed with custom badges (e.g., *Team Player*, *Innovation Champion*, *Problem Solver*, *Customer Hero*), public comments, and live Socket.io feed broadcasts.
3. **Celebration Wall & Automated Greetings**: Nightly automated celebration job identifying today's birthdays and work anniversaries, emitting automated in-app celebration cards and greetings.
4. **Pulse Surveys & Company Polls**: Flexible questionnaire builder supporting multiple choice, rating scales (1–5), and text feedback with optional **anonymity guarantees** and participation analytics.
5. **Survey Analytics Engine**: Interactive result aggregation displaying response rates, question-by-question rating distributions, and breakdown charts with zero third-party bloat (native responsive SVG components).

---

## 2. User Stories & Acceptance Criteria (Vertical Slices)

### User Story 20.1 (P1): Employee of the Month — Nomination & Voting
**BUILD-GUIDE ID:** `20.1`  
**Priority:** P1 (Core Engagement)  
**Backend:** `backend/src/models/award.model.js`, `backend/src/modules/rewards/award.service.js`, `POST /api/v1/rewards/awards`, `POST /api/v1/rewards/awards/:id/nominate`, `POST /api/v1/rewards/awards/:id/vote`, `PATCH /api/v1/rewards/awards/:id/announce`  
**Frontend:** `frontend/src/features/rewards/pages/AwardsPage.jsx`, `frontend/src/features/rewards/components/NominateModal.jsx`, `frontend/src/features/rewards/components/VotingCard.jsx`  

#### Role-Based Acceptance Criteria:
- **Super Admin & HR Manager**:
  - **Given** an active or upcoming month cycle,
  - **When** HR Manager navigates to `/rewards/awards` and clicks "Create Award Cycle",
  - **Then** an award cycle is created with status `'nominating'` with configured deadline dates.
  - **When** the nomination deadline passes, HR transitions the cycle to `'voting'`, allowing workforce voting.
  - **When** voting closes, Super Admin / HR can announce the winner (`PATCH /awards/:id/announce`), setting status to `'completed'` and publishing the winner card to the dashboard.
- **Department Manager**:
  - **Given** an award cycle in `'nominating'` status,
  - **When** the Department Manager selects an employee from their own team with a citation reason,
  - **Then** the nominee is added to the cycle candidates (`POST /awards/:id/nominate`).
  - **When** attempting to nominate an employee from a peer department,
  - **Then** the system rejects with HTTP 403 Forbidden.
- **Employee**:
  - **Given** an award cycle in `'voting'` status,
  - **When** the employee votes for their chosen nominee (`POST /awards/:id/vote`),
  - **Then** the vote is atomically recorded.
  - **When** the employee attempts to vote a second time in the same award cycle,
  - **Then** the system strictly rejects with **HTTP 409 Conflict** (`"You have already cast your vote in this award cycle."`).
  - **Then** employees cannot vote for themselves.

---

### User Story 20.2 (P1): Peer Appreciation Wall & Badges
**BUILD-GUIDE ID:** `20.2`  
**Priority:** P1 (Daily Recognition)  
**Backend:** `backend/src/models/appreciation.model.js`, `POST /api/v1/rewards/kudos`, `GET /api/v1/rewards/kudos`, `POST /api/v1/rewards/kudos/:id/like`  
**Frontend:** `frontend/src/features/rewards/pages/AppreciationWallPage.jsx`, `frontend/src/features/rewards/components/GiveKudosModal.jsx`, `frontend/src/features/rewards/components/KudosCard.jsx`  

#### Role-Based Acceptance Criteria:
- **Employee (All Roles)**:
  - **Given** an authenticated user on `/rewards/kudos`,
  - **When** clicking "Give Kudos", selecting a colleague, choosing a badge (`Team Player`, `Problem Solver`, `Above & Beyond`, `Innovation Champion`, `Leadership`), and writing an appreciation message,
  - **Then** the recognition post is created (`POST /rewards/kudos`), broadcast via Socket.io (`kudos:created`), and immediately renders in the appreciation feed.
  - **When** colleagues view the post,
  - **Then** they can click the reaction button (`POST /rewards/kudos/:id/like`), toggling their like atomically (no duplicate likes per user).
- **Super Admin & HR Manager**:
  - **Given** inappropriate or policy-violating content on the appreciation wall,
  - **When** HR Manager clicks "Delete Kudos",
  - **Then** the post is soft-deleted and removed from the active feed with an audit log entry.
- **Department Manager**:
  - **Given** the appreciation wall,
  - **When** filtering by "My Department",
  - **Then** only kudos sent to or by team members are displayed.

---

### User Story 20.3 (P2): Birthday & Work Anniversary Celebration Wall + Auto Wishes
**BUILD-GUIDE ID:** `20.3`  
**Priority:** P2 (Milestone Celebrations)  
**Backend:** `backend/src/jobs/celebrations.job.js`, `GET /api/v1/rewards/celebrations/today`, `GET /api/v1/rewards/celebrations/upcoming`  
**Frontend:** `frontend/src/features/rewards/pages/CelebrationsWallPage.jsx`, `frontend/src/features/rewards/components/CelebrationCard.jsx`  

#### Role-Based Acceptance Criteria:
- **System / Automated Cron Runner**:
  - **Given** the nightly scheduled cron at 00:01 PKT (`Asia/Karachi`),
  - **When** checking `Employee.dateOfBirth` and `Employee.joiningDate`,
  - **Then** employees with a birthday or anniversary today are compiled.
  - **Then** an automated celebration greeting is logged, in-app notification sent to the celebrant, and Socket.io event `celebration:today` emitted to the dashboard.
- **All Roles (Super Admin, HR Manager, Dept Manager, Employee)**:
  - **Given** active celebrations today,
  - **When** loading the `/rewards/celebrations` wall or main Dashboard,
  - **Then** celebration cards display celebrant photos, department, milestone details (e.g., "5th Work Anniversary!", "Happy Birthday!"), and an interactive "Send Wishes" button.

---

### User Story 20.4 (P1): Pulse Surveys & Company Polls
**BUILD-GUIDE ID:** `20.4`  
**Priority:** P1 (Pulse Feedback)  
**Backend:** `backend/src/models/survey.model.js`, `backend/src/models/surveyResponse.model.js`, `POST /api/v1/rewards/surveys`, `GET /api/v1/rewards/surveys`, `POST /api/v1/rewards/surveys/:id/respond`  
**Frontend:** `frontend/src/features/rewards/pages/SurveysPage.jsx`, `frontend/src/features/rewards/pages/SurveyFillPage.jsx`, `frontend/src/features/rewards/components/SurveyBuilderModal.jsx`  

#### Role-Based Acceptance Criteria:
- **Super Admin & HR Manager**:
  - **Given** HR Manager on `/rewards/surveys`,
  - **When** creating a new survey with title, description, expiry date, target audience (`All Company` or specific department), `isAnonymous: true/false`, and question list (types: `rating_5`, `single_choice`, `multiple_choice`, `text`),
  - **Then** the survey is published (`status: 'active'`).
  - **When** the deadline passes, HR can close the survey (`status: 'closed'`).
- **Employee**:
  - **Given** an active survey targeted to the employee's department,
  - **When** the employee submits their responses (`POST /surveys/:id/respond`),
  - **Then** the submission is saved. If `isAnonymous === true`, `userId` is strictly omitted from the response record; an opaque hash `userHash` prevents duplicate entries without revealing identity.
  - **When** an employee tries to submit a second response to the same survey,
  - **Then** the server rejects with **HTTP 409 Conflict** (`"You have already completed this survey."`).
- **Department Manager**:
  - **Given** team-specific surveys,
  - **When** reviewing active surveys,
  - **Then** sees team completion rates without breaching individual anonymous responses.

---

### User Story 20.5 (P1): Survey Analytics & Participation Tracking
**BUILD-GUIDE ID:** `20.5`  
**Priority:** P1 (Analytics & Intelligence)  
**Backend:** `GET /api/v1/rewards/surveys/:id/results`  
**Frontend:** `frontend/src/features/rewards/pages/SurveyResultsPage.jsx`, `frontend/src/features/rewards/components/RatingBreakdownChart.jsx`  

#### Role-Based Acceptance Criteria:
- **Super Admin & HR Manager**:
  - **Given** a survey with responses,
  - **When** opening `/rewards/surveys/:id/results`,
  - **Then** executive metrics are rendered: Total Eligible Respondents, Total Responses Received, Participation Percentage (e.g., `85%`), Average Score (for rating questions).
  - **Then** native SVG distribution charts render percentage breakdowns for single/multi-choice questions and rating questions.
  - **Then** qualitative text responses are listed cleanly.
- **Department Manager**:
  - **Given** a department-targeted survey,
  - **When** accessing results,
  - **Then** views scoped participation metrics for their own team.
- **Employee**:
  - **Given** a standard employee,
  - **When** attempting to access `/rewards/surveys/:id/results`,
  - **Then** the system denies access with **HTTP 403 Forbidden** unless `survey.resultsPublic === true`.

---

## 3. Official Library Standards (Context7 Patterns)

### 3.1 Socket.IO Broadcasting
```javascript
// Broadcast new recognition to all connected users
io.emit('kudos:created', {
  kudosId: newKudos._id,
  sender: { name: user.name, avatar: user.avatar },
  recipient: { name: recipient.name, avatar: recipient.avatar },
  badge: newKudos.badge,
  message: newKudos.message
});

// Broadcast award nomination updates to room
io.to(`award:${awardId}`).emit('award:voted', {
  totalVotes,
  candidateId: nomineeId
});
```

### 3.2 Zod Schema Validations
```javascript
export const createKudosSchema = z.object({
  body: z.object({
    recipientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid recipient ID'),
    badge: z.enum([
      'Team Player',
      'Problem Solver',
      'Above & Beyond',
      'Innovation Champion',
      'Customer Hero',
      'Leadership'
    ]),
    message: z
      .string({ required_error: 'Appreciation message is required' })
      .trim()
      .min(5, 'Message must be at least 5 characters')
      .max(500, 'Message cannot exceed 500 characters')
  })
});
```

### 3.3 Atomic Uniqueness & Mongoose Compound Indexes
```javascript
// Strict 1 vote per user per award cycle
awardVoteSchema.index({ awardId: 1, voterId: 1 }, { unique: true });

// Strict 1 response per user per survey
surveyResponseSchema.index({ surveyId: 1, userHash: 1 }, { unique: true });
```

---

## 4. Security & Compliance Invariants
1. **Vote Anonymity vs Idempotency**:
   - For anonymous surveys, `userHash = sha256(userId + surveyId + salt)`. This mathematically guarantees strictly 1 response per employee without saving `userId` on the response document.
2. **ReDoS & XSS Sanitation**:
   - All appreciation messages and text survey answers pass through HTML stripping regex prior to database persistence.
3. **NoSQL Injection Block**:
   - All survey filters and award statuses are Zod enum-validated.
4. **PBAC Scoping Invariant**:
   - Regular employees cannot create surveys, delete peer kudos, or announce award winners (HTTP 403 Forbidden).

