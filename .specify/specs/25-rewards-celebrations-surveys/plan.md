# Architecture & Technical Plan: Module M20 — Rewards, Celebrations & Surveys

**Module ID:** M20  
**Module Name:** Rewards, Celebrations & Surveys  
**Phase:** Phase 4 — Engagement & Polish (P3 Scope)  
**Spec Directory:** `.specify/specs/25-rewards-celebrations-surveys/`  
**Sources of Truth:**  
- `docs/TECH-SPEC.md`: Sections 3 (Folders), 4 (Database), 5 (API), 6 (PBAC), 8 (Request Lifecycle)  
- `docs/MODULES.md`: Section M20  
- `docs/BUILD-GUIDE.md`: Section 27 (Rows 20.1 to 20.5)  
- `.specify/specs/25-rewards-celebrations-surveys/spec.md`  

---

## 1. Architectural Blueprint & Request Lifecycle

Following `TECH-SPEC.md` Section 8, every incoming client request flows strictly through the 7-layer pipeline:

```
Client (React 19 / RTK Query)
   │
   ▼
1. Express Global Middleware (CORS, Helmet, RateLimiter)
   │
   ▼
2. `authenticate` (JWT verification & User population)
   │
   ▼
3. `checkPermission('rewards.<action>', 'Rewards')` (CASL PBAC evaluation)
   │
   ▼
4. `validate(schema)` (Zod runtime validation for body, query, and params)
   │
   ▼
5. Controller Layer (`rewards.controller.js` — pure I/O orchestration)
   │
   ▼
6. Service Layer (`rewards.service.js` — business logic, scoping, atomic transactions)
   │
   ├─► MongoDB (Mongoose models: Award, AwardVote, Appreciation, Survey, SurveyResponse)
   ├─► Redis / Socket.IO (Live broadcast: 'kudos:created', 'award:voted', 'celebration:today')
   └─► Centralized Audit Logging (`AuditLog.create`)
   │
   ▼
7. Response Envelope (`ApiResponse.success(res, 200, data, message, meta)`)
```

---

## 2. Directory Structure & File Inventory

All code is strictly plain JavaScript (`.js`, `.jsx`), using standard libraries and zero unapproved dependencies:

```
backend/
├── src/
│   ├── models/
│   │   ├── award.model.js               # Award cycles & candidate nominations
│   │   ├── awardVote.model.js           # Atomic single-vote persistence
│   │   ├── appreciation.model.js        # Peer kudos posts, badges & reactions
│   │   ├── survey.model.js              # Pulse surveys, polls, and questions
│   │   └── surveyResponse.model.js      # Individual and anonymous survey submissions
│   ├── modules/
│   │   └── rewards/
│   │       ├── rewards.validation.js    # Zod schemas for kudos, voting, and surveys
│   │       ├── rewards.service.js       # Business logic, PBAC scoping, Socket.io hooks
│   │       ├── rewards.controller.js    # Express controller handlers
│   │       └── rewards.routes.js        # Protected routes with middleware bindings
│   ├── jobs/
│   │   └── celebrations.job.js          # Scheduled daily birthday/anniversary greeting cron
│   └── seed/
│       └── m20.seed.js                  # Realistic demo data for kudos, awards, and surveys
frontend/
└── src/
    └── features/
        └── rewards/
            ├── rewardsApi.js            # RTK Query hooks with tag cache invalidation
            ├── pages/
                ├── AwardsPage.jsx              # EOTM cycles, nomination cards, and voting UI
                ├── AppreciationWallPage.jsx   # Live Kudos social feed with reaction triggers
                ├── CelebrationsWallPage.jsx    # Birthday & work anniversary milestones
                ├── SurveysPage.jsx             # Active and closed company pulse surveys
                ├── SurveyFillPage.jsx          # Interactive survey question answering
                └── SurveyResultsPage.jsx       # Survey analytics & native SVG rating charts
            └── components/
                ├── NominateModal.jsx           # Manager award candidate submission form
                ├── VotingCard.jsx              # Nominee citation card with one-click voting
                ├── GiveKudosModal.jsx          # Colleague selection with badge picker
                ├── KudosCard.jsx               # Feed post card with badge icon & like counter
                ├── CelebrationCard.jsx         # Birthday/Anniversary milestone card
                ├── SurveyBuilderModal.jsx      # Multi-question creator with anonymous toggle
                └── RatingBreakdownChart.jsx    # Pure SVG rating distribution visualizer
```

