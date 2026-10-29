# Feature Specification: Module M11 — Expense Claims

**Feature Branch**: `feature/14-expenses`  
**Created**: 2026-10-29  
**Status**: Ready for Review  
**Specification Folder**: `.specify/specs/14-Expenses/`  
**BUILD-GUIDE Section**: Section 16 (Rows 11.1 to 11.5)  
**FRD Section**: Section 6 (M11. Expense Claims) & Section 11 (Permission Matrix Row M11)

---

## 1. Executive Summary & Architectural Scope

Module M11 delivers an end-to-end corporate expense reimbursement management engine for the HRM system. It allows employees to submit legitimate out-of-pocket business expenses (travel, fuel, client meals, internet, equipment) with mandatory verifiable receipts, automates hierarchical managerial reviews with monetary approval thresholds, and provides seamless financial reimbursement either through the monthly payroll engine (Module M9) or via standalone direct corporate disbursement.

### Key Architectural Invariants
1. **Monetary Integer Paisa Rule**: All monetary values (`amount`, `maxLimit`, `approvedAmount`) MUST be transmitted, validated, and stored as positive integer paisa ($1\text{ PKR} = 100\text{ paisa}$) to eliminate floating-point arithmetic errors.
2. **Mandatory Receipt Proof**: Every expense submission requires a valid receipt file (JPEG, PNG, WEBP, PDF, max 5MB). Submissions without proof are rejected at the perimeter.
3. **Dual Storage Engine**: File uploads utilize Multer memory storage with Cloudinary cloud streaming (`folder: 'hrm_expenses'`) and local disk fallback (`uploads/expenses/`) in test/offline environments.
4. **Hierarchical Multi-Tier Approval Chain**:
   - Claims $\le$ Manager Limit (e.g., PKR 15,000): Department Manager recommendation/approval $\rightarrow$ HR reimbursement.
   - Claims $>$ Manager Limit: Department Manager review $\rightarrow$ Super Admin executive approval $\rightarrow$ HR reimbursement.
5. **Separation of Duties**: Applicants cannot approve, recommend, or reimburse their own expense claims (`HTTP 403 Forbidden`).
6. **Payroll Earning Integration**: When marked reimbursed via `payroll`, the expense amount is automatically attached as an approved non-taxable earning addition in the employee's next draft payslip.

---

## 2. User Scenarios & Acceptance Criteria (By BUILD-GUIDE Row)

### User Story 1 — Expense Categories & Policy Monetary Caps (Row 11.1 · Priority: P1)
**User Story**: As an **HR Manager** or **Super Admin**, I want to configure corporate expense categories (e.g., Travel, Fuel, Client Entertainment, Internet, Office Supplies) with explicit per-claim monetary caps and receipt rules, so that employees understand borrowing thresholds and claims remain within fiscal budgets.

**Why this priority**: Categories and policy limits must exist before any employee can select a category and submit an expense claim.

**Independent Test**: Can be independently verified via `POST /api/v1/expense-categories` and `ExpenseCategoriesPage.jsx` by creating categories with monetary caps.

#### Acceptance Criteria Across 4 Roles:
- **Super Admin**:
  - **Given** an authenticated Super Admin on `ExpenseCategoriesPage.jsx`, **When** they create or update a category with `name: "Travel"`, `maxLimitPaisa: 5000000` (PKR 50,000), and `requiresReceipt: true`, **Then** the category is saved and immediately reflected in the system.
- **HR Manager**:
  - **Given** an HR Manager with `expense.settings` permission, **When** they update category descriptions or toggle active status, **Then** the update succeeds and audit log is recorded.
- **Department Manager**:
  - **Given** a Department Manager without `expense.settings`, **When** they attempt to create, edit, or delete a category (`POST/PUT/DELETE /api/v1/expense-categories`), **Then** the system rejects the request with `HTTP 403 Forbidden`.
- **Employee**:
  - **Given** an authenticated Employee, **When** they request `GET /api/v1/expense-categories`, **Then** they receive active categories and their respective policy caps to populate the claim submission dropdown.

---

