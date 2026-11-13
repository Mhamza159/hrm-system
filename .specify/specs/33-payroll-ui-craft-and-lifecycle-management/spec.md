# Feature Specification: Payroll Module UI Craft & Lifecycle Management (My Payslips, Form IT-3, Payroll Runs, Archive Bucket & Detail View)

**Feature Branch**: `feature/33-payroll-ui-craft-and-lifecycle-management`  
**Created**: 2026-11-13  
**Status**: Draft  
**Input**: User description:
> "Read the Design.md, UI-reference file, and the Docs folder. Design and structure everything strictly according to them. Nothing should look AI-generated or have any AI slop.
> 
> Payroll Module:
> - My Payslip Page: Completely update and modify the UI design with perfect button alignment and precise color schemes.
> - Form IT-Certificate: Ensure the UI is flawless, and the generated downloadable PDF has perfect alignment and immaculate data inside—there should be no alignment or wording issues.
> - Table at the bottom: Ensure all details and alignments of the table are completely perfect.
> - Salary Slip View: When clicking 'View' on a salary slip, the UI must be pristine. All employee details and required fields must pull directly from the database without missing anything, and the default payment method should be set to Cash. The PDF download feature must be in 100% working order.
> 
> Payroll Run / Payroll Overview:
> - Redesign the UI completely: Button colors and alignments must be spot-on, and the data table must be professionally designed.
> - Archive Tab: When deleting records, they should undergo soft deletion and move into an Archive tab equipped with Revert and Permanent Delete options. The archive tab's confirmation modal UI must be polished and professional.
> - Detail View: When clicking into a record from the data table to view details, that page's UI must be impeccably designed.
> 
> Everything necessary must be fully functional, pulling real data directly from the database."

---

## 1. User Scenarios & Testing *(mandatory)*

### User Story 1 — My Payslips Page & Salary Slip Preview Overhaul (Priority: P1) 🎯 MVP

As an employee visiting `/payroll/my-payslips`, I want a clean, responsive salary advice portal where I can view my aggregate take-home pay, inspect itemized monthly salary slips with full employee details from the database (defaulting to Cash disbursement), and download individual salary PDFs with 100% working accuracy.

**Why this priority**: Self-service payslips are the primary financial trust touchpoint for all employees. Eliminating placeholder text ("Employee", "N/A", "General", "••••5678") and fixing alignment directly impacts professional credibility.

**Independent Test**: Log in as an employee, navigate to `/payroll/my-payslips`. Verify that aggregate cards, Form IT-3 controls, and the payslips table render with hairline borders and tabular alignment. Click "View" on any payslip: verify that Employee Name, Employee Code, Designation, Department, and Payment Mode (Cash by default) load from the database without fallback placeholders. Click "Download PDF" and verify the generated PDF matches the real employee data.

**Acceptance Scenarios**:
1. **Given** an employee with approved/paid payslips, **When** they open `/payroll/my-payslips`, **Then** the page header, year selector, Form IT-3 download button, and financial aggregate cards are aligned horizontally with precise Forest & Emerald tokens (`DESIGN.md`).
2. **Given** a payslip in the table, **When** the employee clicks "View", **Then** `PayslipPreviewModal` opens displaying full populated employee metadata (`name`, `employeeCode`, `designation`, `department`, `paymentMethod: 'Cash'`, `cnic`), without placeholder fallbacks.
3. **Given** a payslip with payment method "Cash", **When** viewed in the preview modal or table, **Then** bank details and IBAN are either hidden or replaced with a clear "Cash Disbursement" indicator, avoiding fictitious `••••5678` account numbers.
4. **Given** any payslip row, **When** the employee clicks "Download PDF", **Then** the server streams a valid, branded PDF with proper HMAC-SHA256 reference and formatted currency.

---

### User Story 2 — Form IT-3 Annual Tax Certificate Perfection (Priority: P1) 🎯 MVP

As an employee or HR administrator, I want to download an official Form IT-3 Annual Tax Withholding Certificate for any tax year, rendered as a PDF with immaculate table formatting, exact statutory wording (under Section 149/164 of ITO 2001), and accurate Pakistani Rupee wording without data or text overlap.

