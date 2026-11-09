# Module M17 — Attrition Prediction & Risk Analytics

## Overview
Module M17 delivers AI-driven flight risk scoring and retention analytics for the HRM platform.

## Architecture & Data Model
- **Model**: `backend/src/models/attritionScore.model.js` (`AttritionScore`)
  - Fields: `employeeId` (unique ref: Employee), `departmentId`, `riskScore` (0-100), `riskLevel` ('Low'|'Medium'|'High'), `breakdown` (attendance, salaryStagnation, appraisal, tenure, engagement), `topFactors` (array of strings), `calculatedAt`, and embedded `notes` (subdocument array: `note`, `actionTaken`, `authorId`, `authorName`, `followUpDate`, `createdAt`).
  - Compound Indexes: `{ departmentId: 1, riskLevel: 1 }`, `{ riskScore: -1 }`, `{ calculatedAt: -1 }`.

## Multi-Signal Algorithm
- **Attendance (30%)**: Unplanned absences (> 3 days: +15 pts) and late arrivals (> 5 times: +15 pts) in the last 90 days.
- **Salary Stagnation (25%)**: Months since last increment (> 18 mos: +25 pts, > 12 mos: +12 pts).
- **Appraisal (20%)**: Low appraisal rating <= 2.5/5.0 (+15 pts) or overdue appraisal (+10 pts).
- **Tenure (15%)**: Stagnation in same designation > 24 mos (+15 pts, > 12 mos: +8 pts).
- **Engagement (10%)**: Active unresolved grievances (+10 pts).

## Endpoints & PBAC Permissions
- `POST /api/v1/attrition/calculate` (`attrition.manage` — Super Admin, HR Manager)
- `GET /api/v1/attrition/departments` (`attrition.view` — Super Admin, HR Manager, Dept Manager)
- `GET /api/v1/attrition/scores` (`attrition.view` — Super Admin, HR Manager, Dept Manager scoped to team)
- `GET /api/v1/attrition/scores/:id` (`attrition.view` — Super Admin, HR Manager, Dept Manager scoped)
- `POST /api/v1/attrition/:id/notes` (`attrition.manage` — Super Admin, HR Manager, Dept Manager scoped)
- `GET /api/v1/attrition/:id/notes` (`attrition.view` — Super Admin, HR Manager, Dept Manager scoped)

## Confidentiality & Security Guard
- Regular Employees receive HTTP 403 Forbidden on all attrition endpoints; the navigation item is completely hidden from their sidebar.
- Department Manager queries are strictly isolated to their direct department employees.
- Zod query schema blocks NoSQL injection (`riskLevel[$ne]...`); ReDoS metacharacters are safely escaped.

## Frontend
- `AttritionDashboardPage.jsx`: Executive KPI cards, filter toolbar, native responsive SVG stacked bar chart, employee risk table.
- `RiskTierBadge.jsx`: Color-coded pulsing badges (High Red, Medium Amber, Low Green).
- `RetentionNotesModal.jsx`: Rule-based actionable suggestions and note logging history.
- Zero external charting dependencies (pure SVG ponytail implementation).
