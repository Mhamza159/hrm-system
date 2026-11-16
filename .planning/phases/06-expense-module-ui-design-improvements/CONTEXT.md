# Phase 06: Expense Module – UI Design Improvements — Context & Decisions

## Phase Goal
Modernize and elevate the UI design and layout of the Expense Module across all key views:
1. Buttons & Pills
2. Categorize & Limit Tab (`/expenses/categories`)
3. Archive Tab (`/expenses/categories?tab=archive`)
4. Active Tab (Active Categories & Active Claims views in `/expenses` and `/expenses/approvals`)

---

## Locked Decisions & User Directives

### 1. Buttons & Pills Tab
- **Button Styling**: Strict alignment with Forest & Emerald design tokens:
  - Primary CTA buttons: `#00C471` emerald background, hover `#049856`, rounded-xl (`12px`), bold text, subtle shadow (`shadow-xs shadow-emerald-600/20`).
  - Secondary/Outline buttons: hairline borders (`border-slate-200/80 dark:border-[#1A3125]`), subtle hover backgrounds (`hover:bg-slate-50 dark:hover:bg-[#15231C]`).
  - Danger buttons: subtle rose hover (`hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/40 dark:text-rose-400`).
- **Semantic Pills**:
  - Locked semantic badges per `DESIGN.md` §4:
    - Active / Required / Approved: `bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60`
    - Optional / Inactive / Default: `bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#15231C] dark:text-slate-300 dark:border-[#1A3125]`
    - In Review / Pending: `bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/60`
    - Approved / Authorised: `bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/60`
    - Reimbursed / Paid: `bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800/60`
    - Rejected / Disabled: `bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60`
- **Tab Switchers**: Segmented pill-style navigation tabs with rounded-xl / rounded-full badges indicating counts (`0`, `3`, etc.).

### 2. Categorize & Limit Tab (`/expenses/categories`)
- **Semantic Data Table**: Replace div-grid lists with structured enterprise tables featuring sticky header (`thead`), hairline border dividers, and hover rows.
- **Interactive Row Click Modal**:
  - Clicking ANY row in the categories data table must open a dedicated **Category Detail Modal** (`ExpenseCategoryDetailModal.jsx`).
  - Must display all necessary information:
    - Category name, uppercase code badge, active status pill, receipt rule pill.
    - Policy max limit per claim in PKR (`tabular-nums font-mono`).
    - Employee guidance description.
    - Linked claims count (`claimCount`).
    - Audit metadata: Created date, last updated date.
    - In-modal actions: Edit category button (opens `ExpenseCategoryModal`), Archive button (with confirm dialog).

### 3. Archive Tab
- **Archived Data Organization**:
  - Clean table layout with columns: Category Name, Code, Limit, Archived Date/Time, Archived By, Linked Claims, Actions.
  - Clicking any archived row opens an **Archived Category Detail Modal** with audit details and explanation of why categories with active linked claims cannot be permanently deleted.
  - Actions: Revert/Restore Category (emerald action) and Permanent Delete (danger action, disabled with tooltip if linked claims exist).

### 4. Active Tab & Claims
- **Active Category Table & Claims Table**:
  - Consistent typography, tabular figures (`font-mono tabular-nums`) for currency (PKR in paisa converted to formatted rupees).
  - Professional alignment, responsive padding, zero AI slop, no harsh borders or misaligned columns.
  - Interactive row click opening full detail modals/drawers across `/expenses` and `/expenses/approvals`.

---

## Design System Invariants
- Colors: Deep Forest Black-Green (`#061A14`), Surface Card (`#FFFFFF` light, `#111D17` dark), Hairline borders (`#EAECF0` light, `#1A3125` dark), Brand Primary (`#00C471`).
- Typography: Inter font family, tabular numbers for monetary figures (`tabular-nums font-mono`).
- Standard envelope response and RTK Query cache invalidation preserved.