**Why this priority**: Form IT-3 is a statutory legal document required for FBR annual tax filing in Pakistan. Inaccurate wording, misalignment, or missing employee details violate regulatory compliance.

**Independent Test**: Select "Tax Year 2026" on `/payroll/my-payslips`, click "Form IT-3 Certificate". Open the downloaded PDF: verify that employer details, employee details, monthly gross/taxable/tax columns, annual totals row, and "Total Tax Deducted in Words" render with zero text overlap and correct formatting.

**Acceptance Scenarios**:
1. **Given** an employee with tax deductions, **When** they request Form IT-3 for tax year $Y$, **Then** the backend retrieves all paid payslips in the July 1 $(Y-1)$ to June 30 $Y$ fiscal cycle with fully populated employee details.
2. **Given** the generated PDF, **When** inspected, **Then** the Federal Board of Revenue header, Withholding Agent block, Taxpayer block, monthly breakdown table, summary row, and Section 149/164 statutory declaration are formatted with exact pixel margins and zero clipped text.
3. **Given** the total tax amount, **When** converted to words via `numberToWords`, **Then** it accurately spells out amounts in Pakistani currency (e.g., *"Four Thousand Two Hundred and Seven Rupees Only"*).

---

### User Story 3 — Payroll Runs Dashboard & Soft-Archival Lifecycle (Priority: P1)

As an HR Manager or Super Admin at `/payroll/runs`, I want a redesigned batch payroll runs dashboard featuring an **Active Runs** vs **Archive Bucket** tab switcher, where deleting a payroll run moves it into the Archive, and the Archive allows **Reverting** (restoring) or **Permanent Deletion** with high-craft confirmation modals.

**Why this priority**: Batch payroll runs represent critical company liabilities. Deleting a run must not irreversibly destroy audit history without a recoverable archive safety bucket, matching the lifecycle architecture established in Leave Types and Employees.

**Independent Test**: On `/payroll/runs`, observe Active Runs and Archive Bucket tabs with dynamic count badges. Click "Delete" on an active run: verify a styled `ConfirmDialog` prompts the user, and upon confirmation, the run moves to Archive (`isDeleted: true`). Switch to the Archive tab: verify the run appears with "Revert" and "Permanent Delete" actions. Test reverting (restores run to active) and permanent deletion (purges run and dependent payslips with danger confirmation).

**Acceptance Scenarios**:
1. **Given** the `/payroll/runs` page, **When** loaded, **Then** the top toolbar displays two view switcher tabs: `Active Runs (count)` and `Archive Bucket (count)`, styled with Forest & Emerald pill tokens.
2. **Given** an active payroll run, **When** an authorized administrator clicks "Delete", **Then** a styled `ConfirmDialog` modal opens explaining that the run will be moved to the Archive.
3. **Given** confirmation of deletion, **When** executed, **Then** the run is soft-deleted (`isDeleted: true, deletedAt: new Date(), deletedBy: actor._id`), and removed from Active Runs view.
4. **Given** an archived payroll run in the Archive Bucket, **When** the admin clicks "Revert", **Then** a confirmation dialog opens; confirming reverts `isDeleted: false, deletedAt: null`, restoring it to Active Runs.
5. **Given** an archived run with zero active financial dependencies, **When** the admin clicks "Permanent Delete", **Then** a danger confirmation dialog opens; confirming permanently deletes the `PayrollRun` and associated `Payslip` documents from MongoDB.

---

### User Story 4 — Payroll Run Detail Page (`/payroll/runs/:id`) Craft Overhaul (Priority: P2)

As an HR Administrator inspecting a specific monthly payroll run, I want an impeccably designed detail page featuring a 4-stage lifecycle stepper, 6 high-density KPI cards, an itemized employee payslip table with employee initials and department subtitles, and aligned action buttons for approval, mark-as-paid, bank export, and slip adjustments.

**Why this priority**: Payroll review requires inspecting complex calculations (gross pay, tax withheld, EOBI, deductions, overtime, net salary) across dozens of employees. Visual clarity and immaculate typography prevent payout errors.

