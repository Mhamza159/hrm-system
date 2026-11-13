# Tasks: Payroll Module UI Craft & Lifecycle Management (My Payslips, Form IT-3, Payroll Runs, Archive Bucket & Detail View)

**Input**: Feature Specification ([`spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/33-payroll-ui-craft-and-lifecycle-management/spec.md)) and Implementation Plan ([`plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/33-payroll-ui-craft-and-lifecycle-management/plan.md))  
**Feature Branch**: `feature/33-payroll-ui-craft-and-lifecycle-management`  
**Organization**: Tasks are structured by prioritized user stories (P1 & P2) to allow independent implementation, automated verification, and incremental progress tracking.

---

## Task Summary Table

| Phase | Story / Topic | Priority | Task Range | Estimated Work |
|---|---|---|---|---|
| **Phase 1** | Schema Foundations & Model Refinements | Pre-req | `T001` - `T003` | Schema updates in `payrollRun.model.js` & `payslip.model.js` (indexes & paymentMethod enum) |
| **Phase 2** | US5: Deep Data Population & Cash Defaults | P1 (MVP) | `T004` - `T007` | Fix `getMyPayslips` & `getPayrollRunById` to populate full employee metadata & default Cash |
| **Phase 3** | US2: Form IT-3 Certificate & Payslip PDF Perfection | P1 (MVP) | `T008` - `T011` | Refine PDFKit layout, Section 149/164 statutory wording, currency words & Cash mode in `payslipPdf.service.js` |
| **Phase 4** | US1: My Payslips Page & Salary Slip Preview Modal | P1 (MVP) | `T012` - `T016` | Header alignment, `PayslipPreviewModal.jsx` database fields & Cash mode, precision bottom table |
| **Phase 5** | US3: Payroll Runs Dashboard & Archive Lifecycle | P1 (MVP) | `T017` - `T023` | Soft-archive service, Revert/Permanent Delete endpoints, RTK Query, Active vs Archive tabs & `ConfirmDialog` |
| **Phase 6** | US4: Payroll Run Detail View (`/payroll/runs/:id`) Craft | P2 | `T024` - `T027` | 4-stage stepper, 6 KPI widgets, aligned employee payslips table with avatar initials |
| **Phase 7** | Automated Testing & Production Build | Verification | `T028` - `T030` | Vitest integration test suite, frontend production build, regression verification |

---

## Phase 1: Schema Foundations & Model Refinements

**Purpose**: Ensure Mongoose schemas in `payrollRun.model.js` and `payslip.model.js` enforce consistent archival fields, indexes, and default payment method.

- [x] T001 Verify active git branch is `feature/33-payroll-ui-craft-and-lifecycle-management` (or checkout from `main`).
- [x] T002 Update `backend/src/models/payslip.model.js` to ensure `paymentMethod` enum exists with default `'cash'`:
  ```javascript
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'cheque'],
    default: 'cash'
  }
  ```
  Ensure compound indexes `{ payrollRunId: 1, employeeId: 1 }` and `{ isDeleted: 1, employeeId: 1, year: 1, month: 1 }` exist.
- [x] T003 Update `backend/src/models/payrollRun.model.js` to ensure compound index `{ isDeleted: 1, year: 1, month: 1 }` and default `paymentMethod: 'cash'`.

**Checkpoint**: Models support soft-deletion tracking and default to Cash disbursement mode.

---

## Phase 2: User Story 5 — Deep Data Population & Cash Defaults (Priority: P1) 🎯 MVP

**Goal**: Fix the root-cause bug where payslip endpoints return sparse unpopulated `employeeId` ObjectIds, resulting in fallback strings like "Employee", "N/A", "Staff", "General", and "••••5678".

**Independent Test**: Calling `GET /api/v1/payslips/my` returns an enveloped array where each payslip's `employeeId` is an expanded object containing `name`, `employeeCode`, `designationId.title`, `departmentId.name`, `bankDetails`, and `cnic`.

