# Feature Specification: Loans & Advances UI Modernization & Settlement Bug Resolution

**Feature Branch**: `25-loans-and-advances-ui-and-settlement`  
**Created**: 2026-11-06  
**Status**: Ready for Plan  
**Theme & Design Standard**: Forest & Emerald Enterprise Craft ([`DESIGN.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/DESIGN.md) & [`docs/UI-REFERENCE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/UI-REFERENCE.md))  
**Input User Request**: 
> "Improve the UI of the Loans and Advance module. Read the docs file, design.md file, and ui-reference file. In the table, all data should be dynamic, fetching real-time data from the database to display in the UI. Design the entire structure while keeping PBAC and RBAC rules in mind. Secondly, when I settle a payment, an error pops up at the top, but the loan or advance still gets closed—find and fix this bug as well"

---

## Executive Summary & Design Vision

Module M10 (Loans & Salary Advances) is a core financial governance pillar within the HRM enterprise platform. While backend loan calculations, amortization engines, and multi-tier approval mechanisms are functional, the current user experience exhibits key deficiencies:
1. **False Error Toast on Prepayment Settlement**: When an administrator records an early prepayment to settle a loan, the API executes and closes the loan, but a false-alarm red toast (`"Failed to record prepayment"`) is displayed due to a frontend reference error (`refetch is not defined`) in `LoanLedgerPage.jsx`'s `onClose` callback.
2. **Missing Employee Population**: The borrower column renders generic fallback text `"Employee"` and a floating dot `" • "` because the backend query does not populate `departmentId`, and the frontend component inspects legacy/non-existent fields rather than `employee.name`, `employee.employeeCode`, and `employee.departmentId.name`.
3. **Hard-coded Legacy Table**: `LoanLedgerPage.jsx` uses a custom `<table>` instead of the enterprise `<DataTable />`, bypassing the recently implemented 10 Systemic UI States (empty states, typo-tolerant search suggestions, shimmer skeletons).
4. **PBAC & RBAC Alignment**: Borrowing ledger auditing (`loan.view:all`), multi-tier recommendation/approval (`loan.recommend`, `loan.approve`), and early prepayment execution (`loan.prepay`) must be strictly guarded both on the API routes and in frontend interactive controls.

This specification redesigns the Loans and Advances module into a polished, high-density dashboard fully aligned with **Forest & Emerald Craft tokens** (`#061A14`, `#111D17`, `#00C471`, `#1A3125`, `#EAECF0`), fixes the early settlement bug at root cause, and guarantees dynamic real-time data synchronization.

---

## User Scenarios & Testing *(Prioritized)*

### User Story 1 (P1) - Error-Free Early Prepayment & Account Settlement
**Journey**: An HR Manager or Super Admin opens an active loan from the Company Borrowing Ledger or Repayment Schedule Drawer, clicks *"Settle Early"*, enters the remaining principal (or a partial amount), selects the payment channel (e.g. Bank Transfer), provides a receipt reference, and confirms. The dialog must successfully record the prepayment, trigger RTK Query cache invalidation, display a success toast/confirmation modal reassuring the user that the account is closed and deductions are halted, and cleanly close without throwing any false-alarm error toasts.

**Why this priority**: Eliminates user confusion and panic caused by conflicting signals (a red error banner claiming the payment failed while the loan shows closed).

**Independent Test**:
- Open `LoanLedgerPage`, click *"Settle Early"* on an active loan (e.g., `LN-2026-0003`).
- Enter full settlement amount and submit.
- **Verify**: Success toast displays (`"Full loan prepayment recorded; account closed successfully"`), modal closes, zero red error toasts appear, and the loan's balance transitions to `PKR 0` with status `Closed`.

**Acceptance Scenarios**:
1. **Given** an active loan, **When** early prepayment is confirmed with valid parameters, **Then** the backend persists the transaction, the modal dismisses without JavaScript runtime exceptions, and a green success confirmation is shown.
2. **Given** a full prepayment settlement, **When** remaining balance hits 0, **Then** all subsequent pending schedule installments are marked as `prepaid` and the loan status becomes `closed`.

---

### User Story 2 (P1) - Dynamic Real-Time Borrowing Ledger with Full Employee Population
**Journey**: An executive, auditor, or HR administrator visits `/loans/ledger`. The table dynamically fetches real-time records from MongoDB. Each row displays the real borrower details: avatar badge with initials, full employee name (`name`), organization employee code (`employeeCode`), and departmental badge (`departmentId.name`). The table is powered by the standardized `<DataTable />` component, supporting sortable columns, client/server search with typo tolerance, and status pill badges.

