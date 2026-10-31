# Implementation Tasks: Module M23 — Asset Management

**Feature Branch**: `feature/18-assets`  
**Specification**: [`.specify/specs/18-assets/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/18-assets/spec.md)  
**Architecture Plan**: [`.specify/specs/18-assets/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/18-assets/plan.md)  
**Target BUILD-GUIDE**: Section 20 (Rows 23.1 to 23.6)  

---

## Task Execution Checklist (Vertical Slice Order)

### Phase 0: Permission Catalogue & Seed Setup
- [x] **23.0-PERM**: Add `asset.view`, `asset.create`, `asset.manage`, `asset.assign`, `asset.request`, and `asset.issue` to `backend/src/shared/permissions.js` and assign appropriate scopes to Super Admin, HR Manager, Department Manager, and Employee in `backend/src/seed/roles.seed.js`.

---

### Slice 1: Asset Inventory Register CRUD (BUILD-GUIDE Row 23.1 · Priority: P1)
- [x] **23.1-BE-MODEL**: Create `backend/src/models/asset.model.js` with attributes (`assetTag`, `name`, `type`, `modelNumber`, `serialNumber`, `specifications`, `purchaseDate`, `purchaseCostPaisa`, `vendorName`, `warrantyExpiresAt`, `licenseExpiresAt`, `status`, `assignedTo`, `hasOpenIssue`, `history[]`, `repairs[]`, `issues[]`, `isDeleted`) and unique indexes on `assetTag` and `serialNumber`.
- [x] **23.1-BE-VAL**: Create `backend/src/modules/assets/asset.validation.js` defining `createAssetSchema`, `updateAssetSchema`, and `queryAssetsSchema` using Zod.
- [x] **23.1-BE-SERVICE**: Implement `createAsset`, `getAssets`, `getAssetById`, `updateAsset`, and `deleteAsset` (soft delete) in `backend/src/modules/assets/asset.service.js` with audit log creation and safe regex escaping.
- [x] **23.1-BE-ROUTE**: Create `backend/src/modules/assets/asset.controller.js` and `backend/src/modules/assets/asset.routes.js` with endpoints:
  - `GET /api/v1/assets` (`checkPermission('asset.view')`)
  - `POST /api/v1/assets` (`checkPermission('asset.create')`)
  - `GET /api/v1/assets/:id` (`checkPermission('asset.view')`)
  - `PUT /api/v1/assets/:id` (`checkPermission('asset.manage')`)
  - `DELETE /api/v1/assets/:id` (`checkPermission('asset.manage')`)
  Mount `/api/v1/assets` in `backend/src/app.js`.
- [x] **23.1-FE-API**: Create `frontend/src/features/assets/assetApi.js` with endpoints `getAssets`, `getAssetById`, `createAsset`, `updateAsset`, and `deleteAsset` with tag `['Assets']`.
- [x] **23.1-FE-UI**: Build `frontend/src/features/assets/pages/AssetsPage.jsx` and `components/AssetFormModal.jsx` displaying inventory table, status filters (Available, Assigned, Repair, Retired), search bar, and "Register Asset" modal.
- [x] **23.1-FE-NAV**: Register `/assets` route in `frontend/src/App.jsx` and add "Asset Register" under "Assets" in `frontend/src/components/layout/Sidebar.jsx` with `<Can>` permission guard.
- [x] **23.1-TEST**: Automated Vitest test verifying asset registration, validation rules (unique tag/serial, minor currency units), and pagination.

---

### Slice 2: Custodian Assignment, Return & History Timeline (BUILD-GUIDE Row 23.2 · Priority: P1)
- [x] **23.2-BE-VAL**: Add `assignAssetSchema` and `returnAssetSchema` in `backend/src/modules/assets/asset.validation.js`.
- [x] **23.2-BE-SERVICE**: Implement `assignAsset` and `returnAsset` in `backend/src/modules/assets/asset.service.js` handling status transitions (`available` $\leftrightarrow$ `assigned`), updating `assignedTo`, appending to `history[]` subdocument atomically, and dispatching notification to custodian.
- [x] **23.2-BE-ROUTE**: Register routes `POST /api/v1/assets/:id/assign` and `POST /api/v1/assets/:id/return` in `asset.routes.js` protected by `checkPermission('asset.assign')`.
- [x] **23.2-FE-API**: Add `assignAsset` and `returnAsset` mutations in `frontend/src/features/assets/assetApi.js`.
- [x] **23.2-FE-UI**: Build `frontend/src/features/assets/pages/AssetDetailPage.jsx`, `components/AssetAssignModal.jsx`, and `components/AssetReturnModal.jsx` with hardware specs card, current custodian details, action buttons, and interactive visual history timeline.
- [x] **23.2-FE-NAV**: Register `/assets/:id` route in `frontend/src/App.jsx`.
- [x] **23.2-TEST**: Automated test asserting asset assignment updates status and custodian, blocks double assignment, handles returns, and records full history timeline.

---

