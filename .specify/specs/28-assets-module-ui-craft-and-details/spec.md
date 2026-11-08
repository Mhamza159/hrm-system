# Feature Specification: 28-assets-module-ui-craft-and-details

**Feature Branch**: `28-assets-module-ui-craft-and-details`  
**Created**: 2026-11-08  
**Status**: Ready for Review  
**Input**: User request: "Perform a complete audit of the Asset module, check if any feature or frontend UI element is missing, and fix it. Completely reshape and update the UI, read the Docs folder and structure everything accordingly. Read the design.md file and make UI changes based on it. Employee details regarding who the asset is assigned to are currently missing. Whenever an asset is assigned, all details of the employee should be fully displayed."

---

## 1. Executive Summary & Design Archetype

This specification governs the complete audit, feature completion, and craft elevation of the **Corporate Asset Management & Inventory Module (M23)** across all administrator, manager, and employee surfaces.

### Design Archetype Alignment (`DESIGN.md` & `docs/UI-REFERENCE.md`)
- **Visual Archetype**: **Forest & Emerald Enterprise Craft** (Inspired by Linear inventory precision + Stripe hardware logistics trustworthiness).
- **Surfaces & Palettes**:
  - Light Surface: Pure white `#FFFFFF` cards, `#F8FAFC` background, hairline `#EAECF0` borders, subtle `shadow-2xs` / `shadow-xs`.
  - Dark Surface: Deep forest `#0A110D` canvas, `#111D17` card backgrounds, and `#1A3125` hairline borders. (Completely replacing legacy `#0F111A` and `#1E2235`).
  - Accent Color: `#00C471` Vibrant Emerald for active pills, CTA buttons, and status confirmations.
- **Typography & Numerics**:
  - UI Sans (`Outfit` / `Geist Sans`) for headings and crisp body text.
  - Tabular Monospace (`font-mono tabular-nums`) for all Asset Tags (`AST-LPT-01`), Serial Numbers, Purchase Costs (`PKR 150,000`), Dates, and Employee IDs (`EMP-XXXX`).

### Core Audit Findings & Requirements
1. **Rich Custodian Identity Across All Surfaces**:
   - Currently, an assigned asset merely displays a plain text string `Bilawal Haq (EMP-0016)` without department, designation, email, phone, or avatar.
   - **Requirement**: Whenever an asset is assigned, render a full **Custodian Identity Card**:
     - Photo / Monogram Avatar
     - Full Employee Name
     - Monospaced Employee ID badge (`EMP-XXXX`)
     - Official Department badge (`departmentId.name`)
     - Official Designation title (`designationId.title`)
     - Work Email & Phone contact
     - Handover Date & Handover Condition
2. **Missing KPI Metrics Header in Asset Register**:
   - Currently, `AssetsPage.jsx` has no top KPI metrics bar.
   - **Requirement**: Add 4 executive metric cards:
     1. **Total Assets**: Gross registered inventory count.
     2. **Assigned / In Custody**: Currently allocated to employees.
     3. **Available in Store**: Ready for deployment.
     4. **In Repair / Open Issues**: Assets undergoing maintenance or with active defect reports.
3. **Interactive Custodian Picker in Assignment Modal**:
   - `AssetAssignModal.jsx` currently has an uninformative `<select>` dropdown.
   - **Requirement**: As soon as an employee is selected, render a live **Employee Preview Card** validating their avatar, ID, department, designation, and email before confirming assignment.
4. **Deep Backend Population**:
   - In `backend/src/modules/assets/asset.service.js`, deeply populate `assignedTo`, `history.employeeId`, `history.performedBy`, and `issues.reportedBy` with `departmentId` (`name`, `code`), `designationId` (`title`, `code`), and `avatar`.
5. **Timeline & Lifecycle History Upgrade**:
   - In `AssetDetailPage.jsx`, display complete custodian and performer cards for each lifecycle event (Assigned, Returned, Sent for Repair, Repaired, Retired).
