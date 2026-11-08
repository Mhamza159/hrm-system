# Feature Specification: 27-expenses-ui-craft-and-details

**Feature Branch**: `27-expenses-ui-craft-and-details`  
**Created**: 2026-11-08  
**Status**: Ready for Review  
**Input**: User description: "Update the UI of the expense module according to the Docs folder, read the design.md file, and also refer to the UI reference file. Display all necessary details on the frontend UI—for instance, when an applicant submits an expense claim, it should show the applicant's data, their ID, and their assigned role or designation. Complete the UI update based on the provided files, ensuring it does not look like AI slop or generic AI-generated UI. Wherever it indicates that a receipt is required, write only 'Receipt' with a checkmark next to it."

---

## 1. Executive Summary & Design Archetype

This specification governs the craft-focused elevation of the **Expense Claims Module (M11)** across all employee, managerial, and administrator surfaces. 

### Design Archetype Alignment (`DESIGN.md` & `docs/UI-REFERENCE.md`)
- **Visual Archetype**: **Forest & Emerald Enterprise Craft** (Inspired by Linear table rigor + Stripe financial trustworthiness).
- **Surfaces & Canvases**:
  - Light Canvas: `#F8FAFC` background with pure white `#FFFFFF` cards, 1px `#EAECF0` hairline borders, and subtle elevation (`shadow-2xs` / `shadow-xs`).
  - Dark Canvas: `#0A110D` deep forest canvas with `#111D17` card surfaces and `#1A3125` subtle borders.
  - Primary Brand Accent: `#00C471` Vibrant Emerald for active pills, CTA buttons, and status confirmations.
- **Typography & Numerics**:
  - UI Sans (`Outfit` / `Geist Sans`) for headings and crisp body text.
  - Tabular Monospace (`font-mono tabular-nums`) for all monetary values (`PKR X,XXX.XX`), Claim IDs (`EXP-YYYYMM-XXXX`), and Employee IDs (`EMP-XXXX`).
- **Core Requirements Addressed**:
  1. **Comprehensive Applicant Identity**: Render complete applicant context (Avatar/Initials, Full Name, Employee Code `EMP-XXXX`, Designation Title, Department Badge, and Role) in Approvals queues, Decision dialogs, and Reimbursement screens.
  2. **Receipt Badge Standardization**: Wherever receipt requirement is indicated across categories, form modals, lists, or audit reviews, write strictly **`Receipt`** with a leading checkmark icon (`✓ Receipt`), completely removing broken mixed-language phrases (such as `Raseed Lazmi`).
  3. **Anti-AI-Slop Assurance**: Elimination of generic layouts, unstyled default inputs, and placeholder styling in favor of high-density tabular hierarchy, structured metadata ribbons, and responsive visual craft.

---

## 2. User Scenarios & Prioritized User Stories

### User Story 1 - Rich Applicant Identity in Approvals & Reviews (Priority: P1)

As a Department Manager, HR Manager, or Super Admin reviewing expense claims,  
I want to see the applicant's full professional identity (Name, Employee ID, Designation, Department, and Role),  
So that I can verify corporate legitimacy, department cost-center attribution, and authorization thresholds without searching across separate employee directories.

**Why this priority**: Approvers currently only see a raw name and fallback "Staff" text without employee code or department, leading to authorization errors and audit gaps.

**Independent Test**: Navigate to `/expenses/approvals` as an administrator or manager. The review queue table, review modal, and reimbursement dialog must immediately display the employee's ID (`employeeCode`), official designation (`designationId.title`), department pill (`departmentId.name`), and avatar/initials.

#### Acceptance Scenarios:
1. **Given** an expense claim submitted by an employee (e.g. Basit Aulakh, `EMP-0012`, Senior Software Engineer, Engineering),  
   **When** an approver opens `/expenses/approvals`,  
   **Then** the "Applicant" column displays an avatar with initials, the employee's full name, a monospace `EMP-0012` code badge, and their designation ("Senior Software Engineer • Engineering").
2. **Given** an approver clicking "Review Claim",  
   **When** the `ExpenseDecisionModal` opens,  
   **Then** the modal header and applicant block show the full identity card: Avatar, Name, Employee Code, Department, Designation, and Email.
3. **Given** an approved claim in the "Approved for Reimbursement" tab,  
   **When** the finance administrator clicks "Reimburse",  
   **Then** the `ExpenseReimburseModal` clearly displays the recipient's employee code, department, and banking reference context.

---