- [x] T004 [US5] Update `getMyPayslips` in `backend/src/modules/payroll/payroll.service.js`:
  - Deeply populate `employeeId`:
    ```javascript
    populate: [
      { path: 'payrollRunId', select: 'status payDate paymentMethod' },
      {
        path: 'employeeId',
        select: 'name firstName lastName employeeCode employeeId email departmentId designationId bankDetails cnic',
        populate: [
          { path: 'departmentId', select: 'name' },
          { path: 'designationId', select: 'title' }
        ]
      }
    ]
    ```
- [x] T005 [US5] Update `getPayrollRunById` in `backend/src/modules/payroll/payroll.service.js`:
  - Ensure payslip `employeeId` population includes `bankDetails` and `cnic` alongside `name`, `employeeCode`, `departmentId`, and `designationId`.
- [x] T006 [US5] Update `getPayslipById` in `backend/src/modules/payroll/payroll.service.js`:
  - Ensure single payslip retrieval deeply populates `employeeId` (`departmentId`, `designationId`, `bankDetails`, `cnic`).
- [x] T007 [US5] Ensure payment method defaults to `'cash'` when undefined across payslips generation and query responses.

**Checkpoint**: Backend queries return complete, rich employee profiles with zero missing fields.

---

## Phase 3: User Story 2 — Form IT-3 Certificate & Payslip PDF Perfection (Priority: P1) 🎯 MVP

**Goal**: Form IT-3 downloadable PDF has perfect margin alignment, accurate statutory wording under Section 149/164 of the Income Tax Ordinance 2001, and precise Pakistani Rupee wording without text clipping or layout overlap.

**Independent Test**: Download Form IT-3 from `/api/v1/payslips/annual-tax-certificate?taxYear=2026`. Verify headers, employer/employee metadata boxes, monthly table, and Section 149 declaration are cleanly separated with 40pt padding and 0 overlap.

- [x] T008 [US2] Update `generateAnnualTaxCertificate` in `backend/src/modules/payroll/payslipPdf.service.js`:
  - Header: Federal Board of Revenue banner with exact legal citation: *"FORM IT-3 · CERTIFICATE OF COLLECTION OR DEDUCTION OF INCOME TAX Under Section 149 read with Section 164 of the Income Tax Ordinance, 2001"*.
  - Metadata Grid: Left box with company/withholding agent credentials (NTN, address, RTO jurisdiction); right box with taxpayer/employee credentials (`Name`, `CNIC`, `Designation`, `Employee Code`).
  - Table: Precise column x-coordinates and right-aligned widths:
    - `Month / Period`: x=50, width=90, left-aligned
    - `Gross Salary (PKR)`: x=150, width=95, right-aligned
    - `Medical Exemption`: x=255, width=95, right-aligned
    - `Taxable Salary (PKR)`: x=360, width=95, right-aligned
    - `Tax Withheld (PKR)`: x=460, width=90, right-aligned
  - Summary row: Amber-tinted `ANNUAL TOTALS` with right-aligned totals matching column headers.
  - Total Tax Deducted in Words: Verified `numberToWords` output formatted in bold oblique.
  - Statutory Declaration: Sized and wrapped without encroaching on CFO signature block.
- [x] T009 [US2] Update `generatePayslipPdf` in `backend/src/modules/payroll/payslipPdf.service.js`:
  - Respect payment method: If `payslip.paymentMethod === 'cash'`, display *"Payment Mode: Cash in Hand"* and hide bank account/IBAN rows.
  - Populate employee name, designation, department, and CNIC from real database fields.
- [x] T010 [US2] Verify `getAnnualTaxCertificatePdf` in `payroll.service.js` handles zero-payslip tax years gracefully without throwing unhandled exceptions.
- [x] T011 [US2] Test PDFKit stream generation with test fixtures to confirm zero PDF corruption.

**Checkpoint**: PDFs generate with immaculate typography, accurate legal wording, and clean spacing.

