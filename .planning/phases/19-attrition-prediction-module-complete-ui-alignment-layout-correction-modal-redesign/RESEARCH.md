# Phase 19 Research: Attrition Prediction Module UI Alignment, Layout Correction & Modal Redesign

## 1. Executive Problem Statement
While the underlying predictive calculations, PBAC security gates, and core SVG charts were established in Phase 18, the visual presentation contains subtle alignment discrepancies, uneven grid card heights, inconsistent component positioning across breakpoints, unconstrained table column shifts, and modal form layout imbalances.

This phase is dedicated to a rigorous **UI/UX polish and layout alignment pass** to make the Attrition Prediction Module visually stunning, geometrically balanced, and pixel-perfect across all screen sizes.

---

## 2. Identified Visual & Layout Inconsistencies

### A. Dashboard Header & KPI Summary Cards
- **Header**: Recalculate button and header titles need standardized baseline alignment and consistent badge placement across viewports.
- **KPI Summary Cards**:
  - Cards currently have natural height (`h-auto`), causing subtle height variations depending on subtitle text length.
  - Metrics need uniform height (`h-32`), standardized internal padding (`p-5`), identical icon container geometry (`w-12 h-12 rounded-xl`), and strictly aligned bottom annotations.

### B. Analytical Charts Grid & Geometry
- **Grid Row 1 (`AttritionRiskDonutChart` & `AttritionFactorsChart`)**:
  - Donut chart is `1-col` and Factors chart is `2-col` in `grid-cols-1 lg:grid-cols-3`.
  - Currently their card heights can drift if one section has more vertical spacing than the other. Both chart cards must enforce equal height (`h-full flex flex-col justify-between`) and standardized internal padding (`p-5` with matching headers).
  - Donut SVG centering and legend layout need unified alignment without text clipping.
- **Department Stacked Bar Chart (`DepartmentRiskChart`)**:
  - Fixed SVG height needs responsive preservation on wide screens.
  - X-axis labels and average risk percentage text require uniform baseline spacing.
  - Tooltip container needs fixed z-index and elevation with glassmorphism backdrop.

### C. Filter Toolbar & Action Controls
- The search input, department dropdown, segmented risk buttons, reset trigger, and export button have slightly varying vertical heights (`h-8` vs `h-9`).
- Elements wrap unevenly on intermediate tablet breakpoints (768px – 1024px).
- Needs a standardized control height (`h-9`), unified rounded-xl geometry, consistent icon spacing, and clean responsive flex-wrap grouping.

### D. Employee Risk Table & Pagination
- **Column Drift**: Lack of fixed column width constraints causes the table columns to jump when sorting or paginating between pages with varying text lengths.
- **Column Alignment**:
  - Employee Code and Name need non-wrapping flex containers with truncated subtexts.
  - Numerical risk score gauges and badges must have fixed widths (`w-36` and `w-32`) to stay aligned vertically across all rows.
  - Interventions button column needs standardized right-alignment and touch targets.
- **Pagination Toolbar**: Needs consistent button heights, clear record counts, and clean baseline text.

### E. Employee Risk Details Dossier Modal (`EmployeeRiskDetailModal`)
- Modal width and height need precise responsiveness (`max-w-3xl`, `max-h-[88vh]`).
- The 4 top metric cards need equal height and centered content.
- 5-factor contribution bars need uniform heights, aligned percentage tags, and standardized track margins.
- Detected trigger badges need consistent padding and uniform grid distribution.
- Retention intervention logger needs aligned input heights (`h-9`), consistent textarea padding, and an organized historical timeline.

---

## 3. Design System Alignment (Forest & Emerald)
- **Canvas / Background**: `#061A14` (Deep forest dark canvas)
- **Surfaces / Cards**: `#111D17` (High-craft dark surface)
- **Borders**: `#1A3125` (Subtle dark emerald border)
- **Brand Accent**: `#00C471` (Vibrant emerald)
- **Risk Crimson**: `#EF4444` / dark `#7F1D1D`
- **Risk Amber**: `#F59E0B` / dark `#78350F`
- **Typography**: Inter / system font with monospace tabular numbers for scores and codes (`font-mono`).
- **Standard Controls Height**: `h-9` across all inputs, dropdowns, and buttons.
- **Zero Prop-Types & Zero Oxlint Warnings**.