### User Story 2 - Standardized 'Receipt' Indicator Enforcement (Priority: P1)

As an employee, manager, or auditor viewing policy rules and claim requirements,  
I want receipt mandates to be displayed clearly and professionally as `"Receipt"` accompanied by a checkmark icon,  
So that policy instructions are universally professional, intuitive, and compliant with enterprise design standards.

**Why this priority**: Eliminates confusing and informal mixed-language strings (`Raseed Lazmi`, `Receipts Mandated (Raseed Lazmi)`) in favor of a sleek, standardized badge.

**Independent Test**: Inspect the Categories page (`/expenses/categories`), the Category Modal, the Claim Submission Modal (`/expenses/my`), and the Claim Table. Every instance of receipt mandate must render as `<Check /> Receipt`.

#### Acceptance Scenarios:
1. **Given** the Expense Categories table (`/expenses/categories`),  
   **When** a category requires a receipt (e.g. Client Entertainment),  
   **Then** the "Receipt Rule" column displays a green badge containing an emerald checkmark and the exact single word **"Receipt"** (`✓ Receipt`), while non-mandatory categories display a neutral "Optional" pill.
2. **Given** the KPI summary cards on `/expenses/categories`,  
   **When** viewing policy metrics,  
   **Then** the third metric card is titled **"Receipt Required"** (not `Receipts Mandated (Raseed Lazmi)`).
3. **Given** the Category Creation/Edit modal (`ExpenseCategoryModal`),  
   **When** viewing the receipt toggle,  
   **Then** the label is **"Receipt Required"** with a clean checkmark indicator and standard helper copy.
4. **Given** the Claim Submission form (`ExpenseFormModal`),  
   **When** an employee selects a category requiring a receipt,  
   **Then** the banner indicates `✓ Receipt` and the upload label states "Receipt Proof (Image or PDF) *".

---

### User Story 3 - High-Craft Aesthetic & Responsive Tabular Polish (Priority: P2)

As an enterprise user navigating expense workflows,  
I want high-density typography, tabular monospace alignment, refined status badges, and smooth dark/light transitions,  
So that the expense module feels cohesive, premium, and unified with the rest of the ELVARA HRM suite.

**Why this priority**: Ensures the module feels like an executive-tier enterprise application, free from generic AI-generated artifacts.

**Independent Test**: Toggle between light and dark modes across all 4 expense screens (`/expenses/my`, `/expenses/approvals`, `/expenses/categories`, `/expenses/reports`). Verify consistent border colors, font weights, tabular number alignment, and responsive viewports.

#### Acceptance Scenarios:
1. **Given** any expense table (Claims History, Approvals, Reports),  
   **When** viewing amounts, claim numbers, and dates,  
   **Then** all financial figures (`PKR 10,000.00`), claim tags (`EXP-202611-0002`), and employee codes use `font-mono tabular-nums` for precise vertical alignment.
2. **Given** empty state queues or loading states,  
   **When** queries return empty or are in-flight,  
   **Then** screens display bespoke empty states with subtle iconography and matching `ScreenSkeleton` components instead of unstyled text.

---

## 3. UI Component Architecture & Wireframe Specifications

### 3.1. Expense Approvals & Reimbursements (`/expenses/approvals`)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PageHeader: Expense Approvals & Reimbursements                                         │
│ Subtitle: Verify submitted receipt proofs, authorize managerial claims... [Refresh]   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Team Claims Review (2) ] [ Executive Escalations (> PKR 15k) (1) ] [ Reimbursement ] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 🔍 Search claim #, employee, code, category...                         3 items in queue│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Claim #          Applicant Identity       Category     Date      Claimed   Authorized  │
│ ────────────────────────────────────────────────────────────────────────────────────── │
│ EXP-202611-0002  [BA] Basit Aulakh        Meals        1 Nov 26  PKR 10,000 PKR 10,000 │
│                       EMP-0012 • Eng      ✓ Receipt              (font-mono) (font-mono)│
│                       Software Engineer                                                │
│                                                                        [Review Claim]  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2. Applicant Cell Detailed Anatomy
- **Avatar Container**: `w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center justify-center border border-emerald-500/20`.
- **Primary Title**: `text-xs font-semibold text-slate-900 dark:text-slate-100` (e.g. "Basit Aulakh").
- **Secondary Identity Line**:
  - Employee Code Badge: `text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300` (e.g. `EMP-0012`).
  - Department Pill: `text-[10px] text-slate-500 dark:text-slate-400` (e.g. `Engineering`).
