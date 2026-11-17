# Phase 15: Reward & Engagement Module – Context & Decision Record

## 1. Context & Business Intent

The Reward & Engagement Module empowers company leadership, managers, and employees to:

- Acknowledge excellence through structured award cycles (Employee of the Month).
- Build camaraderie and appreciation via real-time peer kudos and badges.
- Celebrate human milestones (birthdays and work anniversaries).
- Take the company's emotional temperature via anonymous pulse surveys and polls.

This phase modernizes the entire module's frontend experience, enforces strict PBAC permissions, and aligns every visual component with the project's Forest & Emerald Enterprise design standard.

---

## 2. Locked Technical & Architectural Decisions

### Decision 1: Capability-Based PBAC Guards

- **Choice**: Replace all hardcoded role checks (`isHR || isSuperAdmin`) with `useAuth().hasPermission('permission.key')` or the `<Can>` gate component.
- **Mapping**:
  - `rewards.manage`: Launch award cycle, shortlist nominee, change status, announce winner, inspect vote stats, build survey, view survey analytics.
  - `rewards.nominate`: Nominate team members with citation.
  - `rewards.vote`: Cast single ballot vote.
  - `rewards.kudos`: Send peer appreciation and like kudos posts.
  - `rewards.respond`: Fill and submit survey responses.
  - `rewards.view`: Access the module subpages.

### Decision 2: Forest & Emerald Brand Architecture

- **Choice**: Eliminate all ad-hoc styling (`from-amber-500 via-orange-500 to-rose-500`, raw `indigo-*`, `pink-*`, etc.).
- **Palette**:
  - Canvas: `#F8FAFC` (light) / `#061A14` (dark)
  - Card Surface: `#FFFFFF` (light) / `#111D17` (dark)
  - Borders: `#EAECF0` (light) / `#1A3125` (dark)
  - Primary Brand Accent: `#00C471` (Emerald) with hover `#00E584`
  - Highlighting: Soft emerald glows and subtle gold accents strictly for honors/trophy icons.

### Decision 3: Submodule Slicing & Wave Ordering

To ensure incremental progress and verifiable deliverables, Phase 15 is split into 4 actionable plans:

- **Plan 15-01**: **Award & Honors Submodule** (`AwardsPage.jsx`, `CreateAwardModal.jsx`, `NominateModal.jsx`, `AnnounceWinnerModal.jsx`, `VotingCard.jsx`).
- **Plan 15-02**: **Appreciation Wall Submodule** (`AppreciationWallPage.jsx`, `KudosCard.jsx`, `GiveKudosModal.jsx`).
- **Plan 15-03**: **Celebration Wall Submodule** (`CelebrationsWallPage.jsx`, `CelebrationCard.jsx`, and celebration-to-kudos linking).
- **Plan 15-04**: **Pulse Surveys & Analytics Submodule & Verification Gate** (`SurveysPage.jsx`, `SurveyBuilderModal.jsx`, `SurveyFillModal.jsx`, `RatingBreakdownChart.jsx`, and automated verification).

### Decision 4: Ponytail Code Optimization Standard

- Shortest working diff wins.
- Zero unnecessary abstractions or duplicate components.
- Zero `prop-types` imports.
- Semantic HTML tags and accessible ARIA attributes.
- Native tabular numbers (`tabular-nums font-mono`) for metrics and tallies.

---

## 3. Scope Fences

- **IN SCOPE**:
  - Complete UI overhaul of all 4 submodules and their 10 modals/cards.
  - PBAC enforcement across all action buttons, forms, and views.
  - Live socket integration verification for awards, kudos, and celebrations.
  - Survey anonymity and data privacy verification.
  - Oxlint and Vite production build clean checks.
- **OUT OF SCOPE**:
  - Changing backend database schemas or destroying existing APIs (backward compatibility is mandatory).
  - Introducing heavy third-party social media libraries or chart engines (use lightweight SVG or standard Tailwind flex bars).
