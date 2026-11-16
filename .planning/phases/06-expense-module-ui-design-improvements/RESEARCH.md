# Phase 06: Expense Module – UI Design Improvements — Research & Findings

## 1. Domain & Codebase Analysis

### Existing Architecture:
- **Module:** M11 Expense Claims (`BUILD-GUIDE.md` Section 16 · Rows 11.1 to 11.5).
- **Frontend Directory:** `frontend/src/features/expenses/`
  - `pages/`:
    - `ExpenseCategoriesPage.jsx` (`/expenses/categories`)
    - `ExpenseApprovalsPage.jsx` (`/expenses/approvals`)
    - `MyExpensesPage.jsx` (`/expenses`)
    - `ExpenseReportsPage.jsx` (`/expenses/reports`)
  - `components/`:
    - `ExpenseCategoryModal.jsx` (Add/Edit category dialog)
    - `ExpenseDecisionModal.jsx` (Approve/Recommend/Reject/Escalate dialog)
    - `ExpenseReimburseModal.jsx` (Reimburse direct/payroll dialog)
    - `ExpenseDetailDrawer.jsx` (Full claim details drawer)
    - `expenseUi.jsx` (Pills, currency formatting, status badges)
  - `expensesApi.js` (RTK Query endpoints)

### Identified Gaps & Opportunities:
1. **Row Click Behavior in Categories**:
   - Currently, rows in `ExpenseCategoriesPage.jsx` (both Active and Archive tabs) do not trigger any modal on click. Users must aim for tiny icon buttons on the far right.
   - Requirement: Clicking anywhere on a table row must open a beautifully crafted, comprehensive **Category Detail Modal** showing all fields, policies, linked claims count, audit metadata, and contextual actions (Edit, Archive, Revert, Delete Forever).
2. **Table Design**:
   - Currently, `ExpenseCategoriesPage.jsx` uses grid `<ul><li>` div rows that can misalign across various viewport widths.
   - Transforming it into a semantic, high-density enterprise table (`<table className="w-full">`) with `<thead>`, `<tbody>`, sticky styled headers, hairline borders, and hover states provides visual parity with `SalaryStructuresPage` and `DESIGN.md`.
3. **Pills & Buttons Consistency**:
   - Status badges and pills in `expenseUi.jsx` should strictly reflect the codified semantic colors from `DESIGN.md` §4 (`Pending` violet, `Approved` teal, `Rejected` red, `Paid` cyan, `Active` emerald, `Inactive/Optional` slate, `Disabled` rose).
   - Filter pills/tabs at the top of pages should have rounded-xl or rounded-full badge pills with bold tabular counts.
   - Primary CTA buttons: `#00C471` emerald with hover `#049856`, rounded-xl, and crisp typography.

---

## 2. Recommended Implementation Plan

### Plan 1: Core Design Tokens, Buttons, Pills & Shared UI Components (`06-01-buttons-pills-and-category-detail-modal.md`)
- Update `expenseUi.jsx` with enhanced semantic pill styles, status badges, and icon indicators.
- Create `ExpenseCategoryDetailModal.jsx` for rich row-click inspection of categories (both active and archived).
- Polish `ExpenseCategoryModal.jsx`, `ExpenseDecisionModal.jsx`, and `ExpenseReimburseModal.jsx` with clean spacing, proper alignment, hairline borders, and `#00C471` CTAs.

### Plan 2: Categorize & Limit Tab and Archive Tab Overhaul (`06-02-categories-and-archive-table-overhaul.md`)
- Refactor `ExpenseCategoriesPage.jsx` active and archive tabs into structured semantic tables.
- Wire row click events on both active and archived rows to open `ExpenseCategoryDetailModal.jsx`.
- Align table headers, currency columns (`tabular-nums font-mono`), and action buttons (Pencil, Trash2, RotateCcw).
- Add clear messaging and visual badges for linked claims constraints in the Archive tab.

### Plan 3: Active Tab & Claims Views Polish & Verification (`06-03-active-claims-and-approvals-polish.md`)
- Polish `MyExpensesPage.jsx` and `ExpenseApprovalsPage.jsx` with updated pill filters, streamlined table alignments, and enhanced row-click detail modal integration.
- Verify production build (`npm --prefix frontend run build`).
- Automated verification with Vitest and Playwright.