**Why this priority**: Corrects the visually broken `"Employee ."` rows seen in production screenshots, restoring organizational visibility and accountability.

**Independent Test**:
- Navigate to `/loans/ledger`.
- **Verify**: Every row displays the actual employee name (e.g., "Mohammad Hamza Hakim"), valid employee code (e.g., "EMP-2026-001"), and department name rather than generic fallbacks or empty dots.
- **Verify**: Table reflects changes immediately upon manual refresh or background mutation.

**Acceptance Scenarios**:
1. **Given** loans in database, **When** `/api/v1/loans` is fetched, **Then** `employeeId` includes populated `name`, `employeeCode`, and `departmentId` (`name`, `code`).
2. **Given** `LoanLedgerPage`, **When** rendered, **Then** it uses `<DataTable />` with custom cell renderers for Loan ID, Borrower Employee, Principal, Tenure/EMI, Repaid, Balance, Status, and Actions.

---

### User Story 3 (P1) - Strict PBAC & RBAC Authorization Enforcement
**Journey**: Users access loan views according to their policy permissions:
- Regular Employees (`loan.view:own`) can only view their personal loans at `/loans/my`.
- Department Managers (`loan.view:team`, `loan.recommend`) can view and recommend loans for direct reports in `/loans/approvals`.
- HR Managers and Super Admins (`loan.view:all`, `loan.approve`, `loan.prepay`) have full company-wide ledger visibility (`/loans/ledger`) and authorization to settle loans early.
Interactive action buttons (`Settle Early`, `Recommend`, `Approve`, `Reject`) are conditionally rendered via `<Can />` guards.

**Why this priority**: Protects sensitive employee compensation and borrowing records from unauthorized cross-department exposure.

**Independent Test**:
- Log in as an Employee and attempt to access `/loans/ledger`.
- **Verify**: Rendered view is `<PermissionDeniedState />` explaining that `loan.view:all` is required.
- Log in as an HR Manager.
- **Verify**: Full company ledger is accessible and *"Settle Early"* action buttons are visible and active.

**Acceptance Scenarios**:
1. **Given** an unauthorized role, **When** attempting to access the company ledger or record a prepayment, **Then** PBAC middleware rejects with 403 and the UI surfaces contextual guidance.
2. **Given** an authorized user, **When** viewing the ledger, **Then** actions match their CASL abilities.

---

### User Story 4 (P2) - High-Density Repayment Schedule Drawer & Amortization
**Journey**: When clicking *"Schedule"* on any loan row, a slide-out drawer displays the loan's financial KPIs (Principal, Total Repaid, Remaining Balance), an amortization progress bar, and an itemized monthly installment timeline with date, installment amount, and status (`Pending`, `Deducted`, `Prepaid`). If the loan is active and the user has `loan.prepay`, a *"Record Prepayment"* CTA button is available at the bottom of the drawer.

**Why this priority**: Gives financial controllers and managers an instant audit trail of when each installment was deducted via monthly payroll or prepaid early.

**Independent Test**:
- Click *"Schedule"* on a closed or partially repaid loan.
- **Verify**: The drawer shows the exact number of months, which installments were deducted vs. prepaid, and the overall settlement percentage.

**Acceptance Scenarios**:
1. **Given** a loan with repayments, **When** opening the schedule drawer, **Then** prepaid installments show early settlement notes, reference numbers, and timestamps.

---

### User Story 5 (P2) - Real-Time Executive KPI Metrics & Aggregates
**Journey**: At the top of the Company Borrowing Ledger, four executive KPI cards summarize organizational exposure in real-time:
1. **Total Capital Disbursed**: Lifetime sum of all active and closed loan principals in PKR.
2. **Recovered Capital**: Total repayments received through payroll deductions and early settlements + historical recovery rate percentage.
3. **Current Outstanding Exposure**: Active principal balances currently being serviced.
4. **Active Accounts**: Count of active employee borrowing accounts currently enrolled in monthly payroll deductions.

**Why this priority**: Provides executive leadership with immediate visibility into liquidity risk and payroll deductions.

**Independent Test**:
- Record a full prepayment on an active loan.
- **Verify**: Recovered Capital increases, Current Outstanding Exposure drops, and Active Accounts decrements dynamically.

**Acceptance Scenarios**:
1. **Given** `/loans/ledger/summary`, **When** loaded, **Then** KPIs display accurate tabular currency formatting (`PKR X,XXX,XXX`) with trend indicators matching `DESIGN.md`.

