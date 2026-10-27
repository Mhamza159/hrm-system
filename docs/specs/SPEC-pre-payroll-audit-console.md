# Spec: Pre-Payroll Attendance & Leave Audit Console

## Objective
Provide an interactive, 2-step **Pre-Payroll Audit & Readiness Console** (`Audit & Inspect` → `Confirm & Generate`) directly within the Payroll module (`/payroll/runs`).
Before an official monthly payroll run is executed and financial liabilities are generated, HR Managers and Super Admins must be able to audit and verify every employee's monthly attendance and leave factors—including late arrival counts, unpaid leaves (LWP), approved overtime hours, gazetted holidays, and unexcused absences—with expandable row-by-row daily punch evidence.

---

## Assumptions
1. **Endpoint Design**: `GET /api/v1/payroll/pre-audit?month={month}&year={year}` aggregates live employee attendance, approved leaves, and overtime records without mutating any payroll documents.
2. **Deterministic Rules**: All preview calculations strictly match `payrollProcessor.js` (Integer Paisa invariant, 3 lates = 1 day salary cut, unpaid leave = gross/30 * days, approved overtime = 1.5x basic hourly rate, statutory EOBI/tax).
3. **Expandable Timeline Data**: Every employee record includes itemized audit evidence arrays:
   - `lateArrivals`: `[{ date, checkIn, scheduledStart, minutesLate }]`
   - `unpaidLeaves`: `[{ startDate, endDate, days, reason }]`
   - `approvedOvertime`: `[{ date, overtimeHours, payPaisa }]`
   - `absences`: `[{ date, status: 'absent' }]`
4. **Pre-flight Guard**: If `MonthLock` for the chosen cycle is unlocked, the modal displays an inline warning banner and disables generation until attendance is frozen.
5. **No Mutation During Audit**: Audit is strictly read-only inspection. Correcting punches uses existing Attendance module workflows.

---

## Tech Stack & Architecture
- **Backend**: Node.js, Express, Mongoose, Zod validation.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide icons, RTK Query (`payrollApi.js`).
- **Design System**: ELVARA Emerald Design System (Dark mode `#111D17` / `#162820`, Emerald accents, Light mode Slate).

---

## Commands
```bash
# Backend test verification
npm test -- tests/leave.multiphase.audit.test.js

# Frontend production build verification
npm run build
```

---

## Project Structure & File Touch Points
```text
backend/src/
  modules/payroll/
    payroll.routes.js          → Register GET /pre-audit route with authenticate & checkPermission
    payroll.controller.js      → getPrePayrollAudit handler
    payroll.service.js         → computePrePayrollAudit() business logic
    payroll.validation.js      → queryPreAuditSchema (month, year validation)

frontend/src/
  features/payroll/
    payrollApi.js              → Add getPrePayrollAudit query endpoint
    components/
      PrePayrollAuditModal.jsx → 2-Step interactive audit & generation console with expandable rows
    pages/
      PayrollRunsPage.jsx      → Integrate PrePayrollAuditModal on "+ Generate Payroll Run" trigger
```

---

## Code Style & API Contract

### API Endpoint: `GET /api/v1/payroll/pre-audit?month=7&year=2026`
#### Response Contract:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Pre-payroll audit preview retrieved successfully",
  "data": {
    "month": 7,
    "year": 2026,
    "yearMonth": "2026-07",
    "isMonthLocked": true,
    "totalEligibleEmployees": 6,
    "projectedTotals": {
      "totalGrossPaisa": 34337500,
      "totalOvertimePaisa": 337500,
      "totalDeductionsPaisa": 1713382,
      "totalNetPaisa": 32624118
    },
    "employees": [
      {
        "employeeId": "65f...",
        "name": "Sajwar Babar",
        "employeeCode": "EMP-0001",
        "designation": "Software Engineer",
        "department": "Engineering",
        "avatar": "",
        "baseGrossPaisa": 6000000,
        "presentDays": 19,
        "lateCount": 6,
        "latePenaltyDays": 2,
        "latePenaltyPaisa": 400000,
        "unpaidLeaveDays": 3,
        "unpaidLeavePaisa": 600000,
        "paidLeaveDays": 0,
        "overtimeHours": 5,
        "overtimePayPaisa": 187500,
        "absentDays": 0,
        "projectedNetPaisa": 5348125,
        "auditBreakdown": {
          "lates": [
            { "date": "2026-07-04", "checkIn": "09:40 AM", "scheduledStart": "09:00 AM", "minutesLate": 40 }
          ],
          "unpaidLeaves": [
            { "startDate": "2026-07-13", "endDate": "2026-07-15", "days": 3, "reason": "Personal travel" }
          ],
          "approvedOvertime": [
            { "date": "2026-07-06", "hours": 2, "payPaisa": 75000 },
            { "date": "2026-07-27", "hours": 3, "payPaisa": 112500 }
          ],
          "absences": []
        }
      }
    ]
  }
}
```

---

## Testing Strategy
- **Unit / Integration Tests**:
  - `backend/tests/payroll.preaudit.test.js`:
    1. Returns 404/422 if month or year are invalid.
    2. Accurately flags `isMonthLocked: false` when month lock is missing or unlocked.
    3. Calculates exact late penalty days (`Math.floor(lateCount / 3)`).
    4. Computes itemized unpaid leave deduction and overtime pay matching batch processor numbers.
- **Frontend Verification**:
  - `npm run build` with 0 bundle/lint errors.
  - Manual UI test: Open `/payroll/runs`, click "+ Generate Payroll Run", inspect July 2026 expandable rows, and verify factors.

---

## Boundaries
- **Always do**:
  - Store and calculate all financial values in integer paisa (PKR × 100).
  - Use accessible semantic HTML and keyboard navigation for expandable table rows.
  - Require `payroll.view` or `payroll.create` permissions.
- **Ask first**:
  - Adding new dependencies (strictly avoid; use native React/Tailwind/Lucide).
  - Changing existing `payrollProcessor.js` database models.
- **Never do**:
  - Create draft or real payslips during the pre-audit call (`GET` method must remain idempotent and side-effect free).
  - Bypass `MonthLock` check on generation dispatch.

---

## Success Criteria
1. Clicking "+ Generate Payroll Run" opens `PrePayrollAuditModal.jsx` instead of blindly generating.
2. Step 1 shows an interactive table with all employees' monthly factors (Gross, Lates, Overtime, Unpaid Days, Projected Net).
3. Clicking on any employee row smoothly expands to display itemized evidence badges (Lates with punch timings, Unpaid leave dates & reasons, Overtime details).
4. If MonthLock is not locked for the chosen month, an alert shows: *"Attendance for YYYY-MM is not locked. Please lock attendance before running payroll."* with generation disabled.
5. Clicking "Confirm & Run Payroll" dispatches `POST /payroll/generate`, smoothly transitioning to the generated payroll run.