---

## Phase 4: User Story 1 — My Payslips Page & Salary Slip Preview Modal (Priority: P1) 🎯 MVP

**Goal**: Redesign `/payroll/my-payslips` with perfect button alignment, precision data table, and overhaul `PayslipPreviewModal.jsx` to render database employee fields and handle Cash defaults.

**Independent Test**: Load `/payroll/my-payslips`. Verify header controls align horizontally. Click "View" on any payslip: confirm modal displays real employee name, employee code, designation, department, and "Cash in Hand" mode. Click "PDF": confirm direct file download.

- [x] T012 [US1] Overhaul `frontend/src/features/payroll/components/PayslipPreviewModal.jsx`:
  - Extract employee details directly from `payslip.employeeId`:
    - Name: `emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee'`
    - Employee ID: `emp.employeeCode || emp.employeeId || 'EMP'`
    - Designation: `emp.designationId?.title || emp.designation?.title || 'Staff'`
    - Department: `emp.departmentId?.name || emp.department?.name || 'General'`
    - CNIC: `emp.cnic || '—'`
  - Payment Mode Logic:
    - Default to `'Cash'` when `payslip.paymentMethod` is missing or `'cash'`.
    - If Cash: Set Payment Mode to *"Cash in Hand"*, Bank Name to *"Cash Disbursement"*, and hide fake `••••5678` account numbers.
    - If Bank Transfer: Display `emp.bankDetails?.bankName` and masked account/IBAN.
  - Refine Earnings & Deductions ledgers with hairline borders and tabular numbers.
  - Ensure `onDownloadPdf(payslip._id)` is fully wired with loading state and toast feedback.
- [x] T013 [US1] Redesign Header & Actions Bar in `frontend/src/features/payroll/pages/MyPayslipsPage.jsx`:
  - Align header greeting and right-side controls on a clean horizontal flex axis:
    - `RefreshButton`
    - Tax Year select dropdown (`h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold`)
    - Form IT-3 Certificate button (`h-9 px-4 inline-flex items-center gap-2 bg-[#00C471] hover:bg-[#049856] text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/20 active:scale-[0.98] cursor-pointer`)
- [x] T014 [US1] Update Aggregate Metric Cards in `MyPayslipsPage.jsx`:
  - 3 cards (`Total Net Take-Home`, `Average Monthly Salary`, `Total FBR Tax Contributed`).
  - Values formatted in `font-mono tabular-nums text-2xl font-bold`.
- [x] T015 [US1] Redesign Bottom Table in `MyPayslipsPage.jsx`:
  - 1px hairline border container (`border border-slate-200/80 dark:border-[#1A3125] rounded-2xl bg-white dark:bg-[#111D17] shadow-xs overflow-hidden`).
  - Column headers: `bg-slate-50/75 dark:bg-[#0E1A14] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-3.5 px-6 border-b border-slate-200/80 dark:border-[#1A3125]`.
  - Cells:
    - Payroll Month: Month prefix badge (`01`, `11`), month name & year, payment mode tag (`Cash` / `Bank Transfer`).
    - Financial values: Right-aligned `font-mono tabular-nums text-xs font-semibold`.
    - Status badge: Semantic pill (`bg-emerald-50 text-emerald-700` with emerald dot).
    - Actions: `View` button (`Eye` icon in slate) and `PDF` button (`Download` icon in emerald tint).
- [x] T016 [US1] Verify empty states when zero payslips exist for the user.

**Checkpoint**: My Payslips page and Salary Slip preview modal operate with zero placeholder text and perfect alignment.

---

## Phase 5: User Story 3 — Payroll Runs Dashboard & Soft-Archival Lifecycle (Priority: P1) 🎯 MVP

**Goal**: Implement Active Runs vs Archive Bucket tab switcher, soft-delete archival, Revert, and Permanent Delete with styled `ConfirmDialog.jsx` modals.

