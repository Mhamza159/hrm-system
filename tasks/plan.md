# Implementation Plan: Pre-Payroll Attendance & Leave Audit Console

## Overview
Implement the 2-step **Pre-Payroll Audit & Readiness Console** allowing HR Managers and Super Admins to inspect live attendance evidence (presents, lates count and penalty, unpaid leaves, paid leaves, approved overtime, absents) with expandable date-by-date punch details before generating a monthly payroll run.

---

## Architecture & Data Flow

```text
User triggers "+ Generate Payroll Run" in PayrollRunsPage.jsx
       │
       ▼
Opens PrePayrollAuditModal.jsx (Step 1: Audit & Review)
       │
       ├── Calls GET /api/v1/payroll/pre-audit?month=X&year=Y
       │     │
       │     ▼
       │   PayrollService.computePrePayrollAudit(month, year)
       │     ├── Verifies MonthLock for target yearMonth
       │     ├── Fetches active Employees & SalaryStructures
       │     ├── Fetches Attendance for month (lates, OT, presents, absents)
       │     ├── Fetches Approved Leaves for month (paid vs unpaid)
       │     └── Returns computed totals + itemized audit arrays (integer paisa)
       │
       ├── Displays Pre-Payroll Summary Cards (Gross, Overtime, Deductions, Net)
       ├── Displays Audit Grid with status badges
       ├── Click row expands itemized evidence:
       │     - Late arrivals (Date, check-in, scheduled, minutes late)
       │     - Unpaid leaves (Date range, days, reason)
       │     - Approved overtime (Date, hours, pay amount)
       │     - Absences (Date)
       │
       ▼
User confirms and clicks "Looks Good — Proceed to Run Payroll"
       │
       ▼
Step 2: Confirmation & Dispatch
       │
       ├── Dispatches POST /api/v1/payroll/generate { month, year }
       └── Successfully transitions to newly created PayrollRun detail view
```

---

## Phase Breakdown

### Phase 1: Backend API & Service Layer
- **Validation**: Define `queryPreAuditSchema` in `backend/src/modules/payroll/payroll.validation.js` validating `month` (1-12) and `year` (2020-2099).
- **Service**: Implement `PayrollService.computePrePayrollAudit({ month, year })` in `backend/src/modules/payroll/payroll.service.js`.
- **Controller & Route**: Implement `getPrePayrollAudit` in `payroll.controller.js` and wire `GET /pre-audit` in `payroll.routes.js`.
- **Test**: Add automated integration test in `backend/tests/payroll.preaudit.test.js`.

### Phase 2: Frontend RTK Query & Modal Component
- **API Endpoint**: Add `getPrePayrollAudit` query in `frontend/src/features/payroll/payrollApi.js`.
- **Component**: Create `frontend/src/features/payroll/components/PrePayrollAuditModal.jsx`:
  - 2-Step interactive wizard.
  - Month & Year selector with immediate live re-query.
  - MonthLock check alert banner (locked vs unlocked).
  - Metrics summary strip (Projected Gross, Overtime, Deductions, Projected Net).
  - Searchable audit table with color-coded pills.
  - Expandable row itemized breakdown cards for lates, unpaid leaves, overtime, and absences.
  - Step 2 confirmation dialog with total employee headcount and financial totals.
- **Integration**: Update `frontend/src/features/payroll/pages/PayrollRunsPage.jsx` to replace simple generation prompt with `PrePayrollAuditModal`.

### Phase 3: Verification & Polish
- Verify test suite passes (`npx vitest run tests/payroll.preaudit.test.js`).
- Verify production build passes (`npm run build`).
- Verify July 2026 pre-audit data in modal matches expected values.
