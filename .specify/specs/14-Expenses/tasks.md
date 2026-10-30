# Tasks Checklist: M11 — Expense Claims

**Feature**: M11 Expense Claims  
**Spec Reference**: [`.specify/specs/14-Expenses/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/14-Expenses/spec.md)  
**Plan Reference**: [`.specify/specs/14-Expenses/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/14-Expenses/plan.md)  
**Target Branch**: `feature/14-expenses`  
**Status**: Ready for Implementation  

---

## Foundation & RBAC Setup

- [x] 11.0-CONFIG Add `expenses` module permission actions (`expense.view`, `expense.create`, `expense.approve`, `expense.reimburse`, `expense.settings`) to [`backend/src/shared/permissions.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/shared/permissions.js) with scope taxonomy (`own`, `team`, `department`, `all`) and seed them across the 4 core roles in [`backend/src/seed/roles.seed.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/seed/roles.seed.js).

---

## Slice 11.1: Expense Categories & Policy Limits (Priority: P1 · BUILD-GUIDE ID 11.1)

- [x] 11.1-BE-1 Create Mongoose model [`backend/src/models/expenseCategory.model.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/models/expenseCategory.model.js) with `name`, unique uppercase `code`, positive integer paisa `maxLimitPaisa`, boolean `requiresReceipt` (default `true`), `description`, and `isActive` flag.
- [x] 11.1-BE-2 Create Zod schemas `createExpenseCategorySchema` and `updateExpenseCategorySchema` in [`backend/src/modules/expenses/expense.validation.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/expenses/expense.validation.js) validating string lengths, positive integer paisa limit, and boolean flags.
- [x] 11.1-BE-3 Implement category CRUD methods (`createCategory`, `getAllCategories`, `updateCategory`, `deleteCategory`) in [`backend/src/modules/expenses/expense.service.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/expenses/expense.service.js) with duplicate code check and audit log recording.
- [x] 11.1-BE-4 Implement controller handlers & routes in [`backend/src/modules/expenses/expense.controller.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/expenses/expense.controller.js) and [`backend/src/modules/expenses/expense.routes.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/expenses/expense.routes.js) exposing `GET /api/v1/expense-categories` (authenticated) and `POST/PUT/DELETE /api/v1/expense-categories` protected by `checkPermission('expense.settings', 'ExpenseCategory')`. Mount router in [`backend/src/app.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/app.js).
- [x] 11.1-FE-1 Create [`frontend/src/features/expenses/expensesApi.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/expenses/expensesApi.js) defining RTK Query endpoints `useGetExpenseCategoriesQuery`, `useCreateExpenseCategoryMutation`, `useUpdateExpenseCategoryMutation`, and `useDeleteExpenseCategoryMutation`.
- [x] 11.1-FE-2 Build [`frontend/src/features/expenses/components/ExpenseCategoryModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/expenses/components/ExpenseCategoryModal.jsx) with input fields for category name, code, max limit (PKR input converted to integer paisa), receipt requirement toggle, and validation error messages.
- [x] 11.1-FE-3 Build [`frontend/src/features/expenses/pages/ExpenseCategoriesPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/expenses/pages/ExpenseCategoriesPage.jsx) rendering data table of corporate categories, status pills, edit/delete actions, and "Add Category" trigger gated by `<Can I="expense.settings">`.
- [x] 11.1-TEST Create test suite [`backend/tests/expense.test.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/tests/expense.test.js) verifying category creation, duplicate code rejection, policy limit persistence, and permission checks.

---

## Slice 11.2: Expense Claim Submission with Mandatory Receipt (Priority: P1 · BUILD-GUIDE ID 11.2)

