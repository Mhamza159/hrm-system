# Work Breakdown & Implementation Tasks: M17 Attrition Prediction

**Module ID:** M17  
**Module Name:** Attrition Prediction  
**Phase:** Phase 3 — AI Features (Intelligence Scope)  
**Spec Directory:** `.specify/specs/24-attrition-prediction/`  
**Sources of Truth:**  
- `docs/BUILD-GUIDE.md`: Section 26 (Rows 17.1 to 17.5)  
- `docs/FRD.md`: Sections 8 & 11  
- `.specify/specs/24-attrition-prediction/plan.md`  

---

## Task Execution Order (Vertical Slice Architecture)

Execution strictly follows P1 (Core Risk Calculation, Dashboard, Department Trends, Confidentiality) followed by P2 (Retention Notes & Interventions), ending with comprehensive Playwright E2E verification across all 4 roles.

```
P1 (17.1): Weekly & On-Demand Risk Engine (Backend -> Service -> Job -> Test)
   ↓
P1 (17.2): Risk Tiers & Factors Dashboard (Backend -> Frontend -> Test)
   ↓
P1 (17.3): Department Trends Analytics (Backend -> Recharts Chart -> Test)
   ↓
P1 (17.5): Confidentiality & PBAC Scoping (Permissions -> Route Guards -> Security Test)
   ↓
P2 (17.4): Retention Suggestions & Action Notes (Backend -> Notes Modal -> Test)
   ↓
Final E2E Verification across all 4 system roles (Desktop + 390px Mobile)
```

---

## Phase 1: High Priority (P1) Tasks

### Row 17.1 (P1): Weekly Risk Score Engine & Multi-Signal Aggregation
- [x] **17.1-BE1 — Model Creation:** Implement `backend/src/models/attritionScore.model.js` with `employeeId` (unique ref: Employee), `departmentId`, `riskScore` (0–100), `riskLevel` ('Low'|'Medium'|'High'), `breakdown` (attendance, salaryStagnation, appraisal, tenure, engagement), `topFactors` array, `calculatedAt`, and embedded `notes` array. Add compound indexes `{ departmentId: 1, riskLevel: 1 }`, `{ riskScore: -1 }`, and `{ calculatedAt: -1 }`.
- [x] **17.1-BE2 — Multi-Signal Scoring Service:** Implement `calculateEmployeeRisk(employeeId)` and `runWeeklyAttritionScoring()` in `backend/src/modules/attrition/attrition.service.js`. Ingest signals:
  - Attendance: Unplanned leaves & late punch count in last 90 days (Weight 30%).
  - Compensation: Months elapsed since last salary increment (Weight 25%).
  - Appraisal: Overdue appraisal & rating $\le 2.5/5.0$ (Weight 20%).
  - Tenure: Months in current designation without promotion (Weight 15%).
  - Engagement: Survey rating / grievance records (Weight 10%).
- [x] **17.1-BE3 — Recalculation Route & Cron Job:** Implement `POST /api/v1/attrition/calculate` endpoint in `attrition.controller.js` and `attrition.routes.js`. Implement scheduled weekly runner in `backend/src/jobs/attritionScore.job.js` (Sundays at 00:00 PKT) and register in `backend/src/server.js`.
- [x] **17.1-TEST — Scoring & Calculation Tests:** In `backend/tests/m17.attrition.test.js`, write unit tests verifying signal weighting math, zero-point defaults for missing signals, and manual recalculation API trigger.

---

### Row 17.2 (P1): Risk Levels & Contributing Factors Dashboard
- [x] **17.2-BE — Scored Employees Listing Endpoint:** Implement `GET /api/v1/attrition/scores` and `GET /api/v1/attrition/scores/:id` with Zod validation in `attrition.validation.js` supporting search by name/employeeId, department filter, risk tier filter (`Low`, `Medium`, `High`), sorting by `riskScore` desc, and pagination envelope.
- [x] **17.2-FE1 — Risk Badges & Factor Breakdown:** Create `frontend/src/features/attrition/components/RiskTierBadge.jsx` rendering High (Red `#ef4444`), Medium (Amber `#f59e0b`), and Low (Green `#10b981`) badges with pulsing status indicators and tooltip descriptions.
- [x] **17.2-FE2 — Dashboard Page & Employee Risk Table:** Implement `frontend/src/features/attrition/pages/AttritionDashboardPage.jsx` with summary KPI metric cards (Total Assessed, High Risk Flight Candidates, Average Risk Score), filter controls, and interactive data table displaying employee metadata, risk gauges, and factor pills.
- [x] **17.2-TEST — Dashboard Filter & Tiers Tests:** Add test cases in `backend/tests/m17.attrition.test.js` verifying query filters (by department and risk level), pagination metadata, and single-employee factor breakdowns.

