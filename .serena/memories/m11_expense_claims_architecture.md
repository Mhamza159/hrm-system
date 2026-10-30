# Module M11: Expense Claims Knowledge & Architectural Ledger

## Overview
Module M11 (Corporate Expense Claims & Category Limits) is implemented across vertical slices 11.1 to 11.5 per docs/BUILD-GUIDE.md Section 16.

## Models
1. **ExpenseCategory** (`backend/src/models/expenseCategory.model.js`):
   - `name`, unique uppercase `code`, `maxLimitPaisa` (integer paisa), `requiresReceipt` (default `true`), `description`, `isActive`, `isDeleted`.
2. **Expense** (`backend/src/models/expense.model.js`):
   - `claimNumber` (format: `EXP-YYYYMM-XXXX`), `employeeId`, `categoryId`, `amount` (integer paisa), `approvedAmount`, `expenseDate`, `description`, `receiptUrl`, `receiptPublicId`, `receiptMimeType`.
   - `status`: `pending_manager`, `pending_admin`, `approved`, `rejected`, `reimbursed`.
   - `approvalHistory`: Array of `{ stage, actorId, decision, comments, timestamp }`.
   - `reimbursement`: Embedded schema `{ method: 'payroll' | 'direct', paymentReference, disbursedAt, disbursedBy, remarks }`.

## API Endpoints
- `GET /api/v1/expenses/categories`: List corporate categories (authenticated, `expense.view`).
- `POST/PUT/DELETE /api/v1/expenses/categories`: Manage categories (`expense.settings`).
- `POST /api/v1/expenses`: Submit claim with Multer memory buffer receipt upload (`expense.create`).
- `GET /api/v1/expenses/my`: List personal claims with pagination (`expense.view`).
- `GET /api/v1/expenses/:id`: View claim detail with strict IDOR protection (`expense.view`).
- `GET /api/v1/expenses/pending-approvals`: Pending queues for managers and executive escalations (`expense.approve`).
- `PATCH /api/v1/expenses/:id/decide`: Approve, escalate, or reject with threshold checks (`expense.approve`).
- `PATCH /api/v1/expenses/:id/reimburse`: Direct payout or payroll attachment (`expense.reimburse`).
- `GET /api/v1/expenses/reports/monthly` and `GET /api/v1/reports/expenses`: Monthly aggregations & CSV export (`report.view`).

## Core Business Decisions & Rules
1. **Raseed Lazmi (Mandatory Receipts)**: Claims without a valid receipt attachment are rejected with HTTP 400.
2. **Manager Approval Limit**: Department managers can approve claims up to PKR 15,000 (1,500,000 paisa). Any claim exceeding this limit automatically escalates to `pending_admin` for Super Admin review.
3. **Separation of Duties**: Applicants cannot approve their own claims (HTTP 403).
4. **Payroll Integration**: Claims reimbursed via payroll stay in `approved` state marked with `reimbursement.method = 'payroll'` and are finalized/settled to `reimbursed` when monthly payroll is marked paid.