**Independent Test**: Open `/payroll/runs/:id`. Verify the 4-stage stepper displays with emerald active indicators and clean descriptions. Check that all 6 metric cards use monospace tabular figures. Search employees by name or ID in the filter bar. Click "View Slip" on any employee row to verify the updated preview modal opens with fully populated details.

**Acceptance Scenarios**:
1. **Given** the Payroll Run Detail page, **When** rendered, **Then** the header displays month/year, status pill, run reference ID, and right-aligned buttons (`Refresh`, `Export Bank Advice`, `Approve`/`Mark Paid`, `Delete Run`) with zero button crowding.
2. **Given** the 4-stage stepper (`Draft` $\rightarrow$ `Review` $\rightarrow$ `Approved` $\rightarrow$ `Disbursed`), **When** viewed, **Then** completed and active stages use codified emerald indicators (`bg-emerald-500`) and hairline connectors.
3. **Given** the employee payslips table, **When** inspected, **Then** employee avatars show clean initials, names are bold `text-slate-900 dark:text-white`, employee codes are monospace, financial columns are right-aligned `font-mono tabular-nums`, and actions are centered/aligned.

---

### User Story 5 — Database Population & Referential Data Integrity (Priority: P2)

As the HRM system, I want all payroll queries (`getMyPayslips`, `getPayrollRuns`, `getPayrollRunById`, `getPayslipById`, `getPayslipPdf`, `getAnnualTaxCertificatePdf`) to comprehensively populate employee relations (`departmentId`, `designationId`, `bankDetails`, `cnic`) and default unset payment methods to "Cash", ensuring zero orphaned or blank UI fields.

**Why this priority**: Frontend UI polish cannot succeed if backend endpoints return sparse, unpopulated ObjectIds that force frontend fallback strings.

**Independent Test**: Call `GET /api/v1/payslips/my` and `GET /api/v1/payroll/runs/:id`. Inspect the returned JSON payload to confirm that `employeeId` is an expanded object with `name`, `employeeCode`, `departmentId.name`, `designationId.title`, `bankDetails`, and `paymentMethod: 'cash'`.

**Acceptance Scenarios**:
1. **Given** `getMyPayslips` service, **When** queried, **Then** it populates `employeeId` with `name`, `employeeCode`, `email`, `departmentId`, `designationId`, `bankDetails`, `cnic`, and `paymentMethod`.
2. **Given** any payslip document without an explicit `paymentMethod`, **When** loaded or generated, **Then** it defaults to `'cash'`.
3. **Given** `getPayrollRuns` query, **When** `archived=true` filter is passed, **Then** it queries `{ isDeleted: true }`; when `archived=false` or omitted, it queries `{ isDeleted: { $ne: true } }`.

---

## 2. Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated **Archive Bucket** tab on `/payroll/runs` with live item counts for both `Active Runs` and `Archive Bucket`.
- **FR-002**: System MUST soft-delete payroll runs upon deletion (`isDeleted: true, deletedAt: new Date(), deletedBy: actor`), moving them to the Archive Bucket.
- **FR-003**: System MUST provide a `POST /api/v1/payroll/runs/:id/restore` endpoint guarded by `checkPermission('payroll.manage', 'all')` to revert archived runs back to active status.
- **FR-004**: System MUST provide a `DELETE /api/v1/payroll/runs/:id/permanent` endpoint guarded by `checkPermission('payroll.manage', 'all')` to permanently purge an archived run and its payslips.
- **FR-005**: All lifecycle deletions and restorations MUST use `ConfirmDialog.jsx` with distinct titles, explanations, and loading states; native `window.confirm` is strictly prohibited.
- **FR-006**: `getMyPayslips` backend service MUST fully populate `employeeId` with `name`, `employeeCode`, `departmentId`, `designationId`, `bankDetails`, and `cnic`.
- **FR-007**: `PayslipPreviewModal` MUST display real database fields for Employee Name, Employee ID, Designation, Department, CNIC, and Payment Method.
- **FR-008**: Default payment method for payslips and payroll runs MUST be `'cash'` (or `'bank_transfer'` only when an active bank account is linked). When Cash is active, bank account placeholders (`••••5678`) MUST NOT be displayed.
- **FR-009**: Form IT-3 Certificate generator (`generateAnnualTaxCertificate`) MUST use correct statutory headers, real employer/employee credentials, right-aligned tabular financial columns, and grammatically accurate Urdu/Pakistani English currency wording (`numberToWords`).
- **FR-010**: All tables across My Payslips, Payroll Runs, and Payroll Run Details MUST strictly adhere to `DESIGN.md`:
  - 1px hairline borders (`border-slate-200/80 dark:border-[#1A3125]`)
  - Subdued slate column headers (`text-[11px] font-semibold text-slate-500 uppercase tracking-wider`)
  - Monospace tabular numeric figures (`font-mono tabular-nums text-xs font-semibold`)
  - Standard semantic status pills (`DESIGN.md` Section 4)
  - Zero redundant or nested duplicate search boxes