### User Story 2 — Expense Claim Submission with Mandatory Receipt (Row 11.2 · Priority: P1)
**User Story**: As a company **Employee** or **Department Manager**, I want to submit an expense reimbursement claim with date, category, amount, description, and an uploaded receipt image or PDF, so that the company can audit and refund my legitimate operational costs.

**Why this priority**: Core self-service value proposition of Module M11.

**Independent Test**: Verified by submitting a valid claim with a receipt file via `POST /api/v1/expenses` and observing status `pending_manager`. Submitting without a receipt MUST return `HTTP 400 Bad Request`.

#### Acceptance Criteria Across 4 Roles:
- **Employee**:
  - **Given** an Employee with an active employment profile, **When** they submit `POST /api/v1/expenses` with `categoryId`, `amount: 350000` (PKR 3,500), `expenseDate: "2025-04-15"`, `description: "Client lunch"`, and an attached JPEG receipt, **Then** the file is uploaded, the claim is saved with status `pending_manager`, and the direct manager receives a notification.
  - **Given** an Employee, **When** they submit a claim without a receipt file or with an amount exceeding the category policy cap, **Then** the request is rejected with `HTTP 400 Bad Request` or `HTTP 422 Unprocessable Entity`.
- **Department Manager**:
  - **Given** a Department Manager, **When** they submit their own personal expense claim, **Then** the claim is routed to Super Admin / HR for approval (self-approval blocked).
- **HR Manager & Super Admin**:
  - **Given** HR/Admin inspecting employee submissions, **When** they view the claim, **Then** they can view and download the verified receipt file.

---

### User Story 3 — Multi-Tier Hierarchical Approval Engine (Row 11.3 · Priority: P1)
**User Story**: As a **Department Manager**, **HR Manager**, or **Super Admin**, I want to review pending expense claims from my team or department, inspect attached receipts, and approve, reject, or escalate claims based on monetary limits, so that corporate funds are disbursed only for authorized expenditures.

**Why this priority**: Establishes executive internal controls and prevents unauthorized fund leakage.

**Independent Test**: Verified via `PATCH /api/v1/expenses/:id/decide` on `ExpenseApprovalsPage.jsx`. Department manager approves team claim $\le$ limit $\rightarrow$ transitions to `approved`. Large claims ($>$ threshold) $\rightarrow$ transition to `pending_admin`.

#### Acceptance Criteria Across 4 Roles:
- **Department Manager**:
  - **Given** a Department Manager reviewing a direct report's claim on `ExpenseApprovalsPage.jsx`, **When** the claim amount is $\le$ manager threshold (PKR 15,000) and they select `decision: "approve"`, **Then** the status transitions to `approved` (ready for reimbursement).
  - **Given** a team claim exceeding the manager threshold, **When** the manager approves, **Then** the claim transitions to `pending_admin` with recommendation notes.
  - **Given** a Department Manager, **When** they attempt to approve a claim from another department or their own personal claim, **Then** the system rejects with `HTTP 403 Forbidden`.
- **HR Manager**:
  - **Given** an HR Manager with `expense.approve` (scope: `all`), **When** reviewing claims, **Then** they can approve, reject with mandatory feedback remarks, or verify receipt authenticity.
- **Super Admin**:
  - **Given** high-value claims in `pending_admin` status, **When** Super Admin selects `decision: "approve"`, **Then** the claim transitions to `approved`.
- **Employee**:
  - **Given** an Employee, **When** their claim is approved or rejected, **Then** they receive an in-app and email alert, and the status updates on `MyExpensesPage.jsx`.

---

### User Story 4 — Expense Reimbursement Execution (Row 11.4 · Priority: P2)
**User Story**: As an **HR Manager** or **Finance Officer**, I want to execute reimbursement for approved expense claims either through the monthly payroll run or via separate direct payment (bank wire / cash), so that the employee is refunded accurately.

**Why this priority**: Completes the cash cycle by reconciling approved claims with corporate disbursement channels.

**Independent Test**: Verified via `PATCH /api/v1/expenses/:id/reimburse` with `reimbursementMethod: "payroll"` or `"direct"`. Reimbursed claims transition to status `reimbursed`.

