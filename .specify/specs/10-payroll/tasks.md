# Implementation Tasks: Module M9 — Payroll (+ Pakistan Statutory Compliance)

**Feature Branch**: `feature/10-Payroll`  
**Created**: 2026-10-20  
**Status**: Ready for Execution  
**Module ID**: M9  
**Module Name**: Payroll & Pakistan Statutory Compliance (Phase 1 · Launch Scope P1)  
**Spec Reference**: [`.specify/specs/10-payroll/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/10-payroll/spec.md)  
**Plan Reference**: [`.specify/specs/10-payroll/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/10-payroll/plan.md)  
**Governing Documents**:
- [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 12 (Rows 9.1 to 9.17)
- [`docs/TECH-SPEC.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/TECH-SPEC.md) Sections 3, 4, 5, 6, 8
- [`docs/FRD.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/FRD.md) Section 6 (M9 Payroll) & Section 11 (Permission Matrix)

---

## Task Sequencing & Vertical Slice Organization

Tasks are strictly organized into vertical slices by BUILD-GUIDE ID. For every feature row, execution flows:
1. **Backend (`-BE`)**: Mongoose schema / model $\rightarrow$ Zod validation schema $\rightarrow$ Service business logic $\rightarrow$ Controller $\rightarrow$ Express route with `authenticate`, `checkPermission`, and `validate`.
2. **Frontend (`-FE`)**: RTK Query endpoints $\rightarrow$ React 18 UI components / modal $\rightarrow$ Feature page $\rightarrow$ CASL `Can` / `ProtectedRoute` permission gate $\rightarrow$ Sidebar navigation entry.
3. **Automated Test (`-TEST`)**: Focused Vitest unit test or API integration test validating row acceptance criteria.

---

## Phase 1: Foundational Compensation & Statutory Calculators (P1)

### Slice 9.1: Salary Structure Configuration (BUILD-GUIDE 9.1)
- [x] 9.1-BE Create `SalaryStructure` model (`backend/src/models/salaryStructure.model.js`) storing base salary, house rent, medical, conveyance, and other allowances in integer paisa (`min: 0`), compound indexes `{ employeeId: 1, effectiveFrom: -1 }` and `{ employeeId: 1, status: 1 }`.
- [x] 9.1-BE Implement Zod validation schemas `salaryStructureSchema` in `backend/src/modules/payroll/payroll.validation.js` enforcing integer paisa inputs and non-negative constraints.
- [x] 9.1-BE Implement `createSalaryStructure` and `getSalaryStructures` in `backend/src/modules/payroll/payroll.service.js` with audit log recording in `auditLogs`.
- [x] 9.1-BE Wire controller and routes for `GET /api/v1/salary-structures` and `POST /api/v1/salary-structures` protected by `authenticate`, `checkPermission('payroll.manage', 'all')`, and `validate(salaryStructureSchema)`.
- [x] 9.1-FE Implement RTK Query hooks `useGetSalaryStructuresQuery` and `useCreateSalaryStructureMutation` in `frontend/src/features/payroll/payrollApi.js`.
- [x] 9.1-FE Create `SalaryFormModal.jsx` in `frontend/src/features/payroll/components/` with basic pay, allowances inputs, and live gross preview calculation.
- [x] 9.1-FE Create `SalaryStructuresPage.jsx` in `frontend/src/features/payroll/pages/` displaying employee salary list, status badges, and Assign Structure button.
- [x] 9.1-FE Register `/payroll/salary-structures` route in `frontend/src/App.jsx` wrapped in `<ProtectedRoute requiredPermission="payroll.manage">` and add sidebar navigation item under Payroll.
- [x] 9.1-TEST Write Vitest integration test verifying salary structure creation, total gross computation in integer paisa, and duplicate active status rejection.

---

### Slice 9.2: Salary Increments & Revision History (BUILD-GUIDE 9.2)
- [x] 9.2-BE Implement `reviseSalaryStructure` in `backend/src/modules/payroll/payroll.service.js` that archives previous active structure to `superseded`, inserts new structure with `effectiveFrom`, and records mandatory `revisionReason` in `auditLogs`.
- [x] 9.2-BE Implement `GET /api/v1/salary-structures/employee/:id` and `PUT /api/v1/salary-structures/employee/:id` in `payroll.controller.js` and `payroll.routes.js` protected by `payroll.manage`.
- [x] 9.2-FE Implement `useReviseSalaryStructureMutation` and `useGetEmployeeStructureQuery` in `frontend/src/features/payroll/payrollApi.js`.
- [x] 9.2-FE Create `SalaryRevisionModal.jsx` requiring effective date, new allowance breakdown, and mandatory audit justification text.
- [x] 9.2-FE Add revision history timeline drawer in `SalaryStructuresPage.jsx` showing past salary adjustments, effective dates, increment deltas, and reviewer names.
- [x] 9.2-TEST Write Vitest test asserting that submitting an increment updates the active record, marks old records historical, and stores the audit log reason.

---

### Slice 9.5: Pakistan FBR Progressive Income Tax Calculator (BUILD-GUIDE 9.5)
- [x] 9.5-BE Implement `calculateAnnualIncomeTax` in `backend/src/modules/payroll/taxCalculator.js` that annualizes taxable monthly earnings (`Monthly × 12`), matches progressive slab brackets dynamically from M2 `taxSlabs` setting, and divides by 12 (`Math.round(annualTax / 12)`) in integer paisa.
- [x] 9.5-BE Add helper to format and inspect progressive tax slab breakdowns for UI consumption and payslip attachment.
- [x] 9.5-TEST Write comprehensive Vitest unit test suite `backend/tests/payroll/taxCalculator.test.js` covering FBR salaried slabs:
  - Monthly gross $\le$ PKR 50,000 (PKR 600,000 annual) $\rightarrow$ PKR 0 tax.
  - Monthly gross PKR 100,000 (PKR 1,200,000 annual) $\rightarrow$ 5% on excess of 600k.
  - Monthly gross PKR 250,000, PKR 500,000, and PKR 1,000,000 boundary calculations.
  - Verify zero floating point values are returned (strictly integer paisa).

---

### Slice 9.6: Statutory EOBI, PESSI, PF & Gratuity Calculator (BUILD-GUIDE 9.6)
- [x] 9.6-BE Implement `calculateStatutoryContributions` in `backend/src/modules/payroll/contributionsCalculator.js` loading M2 settings `eobi`, `pessi`, and `providentFund`:
  - EOBI: 1% employee (`37,000 paisa`) + 5% employer (`185,000 paisa`) based on statutory minimum wage PKR 37,000.
  - PESSI: 6% employer contribution up to wage ceiling when enabled.
  - Provident Fund: Equal employee and employer percentage deductions on basic pay when enabled.
- [x] 9.6-BE Implement service gratuity formula `(lastDrawnBasicPaisa / 30) * 30 * completedServiceYears` for final exit settlements.
- [x] 9.6-TEST Write Vitest unit test suite `backend/tests/payroll/contributions.test.js` validating EOBI statutory rates, PESSI ceiling conditions, and Provident Fund deductions.

---

## Phase 2: Core Batch Payroll Engine & 4-Stage Release Lifecycle (P1)

### Slice 9.3: Earnings Sub-Ledger Integration (BUILD-GUIDE 9.3)
- [x] 9.3-BE Extend `payroll.service.js` to compute itemized earnings subdocuments for each employee:
  - Basic pay, House Rent, Medical, Conveyance, Other Allowances from active `SalaryStructure`.
  - Overtime pay computed from M5 Attendance approved overtime hours `(basicSalary / 30 / 8) * 1.5 * overtimeHours`.
  - Approved leave encashment earnings imported from M6 `LeaveEncashment` records.
  - Bonuses, commissions, and manual arrears items.
- [x] 9.3-FE Add Earnings breakdown table in `frontend/src/features/payroll/components/PayslipPreviewModal.jsx` displaying itemized categories and amounts in PKR.
- [x] 9.3-TEST Write integration test verifying that approved overtime hours from M5 Attendance and leave encashments from M6 are accurately calculated and appended to earnings.

---

### Slice 9.4: Deductions Sub-Ledger Integration (BUILD-GUIDE 9.4)
- [x] 9.4-BE Extend `payroll.service.js` to compute itemized deductions subdocuments for each employee:
  - FBR Income Tax withholding from `taxCalculator.js`.
  - EOBI and PESSI employee deductions from `contributionsCalculator.js`.
  - Unpaid absence deductions computed from M6 unpaid leaves: `(grossSalary / 30) * unpaidLeaveDays`.
  - Late arrival penalties aggregated from M5 Attendance penalty rules.
  - Active monthly loan installments linked from M10 Loans.
- [x] 9.4-FE Add Deductions breakdown table in `PayslipPreviewModal.jsx` displaying itemized categories and amounts in PKR.
- [x] 9.4-TEST Write integration test asserting that unpaid leaves and late penalties correctly deduct from gross salary and do not produce negative net pay.

---

### Slice 9.7: Asynchronous BullMQ Batch Payroll Generator (BUILD-GUIDE 9.7)
- [x] 9.7-BE Configure BullMQ Queue `payroll-queue` and worker `payrollProcessor.js` in `backend/src/modules/payroll/payroll.queue.js`.
- [x] 9.7-BE Implement `POST /api/v1/payroll/runs/generate` with precondition check: verify that M5 `MonthLock` is locked for target month/year; return `422 Unprocessable Entity` if unlocked.
- [x] 9.7-BE Implement chunked batch worker processing active employees, calculating payslips, saving records to `payslips`, updating `payrollruns` aggregates, and emitting live Socket.io events `payroll:progress` `{ completed, total, percentage }`.
- [x] 9.7-FE Implement `useGeneratePayrollRunMutation` in `frontend/src/features/payroll/payrollApi.js`.
- [x] 9.7-FE Create `PayrollProgressBar.jsx` listening to `payroll:progress` socket event with live percentage bar, counters, and status spinner.
- [x] 9.7-FE Create `PayrollRunsPage.jsx` displaying monthly runs list, status badges (`draft`, `review`, `approved`, `paid`), and Generate Payroll modal.
- [x] 9.7-FE Register `/payroll/runs` route in `frontend/src/App.jsx` protected by `payroll.view`.
- [x] 9.7-TEST Write Vitest test verifying that generating payroll on an unlocked month fails with 422, and succeeds when locked, dispatching the BullMQ job.

---

### Slice 9.8: 4-Stage Governed Release Lifecycle (BUILD-GUIDE 9.8)
- [x] 9.8-BE Implement state transition state machine in `payroll.service.js` enforcing `draft` $\rightarrow$ `review` $\rightarrow$ `approved` $\rightarrow$ `paid`:
  - `PATCH /api/v1/payroll/runs/:id/approve` transitions to `approved`, locks slip edits, and requires `payroll.approve` authority (Super Admin only).
  - `PATCH /api/v1/payroll/runs/:id/mark-paid` transitions to `paid`, records `paidAt` and `paidBy`, and triggers slip delivery.
- [x] 9.8-BE Ensure HR Manager role is strictly blocked (HTTP 403) from calling `/approve` or `/mark-paid`.
- [x] 9.8-FE Implement `useApprovePayrollRunMutation` and `useMarkPayrollPaidMutation` in `payrollApi.js`.
- [x] 9.8-FE Create `PayrollRunDetailPage.jsx` displaying 4-stage stepper header, aggregate financial totals (Gross, Deductions, Net, Tax, EOBI), payslips data table, and conditional action buttons.
- [x] 9.8-FE Wrap "Approve & Release" and "Mark Paid" buttons in `<Can action="payroll.approve" subject="Payroll">` so only Super Admin can trigger release.
- [x] 9.8-FE Register `/payroll/runs/:id` route in `frontend/src/App.jsx`.
- [x] 9.8-TEST Write Vitest test verifying HR Manager gets 403 on approve endpoint while Super Admin successfully transitions run to `approved` and `paid`.

---

### Slice 9.9: Draft Line-Item Adjustments & Single-Slip Recalculation (BUILD-GUIDE 9.9)
- [x] 9.9-BE Implement `adjustPayslipLineItem` in `payroll.service.js` wrapped in MongoDB `session.withTransaction()`:
  - Allows adding/updating earnings (bonus, arrears) or deductions (advance, penalty) only when parent `PayrollRun` is in `draft` or `review` status.
  - Automatically recalculates taxable gross, tax withholding, net pay, and updates parent `PayrollRun` totals atomically.
  - Rejects modifications if run status is `approved` or `paid` (`409 Conflict`).
- [x] 9.9-BE Expose `PATCH /api/v1/payroll/runs/:id/payslips/:slipId` in `payroll.routes.js` protected by `payroll.run`.
- [x] 9.9-FE Implement `useAdjustPayslipMutation` in `payrollApi.js`.
- [x] 9.9-FE Create `PayslipAdjustmentDrawer.jsx` allowing HR to select earning/deduction category, input amount in PKR, enter justification, and view updated net pay instantly.
- [x] 9.9-TEST Write integration test asserting that adding a PKR 25,000 bonus recalculates gross pay, tax withholding, net pay, and parent run totals within a transaction.

---

## Phase 3: Disbursement, Distribution & Self-Service (P1)

### Slice 9.10: Branded Payslip PDF Generation Engine (BUILD-GUIDE 9.10)
- [ ] 9.10-BE Implement `generatePayslipPdf` in `backend/src/modules/payroll/payslipPdf.service.js` using PDFKit / pdfmake:
  - Includes company logo, header details, employee designation, department, masked CNIC, masked bank IBAN, attendance summary (present, late, OT), itemized earnings and deductions tables, and net pay in PKR words.
- [ ] 9.10-BE Implement `GET /api/v1/payslips/:id/pdf` returning streaming PDF with `Content-Type: application/pdf` and `Content-Disposition: inline`.
- [ ] 9.10-FE Create `PayslipPreviewModal.jsx` supporting in-browser PDF preview iframe and download button.
- [ ] 9.10-TEST Write Vitest test verifying `generatePayslipPdf` produces a valid non-empty PDF buffer containing employee details and financial breakdowns.

---

### Slice 9.11: Multi-Channel Payslip Delivery (BUILD-GUIDE 9.11)
- [ ] 9.11-BE Implement automated delivery trigger upon transitioning run to `paid`:
  - Dispatches M8 email notification with attached PDF payslip to each employee's registered email address.
  - Emits M8 in-app bell notification and Socket.io event `payroll:payslip_ready`.
- [ ] 9.11-BE Implement `GET /api/v1/payslips/my` returning paginated list of paid payslips for authenticated user (`payroll.view`, scope `own`).
- [ ] 9.11-FE Implement `useGetMyPayslipsQuery` and `useDownloadPayslipPdfQuery` in `payrollApi.js`.
- [ ] 9.11-FE Create `MyPayslipsPage.jsx` for employees showing yearly breakdown, net pay badges, view breakdown button, and one-click PDF download.
- [ ] 9.11-FE Register `/payroll/my-payslips` route in `frontend/src/App.jsx` accessible to all authenticated employees.
- [ ] 9.11-TEST Write Vitest test asserting that an employee can query `/payslips/my` and access their own slip, but receives 403 when requesting another employee's slip.

---

### Slice 9.12: Corporate Bank Transfer Advice Sheet (BUILD-GUIDE 9.12)
- [ ] 9.12-BE Implement `generateBankAdviceSheet` in `backend/src/modules/payroll/bankSheet.service.js` using ExcelJS streaming workbook:
  - Supports Meezan Bank format: `[Sr No, Beneficiary Account/IBAN, Beneficiary Name, Amount, Transaction Reference, Remarks]`.
  - Supports HBL corporate format and Standard CSV/XLSX formats.
  - Computes total transfer batch hash and total amount verification row.
- [ ] 9.12-BE Expose `GET /api/v1/payroll/runs/:id/bank-advice?bank=meezan` protected by `payroll.export`.
- [ ] 9.12-FE Create `BankAdviceExportModal.jsx` allowing HR to select bank format (Meezan, HBL, Standard) and trigger streaming `.xlsx` file download.
- [ ] 9.12-FE Add "Export Bank Advice" dropdown button to `PayrollRunDetailPage.jsx`.
- [ ] 9.12-TEST Write Vitest test verifying the generated ExcelJS workbook has correct column headers and matching net pay sums.

---

## Phase 4: Exit Settlement, Statutory Certificates & Governance (P2)

### Slice 9.13: Employee Final Exit Settlement (BUILD-GUIDE 9.13)
- [ ] 9.13-BE Implement `processFinalSettlement` in `payroll.service.js`:
  - Computes payable days in exit month, liquidates unutilized annual leaves from M6 `LeaveBalance`, calculates statutory service gratuity, deducts remaining loan balance from M10, and generates final clearance slip.
- [ ] 9.13-BE Expose `POST /api/v1/payroll/final-settlement/:id` protected by `payroll.manage`.
- [ ] 9.13-FE Implement `useProcessFinalSettlementMutation` in `payrollApi.js`.
- [ ] 9.13-FE Create `SettlementGratuityModal.jsx` displaying service duration, gratuity formula, leave encashment balance, and net exit payout.
- [ ] 9.13-FE Create `FinalSettlementPage.jsx` for HR to search offboarding employees and finalize full & final settlement.
- [ ] 9.13-FE Register `/payroll/settlement` route in `frontend/src/App.jsx`.
- [ ] 9.13-TEST Write integration test asserting final settlement correctly calculates gratuity, liquidates leaves, and clears loan obligations.

---

### Slice 9.14: Form IT-3 Annual Tax Withholding Certificate (BUILD-GUIDE 9.14)
- [ ] 9.14-BE Implement `generateAnnualTaxCertificate` in `payslipPdf.service.js`:
  - Aggregates all paid payslips for an employee across a fiscal year (July 1 to June 30).
  - Calculates total gross salary, total taxable salary, total income tax withheld, and company NTN details as required by FBR Form IT-3.
- [ ] 9.14-BE Expose `GET /api/v1/payslips/annual-tax-certificate?employeeId=&taxYear=` protected by `payroll.view` (`own` or `all`).
- [ ] 9.14-FE Add "Download Tax Certificate" button in `MyPayslipsPage.jsx` and employee profile with tax year selector.
- [ ] 9.14-TEST Write Vitest test asserting annual tax certificate accurately sums all monthly withholding taxes for the selected tax year.

---

### Slice 9.15: Statutory Withholding & EOBI Compliance Audit Reports (BUILD-GUIDE 9.15)
- [ ] 9.15-BE Implement `getTaxComplianceReport` and `getEobiComplianceReport` in `payroll.service.js` aggregating monthly employee withholdings, employer EOBI contributions, and deposit challan details.
- [ ] 9.15-BE Expose `GET /api/v1/reports/tax-compliance` and `GET /api/v1/reports/eobi-compliance` protected by `payroll.export`.
- [ ] 9.15-FE Add Statutory Compliance tab to Reports section with tax year filter, monthly breakdown table, and Excel export button.
- [ ] 9.15-TEST Write integration test asserting report sums match the sum of individual payslip deductions for the selected period.

---

### Slice 9.16: Department Manager Team Overtime Guard (BUILD-GUIDE 9.16)
- [ ] 9.16-BE Implement `getTeamOvertimeHours` in `payroll.service.js` returning employee names, designations, and overtime hours worked for the manager's team; strictly exclude basic pay, gross pay, and net pay fields from projection.
- [ ] 9.16-BE Expose `GET /api/v1/payroll/team-overtime` protected by `attendance.view` with scope `team`.
- [ ] 9.16-FE Add "Team Overtime Hours" widget/page for Department Managers displaying member hours without any monetary salary values.
- [ ] 9.16-TEST Write security test asserting that a Department Manager calling `/api/v1/payroll/team-overtime` receives team hours, but calling `/api/v1/payroll/runs` or salary endpoints returns 403 Forbidden.

---

### Slice 9.17: Departmental Payroll Cost Analytics (BUILD-GUIDE 9.17)
- [ ] 9.17-BE Implement `getDepartmentPayrollCostAnalytics` in `payroll.service.js` using MongoDB aggregation pipeline grouping total gross, net, overtime, and statutory contributions by department.
- [ ] 9.17-BE Expose `GET /api/v1/reports/payroll-cost` protected by `payroll.view` with scope `all`.
- [ ] 9.17-FE Add Departmental Payroll Cost chart and breakdown table to Admin Dashboard and Reports view.
- [ ] 9.17-TEST Write Vitest test verifying aggregation pipeline returns accurate departmental cost totals matching the underlying payroll run.

---

## Phase 5: Multi-Role End-to-End Automated Verification

### Slice 9.E2E: Full Multi-Role Playwright Test Suite
- [ ] 9.E2E-TEST Execute end-to-end Playwright test suite in real Chrome browser across all four core roles verifying:
  1. **Super Admin**: Views structures, triggers BullMQ run, audits slips, executes executive approval (`payroll.approve`), marks run paid, downloads bank advice sheet.
  2. **HR Manager**: Configures salary structures, increments salary with audit reason, reviews draft run, adds line-item bonus adjustment in drawer, exports bank sheet; asserts that clicking "Approve" is forbidden (403).
  3. **Department Manager**: Inspects team overtime hours; verifies that salary figures, payslip runs, and salary structures are completely hidden and APIs return 403 Forbidden.
  4. **Employee**: Logs into self-service portal, views own monthly payslip, inspects tax breakdown card, downloads branded PDF payslip, downloads Form IT-3 annual tax certificate; verifies other employees' slips return 403.
  5. Verify responsive layout on mobile viewport (390px) for `MyPayslipsPage.jsx` and `PayrollRunsPage.jsx`.