---

## Edge Cases

1. **Over-Prepayment Boundary**: If a user enters a prepayment amount exceeding the remaining balance, the input validation flags the field immediately and prevents submission with an inline format instruction.
2. **Partial Prepayments**: When a partial prepayment is recorded, the engine offsets future installments from the tail (last month backwards), reducing tenure without breaking intermediate monthly payroll runs.
3. **Concurrent Multi-Tier Approvals**: If an HR applicant requests a loan, the approval chain skips Department Manager and routes directly to Super Admin (`isApplicantHR` guard).
4. **Zero Matching Search Results**: If the search input does not match any loan ID or employee name, `<NoSearchResults />` displays candidate typo suggestions (e.g. searching "Hamza" when "Hamzah" exists) with a 1-click clear button.
5. **Network Drops During Prepayment**: If network drops while settling, cached ledger records remain on-screen and `<OfflineBanner />` alerts the user.

---

## Architecture & Functional Requirements

### Backend Requirements (Node.js & MongoDB)

- **FR-001 (Employee Population)**: `loan.service.js` in `getLoans()` and `getLoanById()` MUST populate `employeeId` with:
  - `name`, `firstName`, `lastName`, `employeeCode`, `email`, `avatar`
  - Nested `departmentId` populated with `name`, `code`
  - Nested `userId` populated with `name`, `email`, `roles`
- **FR-002 (Prepayment Mutation Response)**: `prepayLoan()` controller MUST return HTTP 200 with standard `apiResponse(200, result, 'Prepayment recorded successfully')` and invalidate RTK Query tags `Loan`, `Loans:LIST`, `Loans:SUMMARY`.
- **FR-003 (Audit Trail)**: Prepayment mutations MUST persist immutable audit log entries recording `actorId`, `amount`, `paymentMethod`, `reference`, and before/after balances.

### Frontend Requirements (React 18 & Redux Toolkit)

- **FR-004 (Bug Fix - Prepayment Handler)**: `LoanLedgerPage.jsx` MUST invoke `refetchLoans()` and `refetchSummary()` on modal close, completely eliminating the undefined `refetch()` reference error that triggered false failure toasts.
- **FR-005 (DataTable Migration)**: `LoanLedgerPage.jsx` MUST replace the raw `<table>` with `<DataTable />`, configuring:
  - Columns: Loan ID & Type, Borrower Employee, Principal, Tenure/EMI, Repaid, Balance, Status, Actions.
  - Custom cell renderers with typography and badges compliant with `DESIGN.md`.
  - Seamless loading skeletons (`ScreenSkeleton`) and empty state (`EmptyState`).
- **FR-006 (Borrower Employee Presentation)**: Borrower column MUST render:
  - Avatar initials badge (`w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-200/60`).
  - Primary text: `empName` (`emp.name || emp.user?.name || ...`).
  - Secondary caption: `{employeeCode} • {departmentName}` (rendered cleanly without lone dots).
- **FR-007 (Prepayment Modal Hardening)**: `EarlyPrepaymentModal.jsx` MUST:
  - Support *"Full Settle"* one-click auto-fill button.
  - Use `<FormField />` with inline instructions for amount and reference.
  - Present a reassuring confirmation summary upon completion.
- **FR-008 (Schedule Drawer Polish)**: `LoanScheduleDrawer.jsx` MUST follow the Forest & Emerald dark/light aesthetics, itemize all installments with due month, deduction status, and offer an early prepayment shortcut.
- **FR-009 (PBAC UI Guarding)**: All action buttons MUST be wrapped in `<Can I="loan.prepay" a="Loan">` and `<Can I="loan.approve" a="Loan">` respectively.
- **FR-010 (Real-Time Sync & Refresh)**: Topbar header MUST include `<RefreshButton />` triggering parallel re-fetching of ledger records and summary KPIs.

---

## Measurable Success Criteria

- **SC-001**: 100% of successful prepayment settlements trigger a success toast and close the modal with **zero** `Failed to record prepayment` errors.
- **SC-002**: 100% of rows in the Company Borrowing Ledger display valid employee names, employee codes, and department names (zero occurrences of `"Employee ."`).
- **SC-003**: 100% of tables and drawers in the Loans module adhere to `DESIGN.md` (Forest `#061A14`, Card `#111D17` / `#FFFFFF`, Emerald `#00C471`, hairline borders `#1A3125` / `#EAECF0`).
- **SC-004**: Complete Vite production build (`npm run build --prefix frontend`) passes with exit code 0.