- [x] 11.2-BE-1 Create Mongoose model [`backend/src/models/expense.model.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/models/expense.model.js) with unique `claimNumber` (EXP-YYYYMM-XXXX), `employeeId`, `categoryId`, positive integer paisa `amount`, receipt fields (`receiptUrl`, `receiptPublicId`, `receiptMimeType`), `expenseDate`, `description`, lifecycle status (`pending_manager`, `pending_admin`, `approved`, `rejected`, `reimbursed`), embedded `approvalHistory`, and reimbursement details.
- [x] 11.2-BE-2 Create Zod schemas `createExpenseSchema` and `queryExpenseSchema` in [`backend/src/modules/expenses/expense.validation.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/expenses/expense.validation.js) validating positive integer paisa `amount`, valid ISO date, category existence, and mandatory receipt file check.
- [x] 11.2-BE-3 Implement upload handler with Multer memory buffer and Cloudinary stream (with local filesystem fallback in `uploads/expenses/`) and business logic in `expense.service.js` for `createExpense`, `getMyExpenses`, and `getExpenseById`. Reject submissions without receipts with `HTTP 400` and amounts exceeding category caps with `HTTP 422`.
- [x] 11.2-BE-4 Implement controller handlers & routes in `expense.controller.js` and `expense.routes.js` exposing `POST /api/v1/expenses` (with `multer` single file upload), `GET /api/v1/expenses/my`, and `GET /api/v1/expenses/:id` protected by `authenticate`, `validate(createExpenseSchema)`, and `checkPermission('expense.create', 'Expense')`.
- [x] 11.2-FE-1 Add `useApplyExpenseMutation`, `useGetMyExpensesQuery`, and `useGetExpenseByIdQuery` to [`frontend/src/features/expenses/expensesApi.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/expenses/expensesApi.js).
- [x] 11.2-FE-2 Build [`frontend/src/features/expenses/components/ExpenseFormModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/expenses/components/ExpenseFormModal.jsx) with category dropdown displaying dynamic policy caps, expense date picker, amount in PKR, receipt drag-and-drop dropzone with instant image/PDF thumbnail preview, and client-side validation.
- [x] 11.2-FE-3 Build [`frontend/src/features/expenses/pages/MyExpensesPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/expenses/pages/MyExpensesPage.jsx) rendering personal claims list, status badges, receipt viewer preview modal, and "Submit Expense" trigger gated by `<Can I="expense.create">`.
- [x] 11.2-FE-4 Add "Expense Claims" navigation entry to [`frontend/src/components/layout/Sidebar.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/components/layout/Sidebar.jsx) and register `/expenses` and `/expenses/my` routes in App Router.
- [x] 11.2-TEST Add test cases to [`backend/tests/expense.test.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/tests/expense.test.js) asserting that claim submissions without a receipt fail with `HTTP 400`, over-limit claims fail with `HTTP 422`, and valid submissions persist with status `pending_manager` and uploaded receipt reference.

---

## Slice 11.3: Multi-Tier Approval Chain & Limit Checks (Priority: P1 · BUILD-GUIDE ID 11.3)

- [x] 11.3-BE-1 Define `decideExpenseSchema` in [`backend/src/modules/expenses/expense.validation.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/expenses/expense.validation.js) validating `decision` (`recommend`, `approve`, `reject`), optional adjusted positive integer `approvedAmount`, and mandatory `comments`.
- [x] 11.3-BE-2 Implement hierarchical state transition engine in [`backend/src/modules/expenses/expense.service.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/expenses/expense.service.js):
  - Department Manager:
    - Claims $\le$ manager monetary approval limit (PKR 15,000 / 1,500,000 paisa): can directly approve (`status -> approved`) or reject (`status -> rejected`).
    - Claims $>$ manager limit: recommends and escalates (`status -> pending_admin`).
  - Super Admin: can approve (`status -> approved`) or reject (`status -> rejected`) escalated claims of any monetary amount.
  - Guard: Applicant cannot approve their own expense claim (`HTTP 403 Forbidden`).
  - Notification dispatch to applicant on decision.
- [x] 11.3-BE-3 Expose `PATCH /api/v1/expenses/:id/decide` and `GET /api/v1/expenses/pending-approvals` in `expense.routes.js` protected by `checkPermission('expense.approve', 'Expense')` with audit log recording.
- [x] 11.3-FE-1 Add `useDecideExpenseMutation` and `useGetPendingExpenseApprovalsQuery` in [`frontend/src/features/expenses/expensesApi.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/expenses/expensesApi.js).
- [x] 11.3-FE-2 Build [`frontend/src/features/expenses/components/ExpenseDecisionModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/expenses/components/ExpenseDecisionModal.jsx) with receipt preview zoom, claim summary, decision remarks input, optional partial amount adjustment, and Approve / Escalate / Reject buttons.
- [x] 11.3-FE-3 Build [`frontend/src/features/expenses/pages/ExpenseApprovalsPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/expenses/pages/ExpenseApprovalsPage.jsx) with tabbed queues (*Department Claims*, *Executive Escalations*), batch review summary, and decision triggers.
- [x] 11.3-TEST Add integration tests verifying multi-tier routing: small claim approved directly by manager; large claim over limit escalates to `pending_admin`; executive approval transitions to `approved`; self-approval attempt returns `HTTP 403`.