6. **Defects & Repairs Workflows**:
   - Polish `AssetRepairModal.jsx`, `AssetReturnModal.jsx`, and `AssetIssueModal.jsx` with full asset context banners and validation.

---

## 2. User Scenarios & Prioritized User Stories

### User Story 1 - Rich Custodian Identity on Asset Details & Register (Priority: P1)

As an HR Manager or IT Asset Administrator inspecting corporate hardware,  
I want to view the complete professional identity of the assigned custodian (Avatar, Name, Employee Code, Designation, Department, Email, and Handover Condition),  
So that I can immediately contact the custodian, track department asset ownership, and verify custody without navigating to a separate employee directory.

**Why this priority**: Solves the primary user complaint: *"Employee details regarding who the asset is assigned to are currently missing. Whenever an asset is assigned, all details of the employee should be fully displayed."*

**Independent Test**: Navigate to `/assets` and click an assigned asset (e.g., `AST-LPT-01`). The details page must display a dedicated **Custodian Identity Card** with Avatar, Name, `EMP-0016`, Department badge, Designation, Work Email, Handover Date, and Condition.

#### Acceptance Scenarios:
1. **Given** an asset assigned to an employee (e.g. Bilawal Haq, Senior HR Specialist, HR & People),  
   **When** an administrator opens `/assets` (Asset Register),  
   **Then** the "Current Custodian" column displays the employee's avatar, full name, monospace `EMP-0016` badge, and department name.
2. **Given** an administrator opening `/assets/:id` (`AssetDetailPage`),  
   **When** the asset has `status === 'assigned'`,  
   **Then** the page renders a highlighted **Current Custodian Profile Card** featuring:
     - Avatar monogram or photo
     - Full Name
     - Employee Code (`EMP-0016`) in `font-mono`
     - Designation Title (`designationId.title`)
     - Department Badge (`departmentId.name`)
     - Work Email and Phone
     - Handover Date and Handover Condition badge (e.g., `Good`, `New`)
3. **Given** an unassigned asset (`status === 'available'`),  
   **When** viewing the Custodian section on `/assets/:id`,  
   **Then** it displays an **"Available in Central Store"** status with a prominent **"Assign Custodian"** action button.

---

### User Story 2 - Interactive Custodian Assignment with Real-Time Preview (Priority: P1)

As an IT Asset Administrator assigning equipment,  
I want to select an employee and see their full identity card previewed in real-time within the assignment dialog,  
So that I never assign high-value company assets to the wrong employee by mistake.

**Why this priority**: Eliminates human error during equipment handover by presenting immediate visual confirmation of the target custodian.

**Independent Test**: Open `AssetAssignModal` on an available asset. Select an employee from the dropdown. The modal must immediately render the employee's preview card below the selector.

#### Acceptance Scenarios:
1. **Given** the `AssetAssignModal` opened for an available asset,  
   **When** the admin selects an employee from the dropdown,  
   **Then** an interactive Employee Preview Card appears below showing their Avatar, Name, Employee Code, Department, Designation, and Email.
2. **Given** handover metadata,  
   **When** setting Handover Date, Initial Condition (`New`, `Good`, `Fair`), and Notes,  
   **Then** submitting assigns the asset atomically, updates the status to `assigned`, and pushes an immutable entry to `history`.

---

### User Story 3 - Executive Inventory KPI Cards & Forest & Emerald Craft (Priority: P2)

As a Company Administrator or Department Manager viewing `/assets`,  
I want high-level inventory KPI cards (Total Assets, Assigned, Available, In Repair) and Forest & Emerald design polish,  
So that the asset registry feels executive-tier, cohesive with the rest of ELVARA, and easy to audit at a glance.

**Why this priority**: Meets the design contract in `DESIGN.md` and provides immediate visibility into hardware utilization and inventory readiness.

**Independent Test**: Inspect `/assets` in light and dark modes. Verify the 4 KPI cards, clean `#FFFFFF` / `#111D17` card surfaces, `#EAECF0` / `#1A3125` borders, and `font-mono tabular-nums` for financial costs and serial numbers.