- **Tertiary Designation Line**: `text-[11px] text-slate-500 dark:text-[#7E9E8F] truncate` (e.g. `Senior Fullstack Developer`).

### 3.3. Standardized Receipt Badge Anatomy
- **Mandatory Receipt**:
  ```jsx
  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    Receipt
  </span>
  ```
- **Optional Receipt**:
  ```jsx
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
    Optional
  </span>
  ```

---

## 4. Backend Population & Data Contract Changes

To supply the frontend with rich applicant data, the backend service queries must populate relational department and designation metadata:

### Required Mongoose Populate in `expense.service.js`:
```javascript
// Before:
.populate('employeeId', 'name firstName lastName email department designation')

// After (Populates employeeCode, departmentId, designationId, and userId role):
.populate({
  path: 'employeeId',
  select: 'name firstName lastName employeeCode email departmentId designationId userId avatar',
  populate: [
    { path: 'departmentId', select: 'name code' },
    { path: 'designationId', select: 'title code' },
    { path: 'userId', select: 'role roles' }
  ]
})
```

### Applied Endpoints:
1. `GET /api/v1/expenses/approvals` (`getExpenseApprovalsQueue`)
2. `GET /api/v1/expenses/my` (`getMyExpenses`)
3. `GET /api/v1/expenses/:id` (`getExpenseById`)

---

## 5. Functional Requirements (FR)

- **FR-001**: System MUST display the applicant's Full Name, Employee Code (`employeeCode`), Designation Title (`designationId.title`), and Department Name (`departmentId.name`) in all approval tables.
- **FR-002**: System MUST display an avatar (image or initial-letter monogram) next to each applicant in review lists.
- **FR-003**: In `ExpenseDecisionModal`, system MUST present an Applicant Profile Card containing Name, Employee Code, Department, Designation, and Email.
- **FR-004**: In `ExpenseReimburseModal`, system MUST display the applicant's full identification details along with payment method selection.
- **FR-005**: Wherever receipt necessity is communicated, the badge text MUST be strictly `"Receipt"` with a leading checkmark icon (`✓ Receipt`).
- **FR-006**: In `ExpenseCategoriesPage`, the receipt rule KPI card MUST be titled `"Receipt Required"` and count all categories with `requiresReceipt === true`.
- **FR-007**: In `ExpenseCategoriesPage`, the table column for receipt policy MUST render `✓ Receipt` for mandatory categories and `"Optional"` for discretionary categories.
- **FR-008**: In `ExpenseCategoryModal`, the toggle label MUST read `"Receipt Required"` with clean explanatory subtitle.
- **FR-009**: In `ExpenseFormModal`, the receipt proof requirement MUST render `✓ Receipt` when a selected category mandates it.
- **FR-010**: All currency representations across all expense screens MUST be formatted in Pakistani Rupees (`PKR X,XXX`) using monospace tabular numerics (`font-mono tabular-nums`).
- **FR-011**: All Claim IDs (`EXP-YYYYMM-XXXX`) MUST be rendered in uppercase tabular monospace font.
- **FR-012**: Light and dark mode tokens MUST strictly conform to `DESIGN.md` (Light: `#FFFFFF` card, `#F8FAFC` canvas, `#EAECF0` border; Dark: `#111D17` card, `#0A110D` canvas, `#1A3125` border).

---

## 6. Measurable Success Criteria

- **SC-001**: 100% of expense approval rows and review dialogs display the applicant's official Employee Code and Designation without displaying generic fallback strings ("Staff").
- **SC-002**: Zero occurrences of `Raseed Lazmi` or untranslated Urdu phrases remain in the UI; every receipt indicator strictly displays `✓ Receipt`.
- **SC-003**: The frontend build (`npm run build --prefix frontend`) passes with 0 syntax or JSX compile errors.
- **SC-004**: Tabular financial values remain vertically aligned in both desktop and mobile viewports.

---

## 7. Assumptions & Boundaries

- **Authentication / CASL**: Manager team filters and Super Admin executive threshold rules (`> PKR 15,000`) established in earlier phases remain intact and untouched.
- **Paisa Calculation Invariant**: All database financial fields remain stored in integer paisa (`amount`, `approvedAmount`, `maxLimitPaisa`).
- **Scope**: Modifies `backend/src/modules/expenses/expense.service.js` for query population, and `frontend/src/features/expenses/` components and pages for UI elevation. No database schema migrations are required.

