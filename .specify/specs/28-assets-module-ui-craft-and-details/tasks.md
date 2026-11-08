# Tasks: 28-assets-module-ui-craft-and-details

**Input**: Design documents from [`.specify/specs/28-assets-module-ui-craft-and-details/`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/28-assets-module-ui-craft-and-details/)  
**Prerequisites**: `spec.md`, `plan.md`, `DESIGN.md`, `docs/BUILD-GUIDE.md` (Rows 23.1 - 23.6)

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story grouping (`[US1]`, `[US2]`, `[US3]`, `[US4]`)

---

## Phase 1: Foundational Backend Population Enhancement

**Purpose**: Ensure the asset API queries deeply populate custodian and history employee profiles.

- [x] **T001** `[Foundational]` Expand Mongoose population in `backend/src/modules/assets/asset.service.js`:
  - In `getAllAssets` (line ~145): Deeply populate `assignedTo` to select `name firstName lastName employeeCode departmentId designationId email phone avatar status` and populate `departmentId: 'name code'` and `designationId: 'title code'`.
  - In `getAssetById` (line ~170): Deeply populate `assignedTo` with identical nested fields; deeply populate `history.employeeId` with `departmentId: 'name code'`, `designationId: 'title code'`, and `avatar`; populate `history.performedBy` with `name email avatar`; populate `issues.reportedBy` with `name employeeCode email avatar`.

**Checkpoint**: Calling `/api/v1/assets/:id` returns fully populated custodian data including `departmentId.name`, `designationId.title`, and `avatar`.

---

## Phase 2: User Story 1 - Rich Custodian Identity in Details & Register (Priority: P1)

**Goal**: Transform custodian presentation from plain text strings into a full executive identity card.

- [x] **T002** `[US1]` Build the Dedicated Custodian Profile Card in `frontend/src/features/assets/pages/AssetDetailPage.jsx`:
  - When `asset.status === 'assigned'`, replace single-line text with an executive **Custodian Profile Card**:
    - Large Monogram / Photo Avatar with emerald status ring.
    - Full Employee Name, Monospaced Employee ID badge (`EMP-XXXX`).
    - Official Designation Title (`designationId.title`) and Department pill (`departmentId.name`).
    - Work Email & Phone contact chips.
    - Handover Date and Condition badge (`Brand New`, `Good Condition`, `Fair`).
  - When `asset.status === 'available'`, render an **"Available in Central Store"** banner with a direct `<UserCheck /> Assign Custodian` CTA button.
- [x] **T003** `[P]` `[US1]` Redesign the "Current Custodian" column in `frontend/src/features/assets/pages/AssetsPage.jsx`:
  - When assigned: Render multi-layered identity lockup (Avatar monogram/photo, Full Name, `font-mono` `EMP-XXXX` badge, and Department badge).
  - When unassigned: Render `<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-[#162820] text-slate-500 border border-slate-200 dark:border-[#1A3125]">Available in Store</span>`.

**Checkpoint**: Both the Asset Register table and Asset Details view clearly present the assigned employee's complete identity.

---

## Phase 3: User Story 2 - Interactive Custodian Picker with Live Preview (Priority: P1)

**Goal**: Prevent accidental assignment by providing real-time visual confirmation of the selected employee.

- [x] **T004** `[US2]` Upgrade `frontend/src/features/assets/components/AssetAssignModal.jsx`:
  - Add real-time selected employee resolution from the query cache.
  - As soon as an employee is selected from the dropdown, render a live **Employee Preview Card**:
    - Avatar, Full Name, `font-mono` `EMP-XXXX` code badge, Department, Designation, and Work Email.
  - Handover Date picker, Condition selector (`New`, `Good`, `Fair`), and Handover Notes textarea.
  - Theme styling with Forest & Emerald palette (`#FFFFFF` / `#111D17`, `#EAECF0` / `#1A3125`).

**Checkpoint**: Selecting any employee in the assignment modal immediately renders their full identity card before confirming.

---

## Phase 4: User Story 3 - Executive Inventory KPI Cards & Forest & Emerald Theme (Priority: P2)

**Goal**: Deliver executive visibility and unify Asset Management with the Forest & Emerald design system.

- [x] **T005** `[US3]` Add 4 Executive KPI Metric Cards to `frontend/src/features/assets/pages/AssetsPage.jsx`:
  - Total Assets (`<Laptop />`), Assigned in Custody (`<UserCheck />`), Available in Store (`<CheckCircle2 />`), and In Repair / Open Issues (`<Wrench />`).
  - Compute counts dynamically from loaded assets or meta counts.
- [x] **T006** `[P]` `[US3]` Refactor dark/light color tokens across all asset pages:
  - Replace all legacy `#0F111A` and `#1E2235` with Forest & Emerald tokens (`#FFFFFF` / `#111D17` surfaces, `#EAECF0` / `#1A3125` borders, `#00C471` emerald accents).
  - Apply `font-mono tabular-nums` to Asset Tags, Serial numbers, Purchase Costs (PKR), Dates, and Model codes.

---

## Phase 5: User Story 4 - Lifecycle Timeline, Repairs & Return Modals Polish (Priority: P2)

**Goal**: Complete audit trail and lifecycle action dialogs.

- [x] **T007** `[US4]` Upgrade the Lifecycle History Timeline in `frontend/src/features/assets/pages/AssetDetailPage.jsx`:
  - Display rich employee chips for both the custodian (`employeeId`) and the authorizing admin (`performedBy`).
  - Render condition tags and formatted timestamps for every action (`assigned`, `returned`, `repair_sent`, `repair_completed`).
- [x] **T008** `[P]` `[US4]` Polish `frontend/src/features/assets/components/AssetReturnModal.jsx`:
  - Render returning custodian's identity card (Avatar, Name, `EMP-XXXX`, Department).
  - Return Date, Return Condition (`Good`, `Fair`, `Damaged`, `Unusable`), and inspection notes.
- [x] **T009** `[P]` `[US4]` Polish `frontend/src/features/assets/components/AssetRepairModal.jsx`:
  - Equipment context header, Issue description, Vendor name, Estimated Cost (PKR), Expected Return Date.
- [x] **T010** `[P]` `[US4]` Polish `frontend/src/features/assets/components/AssetFormModal.jsx`:
  - Forest & Emerald modal container, hardware specifications, and `font-mono tabular-nums` inputs.

---

## Phase 6: Verification & Quality Gates

**Goal**: Guarantee zero regressions and 100% production readiness.

- [x] **T011** Verify backend ES module syntax:
  - Run `node -e "import('./backend/src/modules/assets/asset.service.js')"` and ensure clean execution.
- [x] **T012** Verify frontend production compilation:
  - Run `npm run build --prefix frontend` and verify clean build with 0 errors.