---

### Key Entities

- **PayrollRun**:
  - `month` (Number, 1-12)
  - `year` (Number)
  - `status` (`draft` | `review` | `approved` | `paid` | `cancelled`)
  - `totalEmployees` (Number)
  - `totalGrossPay`, `totalDeductions`, `totalNetPay`, `totalTaxWithheld`, `totalOvertimePay` (Integer paisa)
  - `paymentMethod` (`cash` | `bank_transfer` | `cheque`, default: `cash`)
  - `isDeleted` (Boolean, default: `false`, indexed)
  - `deletedAt` (Date, default: `null`)
  - `deletedBy` (ObjectId ref User, default: `null`)
- **Payslip**:
  - `payrollRunId` (ObjectId ref PayrollRun)
  - `employeeId` (ObjectId ref Employee, populated with department & designation)
  - `month`, `year` (Number)
  - `earnings` (Array of itemized earning sub-ledger objects)
  - `deductions` (Array of itemized deduction sub-ledger objects)
  - `grossPay`, `totalDeductions`, `netPay`, `taxWithheld` (Integer paisa)
  - `paymentMethod` (`cash` | `bank_transfer` | `cheque`, default: `cash`)
  - `isDeleted` (Boolean, default: `false`, indexed)
  - `deletedAt` (Date, default: `null`)

---

## 3. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of payslip preview modal fields display real database data; zero instances of hardcoded "Employee", "N/A", "Staff", "General", or "••••5678" appear in production when records are populated.
- **SC-002**: Form IT-3 downloadable PDF opens with zero text collision, proper margin padding (40pt), right-aligned currency columns, and 100% readable statutory declaration.
- **SC-003**: Payroll run deletion moves records to the Archive tab with zero data loss, allowing 1-click restoration or permanent purge.
- **SC-004**: Frontend production build (`npm --prefix frontend run build`) succeeds with 0 lint, type, or bundle errors.
- **SC-005**: All existing and new automated backend test suites pass with 100% green status.
- **SC-006**: Complete visual adherence to `DESIGN.md` (Forest & Emerald craft) and `docs/UI-REFERENCE.md` across light and dark modes.

---

## 4. Assumptions & Edge Cases

### Edge Cases
- **No Bank Account Assigned**: When an employee has no bank details or payment method is Cash, the UI clearly displays "Payment Mode: Cash in Hand" and cleanly hides account number rows instead of showing mock digits.
- **Empty Fiscal Year for Form IT-3**: When an employee has zero payslips in the requested tax year, the PDF generator prints an empty ledger with "0" amounts rather than crashing or throwing unhandled errors.
- **Reverting a Run with Duplicate Active Month**: If an administrator attempts to revert an archived payroll run for a month/year that already has an active run, the system rejects the operation with HTTP 409 Conflict.
- **Soft-Deleting an Approved or Paid Run**: Super Admin authorization is required to soft-delete or restore finalized runs, logging full audit trails (`PAYROLL_RUN_ARCHIVE`, `PAYROLL_RUN_RESTORE`, `PAYROLL_RUN_PERMANENT_DELETE`).

### Assumptions
- Server currency calculations remain strictly in integer paisa (PKR $\times$ 100) to ensure zero floating-point rounding errors.
- Light mode is the primary daytime workspace; dark mode uses `#061A14` sidebar with `#0A110D` canvas and `#111D17` card surfaces.
- All monetary amounts use standard Pakistani Rupee notation (`PKR 75,000` with comma separators).

