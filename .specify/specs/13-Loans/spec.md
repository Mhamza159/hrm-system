# Feature Specification: M10 — Loans & Salary Advances

**Feature Branch**: `feature/13-loans`  
**Created**: 2026-10-27  
**Status**: Draft / Ready for Review  
**Module**: M10 Loans & Advances (Phase 2 · Smart Operations)  
**Specification Reference**: `docs/BUILD-GUIDE.md` Section 15 (Rows 10.1–10.6), `docs/FRD.md` Section 6 (M10) & Section 11 (Permission Matrix)

---

## 1. Executive Summary & Domain Scope

The **Loans & Salary Advances** module delivers an end-to-end financial borrowing, multi-tier approval, automated payroll recovery, and early repayment engine tailored for Pakistani enterprise software houses.

### Core Architectural Invariants:
1. **Financial Integer Paisa Precision**: All monetary values (`amount`, `monthlyInstallment`, `remainingBalance`, `totalRepaid`, `prepaymentAmount`) are strictly stored as 64-bit safe integers in minor currency units (paisa: `1 PKR = 100 paisa`). Formatting to PKR occurs strictly at the presentation boundary.
2. **Multi-Tier Hierarchical Approval Chain**:
   - `Department Manager`: Recommends or declines direct report applications (with comments).
   - `HR Manager`: Reviews organizational borrowing capacity, recommends or returns for rework.
   - `Super Admin`: Holds sovereign fiduciary authorization to issue final approval, disbursement trigger, or rejection.
3. **Automated Payroll Amortization (M9 Linkage)**: Active approved loans automatically bind to the monthly payroll generation run (`payroll.service.js`). The scheduled monthly installment is automatically deducted under payslip deductions, reducing outstanding loan principal until fully amortized (`closed`).
4. **Zero-TypeScript Mandate**: 100% plain JavaScript (`.js`, `.jsx`), Zod schema validation, Mongoose ODM schemas, and CASL RBAC guards.

---

## 2. Role-Based Access Control (RBAC) Matrix

Derived from `docs/FRD.md` Section 11 (Permission Matrix · Row M10):

| Role | Scope | Permitted Actions | Restrictions |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `all` | Full control: set limits, final approve/reject loans, authorize early prepayments, inspect all company loans & recovery schedules. | Cannot delete an active amortizing loan with payroll deductions. |
| **HR Manager** | `all` | Manage: review applications, recommend/approve within policy cap, track balances, execute early repayments, export ledger. | Cannot bypass Super Admin final disbursement threshold if required by policy. |
| **Department Manager** | `team` | Team (recommend): inspect team loan requests, submit recommendation or decline with structured feedback. | Cannot view loans outside direct reporting line or execute financial prepayments. |
| **Employee** | `own` | Own: apply for loan/advance, view borrowing eligibility cap, track personal installment schedules, check remaining balance. | Cannot approve own loan or view other employees' financial requests. |

---

## 3. Prioritized User Stories & Acceptance Criteria

---

### User Story 1 — Loan / Advance Application (Priority: P1 · BUILD-GUIDE ID 10.1)

> **As an Employee**, I want to submit an application for an emergency salary advance or installment loan specifying the requested amount, reason, and repayment tenure, so that the organization can review and assist with my financial needs.

- **Why this priority**: Core entry point of the module. Without the application submission pipeline, no downstream approvals or payroll deductions can occur.
- **Independent Test**: An authenticated employee fills out the loan request form in `MyLoansPage.jsx`, submits `POST /api/v1/loans`, and verifies a pending loan record is persisted in MongoDB with an unapproved draft schedule.

#### Acceptance Scenarios:

1. **Scenario 1.1 (Employee Submits Valid Loan Request)**:
   - **Given** an authenticated employee with an active employment status and confirmed probation,
   - **When** they submit a request with Type=`loan`, Amount=`PKR 50,000` (5,000,000 paisa), Reason=`Medical Emergency`, and RepaymentTenure=`5 months`,
   - **Then** the system creates a Loan record in `pending_recommendation` status with `remainingBalance = 5,000,000`, generates a provisional 5-month installment schedule (`1,000,000 paisa/month`), logs an audit event, and dispatches a notification to their Department Manager.