### Slice 3: Department Manager Asset Requisitions (BUILD-GUIDE Row 23.5 · Priority: P1)
- [x] **23.5-BE-MODEL**: Create `backend/src/models/assetRequest.model.js` with fields (`requestedBy`, `departmentId`, `employeeId`, `assetType`, `priority`, `specificationsRequired`, `justification`, `status: ['pending', 'approved', 'rejected', 'allocated']`, `allocatedAssetId`, `approvedBy`, `approvedAt`, `rejectionReason`).
- [x] **23.5-BE-VAL**: Add `createAssetRequestSchema`, `approveAssetRequestSchema`, and `rejectAssetRequestSchema` in `asset.validation.js`.
- [x] **23.5-BE-SERVICE**: Implement `createAssetRequest`, `getAssetRequests` (department scoped for managers, global for HR), `approveAssetRequest` (allocates available asset and assigns to employee), and `rejectAssetRequest` in `asset.service.js`.
- [x] **23.5-BE-ROUTE**: Register endpoints:
  - `GET /api/v1/asset-requests` (`checkPermission('asset.request')`)
  - `POST /api/v1/asset-requests` (`checkPermission('asset.request')`)
  - `POST /api/v1/asset-requests/:id/approve` (`checkPermission('asset.manage')`)
  - `POST /api/v1/asset-requests/:id/reject` (`checkPermission('asset.manage')`)
- [x] **23.5-FE-API**: Add `getAssetRequests`, `createAssetRequest`, `approveAssetRequest`, and `rejectAssetRequest` endpoints in `assetApi.js`.
- [x] **23.5-FE-UI**: Build `frontend/src/features/assets/pages/AssetRequestsPage.jsx` and `components/AssetRequestModal.jsx` showing requisition table/cards, request status badges, manager requisition button, and HR approval/allocation modal.
- [x] **23.5-FE-NAV**: Register `/assets/requests` in `App.jsx` and add "Requisitions" in `Sidebar.jsx`.
- [x] **23.5-TEST**: Automated tests asserting manager department scope enforcement, HR approval with automatic asset allocation, and rejection with mandatory reason.

---

### Slice 4: Employee "My Assets" & Defect Issue Reporting (BUILD-GUIDE Row 23.6 · Priority: P1)
- [x] **23.6-BE-VAL**: Add `reportIssueSchema` in `backend/src/modules/assets/asset.validation.js`.
- [x] **23.6-BE-SERVICE**: Implement `getMyAssets` (strictly filtered to `assignedTo: req.user.employeeId`) and `reportAssetIssue` (appends to `issues[]`, sets `hasOpenIssue: true`, alerts HR) in `asset.service.js`.
- [x] **23.6-BE-ROUTE**: Register endpoints:
  - `GET /api/v1/assets/my` (`checkPermission('asset.view', 'own')`)
  - `POST /api/v1/assets/:id/issue` (`checkPermission('asset.issue', 'own')`)
- [x] **23.6-FE-API**: Add `getMyAssets` query and `reportAssetIssue` mutation in `assetApi.js`.
- [x] **23.6-FE-UI**: Build `frontend/src/features/assets/pages/MyAssetsPage.jsx` and `components/AssetIssueModal.jsx` with asset cards, hardware specs, assigned date, condition, and "Report Malfunction" modal.
- [x] **23.6-FE-NAV**: Register `/assets/my` in `App.jsx` and add "My Assets" in `Sidebar.jsx`.
- [x] **23.6-TEST**: Automated tests asserting employee only views own assets, cannot view other employees' assets, and can report issues with urgent notification dispatch.

---

### Slice 5: Automated 30-Day Warranty & License Expiry Alerts (BUILD-GUIDE Row 23.3 · Priority: P2)
- [x] **23.3-BE-JOB**: Implement `backend/src/jobs/assetExpiry.job.js` scanning assets with `warrantyExpiresAt` or `licenseExpiresAt` expiring within 30 days and sending de-duplicated high-priority notifications to HR and Super Admin.
- [x] **23.3-BE-ROUTE**: Add manual trigger endpoint `POST /api/v1/assets/check-expiry` protected by Super Admin permission for on-demand audit and testing.
- [x] **23.3-FE-UI**: Add "Expiring Soon" alert badge and quick filter pill on `AssetsPage.jsx`.
- [x] **23.3-TEST**: Automated tests verifying cron evaluation correctly identifies assets expiring within 30 days and avoids duplicate daily notifications.

---

### Slice 6: Damage & Repair Maintenance Tracking (BUILD-GUIDE Row 23.4 · Priority: P2)
- [x] **23.4-BE-VAL**: Add `repairAssetSchema` and `updateRepairSchema` in `backend/src/modules/assets/asset.validation.js`.
- [x] **23.4-BE-SERVICE**: Implement `sendAssetForRepair` (status $\rightarrow$ `'under_repair'`, logs vendor & expected return date) and `completeAssetRepair` (status $\rightarrow$ `'available'`, logs actual return date & final repair cost in paisa) in `asset.service.js`.
- [x] **23.4-BE-ROUTE**: Register endpoints:
  - `POST /api/v1/assets/:id/repairs` (`checkPermission('asset.manage')`)
  - `PATCH /api/v1/assets/:id/repairs/:repairId` (`checkPermission('asset.manage')`)
- [x] **23.4-FE-API**: Add `sendAssetForRepair` and `updateAssetRepair` mutations in `assetApi.js`.
- [x] **23.4-FE-UI**: Build `components/AssetRepairModal.jsx` and embed Maintenance & Repairs section in `AssetDetailPage.jsx`.
- [x] **23.4-TEST**: Automated test verifying status transitions to `'under_repair'`, repair cost recording in paisa, and return to service upon completion.

---

### Slice 7: End-to-End Verification & Multi-Role Playwright Test
- [x] **23.7-TEST-E2E**: Module M23 end-to-end Playwright test, chaaron roles se (`Super Admin`, `HR Manager`, `Department Manager`, `Employee`) verifying asset registration, custodian assignment, manager requisition approval, employee my assets, and defect reporting.
