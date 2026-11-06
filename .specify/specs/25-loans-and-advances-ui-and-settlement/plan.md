# Implementation Plan: Loans & Advances UI Modernization & Settlement Bug Resolution

**Branch**: `feature/25-loans-and-advances-ui-and-settlement`  
**Date**: 2026-11-06  
**Spec**: [`.specify/specs/25-loans-and-advances-ui-and-settlement/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/25-loans-and-advances-ui-and-settlement/spec.md)  
**Status**: Ready for Tasks Breakdown  

---

## 1. Summary & Architecture Overview

This plan modernizes the **Loans & Salary Advances (Module M10)** user experience, eliminates the early prepayment settlement bug that caused false error toasts, and upgrades the borrowing ledger to the enterprise `<DataTable />` with real-time database reactivity.

### Root-Cause Bug Resolution
In [`LoanLedgerPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/loans/pages/LoanLedgerPage.jsx#L281), the `EarlyPrepaymentModal`'s `onClose` callback was invoking `refetch()`. However, the query hook destructured the functions as `refetchLoans` and `refetchSummary`. When `onClose()` ran inside the `try` block of [`EarlyPrepaymentModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/loans/components/EarlyPrepaymentModal.jsx#L64), the resulting `ReferenceError: refetch is not defined` was caught by the modal's `catch` block, immediately triggering a red error toast (`"Failed to record prepayment"`). Meanwhile, the backend had already closed the loan in MongoDB. Correcting this handler to call `refetchLoans()` and `refetchSummary()` eliminates the false alarm completely.

### Real-Time Employee Entity Population
In [`loan.service.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/backend/src/modules/loans/loan.service.js#L230-L238), `getLoans()` and `getLoanById()` populated `employeeId` but omitted nested `departmentId` population (`populate: { path: 'departmentId', select: 'name code' }`). In the UI, the borrower cell attempted to read non-standard fields, resulting in `"Employee ."` instead of borrower names and departments. The query will be updated to populate both `userId` and `departmentId`, and the UI will render an avatar initials badge, employee name, employee code, and department title.

### High-Density `<DataTable />` Migration
`LoanLedgerPage.jsx` currently uses a custom HTML table lacking pagination, column sorting, and empty/error states. Replacing it with `<DataTable />` immediately brings all **10 Systemic UI States** (empty states, typo-tolerant search suggestions, shimmer loading skeletons, offline banners) to the Loans module.

---

## 2. Technical Context & File Layout

- **Platform**: React 18, Vite 6, Tailwind CSS, Redux Toolkit Query, Express, Mongoose, Zod.
- **Design Tokens**: Forest & Emerald theme (`#061A14`, `#111D17`, `#00C471`, hairline borders `#1A3125` / `#EAECF0`).
- **File Structure**:
  ```text
  backend/src/
  ├── modules/loans/
  │   ├── loan.controller.js            # Prepayment & ledger controller
  │   ├── loan.service.js               # Population & atomic settlement math
  │   └── loan.routes.js                # PBAC checkPermission guards

  frontend/src/
  ├── features/loans/
  │   ├── pages/
  │   │   ├── LoanLedgerPage.jsx        # Company ledger migrated to DataTable
  │   │   ├── LoanApprovalsPage.jsx     # Multi-tier approval queue
  │   │   └── MyLoansPage.jsx           # Employee self-service borrowing
  │   ├── components/
  │   │   ├── EarlyPrepaymentModal.jsx  # Settlement modal with bug fix & validation
  │   │   ├── LoanScheduleDrawer.jsx    # Amortization timeline drawer
  │   │   ├── LoanApplyModal.jsx        # Application dialog (State 9 & 8)
  │   │   └── LoanStatsCard.jsx         # Executive KPI card
  │   └── loansApi.js                   # RTK Query cache invalidation
  ```

---

## 3. Detailed Component & API Design

### 3.1 Backend: `loan.service.js` Population Update
```javascript
// backend/src/modules/loans/loan.service.js
export async function getLoans(query = {}, userScope = 'all', actor = null) {
  // ... filter setup ...
  const [items, total] = await Promise.all([
    Loan.find(filter)
      .populate({
        path: 'employeeId',
        select: 'name firstName lastName employeeCode email avatar departmentId designationId userId',
        populate: [
          { path: 'userId', select: 'name email roles', populate: { path: 'roles', select: 'name' } },
          { path: 'departmentId', select: 'name code' },
          { path: 'designationId', select: 'title' }
        ]
      })
      .populate('recommendation.recommendedBy', 'name email')
      .populate('hrReview.reviewedBy', 'name email')
      .populate('adminApproval.approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    Loan.countDocuments(filter)
  ]);
  // ...
}
```

---

### 3.2 Bug Fix: `LoanLedgerPage.jsx` Modal Callback
```javascript
// frontend/src/features/loans/pages/LoanLedgerPage.jsx
<EarlyPrepaymentModal
  isOpen={Boolean(prepayTargetLoan)}
  loan={prepayTargetLoan}
  onClose={() => {
    setPrepayTargetLoan(null);
    refetchLoans();
    refetchSummary();
  }}
/>
```

---

### 3.3 `<DataTable />` Column Configuration in `LoanLedgerPage.jsx`
```javascript
const columns = [
  {
    key: 'loanId',
    label: 'Loan ID & Type',
    sortable: true,
    render: (loan) => (
      <div>
        <span className="font-mono font-bold text-slate-900 dark:text-white">
          {loan.loanId}
        </span>
        <div className="uppercase text-[10px] font-bold text-slate-400">
          {loan.type}
        </div>
      </div>
    )
  },
  {
    key: 'employee',
    label: 'Borrower Employee',
    sortable: true,
    render: (loan) => {
      const emp = loan.employeeId;
      const empName = emp?.name || emp?.user?.name || `${emp?.firstName || ''} ${emp?.lastName || ''}`.trim() || 'Employee';
      const empCode = emp?.employeeCode || '';
      const deptName = emp?.departmentId?.name || '';
      const initial = empName.charAt(0).toUpperCase();

      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-200/60 dark:border-emerald-800/40 shrink-0">
            {initial}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">
              {empName}
            </div>
            <div className="text-[11px] text-slate-400">
              {empCode}{empCode && deptName ? ' • ' : ''}{deptName}
            </div>
          </div>
        </div>
      );
    }
  },
  {
    key: 'amount',
    label: 'Principal',
    sortable: true,
    render: (loan) => (
      <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
        PKR {((loan.amount || 0) / 100).toLocaleString()}
      </span>
    )
  },
  {
    key: 'tenure',
    label: 'Tenure / EMI',
    render: (loan) => (
      <div>
        <div className="font-medium text-slate-800 dark:text-slate-200">
          {loan.repaymentTenureMonths} mo
        </div>
        <div className="text-[11px] text-slate-400 tabular-nums">
          PKR {((loan.monthlyInstallment || 0) / 100).toLocaleString()}/mo
        </div>
      </div>
    )
  },
  {
    key: 'totalRepaid',
    label: 'Repaid',
    sortable: true,
    render: (loan) => (
      <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
        PKR {((loan.totalRepaid || 0) / 100).toLocaleString()}
      </span>
    )
  },
  {
    key: 'remainingBalance',
    label: 'Balance',
    sortable: true,
    render: (loan) => {
      const isZero = (loan.remainingBalance || 0) === 0;
      return (
        <span className={cn('font-bold tabular-nums', isZero ? 'text-slate-400' : 'text-rose-600 dark:text-rose-400')}>
          PKR {((loan.remainingBalance || 0) / 100).toLocaleString()}
        </span>
      );
    }
  },
  {
    key: 'status',
    label: 'Status',
    render: (loan) => <StatusBadge status={loan.status} />
  },
  {
    key: 'actions',
    label: 'Actions',
    className: 'text-right',
    render: (loan) => (
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setScheduleLoanId(loan._id)}
          className="px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
        >
          Schedule
        </button>
        {loan.status === 'active' && (
          <Can I="loan.prepay" a="Loan">
            <button
              onClick={() => setPrepayTargetLoan(loan)}
              className="px-2.5 py-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Settle Early
            </button>
          </Can>
        )}
      </div>
    )
  }
];
```

---

### 3.4 Early Prepayment Modal Enhancement
In [`EarlyPrepaymentModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ Coder\Advanced MERN\HRM\frontend\src\features\loans\components\EarlyPrepaymentModal.jsx):
- Wrap inputs with `<FormField />` displaying inline instructions (`"Amount must be between 1 and remaining balance PKR X"`).
- Provide a *"Full Settle"* shortcut button that fills the exact remaining balance.
- Display a dynamic preview chip: `Remaining After Prepayment: PKR 0 (Closed)`.
- Ensure clean submission handling without re-throwing into the error toast.

---

## 4. Phased Implementation Roadmap

### Phase 1: Backend Population & API Serialization
- Update `backend/src/modules/loans/loan.service.js`:
  - Enhance `getLoans()` with populated `departmentId` and `designationId`.
  - Enhance `getLoanById()` with populated `departmentId`.
- Verify backend tests run cleanly.

### Phase 2: Settlement Bug Fix & Modal Hardening
- Fix `refetch` reference in `frontend/src/features/loans/pages/LoanLedgerPage.jsx`.
- Enhance `frontend/src/features/loans/components/EarlyPrepaymentModal.jsx`:
  - Add `<FormField />` integration.
  - Add *"Full Settle"* button.
  - Validate amount bounds.

### Phase 3: Company Borrowing Ledger `<DataTable />` Migration
- Refactor `LoanLedgerPage.jsx`:
  - Replace raw table with `<DataTable />`.
  - Implement full column spec with avatar initials, clean employee code, and department names.
  - Wire type and status filter controls.
  - Add `RefreshButton` wired to `refetchLoans()` and `refetchSummary()`.

### Phase 4: Repayment Schedule Drawer & UI Polish
- Refactor `LoanScheduleDrawer.jsx`:
  - Forest & Emerald dark/light mode alignment.
  - Clean installment badges (`Pending`, `Deducted`, `Prepaid`).
  - Settle early shortcut guarded by `<Can I="loan.prepay" a="Loan">`.

### Phase 5: Build Verification & Regression Check
- Run `npm run build --prefix frontend`.
- Verify zero syntax or runtime errors.

---

## 5. Verification & Testing Strategy

1. **Prepayment Test**:
   - Open loan `LN-2026-0003` (balance: 20,000).
   - Click *"Settle Early"*, click *"Full Settle"*, input reference `FT-20261106-001`, submit.
   - Confirm: Green success toast appears, modal closes, ZERO error banners appear, and table immediately reflects status `Closed` with balance `PKR 0`.
2. **Employee Population Test**:
   - Inspect table rows: verify borrower column displays "Mohammad Hamza Hakim", employee code, and department title instead of `"Employee ."`.
3. **PBAC Gating Test**:
   - Inspect *"Settle Early"* button visibility with different logged-in roles (`Super Admin` vs regular `Employee`).
4. **Build Verification**:
   - Ensure `npm run build --prefix frontend` succeeds with exit code 0.