#### Acceptance Criteria Across 4 Roles:
- **HR Manager & Super Admin**:
  - **Given** an approved expense claim, **When** HR invokes `PATCH /api/v1/expenses/:id/reimburse` with `method: "payroll"`, **Then** the claim transitions to `reimbursed` (`reimbursedAt: now`), and the amount is tagged to the employee's next pending payroll run as an earning addition (`category: "reimbursement"`).
  - **Given** an approved expense claim, **When** HR reimburses via `method: "direct"` with `paymentReference: "TRX-EXP-8899"`, **Then** status becomes `reimbursed` and reference is logged.
- **Department Manager & Employee**:
  - **Given** an Employee or Department Manager without `expense.reimburse`, **When** they invoke the reimbursement endpoint, **Then** the system returns `HTTP 403 Forbidden`.

---

### User Story 5 — Monthly Categorized Expense Analytics & Reports (Row 11.5 · Priority: P2)
**User Story**: As an **HR Manager**, **Finance Lead**, or **Super Admin**, I want to generate and view monthly expense reports grouped by category, department, and payment method with exportable tables, so that executive leadership can monitor operational burn rates.

**Why this priority**: Required for financial forecasting, cost auditing, and tax compliance.

**Independent Test**: Verified via `GET /api/v1/reports/expenses?month=2025-04&departmentId=...` ensuring totals match sum of individual reimbursed claims.

#### Acceptance Criteria Across 4 Roles:
- **Super Admin & HR Manager**:
  - **Given** company-wide scope (`expense.view:all`), **When** accessing `GET /api/v1/reports/expenses`, **Then** they receive total expenditure, count of claims, department-wise breakdowns, and category utilization.
- **Department Manager**:
  - **Given** team scope (`expense.view:team`), **When** accessing the reports page, **Then** data is strictly filtered to their department's employees.
- **Employee**:
  - **Given** an Employee, **When** requesting company-wide expense reports, **Then** the system restricts visibility to their own personal claim history.

---

## 3. Data Models & Schemas

### 3.1 Expense Category Model (`backend/src/models/expenseCategory.model.js`)
```javascript
import mongoose from 'mongoose';

const expenseCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 100
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: 20
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    maxLimitPaisa: {
      type: Number,
      required: true,
      min: 1 // Integer paisa ceiling per claim
    },
    requiresReceipt: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

export const ExpenseCategory = mongoose.models.ExpenseCategory || mongoose.model('ExpenseCategory', expenseCategorySchema);
```

### 3.2 Expense Claim Model (`backend/src/models/expense.model.js`)
```javascript
import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    claimId: {
      type: String,
      required: true,
      unique: true,
      index: true // e.g. EXP-2025-0001
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseCategory',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 1 // Integer paisa
    },
    expenseDate: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    receiptUrl: {
      type: String,
      required: true // URL in Cloudinary or local disk
    },
    receiptPublicId: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending_manager', 'pending_admin', 'approved', 'rejected', 'reimbursed'],
      default: 'pending_manager',
      index: true
    },
    // Multi-tier audit approvals
    managerReview: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null },
      decision: { type: String, enum: ['approved', 'escalated', 'rejected', null], default: null },
      comments: { type: String, trim: true, default: '' }
    },
    adminApproval: {
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      approvedAt: { type: Date, default: null },
      decision: { type: String, enum: ['approved', 'rejected', null], default: null },
      comments: { type: String, trim: true, default: '' }
    },
    reimbursement: {
      reimbursedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reimbursedAt: { type: Date, default: null },
      method: { type: String, enum: ['payroll', 'direct', null], default: null },
      reference: { type: String, trim: true, default: '' },
      payrollRunId: { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun', default: null }
    }
  },
  { timestamps: true }
);

// High-performance compound indexes
expenseSchema.index({ employeeId: 1, status: 1 });
expenseSchema.index({ categoryId: 1, expenseDate: 1 });

export const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
```

---

## 4. API Endpoints Contract & Authorization