---

## Slice 11.4: Reimbursement Execution (Payroll Integration vs Direct Payout) (Priority: P1 · BUILD-GUIDE ID 11.4)

- [x] 11.4-BE-1 Define `reimburseExpenseSchema` in [`backend/src/modules/expenses/expense.validation.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/expenses/expense.validation.js) validating `method` (`payroll` | `direct`), `paymentReference`, and optional notes.
- [x] 11.4-BE-2 Implement `reimburseExpense` in [`backend/src/modules/expenses/expense.service.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/expenses/expense.service.js) updating status to `reimbursed`, saving reimbursement metadata, recording audit log, and notifying the employee.
- [x] 11.4-BE-3 Update [`backend/src/modules/payroll/payrollProcessor.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/payroll/payrollProcessor.js) to query approved expenses marked for payroll reimbursement, appending line item `"Expense Reimbursement: [Claim#]"` to payslip non-taxable earnings and updating claim status to `reimbursed` on payroll mark paid in [`backend/src/modules/payroll/payroll.service.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/payroll/payroll.service.js).
- [x] 11.4-BE-4 Expose `PATCH /api/v1/expenses/:id/reimburse` in `expense.routes.js` protected by `checkPermission('expense.reimburse', 'Expense')`.
- [x] 11.4-FE-1 Add `useReimburseExpenseMutation` in [`frontend/src/features/expenses/expensesApi.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/expenses/expensesApi.js).
- [x] 11.4-FE-2 Build [`frontend/src/features/expenses/components/ExpenseReimburseModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/expenses/components/ExpenseReimburseModal.jsx) allowing HR to select reimbursement channel (Attach to Next Payroll vs Direct Wire/Cash Transfer) and enter bank reference number.
- [x] 11.4-FE-3 Add "Reimburse" action in [`frontend/src/features/expenses/pages/ExpenseApprovalsPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/expenses/pages/ExpenseApprovalsPage.jsx) under an "Approved for Reimbursement" tab gated by `<Can I="expense.reimburse">`.
- [x] 11.4-TEST Add integration tests for reimbursement flow: direct settlement updates status to `reimbursed`; payroll processor attaches reimbursement to draft payslip earnings and settles claim upon payroll finalization.

---

## Slice 11.5: Monthly Expense Report & Department Aggregation (Priority: P2 · BUILD-GUIDE ID 11.5)

- [x] 11.5-BE-1 Implement `getExpenseMonthlyReport` aggregation in [`backend/src/modules/expenses/expense.service.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/expenses/expense.service.js) grouping by month (`YYYY-MM`), department, and category, calculating total submitted, approved, reimbursed, and pending amounts in integer paisa.
- [x] 11.5-BE-2 Expose `GET /api/v1/reports/expenses` in `expense.routes.js` (and mounted in reports router) with date/department query filters, returning structured summary and supporting CSV export generation via [`backend/src/services/reportExport.service.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/services/reportExport.service.js).
- [x] 11.5-FE-1 Add `useGetExpenseReportQuery` and `useExportExpenseReportMutation` in [`frontend/src/features/expenses/expensesApi.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/expenses/expensesApi.js).
- [x] 11.5-FE-2 Build [`frontend/src/features/expenses/pages/ExpenseReportsPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/expenses/pages/ExpenseReportsPage.jsx) featuring monthly KPI cards, department cost breakdown chart, category spend progress bars, and CSV export button.
- [x] 11.5-TEST Add integration test asserting expense report totals match individual claim amounts precisely without rounding discrepancy.

---

## Module Verification & End-to-End System Tests

- [x] 11.E2E-TEST Module M11 end-to-end Playwright test, chaaron roles se: Super Admin, HR Manager, Department Manager, and Employee verifying complete claim submission, receipt upload, manager threshold escalation, executive approval, reimbursement payout, and reporting lifecycle ([`tests/e2e/m11-expenses.spec.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/tests/e2e/m11-expenses.spec.js)).

