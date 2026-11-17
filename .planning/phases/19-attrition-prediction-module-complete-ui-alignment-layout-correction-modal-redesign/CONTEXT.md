# Phase 19 Context: Attrition Prediction Module UI Alignment, Layout Correction & Modal Redesign

## 1. Objectives & Boundaries
- Perform a complete visual balance, alignment, and responsive layout overhaul of the **Attrition Prediction Module**.
- Align all card heights, paddings, margins, flexbox containers, and table columns to eliminate visual drift.
- Standardize all charts to equal-height grid rows with responsive SVG viewports and non-overlapping tooltips.
- Completely refine every modal dialog (`EmployeeRiskDetailModal.jsx` and related components) with structured typography, balanced multi-column form layouts, and smooth timeline history.
- Preserve 100% of existing backend integrations, PBAC security checks, calculations, and search/filter states.
- Ensure zero `prop-types` imports, zero Oxlint errors, and clean Vite production build.

---

## 2. Plan Breakdown (4 Plans)

### Plan 19-01: Header, KPI Summary Cards & Global Toolbar Layout Alignment
- Standardize the dashboard header with aligned recalculate button, last-calculated time indicator, and status badge.
- Rebalance the 4 KPI summary cards to uniform height (`h-32`), equal internal padding (`p-5`), standardized icon containers (`w-12 h-12 rounded-xl`), and aligned baseline metrics.
- Reorganize the global toolbar with standardized `h-9` controls, consistent icon spacing, and responsive wrapping across mobile and desktop.

### Plan 19-02: Charts Suite Geometry, Grid Height Balance & SVG Responsive Polish
- Equalize card heights for Row 1 charts (`AttritionRiskDonutChart.jsx` and `AttritionFactorsChart.jsx`) with `h-full flex flex-col justify-between`.
- Refine donut chart SVG centering, legend spacing, and tooltip positioning.
- Polish `DepartmentRiskChart.jsx` with responsive SVG viewBox, aligned X-axis labels, standardized bar widths, and elevated glassmorphism tooltips.

### Plan 19-03: Employee Risk Table Column Alignment, Sizing & Pagination Overhaul
- Establish fixed width constraints on table columns to prevent layout jumps during sorting or page transitions.
- Align employee credentials with non-wrapping avatar rows, truncate overflow cleanly, and standardize risk score gauges (`w-36`) and risk tier badges (`w-32`).
- Align pagination toolbar with consistent button touch targets and baseline record counters.

### Plan 19-04: Employee Risk Dossier Modal Redesign & Module Verification Gate
- Overhaul `EmployeeRiskDetailModal.jsx` with balanced grid layouts for the 4 overview cards, standardized 5-factor progress bar heights, uniform trigger badges, and clean recommendation cards.
- Redesign the intervention note form with `h-9` inputs, aligned labels, and an elegant historical timeline.
- Execute the complete verification gate (zero `prop-types`, zero Oxlint warnings, 22/22 backend test pass, clean Vite production build).

---

## 3. Invariants & Commitments
- **Design Tokens**: `#061A14` canvas, `#111D17` surface, `#1A3125` border, `#00C471` emerald accent.
- **Strict Height Matching**: Equal heights for summary cards and paired chart grid containers.
- **Fixed Table Column Widths**: No column jumping on data changes.
- **Zero Prop-Types**: Ban all `prop-types` imports.
- **Zero Oxlint Warnings**: 100% clean linter output.
