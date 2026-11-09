# Module M20: Rewards, Celebrations & Surveys Implementation Summary

## 1. Scope & Coverage
- Implemented BUILD-GUIDE Section 27 (Rows 20.1 through 20.5).
- Feature branch: feature/25-rewards-celebrations-surveys.
- 100% verified across 4 roles (Super Admin, HR Manager, Department Manager, Employee) with 24/24 Vitest integration & security tests and Playwright live Chromium verification.

## 2. Models & Database
- Award (`award.model.js`): Employee of the month cycles with stages ('Nomination', 'Voting', 'Announced', 'Archived'), nominations array, and winner announcement.
- AwardVote (`awardVote.model.js`): Enforces single-ballot voting with compound unique index `{ awardId: 1, voterId: 1 }`. Duplicate vote attempts reject with 409 Conflict.
- Appreciation (`appreciation.model.js`): Peer appreciation feed with 7 predefined badge types ('Team Player', 'Innovator', 'Customer Champion', 'Problem Solver', 'Leadership', 'Speed Demon', 'Helpful Hand'), public visibility, and likes array. Socket.io broadcast `kudos:created`. Self-kudos strictly rejected (400).
- Survey (`survey.model.js`): Pulse surveys & polls with builder fields (rating 1-5, single_choice, multiple_choice, text), anonymous toggle, and lifecycle statuses ('Draft', 'Published', 'Closed').
- SurveyResponse (`surveyResponse.model.js`): User response collection. For anonymous surveys, `userHash = sha256(userId + surveyId + salt)` paired with compound unique index `{ surveyId: 1, userHash: 1 }` guarantees single-response idempotency while keeping `userId` strictly null.

## 3. Core APIs & Routes
Mounted at `/api/v1/rewards`:
- Awards (20.1):
  - POST `/awards` (rewards.manage - HR/Admin create cycle)
  - GET `/awards` (rewards.view - active & past cycles)
  - GET `/awards/:id` (rewards.view - award details)
  - POST `/awards/:id/nominate` (rewards.nominate - nominate peer with reason)
  - POST `/awards/:id/vote` (rewards.vote - atomic vote)
  - POST `/awards/:id/announce` (rewards.manage - finalize winner)
- Kudos & Appreciation (20.2):
  - POST `/kudos` (kudos.give - send appreciation badge)
  - GET `/kudos` (kudos.view - public wall feed with pagination)
  - POST `/kudos/:id/like` (kudos.like - toggle like on kudos)
- Celebrations (20.3):
  - GET `/celebrations/today` (celebrations.view - today's birthdays & work anniversaries)
  - GET `/celebrations/upcoming` (celebrations.view - upcoming 14-day celebrations)
- Pulse Surveys & Polls (20.4, 20.5):
  - POST `/surveys` (surveys.manage - create survey)
  - GET `/surveys` (surveys.view - list published/accessible surveys)
  - GET `/surveys/:id` (surveys.view - get survey details)
  - POST `/surveys/:id/respond` (surveys.respond - submit anonymous or named response)
  - GET `/surveys/:id/analytics` (surveys.manage - participation rate & breakdown)

## 4. Background Jobs & Socket Events
- Celebrations Cron (`jobs/celebrations.job.js`): Nightly cron running at 00:01 PKT (`1 0 * * *`), scanning active employees for `dob` and `joiningDate`, generating celebration records and notifying users.
- Socket.io: Real-time kudos broadcast (`kudos:created`) notifying online users of new appreciations.

## 5. Security & PBAC
- Registered 8 permissions in `shared/permissions.js`:
  - `rewards.view`, `rewards.nominate`, `rewards.vote`, `rewards.manage`
  - `kudos.view`, `kudos.give`, `kudos.like`
  - `celebrations.view`
  - `surveys.view`, `surveys.respond`, `surveys.manage`
- Seeded across roles in `seed/roles.seed.js`:
  - Super Admin & HR Manager: Full management & participation.
  - Department Manager: View, nominate, vote, give/like kudos, view celebrations, respond to surveys (No survey/award management).
  - Employee: View, nominate, vote, give/like kudos, view celebrations, respond to surveys.

## 6. Frontend Components & Visuals
- Awards: `AwardsPage.jsx`, `CreateAwardModal.jsx`, `NominateModal.jsx`, `VotingCard.jsx`, `AnnounceWinnerModal.jsx`.
- Kudos: `AppreciationWallPage.jsx`, `GiveKudosModal.jsx`, `KudosCard.jsx`.
- Celebrations: `CelebrationsWallPage.jsx`, `CelebrationCard.jsx`.
- Surveys: `SurveysPage.jsx`, `SurveyBuilderModal.jsx`, `SurveyFillModal.jsx`, `RatingBreakdownChart.jsx` (native responsive SVG stacked distribution bars without external charting libraries, complying with Ponytail principles).
