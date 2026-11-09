# Module M17 — Attrition Prediction & Risk Analytics (Status: Completed & Verified)

## Final Implementation & Verification State
- **Module ID**: M17
- **Module Name**: Attrition Prediction
- **Phase**: Phase 3 — AI Features
- **Status**: 100% Completed & Verified in Real Chrome via Playwright MCP
- **Git Branch**: `feature/24-attrition-prediction`
- **BUILD-GUIDE Section 26**: All rows 17.1 to 17.5 marked ☑

## Persistence & Data Model
- **Model**: `backend/src/models/attritionScore.model.js` (`AttritionScore`)
  - Fields: `employeeId` (unique ref: Employee), `departmentId`, `riskScore` (0-100), `riskLevel` ('Low'|'Medium'|'High'), `breakdown` (attendance: 30, salaryStagnation: 25, appraisal: 20, tenure: 15, engagement: 10), `topFactors` (array of strings), `calculatedAt`, and embedded `notes` (subdocument array: `note`, `actionTaken`, `authorId`, `authorName`, `followUpDate`, `createdAt`).
  - Compound Indexes: `{ departmentId: 1, riskLevel: 1 }`, `{ riskScore: -1 }`, `{ calculatedAt: -1 }`.

## API Endpoints & Permissions
- `POST /api/v1/attrition/calculate` (`attrition.manage` — Super Admin, HR Manager, calculateLimiter: 10/5m, Mutex-guarded)
- `GET /api/v1/attrition/departments` (`attrition.view` — Super Admin, HR Manager, Dept Manager scoped to team)
- `GET /api/v1/attrition/scores` (`attrition.view` — Super Admin, HR Manager, Dept Manager scoped to team, validated via Zod)
- `GET /api/v1/attrition/scores/:id` (`attrition.view` — Super Admin, HR Manager, Dept Manager scoped, validated via `idParamSchema`)
- `POST /api/v1/attrition/:id/notes` (`attrition.manage` — Super Admin, HR Manager, Dept Manager scoped, validated via `addRetentionNoteSchema`, XSS script sanitization)
- `GET /api/v1/attrition/:id/notes` (`attrition.view` — Super Admin, HR Manager, Dept Manager scoped, validated via `idParamSchema`)

## Security, Scoping & Privacy Invariants
1. **Confidentiality Perimeter**: Regular Employees have zero access; the sidebar item is hidden, and direct URL access returns HTTP 403 Forbidden alert (`Requires: attrition.view`).
2. **Horizontal Privilege Isolation**: Department Managers are strictly scoped to their team department; attempting to query or annotate an employee in another department returns HTTP 403 Forbidden.
3. **Data Leakage Immunity**: Populated responses on `employeeId` only include safe metadata (`name`, `employeeCode`, `avatar`, `email`, `status`, `designationId`, `departmentId`, `joiningDate`). Salary, CNIC, and banking records are never exposed.
4. **ReDoS & Injection Protection**: Inputs escaped via `escapeRegex`; query parameters validated by Zod enum schemas.
5. **Race Condition Mutex**: Concurrent on-demand recalculation double-clicks are rejected with HTTP 409 Conflict.

## Frontend UI (Vite + React 19)
- `AttritionDashboardPage.jsx`: KPI metric cards, filters by risk level and department, native SVG stacked bar chart (`DepartmentRiskChart.jsx`), employee data table.
- `RiskTierBadge.jsx`: Color-coded pulsing badges (High Red, Medium Amber, Low Green).
- `RetentionNotesModal.jsx`: Dynamic retention suggestions, action notes logging with follow-up dates, and history timeline.
- Fully responsive on mobile viewports (390px). Zero external charting dependencies (pure SVG ponytail implementation).
