# Phase 18 Research: Attrition Prediction Module Complete Audit & UI Redesign

## 1. Domain & Module Overview
The **Attrition Prediction Module** (Module M17 / Phase 18) provides early flight-risk intelligence and predictive workforce analytics to empower HR leadership and Department Managers to identify retention vulnerabilities, evaluate underlying behavioral/compensation drivers, and intervene proactively before resignations occur.

### Current Implementation State
- **Backend Model (`backend/src/models/attritionScore.model.js`)**:
  - `employeeId` (unique ref: Employee)
  - `departmentId` (ref: Department)
  - `riskScore` (0 to 100 integer)
  - `riskLevel` ('Low' | 'Medium' | 'High')
  - `breakdown`:
    - `attendance`: (Weight 30%) Absences (>3 days: +15pts), Frequent late punches (>5 days: +15pts).
    - `salaryStagnation`: (Weight 25%) No salary increment in $\ge$ 18 months (+25pts), 12-18 months (+12pts).
    - `appraisal`: (Weight 20%) No appraisal completed in $\ge$ 6 months (+10pts), appraisal delay > 12 months (+10pts), low performance rating $\le$ 2.5/5.0 (+10pts).
    - `tenure`: (Weight 15%) Over 2 years in same title (+15pts), 18-24 months (+8pts).
    - `engagement`: (Weight 10%) Baseline signals.
  - `topFactors`: Array of human-readable explanation strings with point attributions.
  - `notes`: Subdocument array containing intervention history (`note`, `actionTaken`, `authorId`, `authorName`, `followUpDate`, `createdAt`).
  - `calculatedAt`: Timestamp of last evaluation.
- **Backend Endpoints (`backend/src/modules/attrition/attrition.routes.js`)**:
  - `POST /api/v1/attrition/calculate`: Company-wide batch recalculation with mutex protection and rate limiter (10 req / 5 min). Requires `attrition.manage`.
  - `GET /api/v1/attrition/departments`: Department-level aggregated risk distribution and average risk score. Requires `attrition.view`.
  - `GET /api/v1/attrition/scores`: Paginated employee risk scores with search, department, and risk level filtering. Requires `attrition.view`.
  - `GET /api/v1/attrition/scores/:id`: Single employee detailed risk profile. Requires `attrition.view`.
  - `POST /api/v1/attrition/:id/notes`: Add retention intervention note with XSS sanitization. Requires `attrition.manage`.
  - `GET /api/v1/attrition/:id/notes`: Get retention notes history. Requires `attrition.view`.
- **Existing Frontend Components (`frontend/src/features/attrition/`)**:
  - `AttritionDashboardPage.jsx`: Top KPI cards, recalculate button, embedded `DepartmentRiskChart`, basic search/filter bar, and table.
  - `DepartmentRiskChart.jsx`: Native SVG stacked bar chart.
  - `RiskTierBadge.jsx`: Basic badge for High / Medium / Low.
  - `RetentionNotesModal.jsx`: Modal for viewing and logging retention notes.
  - `attritionApi.js`: RTK Query endpoints for scores, analytics, recalculate, and notes.

---

## 2. PBAC & RBAC Security Invariants
Based on `Docs/PBAC-Permission-Matrix.md` and `backend/src/modules/attrition/attrition.service.js`:
1. **Regular Employees**:
   - Have **0 access** to attrition prediction.
   - The navigation menu item is strictly hidden in `Sidebar.jsx`.
   - Direct API calls return `403 Forbidden` (`Access denied: Attrition prediction data is strictly confidential`).
2. **Department Managers**:
   - Have **scoped access** (`scope: 'team'`).
   - Can only view analytics and employee scores belonging to their managed department (`filter.departmentId = scopeInfo.departmentId`).
   - Querying or adding notes to employees from other departments is rejected with `403 Forbidden`.
3. **HR Managers & Super Admins**:
   - Have **company-wide access** (`scope: 'all'`).
   - Can view all department metrics, run company-wide recalculations (`/calculate`), filter by any department, and export reports.

---

## 3. UI/UX Gaps & Enhancement Strategy
1. **Visual System & Theme**:
   - Currently uses generic `slate-*` and light/dark backgrounds instead of the unified **Forest & Emerald Enterprise** design tokens (`#061A14` canvas, `#111D17` surfaces, `#1A3125` borders, `#00C471` emerald accents, with `#EF4444` crimson for High Risk, `#F59E0B` amber for Moderate Risk).
2. **Analytics & Charts Suite**:
   - Missing interactive **Risk Distribution Donut Chart** with employee counts, percentages, and click-to-filter drill-down.
   - Missing **Contributing Factor Breakdown Chart** highlighting top organizational risk drivers across attendance, compensation, appraisal, and tenure.
   - Missing **Interactive Filter Linkage**: Clicking a department bar or risk category donut slice should instantly filter the employee table.
3. **Employee Risk Table**:
   - Needs high-craft styling with employee avatar, monospaced code, designation/department tags, tenure pill, risk score visual gauge (mini progress bar with color interpolation), risk tier badge, and top factors badges.
   - Needs export functionality (CSV export matching active filters and PBAC scope).
4. **Employee Risk Details Modal**:
   - Redesign `RetentionNotesModal.jsx` into a comprehensive `EmployeeRiskDetailModal.jsx` featuring:
     - Header with employee profile overview.
     - Risk Score Radial / Progress Indicator.
     - 5-factor breakdown horizontal bars (`Attendance 30%`, `Salary Stagnation 25%`, `Appraisal 20%`, `Tenure 15%`, `Engagement 10%`).
     - Key Contributing Drivers cards explaining why points were assigned.
     - Contextual retention action recommendations based on specific drivers.
     - Retention Intervention Notes logger with action category selector, follow-up date picker, and historical audit trail timeline.
5. **Quality & Performance Standards**:
   - Zero `prop-types` imports.
   - Zero Oxlint errors or warnings.
   - Zero external chart dependencies (use native, lightweight, performant SVG charts following Ponytail principles).
   - Clean Vite production build.
