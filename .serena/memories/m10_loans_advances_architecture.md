# Module M10 — Loans & Salary Advances (Architecture & Decisions)

## 1. Specification & Scope
- Build Guide: Section 15 (Rows 10.1 - 10.6).
- Full lifecycle: Application -> Multi-tier sequential approval (Dept Manager recommend -> HR review -> Super Admin approve/disburse) -> Amortization schedule -> Automated payroll recovery -> Early prepayment / full settlement.

## 2. Models
- `Loan` (`backend/src/models/loan.model.js`):
  - Invariants: Amounts stored in integer paisa (PKR * 100).
  - Concurrency Defense: Unique partial compound index `{ employeeId: 1, type: 1 }` on `status: { $in: ['pending_recommendation', 'pending_hr', 'pending_admin', 'active'] }` to eliminate double-click/race condition bypass.
  - Multi-tier audit: `recommendation`, `hrReview`, `adminApproval`, `schedule[]`, `repayments[]`.

## 3. APIs & Perimeter Security
- `GET /api/v1/loans/my-eligibility` (`loan.view`, own)
- `GET /api/v1/loans/ledger/summary` (`loan.view`, all)
- `POST /api/v1/loans` (`loan.create`, own)
- `GET /api/v1/loans` (`loan.view`, own/team/dept/all)
- `GET /api/v1/loans/:id` (`loan.view`, own/team/dept/all) - BOLA/IDOR guarded.
- `GET /api/v1/loans/:id/schedule` (`loan.view`, own/team/dept/all) - BOLA/IDOR guarded.
- `PATCH /api/v1/loans/:id/decide` (`loan.recommend`, team/all) - Separation of duties: Self-approval/self-recommendation blocked with HTTP 403.
- `POST /api/v1/loans/:id/prepay` (`loan.prepay`, all) - Prepayment cap & status validation.

## 4. Permissions Map
- `Super Admin`: `*` (wildcard manage all)
- `HR Manager`: `loan.view` (all), `loan.create` (own), `loan.recommend` (all), `loan.approve` (all), `loan.prepay` (all), `loan.settings` (all)
- `Department Manager`: `loan.view` (team), `loan.create` (own), `loan.recommend` (team)
- `Employee`: `loan.view` (own), `loan.create` (own)

## 5. Module Integrations
- **M1 Employee & Salary Structure**: Borrowing caps enforced against active `SalaryStructure`: Salary Advance <= 1x Gross, Loan <= 2x Basic. Probation blocks advances.
- **M9 Payroll Engine**: Active loan installments automatically attached as `loan_installment` or `advance` deductions in `payrollProcessor.js`. Upon payroll mark-paid in `payroll.service.js`, installments transition to `deducted`, reducing remaining balance to `closed`.
- **M0 Audit & Notifications**: Audit log `recordAuditLog` on all decisions and settlements; applicant alerted via `notify.service.js`.
