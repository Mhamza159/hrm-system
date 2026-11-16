# Phase 11: Performance Management Module – Complete UI Redesign & Improvements

## Executive Summary
Completely overhaul the user interface of Module M19 (Performance & Appraisal) to deliver a modern, pixel-perfect, enterprise-grade experience adhering strictly to the Forest & Emerald design archetype (`DESIGN.md` & `docs/UI-REFERENCE.md`). 

All three core submodules:
1. **Team Reviews** (`TeamReviewsPage.jsx`)
2. **Appraisal Cycles** (`ReviewCyclesPage.jsx` & `CycleProgressPage.jsx`)
3. **KPI Templates** (`KpiTemplatesPage.jsx`)

along with supporting modals, drawers, rating controls, and the employee personal appraisal portal (`MyReviewPage.jsx`), will be completely redesigned. The redesign maintains 100% backwards compatibility with existing backend APIs, business logic invariants, and PBAC/RBAC authorization matrices.

---

## User Constraints & Core Directives

1. **Brand Archetype & Color Palette:**
   - Strict adherence to Forest & Emerald Enterprise Craft (`DESIGN.md`).
   - Primary: Emerald (`#047857` / `#10B981`), Dark Slate (`#0F172A`), Background Canvas (`#F8FAFC`).
   - Eliminate all legacy `indigo-*` classes across the entire module.
   - 1px hairline borders (`border-slate-200 dark:border-slate-800`), subtle shadows, and tabular numbers (`tabular-nums font-mono`).

2. **PBAC & RBAC Alignment:**
   - Preserve CASL permissions:
     - `performance.template.view` / `performance.template.manage`
     - `performance.cycle.view` / `performance.cycle.manage`
     - `performance.review.view` / `performance.review.submit` / `performance.review.finalize`
     - `performance.peer.manage`
   - Unpermitted actions must be hidden from the UI entirely (never merely disabled).

3. **Submodule Scope & Enhancements:**
   - **Team Reviews:**
     - Executive metrics header (Total in Queue, Pending Self, Awaiting Manager, Ready for Finalization, Finalized).
     - Modern filter bar with search, cycle selector, status filter, and department filter.
     - New `ReviewDetailModal.jsx` providing a full read-only scorecard view for any review.
     - Upgraded `ManagerReviewModal.jsx` with ergonomic 1–5 rating controls, feedback inputs, and increment recommendations.
     - Upgraded `FinalizeReviewModal.jsx` with side-by-side self vs manager comparison and M9 Payroll salary sync preview.
     - Redesigned `PeerFeedbackModal.jsx`.
   - **Appraisal Cycles:**
     - Executive metrics banner (Total Cycles, Active, Closed, Total Reviews, Completed, Avg Completion %).
     - Rich cycle cards with period badges, dual deadline displays (`selfReviewDeadline`, `managerReviewDeadline`), live progress bar.
     - New `ReviewCycleDetailModal.jsx` for viewing cycle specifications.
     - Redesigned `ReviewCycleModal.jsx` with date-range validation and auto-instantiation explainer.
     - Redesigned `CycleProgressPage.jsx` with department completion meters and overdue reviewer queues.
     - Reusable confirmation dialogs (`ConfirmModal.jsx`) replacing `window.confirm`.
   - **KPI Templates:**
     - Overview stat cards (Total Templates, Active, Designations Covered, Total Metrics).
     - Search, designation filter, active status toggle.
     - Redesigned `KpiTemplateModal.jsx` with a real-time 100% weightage visual gauge and live validation.
     - New `KpiTemplateDetailModal.jsx` displaying the complete rubric and weight distribution.
   - **Employee Self-Review & Profile:**
     - Redesigned `MyReviewPage.jsx` with deadline countdown, goal editor (`GoalsEditor.jsx`), and self-score calculator.
     - Redesigned `EmployeePerformanceTab.jsx` for profile timeline view.

4. **Safety & Zero-Regression Invariants:**
   - Preserve 100% KPI weightage sum validation.
   - Preserve self-review deadline locking.
   - Preserve automated M9 Payroll Salary Structure generation upon approved increment.
   - Fix test deadline hardcoding in `backend/tests/m19.performance.e2e.test.js` to ensure 100% backend test pass rate.