**Independent Test**: Load `/payroll/runs`. Observe `Active Runs (N)` and `Archive Bucket (M)` tabs. Click "Delete" on an active run: confirm dialog opens and moves the run to Archive. Switch to Archive tab: click "Revert" to restore, or "Permanent Delete" to purge.

- [x] T017 [US3] Update `getPayrollRuns` in `backend/src/modules/payroll/payroll.service.js`:
  - Support query parameter `archived`:
    - When `query.archived === 'true'`: query `{ isDeleted: true }`.
    - When `query.archived === 'false'` or omitted: query `{ isDeleted: { $ne: true } }`.
  - Include overall counts of active vs archived runs in response meta or separate count query.
- [x] T018 [US3] Update `deletePayrollRun` in `backend/src/modules/payroll/payroll.service.js`:
  - Update to soft-archive:
    ```javascript
    run.isDeleted = true;
    run.deletedAt = new Date();
    run.deletedBy = actor?._id;
    await run.save();
    await Payslip.updateMany({ payrollRunId: run._id }, { isDeleted: true, deletedAt: new Date() });
    ```
  - Record audit log: `action: 'PAYROLL_RUN_ARCHIVE'`.
  - Return HTTP 200 with message `"Payroll run moved to Archive successfully"`.
- [x] T019 [US3] Implement `restorePayrollRun(id, actor)` in `backend/src/modules/payroll/payroll.service.js`:
  - Find run by ID: verify `run.isDeleted === true`. Throw 404 if missing, 400 if already active.
  - Check active conflict: verify no active run exists with `{ month: run.month, year: run.year, isDeleted: false, _id: { $ne: id } }`. If conflict exists, throw `ApiError(409, "Cannot restore: An active payroll run for ${run.month}/${run.year} already exists.")`.
  - Revert fields: `run.isDeleted = false; run.deletedAt = null; run.deletedBy = null; await run.save();`
  - Restore child payslips: `await Payslip.updateMany({ payrollRunId: run._id }, { isDeleted: false, deletedAt: null });`
  - Record audit log: `action: 'PAYROLL_RUN_RESTORE'`.
  - Return restored `run`.
- [x] T020 [US3] Implement `permanentDeletePayrollRun(id, actor)` in `backend/src/modules/payroll/payroll.service.js`:
  - Find run by ID: verify `run.isDeleted === true`.
  - Enforce Super Admin authorization.
  - Revert any active loan/expense settlements linked to this run.
  - Hard delete: `await Payslip.deleteMany({ payrollRunId: run._id }); await run.deleteOne();`
  - Record audit log: `action: 'PAYROLL_RUN_PERMANENT_DELETE'`.
  - Return `{ message: 'Payroll run permanently deleted' }`.
- [x] T021 [US3] Register Routes & Controllers:
  - Add `restorePayrollRun` and `permanentDeletePayrollRun` handlers in `payroll.controller.js`.
  - Register `POST /runs/:id/restore` and `DELETE /runs/:id/permanent` in `payroll.routes.js` protected by `checkPermission('payroll.manage', 'all')`.
- [x] T022 [US3] Add RTK Query Mutations in `frontend/src/features/payroll/payrollApi.js`:
  - `restorePayrollRun`: `POST /payroll/runs/${id}/restore`, invalidates tags `['Payroll']`.
  - `permanentDeletePayrollRun`: `DELETE /payroll/runs/${id}/permanent`, invalidates tags `['Payroll']`.
- [x] T023 [US3] Redesign `frontend/src/features/payroll/pages/PayrollRunsPage.jsx`:
  - Top View Switcher Tabs: `Active Runs (count)` & `Archive Bucket (count)`.
  - Filter Bar: Year select + Status select + Single search input + Emerald `Generate Payroll Run` CTA.
  - Table Columns: `Payroll Period`, `Stage / Status`, `Headcount`, `Gross Pay`, `Tax Withheld`, `Net Disbursement`, `Actions`.
  - Active Actions: `Details` (`Eye` in emerald) and `Archive` (`Trash2` in soft rose).
  - Archive Actions: `Revert` (`RotateCcw` in emerald) and `Permanent Delete` (`Trash2` in rose).
  - 3 discrete `ConfirmDialog.jsx` instances (Archive, Revert, Permanent Delete) with loading states.
  - Replace all legacy `window.confirm` calls.