2. **Scenario 1.2 (Employee Submits Salary Advance Request)**:
   - **Given** an authenticated employee needing a mid-month salary advance,
   - **When** they submit a request with Type=`advance`, Amount=`PKR 25,000`, Reason=`Personal travel`, RepaymentTenure=`1 month`,
   - **Then** the system registers the advance with a single deduction scheduled for the upcoming payroll batch.

3. **Scenario 1.3 (Department Manager Views Own vs Team Requests)**:
   - **Given** a Department Manager logged into the system,
   - **When** they open the loan console,
   - **Then** their personal loans appear under "My Loans", while team members' submissions appear under "Team Recommendations".

4. **Scenario 1.4 (HR Manager & Super Admin Oversight)**:
   - **Given** an HR Manager or Super Admin,
   - **When** they inspect the organization loans console,
   - **Then** they can view incoming requests from all departments with full employee job profiles and salary structure context.

---

### User Story 2 — Borrowing Limits & Policy Validation (Priority: P1 · BUILD-GUIDE ID 10.2)

> **As the Organization (Super Admin / HR Manager)**, I want the system to dynamically calculate and enforce loan borrowing caps (e.g. up to 1 month gross salary for advances, up to 2 months basic salary for loans) and block unauthorized over-limit requests, so that company financial risk is controlled.

- **Why this priority**: Prevents default risk, payroll over-deduction (employee taking home negative salary), and policy violations.
- **Independent Test**: Verify API returns HTTP 422 Unprocessable Entity when an employee requests PKR 200,000 when their policy cap is PKR 100,000.

#### Acceptance Scenarios:

1. **Scenario 2.1 (Live Borrowing Limit Display for Employee)**:
   - **Given** an employee with a Basic Salary of `PKR 120,000` and Gross Salary of `PKR 180,000`,
   - **When** they open the "Apply for Loan" modal,
   - **Then** the UI clearly displays their maximum borrowing cap: Advance Cap = `PKR 180,000` (1x Gross) and Loan Cap = `PKR 240,000` (2x Basic), with dynamic installment simulation.

2. **Scenario 2.2 (Blocking Over-Limit Requests)**:
   - **Given** an employee attempting to request `PKR 300,000` (exceeding their `PKR 240,000` cap),
   - **When** they submit the form,
   - **Then** both client-side Zod and server-side Zod validation reject the payload with message: `"Requested amount exceeds your maximum borrowing policy limit of PKR 240,000"`.

3. **Scenario 2.3 (Existing Active Loan Restraint)**:
   - **Given** an employee who already has an active, un-cleared loan with an outstanding balance,
   - **When** they attempt to apply for a second concurrent loan,
   - **Then** the system rejects the request unless `allowConcurrentLoans` is explicitly enabled in Company Loan Settings.

4. **Scenario 2.4 (Super Admin Sovereign Policy Override)**:
   - **Given** a Super Admin reviewing an exceptional case,
   - **When** they explicitly approve an over-limit loan with administrative justification notes,
   - **Then** the override is authorized, and a high-severity entry is recorded in `auditLogs` collection with `action: 'LOAN_LIMIT_OVERRIDE'`.

---

### User Story 3 — Multi-Tier Approval Chain (Priority: P1 · BUILD-GUIDE ID 10.3)

> **As a Department Manager, HR Manager, and Super Admin**, I want a structured sequential approval workflow, so that team managers verify operational necessity, HR verifies financial eligibility, and Super Admin grants final disbursement authorization.

- **Why this priority**: Core enterprise governance requirement (BUILD-GUIDE Row 10.3).
- **Independent Test**: Move a loan through the complete lifecycle: `pending_recommendation` $\rightarrow$ `pending_hr` $\rightarrow$ `pending_admin` $\rightarrow$ `approved` / `disbursed`.

#### State Transition Blueprint:
```
[DRAFT/SUBMITTED]
       │
       ▼
[pending_recommendation] ──(Manager Declines)──► [rejected]
       │
  (Manager Recommends)
       │
       ▼
[pending_hr] ────────────(HR Rejects)─────────► [rejected]
       │
  (HR Recommends)
       │
       ▼
[pending_admin] ─────────(Admin Rejects)──────► [rejected]
       │
(Super Admin Approves & Disburses)
       │
       ▼
   [active] ──(Payroll Deductions)──► [closed]
```

#### Acceptance Scenarios:

1. **Scenario 3.1 (Department Manager Recommends Team Request)**:
   - **Given** a loan request submitted by a team member in `pending_recommendation` status,
   - **When** the Department Manager reviews it in `LoanApprovalsPage.jsx` and clicks "Recommend", providing recommendation comments,
   - **Then** status transitions to `pending_hr`, the manager's decision is recorded with timestamp and user ID, and HR receives a notification.

2. **Scenario 3.2 (Department Manager Declines)**:
   - **Given** a loan request in `pending_recommendation`,
   - **When** the Department Manager declines the request with mandatory reason `"Probation period incomplete"`,
   - **Then** status transitions to `rejected`, and the employee is notified with the decline remarks.

3. **Scenario 3.3 (HR Review & Forward to Super Admin)**:
   - **Given** a loan in `pending_hr`,
   - **When** the HR Manager verifies the employee's payroll history and clicks "Verify & Forward",
   - **Then** status transitions to `pending_admin`.

4. **Scenario 3.4 (Super Admin Final Disbursement)**:
   - **Given** a loan in `pending_admin`,
   - **When** the Super Admin approves the loan, selecting the Disbursement Method (`Direct Bank Transfer` | `Cash` | `Payroll Addition`) and Effective Start Month (`2026-11`),
   - **Then** status updates to `active`, the repayment schedule is finalized with active due months, and the employee is notified.

---

### User Story 4 — Installment Repayment Schedule (Priority: P1 · BUILD-GUIDE ID 10.4)

> **As an Employee and Payroll Administrator**, I want to view a transparent monthly amortization schedule showing due dates, principal amounts, deduction status, and remaining balance for each installment, so that recovery progress is completely transparent.

- **Why this priority**: Required for financial auditability and employee trust (BUILD-GUIDE Row 10.4).
- **Independent Test**: Execute `GET /api/v1/loans/:id/schedule` and verify all installment rows equal the original loan amount with proper rounding.

#### Acceptance Scenarios:

1. **Scenario 4.1 (Schedule Generation Precision)**:
   - **Given** an approved loan of `PKR 50,000` (5,000,000 paisa) over `3 months` starting `2026-11`,
   - **When** the schedule is compiled,
   - **Then** Month 1 = `1,666,667 paisa`, Month 2 = `1,666,667 paisa`, Month 3 = `1,666,666 paisa` (sum = exactly `5,000,000 paisa`), with statuses `pending`.

2. **Scenario 4.2 (Employee Schedule Drawer Inspection)**:
   - **Given** an employee viewing their active loan in `MyLoansPage.jsx`,
   - **When** they click "View Schedule",
   - **Then** a slide-out drawer renders each monthly installment with due month, amount in PKR, status pill (`Pending`, `Deducted in Payroll`, `Early Paid`), and payslip link if deducted.

3. **Scenario 4.3 (Admin Ledger Inspection)**:
   - **Given** an HR Manager or Super Admin,
   - **When** they inspect the schedule of any employee's loan,
   - **Then** they see repayment progress percentage (`e.g. 66.6% recovered`), total recovered, and remaining principal balance.

---

### User Story 5 — Automated Payroll Deduction Integration (Priority: P1 · BUILD-GUIDE ID 10.5)

> **As a Payroll Officer**, I want monthly payroll generation in Module M9 to automatically query and deduct the active scheduled loan installment for each employee, so that loan repayments are recovered seamlessly without manual spreadsheets.

- **Why this priority**: Crucial cross-module automation connecting M10 Loans directly to M9 Payroll (BUILD-GUIDE Row 10.5 & Row 9.4).
- **Independent Test**: Run a payroll batch for `2026-11`. An employee with an active loan has `payslip.deductions.loanInstallment = 16,666.67 PKR`, loan balance decrements by the installment, and the schedule installment marks as `deducted`.

#### Acceptance Scenarios:

1. **Scenario 5.1 (Auto Deduction in Payroll Run)**:
   - **Given** an active loan with installment 1 due in `2026-11` for `PKR 10,000`,
   - **When** HR executes `POST /api/v1/payroll/runs` for month `2026-11`,
   - **Then** the payslip generator:
     1. Identifies the active loan installment due for `2026-11`.
     2. Deducts `1,000,000 paisa` under `payslip.deductions.loan`.
     3. Records the `payslipId` on the loan installment schedule item.
     4. Decrements `loan.remainingBalance` by `1,000,000 paisa`.
     5. Increments `loan.totalRepaid` by `1,000,000 paisa`.
     6. Marks installment status as `deducted`.