| Method | Endpoint | Permission & Scope | Request Payload | Response | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/expense-categories` | `expense.view` (`own`) | Query: `{ active: boolean }` | `{ success: true, data: Category[] }` | List active categories for dropdown |
| `POST` | `/api/v1/expense-categories` | `expense.settings` (`all`) | Body: `{ name, code, maxLimitPaisa, requiresReceipt }` | `{ success: true, data: Category }` | Create expense category |
| `PUT` | `/api/v1/expense-categories/:id` | `expense.settings` (`all`) | Body: `{ name, maxLimitPaisa, requiresReceipt, isActive }` | `{ success: true, data: Category }` | Update category limit or status |
| `POST` | `/api/v1/expenses` | `expense.create` (`own`) | Multipart: `categoryId`, `amount`, `expenseDate`, `description`, `receipt` | `{ success: true, data: Expense }` | Submit new claim with receipt |
| `GET` | `/api/v1/expenses` | `expense.view` (`own/team/all`) | Query: `{ page, limit, status, categoryId, employeeId }` | `{ success: true, data: Expense[], meta }` | List scoped expense claims |
| `GET` | `/api/v1/expenses/:id` | `expense.view` (`own/team/all`) | Params: `{ id: ObjectId }` | `{ success: true, data: Expense }` | Single claim details with receipt |
| `PATCH` | `/api/v1/expenses/:id/decide` | `expense.approve` (`team/all`) | Body: `{ decision: 'approve'\|'reject'\|'escalate', comments }` | `{ success: true, data: Expense }` | Process approval decision |
| `PATCH` | `/api/v1/expenses/:id/reimburse`| `expense.reimburse` (`all`) | Body: `{ method: 'payroll'\|'direct', reference }` | `{ success: true, data: Expense }` | Mark reimbursed & link to payroll |
| `GET` | `/api/v1/reports/expenses` | `report.view` (`team/all`) | Query: `{ month, departmentId, categoryId }` | `{ success: true, data: ExpenseReport }` | Monthly expense analytics |

---

## 5. Official Library Syntax & Context7 Verified Patterns

### 5.1 Multer Memory Storage & File Validation
```javascript
import multer from 'multer';
import { ApiError } from '../../utils/ApiError.js';

export const uploadReceipt = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max receipt size
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid receipt format. Allowed: JPEG, PNG, WEBP, and PDF.'));
    }
  }
});
```

### 5.2 Zod Validation Schemas (`backend/src/modules/expenses/expense.validation.js`)
```javascript
import { z } from 'zod';

export const createExpenseSchema = z.object({
  body: z.object({
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
    amount: z.coerce.number().int('Amount must be in integer paisa').positive('Amount must be positive'),
    expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    description: z.string().trim().min(5, 'Description must be at least 5 characters').max(500)
  })
});

export const decideExpenseSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Expense ID')
  }),
  body: z.object({
    decision: z.enum(['approve', 'reject', 'escalate']),
    comments: z.string().trim().min(3, 'Comments are required for audit trail').max(500)
  })
});

export const reimburseExpenseSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Expense ID')
  }),
  body: z.object({
    method: z.enum(['payroll', 'direct']),
    reference: z.string().trim().max(100).optional().default('')
  })
});
```

---

## 6. Edge Cases & Defensive Invariants

1. **Submission without receipt**: If `req.file` is missing and the category requires a receipt, throw `400 Bad Request` before creating any record.
2. **Exceeding Category Policy Cap**: If `amount > category.maxLimitPaisa`, reject immediately with `422 Unprocessable Entity`.
3. **Future Date Prohibited**: Expenses incurred in the future (`expenseDate > new Date()`) must be rejected (`400 Bad Request`).
4. **Separation of Duties**: Applicants cannot approve or reimburse their own claim (`403 Forbidden`).
5. **Double Reimbursement**: Once status is `reimbursed`, subsequent calls to `/reimburse` fail with `400 Bad Request`.
6. **NoSQL Injection & XSS**: All description and remark inputs have HTML tags stripped via sanitization regex.

---

## 7. Next Step

Run `/speckit-plan` to generate the complete technical architecture plan, file directory tree, and implementation task checklist.