---

### Row 17.3 (P1): Department Attrition Trends Analytics
- [x] **17.3-BE — Department Risk Aggregation Endpoint:** Implement `GET /api/v1/attrition/departments` in `attrition.service.js` and controller. Use MongoDB `$facet` or `$group` aggregation pipeline to compute department-wise head count, High/Medium/Low counts, and average risk score.
- [x] **17.3-FE — Recharts Department Risk Chart:** Create `frontend/src/features/attrition/components/DepartmentRiskChart.jsx` using Context7 verified Recharts patterns (`ResponsiveContainer`, `BarChart`, `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, stacked `Bar` components).
- [x] **17.3-TEST — Department Analytics Tests:** In `backend/tests/m17.attrition.test.js`, test department risk calculation accuracy, ensuring correct counts and averages across all departments.

---

### Row 17.5 (P1): Confidentiality, PBAC Permissions & UI Navigation Defense
- [x] **17.5-BE — Permissions Catalog & Scoping Guards:** Add `attrition` entry with actions `attrition.view` and `attrition.manage` in `backend/src/shared/permissions.js`. Seed permissions in `backend/src/seed/roles.seed.js`:
  - Super Admin: `all`
  - HR Manager: `all`
  - Department Manager: `team`
  - Employee: `none` (zero access)
  Enforce scope filtering in `attrition.service.js` (Managers only receive their own team employees; Employee requests receive HTTP 403 Forbidden).
- [x] **17.5-FE — Navigation & Route Guards:** Modify `frontend/src/components/layout/Sidebar.jsx` to render "Attrition Risk" link guarded by `can('attrition.view')` (hidden for Employee). Register protected route `/attrition` in `frontend/src/App.jsx`.
- [x] **17.5-TEST — Security & Scoping Tests:** Implement `backend/tests/m17.attrition.security.test.js` verifying:
  - SEC-1: HTTP 401 on unauthenticated access.
  - SEC-2: HTTP 403 Forbidden on regular Employee access.
  - SEC-3: Department Manager isolation: team scope enforced; cannot query peer department employees.
  - SEC-4: NoSQL injection protection on query parameters.
  - SEC-5: ReDoS protection on employee search inputs.

---

## Phase 2: Medium Priority (P2) Tasks

### Row 17.4 (P2): Tailored Retention Suggestions & Action Notes Panel
- [x] **17.4-BE — Retention Recommendations & Notes API:** Implement rule-based suggestion engine in `attrition.service.js` mapping top factors to tailored retention interventions. Implement `POST /api/v1/attrition/:id/notes` and `GET /api/v1/attrition/:id/notes` in controller and routes with Zod validation. Log every note mutation in `auditLogs`.
- [x] **17.4-FE — Retention Notes Modal:** Create `frontend/src/features/attrition/components/RetentionNotesModal.jsx` displaying dynamic retention suggestions based on employee risk factors, an interactive form to log notes with `actionTaken` and `followUpDate`, and history timeline of previous notes.
- [x] **17.4-TEST — Retention Notes Tests:** In `backend/tests/m17.attrition.test.js`, test note creation, author assignment from `req.user`, follow-up date validation, and team scope authorization for Department Managers.

---

## Final Verification & E2E Testing

- [x] **17.E2E-TEST — Module M17 End-to-End Playwright Verification:** Implement `tests/e2e/m17-attrition.spec.js` running real Chromium browser tests across all four roles:
  - Super Admin: Full company-wide dashboard, department chart, manual recalculation trigger.
  - HR Manager: Company-wide dashboard, add retention notes, filter by High risk.
  - Department Manager: Sees own team employees only; department filter locked to own team; can log team action note.
  - Employee: Menu item completely absent from sidebar; navigating to `/attrition` is blocked with 403 / redirect.
  - Mobile Viewport (390px): Dashboard layout, metric cards, and responsive table verify cleanly.

