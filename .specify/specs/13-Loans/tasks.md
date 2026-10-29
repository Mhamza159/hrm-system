# Tasks Checklist: M10 — Loans & Salary Advances

**Feature**: M10 Loans & Advances  
**Spec Reference**: `.specify/specs/13-Loans/spec.md`  
**Plan Reference**: `.specify/specs/13-Loans/plan.md`  
**Target Branch**: `feature/13-loans`  
**Status**: Completed  

---

## Foundation & RBAC Setup

- [x] 10.0-CONFIG Add `loans` module permission actions (`loan.view`, `loan.create`, `loan.recommend`, `loan.approve`, `loan.prepay`, `loan.settings`) to [`backend/src/shared/permissions.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/shared/permissions.js) with scope taxonomy (`own`, `team`, `department`, `all`).

---

## Slice 10.1: Loan / Advance Request Application (Priority: P1 · BUILD-GUIDE ID 10.1)

- [x] 10.1-BE-1 Create Mongoose model [`backend/src/models/loan.model.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/models/loan.model.js) with integer paisa storage, embedded schedule schema, unique `loanId` generator, and compound indexes (`{ employeeId: 1, status: 1 }`).
- [x] 10.1-BE-2 Create Zod schema `createLoanSchema` in [`backend/src/modules/loans/loan.validation.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/loans/loan.validation.js) validating `type` (`loan` | `advance`), positive integer paisa `amount`, `repaymentTenureMonths` (1–24), `reason`, and `effectiveStartMonth` (`YYYY-MM`).
- [x] 10.1-BE-3 Implement `createLoan` service in [`backend/src/modules/loans/loan.service.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/loans/loan.service.js) initializing draft installment schedule, setting status `pending_recommendation`, logging audit log, and notifying the department manager.
- [x] 10.1-BE-4 Implement controller & routes in [`backend/src/modules/loans/loan.controller.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/loans/loan.controller.js) and [`backend/src/modules/loans/loan.routes.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/loans/loan.routes.js) exposing `POST /api/v1/loans` protected by `authenticate`, `validate(createLoanSchema)`, and `checkPermission('loan.create', 'Loan')`. Mount in [`app.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/app.js).
- [x] 10.1-FE-1 Create [`frontend/src/features/loans/loansApi.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/loans/loansApi.js) with `useApplyLoanMutation` and `useGetMyLoansQuery`.
- [x] 10.1-FE-2 Build [`frontend/src/features/loans/components/LoanApplyModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/loans/components/LoanApplyModal.jsx) with Forest & Emerald design tokens, form fields, live monthly installment preview, and validation messages.
- [x] 10.1-FE-3 Build [`frontend/src/features/loans/pages/MyLoansPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/loans/pages/MyLoansPage.jsx) rendering personal active loans, status badges, and apply button gated by `Can I="loan.create"`.
- [x] 10.1-FE-4 Add "Loans & Advances" navigation item in [`frontend/src/components/layout/Sidebar.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/components/layout/Sidebar.jsx) and register `/loans` route in App Router.
- [x] 10.1-TEST Create test suite [`backend/tests/loan.test.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/tests/loan.test.js) verifying `POST /api/v1/loans` persists loan with correct integer paisa amount, generates draft schedule, and triggers notification.

---

## Slice 10.2: Borrowing Limits & Policy Validation (Priority: P1 · BUILD-GUIDE ID 10.2)