2. **Scenario 5.2 (Final Installment & Automatic Loan Closure)**:
   - **Given** a loan with only 1 final installment remaining (`remainingBalance = 1,000,000 paisa`),
   - **When** the final payroll run is processed and marked as paid,
   - **Then** `loan.remainingBalance` reaches `0`, and the loan status automatically transitions from `active` to `closed`.

3. **Scenario 5.3 (Payroll Draft Re-calculation & Idempotency)**:
   - **Given** a payroll batch in `draft` status where a payslip is regenerated,
   - **When** the payslip is regenerated before finalization,
   - **Then** the loan deduction is idempotently recalculated without double-deducting or corrupting the loan balance.

---

### User Story 6 — Outstanding Balance Tracking & Early Prepayment (Priority: P2 · BUILD-GUIDE ID 10.6)

> **As an HR Manager / Super Admin**, I want to record an employee's lump-sum early cash/bank repayment and recalculate or close the loan immediately, so that employees can settle their liabilities early.

- **Why this priority**: Provides business flexibility for bonuses, tax refunds, or departing employees clearing liabilities (BUILD-GUIDE Row 10.6).
- **Independent Test**: Execute `POST /api/v1/loans/:id/prepay` with PKR 20,000 on a PKR 30,000 loan. Remaining balance drops to PKR 10,000, remaining installments are adjusted, and when paid in full, loan closes.

#### Acceptance Scenarios:

1. **Scenario 6.1 (Full Early Settlement)**:
   - **Given** an active loan with an outstanding balance of `PKR 25,000`,
   - **When** the HR Manager submits a prepayment of `PKR 25,000` with PaymentMethod=`Bank Transfer` and Reference=`Cheque #88123`,
   - **Then** `remainingBalance` becomes `0`, status transitions to `closed`, all remaining pending installments are marked `prepaid`, an audit log is created, and the employee receives a clearance confirmation.

2. **Scenario 6.2 (Partial Prepayment & Amortization Adjustment)**:
   - **Given** an active loan with 4 remaining installments of `PKR 10,000` each (total `PKR 40,000`),
   - **When** the employee makes a partial prepayment of `PKR 20,000`,
   - **Then** the remaining balance drops to `PKR 20,000`, and remaining installments are adjusted (either reducing future monthly amounts or shortening the tenure, per employee selection).

3. **Scenario 6.3 (Employee Offboarding Final Settlement Integration)**:
   - **Given** an employee undergoing offboarding exit clearance (`M9.8 final settlement`),
   - **When** HR computes the final settlement,
   - **Then** any outstanding loan balance is automatically surfaced and deducted from final gratuity and encashment earnings.

---

## 4. Technical Specifications & Syntax Patterns (Context7 Grounding)

### 4.1 Mongoose Schema Pattern (`loan.model.js`)

Conforms to latest Mongoose 8.x/9.x subdocument array and transaction patterns verified via Context7:

```javascript
import mongoose from 'mongoose';

const installmentScheduleSchema = new mongoose.Schema(
  {
    installmentNumber: { type: Number, required: true },
    dueMonth: { type: String, required: true, trim: true }, // Format: 'YYYY-MM'
    amount: { type: Number, required: true, min: 1 }, // Integer paisa
    status: {
      type: String,
      enum: ['pending', 'deducted', 'prepaid', 'waived'],
      default: 'pending'
    },
    payslipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payslip',
      default: null
    },
    paidAt: { type: Date, default: null },
    notes: { type: String, trim: true }
  },
  { _id: true }
);

const loanSchema = new mongoose.Schema(
  {
    loanId: {
      type: String,
      unique: true,
      required: true,
      trim: true // e.g. "LN-2026-0001"
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['loan', 'advance'],
      required: true,
      default: 'loan'
    },
    amount: {
      type: Number,
      required: true,
      min: 100 // Integer paisa (min 1 PKR)
    },
    repaymentTenureMonths: {
      type: Number,
      required: true,
      min: 1,
      max: 24,
      default: 1
    },
    monthlyInstallment: {
      type: Number,
      required: true,
      min: 1 // Integer paisa
    },
    remainingBalance: {
      type: Number,
      required: true,
      min: 0 // Integer paisa
    },
    totalRepaid: {
      type: Number,
      default: 0,
      min: 0 // Integer paisa
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    status: {
      type: String,
      enum: [
        'pending_recommendation',
        'pending_hr',
        'pending_admin',
        'approved',
        'active',
        'rejected',
        'closed'
      ],
      default: 'pending_recommendation',
      index: true
    },
    // Multi-tier Approval Audit Trail
    recommendation: {
      recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      recommendedAt: { type: Date },
      decision: { type: String, enum: ['recommended', 'declined'] },
      comments: { type: String, trim: true }
    },
    hrReview: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: { type: Date },
      decision: { type: String, enum: ['forwarded', 'rejected'] },
      comments: { type: String, trim: true }
    },
    adminApproval: {
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: { type: Date },
      decision: { type: String, enum: ['approved', 'rejected'] },
      disbursementMethod: {
        type: String,
        enum: ['bank_transfer', 'cash', 'payroll_addition'],
        default: 'bank_transfer'
      },
      comments: { type: String, trim: true }
    },
    effectiveStartMonth: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/ // 'YYYY-MM'
    },
    schedule: [installmentScheduleSchema],
    repayments: [
      {
        amount: { type: Number, required: true },
        paymentMethod: { type: String, enum: ['payroll', 'bank_transfer', 'cash'] },
        reference: { type: String },
        paidAt: { type: Date, default: Date.now },
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ]
  },
  { timestamps: true }
);

loanSchema.index({ employeeId: 1, status: 1 });
loanSchema.index({ 'schedule.dueMonth': 1, 'schedule.status': 1 });

export const Loan = mongoose.model('Loan', loanSchema);
```

### 4.2 Zod Validation Schemas (`loan.validation.js`)

Conforms to latest Zod 3.x patterns verified via Context7:

```javascript
import { z } from 'zod';

export const createLoanSchema = z.object({
  type: z.enum(['loan', 'advance'], {
    errorMap: () => ({ message: "Type must be either 'loan' or 'advance'" })
  }),
  amount: z.number({ required_error: 'Amount is required' })
    .int('Amount must be in integer paisa')
    .positive('Amount must be greater than zero'),
  repaymentTenureMonths: z.number()
    .int()
    .min(1, 'Tenure must be at least 1 month')
    .max(24, 'Tenure cannot exceed 24 months')
    .default(1),
  reason: z.string().trim().min(5, 'Reason must be at least 5 characters').max(500),
  effectiveStartMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Start month must be in YYYY-MM format')
});

export const approvalDecisionSchema = z.object({
  decision: z.enum(['recommend', 'forward', 'approve', 'reject', 'decline']),
  comments: z.string().trim().min(3, 'Comments are required for audit trail'),
  disbursementMethod: z.enum(['bank_transfer', 'cash', 'payroll_addition']).optional()
});

export const earlyPrepaymentSchema = z.object({
  amount: z.number().int().positive('Prepayment amount must be greater than zero'),
  paymentMethod: z.enum(['bank_transfer', 'cash']),
  reference: z.string().trim().min(2, 'Payment reference or receipt note required')
});
```

---

## 5. Non-Functional Requirements & Security

1. **Transaction Integrity**: Prepayment and payroll deduction updates MUST run inside a MongoDB replica set session (`await session.withTransaction(...)`) to guarantee atomicity.
2. **Audit Logging**: Every status transition (`pending_recommendation` $\rightarrow$ `pending_hr` $\rightarrow$ `approved` $\rightarrow$ `closed`) logs to `auditLogs` collection with before/after state, IP address, and actor ID.
3. **Notification Triggers**: Submissions, recommendations, approvals, and early clearances trigger real-time WebSocket events and persistent in-app notifications via M8 `notify()`.
4. **Performance**: All queries filtering by `employeeId`, `status`, and `schedule.dueMonth` are backed by compound indexes (`loanSchema.index`).

---

## 6. Measurable Success Criteria

- **SC-001**: 100% of monetary calculations operate in integer paisa with 0 round-off errors.
- **SC-002**: Automated monthly payroll generation successfully deducts active installments with zero manual adjustments.
- **SC-003**: 4-role permission gates strictly enforce CASL constraints without privilege escalation.
- **SC-004**: Vitest & Supertest automated test suite achieves $\ge 95\%$ line coverage across loan lifecycle.

---

## 7. Next Actions Recommended

Execute `/speckit-plan` to generate the complete technical architecture blueprint, database migrations, endpoint specifications, and integration test plan.