**Checkpoint**: Payroll runs dashboard features clean tabs, soft-archival, and safe recovery.

---

## Phase 6: User Story 4 — Payroll Run Detail View (`/payroll/runs/:id`) Craft (Priority: P2)

**Goal**: Complete visual overhaul of `PayrollRunDetailPage.jsx` featuring an aligned header, 4-stage stepper, 6 metric widgets, and an itemized payslip table with avatar initials.

**Independent Test**: Navigate to `/payroll/runs/:id`. Verify header button alignment, 4-stage visual stepper with completed checks, 6 KPI cards with tabular figures, and employee initials avatar in the table. Click "View Slip" to open the updated preview modal.

- [x] T024 [US4] Redesign Header & Actions in `frontend/src/features/payroll/pages/PayrollRunDetailPage.jsx`:
  - Left: Back arrow, month/year title, status badge, run ID, created date.
  - Right: Aligned action buttons (`RefreshButton`, `Export Bank Advice`, `Approve`, `Mark Paid`, `Delete Run`).
- [x] T025 [US4] Redesign 4-Stage Stepper:
  - Linear/Elvara craft with 1px hairline borders:
    `1. DRAFT Initial Generation` $\rightarrow$ `2. REVIEW Audit & Adjustments` $\rightarrow$ `3. APPROVED Locked by Super Admin` $\rightarrow$ `4. DISBURSED (PAID) Direct Disbursement`.
  - Completed stages display solid emerald badge with `CheckCircle2` (`bg-emerald-500 text-white`).
- [x] T026 [US4] Redesign 6 KPI Metric Widgets:
  - `Headcount`, `Gross Pay`, `FBR Tax Withheld`, `EOBI`, `Overtime Pay`, `Net Payable`.
  - Tabular monospace numbers (`font-mono tabular-nums`).
- [x] T027 [US4] Redesign Employee Payslips Table:
  - Table toolbar with single search input (`w-80`) and counter pill (`Showing X of Y employees`).
  - Table rows:
    - Employee column: Avatar with capitalized initials (`MH`, `BH`), employee name in bold, employee code and department subtitle.
    - Financial columns: Gross Pay, Overtime, Deductions, Tax, Net Salary in `font-mono tabular-nums text-xs`.
    - Actions: `Adjust` button (when run is editable) and `View Slip` button (opens `PayslipPreviewModal`).

**Checkpoint**: Payroll run detail view provides enterprise financial density and high craft.

---

## Phase 7: Automated Testing & Production Build

**Purpose**: Verify all lifecycle transitions, PDF generators, and build output.

- [x] T028 Create `backend/tests/payroll.archive-lifecycle.test.js`:
  - Test 1: Soft-archive moves run to `isDeleted: true` and marks child payslips `isDeleted: true`.
  - Test 2: Employees can only view unarchived payslips in self-service.
  - Test 3: Revert restores `isDeleted: false` for run and child payslips.
  - Test 4: Revert rejects duplicate active month/year run with HTTP 409 Conflict.
  - Test 5: Permanent delete purges run and child payslips from MongoDB.
  - Test 6: Deep employee population returns non-null name, code, designation, and department.
- [x] T029 Run backend test suite via Vitest:
  ```bash
  npm --prefix backend test tests/payroll.archive-lifecycle.test.js
  ```
  Ensure all 6 tests pass.
- [x] T030 Run frontend production build:
  ```bash
  npm --prefix frontend run build
  ```
  Ensure 0 lint, syntax, or chunk compilation errors.

---

## Next Action
To implement this task list sequentially, run **/speckit-implement** (or `ralph run` in terminal).