- [x] 10.2-BE-1 Implement [`backend/src/modules/loans/loanPolicy.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/loans/loanPolicy.js) with `calculateBorrowingLimits(employeeId)` checking salary structure (Advance: max 1x Gross, Loan: max 2x Basic), probation status, and active loan constraints.
- [x] 10.2-BE-2 Hook `loanPolicy.js` validation into `loan.service.js` rejecting requests exceeding policy caps with HTTP 422, and expose `GET /api/v1/loans/my-eligibility` endpoint.
- [x] 10.2-FE-1 Update `loansApi.js` with `useGetLoanEligibilityQuery`.
- [x] 10.2-FE-2 Update [`LoanApplyModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/loans/components/LoanApplyModal.jsx) to display live max borrowing limit pill (`Advance Cap: PKR X`, `Loan Cap: PKR Y`) and disable submission if requested amount exceeds cap.
- [x] 10.2-TEST Add test cases to [`loan.test.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/tests/loan.test.js) confirming over-limit requests return HTTP 422 and valid requests within cap pass successfully.

---

## Slice 10.3: Multi-Tier Approval Chain (Priority: P1 · BUILD-GUIDE ID 10.3)

- [x] 10.3-BE-1 Define `approvalDecisionSchema` in `loan.validation.js` validating `decision` (`recommend`, `forward`, `approve`, `reject`, `decline`), `comments`, and optional `disbursementMethod`.
- [x] 10.3-BE-2 Implement state transition engine in `loan.service.js`:
  - Dept Manager: `pending_recommendation` $\rightarrow$ `pending_hr` (recommend) or `rejected` (decline).
  - HR Manager: `pending_hr` $\rightarrow$ `pending_admin` (forward) or `rejected`.
  - Super Admin: `pending_admin` $\rightarrow$ `active` (approve & disburse) or `rejected`.
- [x] 10.3-BE-3 Expose `PATCH /api/v1/loans/:id/decide` in `loan.routes.js` with CASL permission checks (`loan.recommend` for manager, `loan.approve` for HR/Admin) and audit log recording.
- [x] 10.3-FE-1 Add `useDecideLoanMutation` and `useGetPendingApprovalsQuery` in `loansApi.js`.
- [x] 10.3-FE-2 Build [`frontend/src/features/loans/components/LoanDecisionModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/loans/components/LoanDecisionModal.jsx) with recommendation/approval remarks and disbursement method selection.
- [x] 10.3-FE-3 Build [`frontend/src/features/loans/pages/LoanApprovalsPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/loans/pages/LoanApprovalsPage.jsx) with tabbed scope filters (*Team Requests*, *HR Verification*, *Executive Disbursement*) and action buttons.
- [x] 10.3-TEST Add integration tests verifying sequential approval flow (`Manager Recommend` $\rightarrow$ `HR Forward` $\rightarrow$ `Admin Approve`) activates loan and sets `disbursed` flag.

---

## Slice 10.4: Installment Repayment Schedule (Priority: P1 · BUILD-GUIDE ID 10.4)

- [x] 10.4-BE-1 Implement schedule compiler in `loan.service.js` calculating exact monthly installment allocations in integer paisa without rounding discrepancy.
- [x] 10.4-BE-2 Expose `GET /api/v1/loans/:id/schedule` in `loan.routes.js` returning itemized installment array with status and due months.
- [x] 10.4-FE-1 Add `useGetLoanScheduleQuery` in `loansApi.js`.
- [x] 10.4-FE-2 Build [`frontend/src/features/loans/components/LoanScheduleDrawer.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/loans/components/LoanScheduleDrawer.jsx) slide-out panel rendering amortization schedule table, status pills, and remaining balance progress bar.
- [x] 10.4-TEST Add test verifying amortization schedule amounts sum precisely to the total loan principal in paisa.

---

## Slice 10.5: Automated Payroll Deduction Integration (Priority: P1 · BUILD-GUIDE ID 10.5)

- [x] 10.5-BE-1 Update [`backend/src/modules/payroll/payrollProcessor.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/payroll/payrollProcessor.js) to query active loans with `schedule.dueMonth === currentMonth`, appending deduction line item `loan_installment` / `advance` to employee draft payslip.
- [x] 10.5-BE-2 Update `markPayrollPaid` in [`backend/src/modules/payroll/payroll.service.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/payroll/payroll.service.js) to mark scheduled installments as `deducted`, decrement `loan.remainingBalance`, increment `loan.totalRepaid`, and auto-transition to `closed` when balance reaches zero.
- [x] 10.5-FE-1 Verify employee payslip view reflects `"Loan Installment"` deduction item in earnings/deductions summary.
- [x] 10.5-TEST Author integration test running a draft payroll cycle, verifying payslip contains loan deduction, marking payroll paid, and asserting loan balance decrements and installment marks `deducted`.

---

## Slice 10.6: Outstanding Balance Tracking & Early Prepayment (Priority: P2 · BUILD-GUIDE ID 10.6)

- [x] 10.6-BE-1 Define `earlyPrepaymentSchema` in `loan.validation.js` validating `amount`, `paymentMethod` (`bank_transfer` | `cash`), and `reference`.
- [x] 10.6-BE-2 Implement `prepayLoan` service in `loan.service.js` executing atomic prepayment transaction, reducing `remainingBalance`, marking pending installments `prepaid`, updating status to `closed` on full repayment, and logging audit entry.
- [x] 10.6-BE-3 Expose `POST /api/v1/loans/:id/prepay` and `GET /api/v1/loans/ledger/summary` in `loan.routes.js` protected by `checkPermission('loan.prepay', 'Loan')`.
- [x] 10.6-FE-1 Add `usePrepayLoanMutation` and `useGetLoanLedgerSummaryQuery` in `loansApi.js`.
- [x] 10.6-FE-2 Build [`frontend/src/features/loans/components/EarlyPrepaymentModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/loans/components/EarlyPrepaymentModal.jsx) with payment method selector, amount input, and receipt reference.
- [x] 10.6-FE-3 Build [`frontend/src/features/loans/pages/LoanLedgerPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/loans/pages/LoanLedgerPage.jsx) with executive KPI cards ([`LoanStatsCard.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/loans/components/LoanStatsCard.jsx)), organization-wide borrowing filter table, and early settlement trigger.
- [x] 10.6-TEST Add integration tests for partial prepayment and full early settlement verifying loan status transitions to `closed` and pending installments mark `prepaid`.

---

## Module Verification & End-to-End System Tests

- [x] 10.E2E-TEST Module M10 end-to-end verification test suite across all 4 roles: Super Admin, HR Manager, Department Manager, Employee ([`backend/tests/m10.loans.e2e.test.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/tests/m10.loans.e2e.test.js)).