---

## 3. Architecture Diagrams (Mermaid Engine)

### Diagram 1: System Flow & Real-Time Pipeline
```mermaid
flowchart TD
    subgraph Frontend["Frontend Client (React 19)"]
        UI_Kudos["AppreciationWallPage"]
        UI_Awards["AwardsPage"]
        UI_Surveys["SurveysPage / Results"]
        SocketClient["Socket.io Client Listener"]
    end

    subgraph Middleware["API Perimeter & Middlewares"]
        AuthMid["authenticate (JWT)"]
        PermMid["checkPermission('rewards.*')"]
        ValMid["validate(ZodSchemas)"]
    end

    subgraph ServiceLayer["Service & Business Logic"]
        Service["rewards.service.js"]
        CronJob["celebrations.job.js (Nightly)"]
        AuditSvc["AuditLog Service"]
    end

    subgraph Persistence["Persistence & Real-time Broadcast"]
        MongoDB[("MongoDB Database\n(awards, kudos, surveys)")]
        SocketIO["Socket.IO Server\nio.emit('kudos:created')"]
    end

    UI_Kudos -->|POST /kudos| AuthMid
    UI_Awards -->|POST /awards/:id/vote| AuthMid
    UI_Surveys -->|POST /surveys/:id/respond| AuthMid

    AuthMid --> PermMid --> ValMid --> Service
    CronJob -->|Find Celebrations| MongoDB
    CronJob -->|Broadcast Today| SocketIO

    Service -->|Atomic CRUD| MongoDB
    Service -->|Emit Live Events| SocketIO
    Service -->|Audit Mutations| AuditSvc

    SocketIO -.->|Push Notifications & Kudos Feed| SocketClient
```

---

### Diagram 2: Entity-Relationship Diagram (ERD)
```mermaid
erDiagram
    EMPLOYEE ||--o{ AWARD_NOMINEE : "is nominated"
    USER ||--o{ AWARD_VOTE : "casts 1 vote"
    AWARD ||--o{ AWARD_NOMINEE : "contains"
    AWARD ||--o{ AWARD_VOTE : "accumulates"
    EMPLOYEE ||--o{ APPRECIATION : "sends/receives"
    USER ||--o{ APPRECIATION_LIKE : "likes"
    SURVEY ||--o{ SURVEY_RESPONSE : "collects"

    AWARD {
        ObjectId _id PK
        string title
        string cycleMonth "YYYY-MM"
        string status "'nominating'|'voting'|'completed'"
        date nominationDeadline
        date votingDeadline
        ObjectId winnerId FK "ref: Employee"
        ObjectId createdBy FK "ref: User"
    }

    AWARD_NOMINEE {
        ObjectId employeeId FK "ref: Employee"
        ObjectId nominatedBy FK "ref: User"
        string citation
        date nominatedAt
    }

    AWARD_VOTE {
        ObjectId _id PK
        ObjectId awardId FK "ref: Award"
        ObjectId voterId FK "ref: User"
        ObjectId candidateId FK "ref: Employee"
        date votedAt
    }

    APPRECIATION {
        ObjectId _id PK
        ObjectId senderId FK "ref: User"
        ObjectId recipientId FK "ref: Employee"
        string badge "'Team Player'|'Problem Solver'|'Above & Beyond'|'Innovation Champion'|'Leadership'"
        string message
        array likes "Array of User ObjectIds"
        date createdAt
    }

    SURVEY {
        ObjectId _id PK
        string title
        string description
        string targetAudience "'company'|'department'"
        ObjectId departmentId FK "ref: Department (optional)"
        boolean isAnonymous
        boolean resultsPublic
        string status "'draft'|'active'|'closed'"
        array questions "Array of question schemas"
        date expiresAt
        ObjectId createdBy FK "ref: User"
    }

    SURVEY_RESPONSE {
        ObjectId _id PK
        ObjectId surveyId FK "ref: Survey"
        string userHash "sha256(userId + surveyId) (anonymity guard)"
        ObjectId userId FK "ref: User (null if isAnonymous)"
        array answers "Array of { questionId, answer }"
        date submittedAt
    }
```

