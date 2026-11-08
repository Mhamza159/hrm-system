# Tasks: 27-expenses-ui-craft-and-details

**Input**: Design documents from [`.specify/specs/27-expenses-ui-craft-and-details/`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/27-expenses-ui-craft-and-details/)  
**Prerequisites**: `spec.md`, `plan.md`, `DESIGN.md`, `docs/UI-REFERENCE.md`

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story grouping (`[US1]`, `[US2]`, `[US3]`)

---

## Phase 1: Foundational Backend Population

**Purpose**: Ensure the backend API query provides complete relational employee details needed by the frontend.

- [x] **T001** `[Foundational]` Expand Mongoose population in `backend/src/modules/expenses/expense.service.js`:
  - In `getExpenseApprovalsQueue` (line ~408), update `employeeId` populate to select `name firstName lastName employeeCode email departmentId designationId avatar userId` and deeply populate `departmentId: 'name code'` and `designationId: 'title code'`.
  - In `getExpenseById` (line ~344), apply the identical deep populate structure.
  - In `getMyExpenses` (line ~320), ensure consistent category and applicant projection.

**Checkpoint**: Backend responses for `/api/v1/expenses/approvals` now contain `employeeCode`, `departmentId.name`, and `designationId.title`.

---

## Phase 2: User Story 1 - Rich Applicant Identity in Approvals & Reviews (Priority: P1)

**Goal**: Deliver complete professional identity context for applicants in review queues and approval modals.

- [x] **T002** `[US1]` Rebuild the Applicant table cell in `frontend/src/features/expenses/pages/ExpenseApprovalsPage.jsx`:
  - Add initial-letter monogram avatar (`w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20`).
  - Render full applicant name with fallback (`employee.name || firstName lastName`).
  - Render monospace Employee Code badge (`<span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#162720]">EMP-XXXX</span>`).
  - Render official designation (`employee.designationId?.title || employee.designation || 'Staff'`) and department badge (`employee.departmentId?.name`).
- [x] **T003** `[P]` `[US1]` Redesign the Applicant metadata block in `frontend/src/features/expenses/components/ExpenseDecisionModal.jsx`:
  - Replace the plain text row with a structured identity card displaying Avatar, Full Name, Monospace Employee Code (`EMP-XXXX`), Department, Designation, and Work Email.
- [x] **T004** `[P]` `[US1]` Upgrade `frontend/src/features/expenses/components/ExpenseReimburseModal.jsx`:
  - Render the applicant's official Employee Code, Department name, and Designation in the header card alongside payout method selection.

**Checkpoint**: All approval lists and review dialogs present rich applicant data without displaying generic fallback text ("Staff").

---

## Phase 3: User Story 2 - Standardized 'Receipt' Indicator Enforcement (Priority: P1)

**Goal**: Systematically enforce the universal UI rule: write strictly `"Receipt"` with a leading checkmark icon (`✓ Receipt`) wherever a receipt is mandatory.

- [x] **T005** `[US2]` Standardize receipt indicators in `frontend/src/features/expenses/pages/ExpenseCategoriesPage.jsx`:
  - In KPI summary Card 3: Change title to `"Receipt Required"` (purge `"Receipts Mandated (Raseed Lazmi)"`).
  - In the table "Receipt Rule" column: Render an emerald badge with `<Check className="w-3.5 h-3.5 text-emerald-600" /> Receipt` for mandatory categories, and a neutral `"Optional"` badge for discretionary categories.
- [x] **T006** `[P]` `[US2]` Standardize `frontend/src/features/expenses/components/ExpenseCategoryModal.jsx`:
  - Update toggle switch label from `"Mandatory Receipt Proof (Raseed Lazmi)"` to `"Receipt Required"` with a green check badge.
- [x] **T007** `[P]` `[US2]` Standardize `frontend/src/features/expenses/components/ExpenseFormModal.jsx`:
  - In the category selection banner: Replace `"Raseed Lazmi"` with `<span className="font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Receipt</span>`.
  - Update upload box label to `"Receipt Proof (Image or PDF) *"` with clean helper copy and mandatory indicator.

**Checkpoint**: Zero occurrences of `Raseed Lazmi` remain in any category, policy, or submission interface.

---

## Phase 4: User Story 3 - High-Craft Polish & Tabular Numerics (Priority: P2)

**Goal**: Elevate visual craft, alignment, and dark/light mode elegance in line with `DESIGN.md`.

- [x] **T008** `[US3]` Standardize tabular numerics in `frontend/src/features/expenses/pages/ExpenseApprovalsPage.jsx`:
  - Format Claim IDs with `font-mono font-semibold uppercase tracking-wider`.
  - Format Claimed Amount and Authorized Amount with `font-mono tabular-nums`.
- [x] **T009** `[P]` `[US3]` Polish `frontend/src/features/expenses/pages/MyExpensesPage.jsx`:
  - Update "Receipt" column to display a green `✓ Receipt` badge for mandatory/uploaded proofs.
  - Apply `font-mono tabular-nums` to Claimed Amount, Approved Amount, and Expense Dates.
- [x] **T010** `[P]` `[US3]` Polish `frontend/src/features/expenses/pages/ExpenseReportsPage.jsx`:
  - Apply `font-mono tabular-nums` to KPI outlay totals (`Total Incurred Outlay`, `Disbursed Reimbursements`, `Pending Pipeline`) and category breakdown table values.

---

## Phase 5: Verification & Quality Gates

**Goal**: Ensure end-to-end functionality, zero syntax regressions, and clean production builds.

- [x] **T011** Verify backend ES module imports:
  - Run `node -e "import('./backend/src/modules/expenses/expense.service.js')"` and ensure clean execution.
- [x] **T012** Verify frontend production compilation:
  - Run `npm run build --prefix frontend` and confirm build succeeds with 0 errors.
