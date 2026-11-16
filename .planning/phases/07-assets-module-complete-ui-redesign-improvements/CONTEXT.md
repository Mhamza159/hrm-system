# Phase 07: Assets Module – Complete UI Redesign & Improvements (Context)

## Executive Summary
This phase delivers a complete UI redesign, craft elevation, and architectural hardening for the entire Assets Module across 4 core areas:
1. **My Assets Page**
2. **Assets Register Page (Active & Archive Lifecycle)**
3. **Custodian Assignment Dropdown**
4. **Requisition Page & Approvals Workflow**

All changes must conform to the project's Forest & Emerald design system (`DESIGN.md`, `docs/UI-REFERENCE.md`), PBAC & RBAC permission matrix (`docs/RBAC.md`, `docs/PBAC.md`), and maintain zero breaking changes to existing business logic.

---

## Detailed Requirements

### 1. My Assets Page (`/assets/my` or `/assets`)
- **Visual & Component Overhaul**:
  - Replace dated tables/cards with crisp, high-density enterprise tables adhering to `DESIGN.md`.
  - Add a dedicated **Buttons / Pills tab** switcher with properly styled filter buttons, status pills (`assigned`, `in-repair`, `pending`, `retired`), and semantic tone schemes.
- **Interactive Row-Click Asset Detail Modal**:
  - Clicking any asset row in the table opens an authoritative detail modal.
  - Displays complete asset information: Asset Tag / Code (monospace), Category, Serial Number, Model/Make, Condition, Current Custodian, Issue Date, Warranty / Depreciation Info, and Policy Remarks.
  - Contextual actions: Request Return / Surrender, Report Issue / Repair Request, or Download Handover Receipt (permission & state aware).

### 2. Assets Register Page (`/assets` or `/assets/register`)
- **Unified Toolbar & Filter Architecture**:
  - Separate **Active** and **Archive** tabs with live badge counters.
  - Unified search bar (search by Asset Tag, Name, Serial Number, or Custodian), Category dropdown filter, and Condition filter.
- **Active Tab Data Table**:
  - High-density semantic table with hairline borders (`#EAECF0` / `#1A3125`), tabular serial numbers, category pills, custodian `PersonRow` (or badge), and action buttons.
  - Row click opens Asset Detail Modal.
- **Archive Tab & Lifecycle Modals**:
  - Dedicated table showing archived/decommissioned assets with archive timestamps, reason, and actor.
  - Archive modal with two explicit actions:
    - **Revert**: Restores the asset back into active inventory (`isActive: true`, `isArchived: false`).
    - **Permanent Delete**: Permanently removes the asset from the database with double confirmation, strictly guarded by the business rule below.
- **Critical Business Rule (Assignment-Based Deletion Restriction)**:
  - **Rule**: If an asset is currently assigned to a user (`assignedTo` is present / status is `assigned` / unreturned custody), it must **NOT** be deleted (neither normal soft-delete nor permanent delete).
  - **Enforcement**: Must be enforced in both **Backend API** (reject deletion request with clear 400 Bad Request error) and **Frontend UI** (disable/hide delete button, display clear warning tooltip/badge explaining why assigned assets cannot be deleted).

### 3. Custodian Assignment Dropdown
- **Modern Employee Selector**:
  - Redesign the raw `<select>` into a searchable, accessible dropdown component.
  - Displays employee avatar/initials, full name, employee ID (`EMP-XXXX` in monospace), department, and designation.
  - Fast client-side fuzzy search by name or code.
  - Smooth keyboard navigation and design tokens aligned with `#00C471`.

### 4. Requisition Page (`/assets/requisitions`)
- **Full Workflow Redesign**:
  - Redesign asset requisitions from scratch with modern enterprise layout.
  - Requisition tabs / status filters: `Pending Review`, `Approved`, `Allocated / Fulfilled`, `Rejected`.
  - Semantic data table showing Requester identity (`PersonRow`), Requested Category/Asset, Business Purpose, Urgency/Priority pill (`High`, `Medium`, `Low`), Application Date, and Decision Status badge.
  - Action Modals:
    - **Approve Requisition Modal**: Manager/Admin notes and approval trigger.
    - **Allocate Asset Modal**: Seamlessly pair approved requisition with available inventory via the new Custodian Assignment component.
    - **Reject Requisition Modal**: Required rejection reason input.

### 5. PBAC & RBAC Alignment
- Check CASL permissions (`checkPermission('assets', 'create')`, `manage`, `delete`, `assign`, `approve`).
- Wrap all action buttons in `<Can I="create" a="Asset">`, etc.
- If a user lacks permission for an action, do NOT render the button or control in the UI.
- Never expose raw database IDs or unmasked internal data.