---

### Diagram 3: Main Sequence Diagram (EOTM Voting & Peer Kudos Workflow)
```mermaid
sequenceDiagram
    autonumber
    actor Employee as Employee / User
    actor Manager as Department Manager
    actor HR as HR Manager
    participant Router as Rewards Router & Validations
    participant Service as Rewards Service
    participant DB as MongoDB Atlas
    participant Sockets as Socket.IO Server

    %% 1. Nomination Phase
    HR->>Router: POST /api/v1/rewards/awards (Create Oct Cycle)
    Router->>Service: createAwardCycle(payload)
    Service->>DB: Award.create(status: 'nominating')
    DB-->>Service: awardDoc
    Service-->>HR: 201 Created

    Manager->>Router: POST /api/v1/rewards/awards/:id/nominate
    Router->>Service: nominateCandidate(awardId, nomineeId, citation, user)
    Service->>DB: Check nominee belongs to Manager's department
    Service->>DB: Award.updateOne($push: { nominees: candidate })
    Service-->>Manager: 200 OK (Nomination accepted)

    %% 2. Voting Phase
    HR->>Router: PATCH /api/v1/rewards/awards/:id/status (voting)
    Router->>Service: transitionAwardStatus(awardId, 'voting')
    Service->>DB: Award.findByIdAndUpdate(status: 'voting')
    Service->>Sockets: io.emit('award:voting_opened')

    Employee->>Router: POST /api/v1/rewards/awards/:id/vote (candidateId)
    Router->>Service: castAwardVote(awardId, candidateId, user)
    Service->>DB: AwardVote.create({ awardId, voterId, candidateId })
    Note over DB: Unique Compound Index { awardId: 1, voterId: 1 } blocks duplicate votes!
    DB-->>Service: voteDoc
    Service->>Sockets: io.to(`award:${awardId}`).emit('award:vote_recorded')
    Service-->>Employee: 201 Created (Vote Confirmed)

    %% 3. Peer Appreciation Flow
    Employee->>Router: POST /api/v1/rewards/kudos (recipientId, badge, message)
    Router->>Service: createKudos(payload, user)
    Service->>DB: Appreciation.create(sanitizedPayload)
    Service->>Sockets: io.emit('kudos:created', newKudos)
    Service-->>Employee: 201 Created
```

---

## 4. API Endpoints, PBAC Permissions & Scoping Contracts

To be registered in `backend/src/shared/permissions.js` under module `rewards`:

| Method & Route | Action / Permission | Subject | Allowed Scopes | Description & Defense |
| :--- | :--- | :--- | :--- | :--- |
| `POST /api/v1/rewards/awards` | `rewards.manage` | `Rewards` | `['all']` | Super Admin & HR Manager create monthly award cycles. |
| `GET /api/v1/rewards/awards` | `rewards.view` | `Rewards` | `['own', 'team', 'department', 'all']` | Fetch award cycles with nominees and active status. |
| `POST /api/v1/rewards/awards/:id/nominate` | `rewards.nominate` | `Rewards` | `['team', 'all']` | Dept Manager nominates team member with citation. |
| `POST /api/v1/rewards/awards/:id/vote` | `rewards.vote` | `Rewards` | `['own', 'all']` | Employees cast single vote for a nominee (HTTP 409 on duplicate). |
| `PATCH /api/v1/rewards/awards/:id/announce` | `rewards.manage` | `Rewards` | `['all']` | HR Manager announces winner, locking the cycle. |
| `POST /api/v1/rewards/kudos` | `rewards.kudos` | `Rewards` | `['own', 'all']` | Send peer appreciation with badge and message. |
| `GET /api/v1/rewards/kudos` | `rewards.view` | `Rewards` | `['own', 'team', 'department', 'all']` | Fetch paginated recognition feed. |
| `POST /api/v1/rewards/kudos/:id/like` | `rewards.kudos` | `Rewards` | `['own', 'all']` | Toggle like reaction on kudos card. |
| `GET /api/v1/rewards/celebrations/today` | `rewards.view` | `Rewards` | `['own', 'team', 'department', 'all']` | Fetch today's birthdays and work anniversaries. |
| `POST /api/v1/rewards/surveys` | `rewards.manage` | `Rewards` | `['department', 'all']` | Create pulse survey or poll with optional anonymity. |
| `GET /api/v1/rewards/surveys` | `rewards.view` | `Rewards` | `['own', 'team', 'department', 'all']` | Fetch active surveys targeted to user's scope. |
| `POST /api/v1/rewards/surveys/:id/respond` | `rewards.respond` | `Rewards` | `['own', 'all']` | Submit responses; strictly 1 submission per employee. |
| `GET /api/v1/rewards/surveys/:id/results` | `rewards.view` | `Rewards` | `['department', 'all']` | Aggregated response rates and question distributions. |

### Role Permissions Seed Mapping
- **Super Admin**: `all` on `rewards.view`, `rewards.nominate`, `rewards.vote`, `rewards.kudos`, `rewards.respond`, `rewards.manage`.
- **HR Manager**: `all` on `rewards.view`, `rewards.nominate`, `rewards.vote`, `rewards.kudos`, `rewards.respond`, `rewards.manage`.
- **Department Manager**: `team` on `rewards.nominate`, `all` on `rewards.view`, `rewards.vote`, `rewards.kudos`, `rewards.respond`.
- **Employee**: `own` on `rewards.vote`, `rewards.kudos`, `rewards.respond`, `rewards.view`.

---

## 5. Database Schema & Indexing Strategy

### 5.1 `Award` (`awards`)
- **Indexes**:
  - `{ cycleMonth: 1 }` (Unique cycle identifier: e.g., `'2026-10'`).
  - `{ status: 1 }` (Querying active nominating/voting cycles).

### 5.2 `AwardVote` (`awardvotes`)
- **Compound Unique Index**:
  - `{ awardId: 1, voterId: 1 }` — **Strict Invariant**: Enforces at the database engine level that no user can cast more than one vote in the same award cycle.
- **Auxiliary Index**:
  - `{ awardId: 1, candidateId: 1 }` (Tallying candidate vote counts).

### 5.3 `Appreciation` (`appreciations`)
- **Indexes**:
  - `{ createdAt: -1 }` (Chronological feed pagination).
  - `{ recipientId: 1, createdAt: -1 }` (Employee profile recognition tab).
  - `{ senderId: 1 }` (Activity tracking).

### 5.4 `Survey` (`surveys`)
- **Indexes**:
  - `{ status: 1, expiresAt: 1 }` (Finding active open surveys).
  - `{ targetAudience: 1, departmentId: 1 }` (Audience scoping).

### 5.5 `SurveyResponse` (`surveyresponses`)
- **Compound Unique Index**:
  - `{ surveyId: 1, userHash: 1 }` — **Anonymity & Idempotency Invariant**: `userHash` guarantees single submission per user without storing the employee's ID when `isAnonymous: true`.
- **Auxiliary Index**:
  - `{ surveyId: 1, submittedAt: -1 }`.
