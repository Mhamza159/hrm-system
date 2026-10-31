# Module M23: Asset Management (Complete)

- **Specification**: `.specify/specs/18-assets/spec.md`, `plan.md`, `tasks.md`
- **BUILD-GUIDE**: Section 20 · Rows 23.1 to 23.6 (all checked ☑)
- **Branch**: `feature/18-assets`

## Data Models
1. **Asset (`backend/src/models/asset.model.js`)**:
   - `assetTag` (unique uppercase string, e.g. `AST-001`)
   - `serialNumber` (unique string)
   - `name`, `type` (`laptop`, `desktop`, `monitor`, `phone`, `vehicle`, `furniture`, `software_license`, `accessory`, `other`)
   - `modelNumber`, `specifications`
   - `purchaseDate`, `purchaseCostPaisa` (stored in integer paisa), `vendorName`
   - `warrantyExpiresAt`, `licenseExpiresAt`
   - `status` (`available`, `assigned`, `under_repair`, `retired`, `lost`)
   - `assignedTo` (ref `Employee`)
   - `hasOpenIssue` (boolean flag)
   - `history[]` subdocument: `{ action, employeeId, performedBy, date, condition, notes }`
   - `repairs[]` subdocument: `{ repairId, vendor, issueDescription, sentDate, expectedReturnDate, actualReturnDate, repairCostPaisa, status, notes }`
   - `issues[]` subdocument: `{ issueId, reportedBy, reportedDate, type, description, status, resolutionNotes }`
   - `isDeleted` (soft-delete flag)

2. **AssetRequest (`backend/src/models/assetRequest.model.js`)**:
   - `requestedBy` (ref `User`, Department Manager)
   - `departmentId` (ref `Department`)
   - `employeeId` (ref `Employee`)
   - `assetType`, `priority` (`low`, `medium`, `high`, `urgent`)
   - `specificationsRequired`, `justification`
   - `status` (`pending`, `approved`, `rejected`, `allocated`)
   - `allocatedAssetId` (ref `Asset`)
   - `approvedBy` (ref `User`), `approvedAt`, `rejectionReason`

## Permissions (`backend/src/shared/permissions.js` & `roles.seed.js`)
- `asset.view` (Super Admin: global, HR: global, Dept Manager: dept, Employee: own)
- `asset.create` (Super Admin, HR Manager)
- `asset.manage` (Super Admin, HR Manager)
- `asset.assign` (Super Admin, HR Manager)
- `asset.request` (Super Admin, HR Manager, Dept Manager)
- `asset.issue` (Super Admin, HR Manager, Dept Manager, Employee)

## Endpoints
- `GET /api/v1/assets` - Paginated catalog with multi-axis filtering & safe regex escaping
- `POST /api/v1/assets` - Register asset
- `GET /api/v1/assets/:id` - Asset details with history, repairs, issues
- `PUT /api/v1/assets/:id` - Update specs
- `DELETE /api/v1/assets/:id` - Soft delete
- `POST /api/v1/assets/:id/assign` - Assign to custodian with atomic lock
- `POST /api/v1/assets/:id/return` - Return asset to inventory
- `POST /api/v1/assets/:id/repairs` - Dispatch for repair
- `PATCH /api/v1/assets/:id/repairs/:repairId` - Complete repair
- `POST /api/v1/assets/:id/issue` - Custodian report defect
- `GET /api/v1/assets/my` - Employee assigned assets
- `GET /api/v1/asset-requests` - Requisitions list
- `POST /api/v1/asset-requests` - Manager submit requisition
- `POST /api/v1/asset-requests/:id/approve` - HR allocate available asset
- `POST /api/v1/asset-requests/:id/reject` - HR decline requisition
- `POST /api/v1/assets/check-expiry` - On-demand expiry check

## Background Job
- `backend/src/jobs/assetExpiry.job.js`: Daily 09:00 PKT scanner for assets expiring within 30 days.

## Frontend
- `frontend/src/features/assets/`: `assetApi.js`, `AssetsPage.jsx`, `AssetDetailPage.jsx`, `AssetRequestsPage.jsx`, `MyAssetsPage.jsx`, and modals.

## Verification
- Vitest: 34 tests passing (`m23.asset.e2e.test.js` [24], `m23.asset.security.test.js` [10]).
- Playwright: `tests/e2e/m23-assets.spec.js` created.
