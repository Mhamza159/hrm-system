# Phase 18 Context: Attrition Prediction Module Complete Audit & UI Redesign

## 1. Objectives & Boundaries
- Elevate the **Attrition Prediction Module** (M17) into a premier enterprise workforce intelligence and retention hub.
- Ensure 100% adherence to the Forest & Emerald Enterprise design system (`#061A14` canvas, `#111D17` surfaces, `#1A3125` borders, `#00C471` emerald accent).
- Implement interactive SVG analytical charts without adding heavy external dependencies (following Ponytail lightweight principles).
- Maintain strict PBAC compliance: Regular Employees have zero access; Department Managers are strictly restricted to their department; HR Managers and Super Admins have company-wide access.
- Ensure all metrics and charts derive from live backend data (`/attrition/scores` and `/attrition/departments`).

---

## 2. Plan Breakdown (4 Plans)

### Plan 18-01: Analytics Dashboard Layout, KPI Metric Cards & Global Controls
- Modernize `AttritionDashboardPage.jsx` container, header, recalculation trigger, and global filter controls.
- Implement 4 executive summary cards (Total Workforce Evaluated, High Flight Risk, Moderate Risk, Stable Retention) with percentages, trend comparison indicators, and emerald/crimson/amber status accents.
- Implement global search, department dropdown (HR Manager & Super Admin only), risk level segmented filter, and recalculation status badge.

### Plan 18-02: Interactive Analytics Charts Suite (Risk Donut, Department Stacked Bars & Risk Factors Breakdown)
- Redesign `DepartmentRiskChart.jsx` with Forest & Emerald styling, hover tooltips, responsive SVG viewBox, and click-to-filter drill-down.
- Create `AttritionRiskDonutChart.jsx` showing the proportion of Low, Medium, and High risk employees with interactive tooltips and legend.
- Create `AttritionFactorsChart.jsx` visualizing organizational distribution across the 5 core factors (Attendance, Salary Stagnation, Appraisal, Tenure, Engagement).

### Plan 18-03: Employee Risk Analysis Table, Pagination & Export Engine
- Redesign the employee risk table with high-density enterprise rows, employee avatars, employee codes, department/designation badges, risk score progress gauges, pulsing risk tier badges, and top contributing factor chips.
- Add responsive pagination with jump-to-page and rows-per-page options.
- Implement client-side / server-aligned CSV export for authorized managers.

### Plan 18-04: Employee Risk Details Modal, Retention Intervention Notes & Module Verification Gate
- Redesign the employee modal into `EmployeeRiskDetailModal.jsx` featuring:
  - Employee profile overview & tenure metrics.
  - Risk score gauge & 5-factor breakdown bars.
  - Signal breakdown cards explaining points attribution.
  - Actionable retention recommendations.
  - Retention Intervention Notes logger with category dropdown, follow-up date, and historical timeline.
- Verify zero `prop-types` imports, zero Oxlint errors, and clean Vite production build.

---

## 3. Invariants & Commitments
- **Design Tokens**: `#111D17` dark surface, `#1A3125` border, `#00C471` emerald brand accent.
- **Color Consistency**: High Risk: `#EF4444` (crimson), Medium Risk: `#F59E0B` (amber), Low Risk: `#00C471` (emerald).
- **PBAC Perimeter**: Strictly preserve `attrition.view` and `attrition.manage` permission checks.
- **Zero Heavy Chart Bloat**: Pure, performant SVG charts.
- **Zero Prop-Types**: Ban all `prop-types` imports.
