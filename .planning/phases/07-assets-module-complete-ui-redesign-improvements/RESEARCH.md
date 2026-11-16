# Phase 07: Assets Module – Complete UI Redesign & Improvements (Research)

## 1. Domain & Codebase Analysis

### Existing Architecture & Files
- **Backend Model**:
  - `backend/src/models/asset.model.js`:
    - Fields: `assetTag` (unique), `name`, `type`, `modelNumber`, `serialNumber` (unique), `specifications`, `purchaseDate`, `purchaseCostPaisa`, `vendorName`, `warrantyExpiresAt`, `licenseExpiresAt`, `status` (`'available'`, `'assigned'`, `'under_repair'`, `'retired'`, `'lost'`), `assignedTo` (ref `Employee`), `hasOpenIssue`, `history`, `repairs`, `issues`, `isDeleted`.
    - Soft delete is currently modeled as `isDeleted: true`.
- **Backend Routes & Service**:
  - `backend/src/modules/assets/asset.routes.js`:
    - Permissions: `asset.view`, `asset.create`, `asset.manage`, `asset.assign`, `asset.issue`, `asset.request`.
    - Soft delete endpoint: `DELETE /api/v1/assets/:id`.
    - **Current Gap**: Lacks `POST /api/v1/assets/:id/restore` and `DELETE /api/v1/assets/:id/permanent`. Also `getAssets` query needs to support fetching archived records (`archived=true` / `isDeleted=true`).
  - **Deletion Invariant (Existing & Required)**:
    - In `asset.service.js`, `deleteAsset` checks `if (asset.status === 'assigned' || asset.assignedTo)`.
    - We must ensure this invariant is strictly enforced on BOTH soft delete and permanent delete:
      ```javascript
      if (asset.status === 'assigned' || asset.assignedTo) {
        throw new ApiError(400, 'Cannot delete an asset that is currently assigned to a custodian. Please return it to inventory first.');
      }
      ```
- **Frontend Pages & Components**:
  - `frontend/src/features/assets/pages/MyAssetsPage.jsx`:
    - Current: basic 2-column grid cards without tabular sorting, pill filters, or row-click detail modal.
  - `frontend/src/features/assets/pages/AssetsPage.jsx`:
    - Current: uses single active table, uses browser `window.confirm`, lacks Archive tab and restore/permanent delete controls.
  - `frontend/src/features/assets/pages/AssetRequestsPage.jsx`:
    - Current: basic requisition list, raw modal controls, lacks modern design alignment.
  - `frontend/src/features/assets/components/AssetAssignModal.jsx`:
    - Current: uses native HTML `<select>` with standard text options. Needs modern `CustodianSelect` component.

---

## 2. Design System Tokens & Patterns (`DESIGN.md` & `docs/UI-REFERENCE.md`)

- **Color Scheme**:
  - Canvas: `#061A14` (dark) / `#F8FAFC` (light)
  - Surface: `#111D17` (dark) / `#FFFFFF` (light)
  - Hairline Border: `#1A3125` (dark) / `#EAECF0` (light)
  - Brand Primary Emerald: `#00C471`, hover `#049856`
  - Warning/Amber: `#F59E0B`, `bg-amber-50 text-amber-700`
  - Danger/Rose: `#F43F5E`, `bg-rose-50 text-rose-700`
- **Semantic Status Pills**:
  - `available`: `bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60`
  - `assigned`: `bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/60`
  - `under_repair`: `bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/60`
  - `retired` / `archived`: `bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700`
  - `lost`: `bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/60`
- **Component Patterns**:
  - `PersonRow`: Employee avatar, name, `EMP-XXXX` code, department/designation.
  - `Can`: RBAC/PBAC permission gate. If `can('asset.manage')` is false, hide edit/delete/assign buttons.
  - `ConfirmDialog`: Non-blocking modal for destructive confirmation.

---

## 3. Plan Wave Breakdown

- **Plan 07-01: Backend Lifecycle & Deletion Guard Hardening**:
  - Endpoints: `POST /api/v1/assets/:id/restore`, `DELETE /api/v1/assets/:id/permanent`.
  - Query: Support `archived=true` in `getAssets` to retrieve `isDeleted: true` items.
  - Enforce `asset.status === 'assigned' || asset.assignedTo` invariant on all deletion pathways with explicit 400 error.
  - Fix `tests/m23.asset.e2e.test.js` object assertion and add archive lifecycle tests.
- **Plan 07-02: Modern Custodian Dropdown & My Assets Page Overhaul**:
  - Build `CustodianSelect.jsx` searchable component.
  - Redesign `MyAssetsPage.jsx` with pill filter bar, enterprise data table, and `AssetDetailModal.jsx`.
- **Plan 07-03: Assets Register (Active & Archive Tabs) & Requisitions Workflow**:
  - Overhaul `AssetsPage.jsx` with Active / Archive tab switcher, high-density table, Archive Revert/Permanent Delete modal, and assigned asset deletion prevention UI.
  - Overhaul `AssetRequestsPage.jsx` with modern requisition pipeline and `CustodianSelect` integration.
  - Strict PBAC / RBAC verification and live browser test.
