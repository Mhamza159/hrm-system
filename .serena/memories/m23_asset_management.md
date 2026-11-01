# Module M23: Asset Management

## Overview
Implemented corporate physical hardware and software asset lifecycle management conforming to BUILD-GUIDE Section 20 (Rows 23.1 to 23.6).

## Data Models
1. **Asset (`asset.model.js`)**:
   - Fields: `assetTag` (unique), `name`, `type`, `modelNumber`, `serialNumber` (unique), `specifications`, `purchaseDate`, `purchaseCostPaisa` (integer paisa), `vendorName`, `warrantyExpiresAt`, `licenseExpiresAt`, `status` (`available`, `assigned`, `under_repair`, `retired`, `lost`), `assignedTo` (ref Employee), `hasOpenIssue`.
   - Subdocuments: `history[]` (custody actions), `repairs[]` (vendor repair logs), `issues[]` (malfunction reports).
2. **AssetRequest (`assetRequest.model.js`)**:
   - Requisition workflow tracking: `requestedBy`, `departmentId`, `employeeId`, `assetType`, `priority`, `specificationsRequired`, `justification`, `status` (`pending`, `approved`, `rejected`), `allocatedAssetId`.

## Permissions & PBAC Scoping
- `asset.view`: `all` (Super Admin, HR), `department` (Dept Manager), `own` (Employee).
- `asset.create`: `all` (Super Admin, HR).
- `asset.manage`: `all` (Super Admin, HR).
- `asset.assign`: `all` (Super Admin, HR).
- `asset.request`: `department` (Dept Manager, Super Admin, HR).
- `asset.issue`: `own` (Employee).

## API Endpoints
- Master CRUD: `GET /api/v1/assets`, `POST /api/v1/assets`, `GET /api/v1/assets/:id`, `PUT /api/v1/assets/:id`, `DELETE /api/v1/assets/:id`
- Assignment & Return: `POST /api/v1/assets/:id/assign`, `POST /api/v1/assets/:id/return`
- Maintenance & Repairs: `POST /api/v1/assets/:id/repairs`, `PATCH /api/v1/assets/:id/repairs/:repairId`
- Requisitions: `GET /api/v1/asset-requests`, `POST /api/v1/asset-requests`, `POST /api/v1/asset-requests/:id/approve`, `POST /api/v1/asset-requests/:id/reject`
- Self-Service: `GET /api/v1/assets/my`, `POST /api/v1/assets/:id/issue`
- Cron / Scanner: `POST /api/v1/assets/check-expiry` (30-day window, 7-day de-duplication)

## Key Architectural & Security Decisions
- Defensive hierarchy: `authenticate` -> `checkPermission` -> `validate` -> `controller`.
- IDOR Protection: `getAssetById` validates requesting user's horizontal scope; regular employees can only inspect assets assigned to them.
- Concurrency Safety: Atomic conditional updates (`findOneAndUpdate`) on `assignAsset`, `returnAsset`, `approveAssetRequest`, and `rejectAssetRequest` prevent double allocations and race conditions.
- State Machine Guards: Cannot delete or repair assets already under repair; cannot re-complete finalized repairs.
- Cross-Module Exit Clearance: `assertEmployeeAssetClearance(employeeId)` integrated into `employee.service.js:deleteEmployee()` and prepared for M18 offboarding checklist to block clearing employees holding company equipment.