#### Acceptance Scenarios:
1. **Given** `/assets` (Asset Register),  
   **When** the page loads,  
   **Then** 4 summary cards are displayed: Total Assets, Assigned in Custody, Available in Store, and In Repair / Open Issues.
2. **Given** the equipment table on `/assets`,  
   **When** viewing purchase values, warranty dates, serial numbers, and tags,  
   **Then** all values use `font-mono tabular-nums`.
3. **Given** theme toggle (Light / Dark),  
   **When** dark mode is active,  
   **Then** surfaces use `#111D17` and borders use `#1A3125`.

---

### User Story 4 - Audit-Grade Lifecycle Timeline, Repairs & Defects Management (Priority: P2)

As an auditor, HR manager, or IT specialist,  
I want to inspect itemized lifecycle history, service & repair logs, and employee-reported defect tickets with full actor attribution,  
So that corporate accountability and maintenance records are 100% auditable.

**Why this priority**: Satisfies BUILD-GUIDE Rows 23.2, 23.4, and 23.6.

**Independent Test**: Navigate to `/assets/:id` tabs (Lifecycle History, Service & Repairs, Reported Issues). Verify each event shows date, actor attribution, custodian context, and condition.

#### Acceptance Scenarios:
1. **Given** the "Lifecycle History" tab on `/assets/:id`,  
   **When** viewing past events,  
   **Then** each event shows an event badge (`Assigned`, `Returned`, `Repaired`), the timestamp, the administrator who performed it (`performedBy.name`), and the custodian involved (`employeeId.name` + `employeeCode`).
2. **Given** an asset sent for repair,  
   **When** the repair is completed,  
   **Then** clicking "Complete Repair" updates the repair record and restores the asset to `available` status.
3. **Given** an employee reporting a hardware issue via `MyAssetsPage.jsx`,  
   **When** submitted,  
   **Then** the asset is flagged with `hasOpenIssue = true` and appears in the "Reported Issues" tab for IT triage.

---

## 3. Requirements & Constraints Matrix

### Functional Requirements
- **FR-01**: Deep backend population in `asset.service.js` for `assignedTo`, `history.employeeId`, `history.performedBy`, and `issues.reportedBy` including `name`, `employeeCode`, `departmentId` (`name`, `code`), `designationId` (`title`, `code`), and `avatar`.
- **FR-02**: Dedicated **Custodian Profile Card** on `AssetDetailPage.jsx` when `status === 'assigned'`.
- **FR-03**: Live **Employee Preview Card** in `AssetAssignModal.jsx` upon selecting an employee from the dropdown.
- **FR-04**: Returning custodian profile display in `AssetReturnModal.jsx`.
- **FR-05**: 4 Executive KPI Cards on `AssetsPage.jsx` (Total Assets, Assigned, Available, In Repair).
- **FR-06**: Full Forest & Emerald visual craft across all asset components (`#FFFFFF` / `#111D17` surfaces, `#EAECF0` / `#1A3125` borders, `#00C471` accents, `font-mono tabular-nums`).

### Key Invariants
- Financial amounts (Purchase Cost, Repair Cost) stored in integer paisa (1 PKR = 100 paisa) and formatted as `PKR X,XXX`.
- Asset Tags (`AST-LPT-01`) and Serial Numbers unique, trimmed, and uppercase.
- Atomic state transitions: an asset cannot be assigned if already assigned, under repair, or retired.

---

## 4. Verification & Success Criteria

1. **Backend Syntax & Population**:
   - `getAssetById` and `getAllAssets` populate full custodian profile (avatar, code, name, designation, department).
2. **Frontend UI Quality**:
   - `AssetsPage.jsx` renders KPI cards and rich custodian badges in the table.
   - `AssetDetailPage.jsx` renders the comprehensive Custodian Profile Card when assigned.
   - `AssetAssignModal.jsx` renders live employee preview upon selection.
   - Zero AI-slop, clean dark/light contrast per `DESIGN.md`.
3. **Production Build**:
   - `npm run build --prefix frontend` succeeds with 0 errors.

