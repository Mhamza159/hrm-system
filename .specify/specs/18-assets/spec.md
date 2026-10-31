# Feature Specification: Module M23 — Asset Management

**Module ID**: `M23`  
**Module Name**: `Asset Management`  
**Phase / Milestone**: `Phase 2: Smart Operations (Item 18)`  
**Spec Directory**: `.specify/specs/18-assets/spec.md`  
**Target BUILD-GUIDE**: Section 20 (Rows 23.1 to 23.6)  
**Target FRD Reference**: `docs/FRD.md` Section 9 (M23. Asset Management) & Section 11 (Permission Matrix)  

---

## 1. Executive Summary & Business Scope

Module M23 (Asset Management) introduces centralized physical hardware (laptops, monitors, smartphones, peripherals) and digital asset (software licenses, cloud subscriptions) tracking for the enterprise. It establishes complete asset lifecycle tracking—from procurement and inventory intake, custodian assignment and handover, routine maintenance and repair logging, to automated warranty/license expiry notifications, department manager asset requisitions, and employee self-service issue reporting.

### Key Capabilities
1. **Asset Register & Inventory Master (23.1)**: Catalog assets with unique asset tag barcodes, serial numbers, hardware specs, categories, purchase values (in paisa), and warranty/license expiry dates.
2. **Custodian Assignment & Historical Tracking (23.2)**: Assign assets to active employees, process custodian handovers or returns to inventory, and maintain an immutable historical timeline (`history[]`).
3. **Automated Expiry Alerts (23.3)**: Daily cron runner (`jobs/assetExpiry.job.js`) scanning for warranties and software licenses expiring within 30 days and alerting HR/Admin.
4. **Damage & Repair Maintenance Tracking (23.4)**: Record repair requests, service vendor details, maintenance costs, and operational status transitions (`under_repair`, `available`, `retired`).
5. **Manager Asset Requisition Workflow (23.5)**: Allow department managers to requisition equipment for team members, with HR/Super Admin review, approval, and one-click asset allocation.
6. **Employee Self-Service "My Assets" & Issue Flagging (23.6)**: Enable employees to view all company property under their custody and submit defect/malfunction tickets with real-time HR notification.

---

## 2. Role-Based Access Control (RBAC) & Permission Matrix

Per `docs/FRD.md` Section 11:
| Role | Permissions & Capabilities | Scope |
| :--- | :--- | :--- |
| **Super Admin** | Full access to asset registry, assignment, repairs, settings, deletion, and approvals. | `all` |
| **HR Manager** | Manage registry, assign/recover assets, approve manager requests, view repair logs, handle issues. | `all` |
| **Department Manager** | View team custodian assets, requisition new hardware for subordinates, view team requests. | `team` / `department` |
| **Employee** | View assigned personal assets (`GET /assets/my`), submit defect/maintenance reports. | `own` |

### New Permissions Registered (`backend/src/shared/permissions.js`)
- `asset.view` (Subject: `'Asset'`, Scopes: `['all', 'department', 'own']`)
- `asset.create` (Subject: `'Asset'`, Scopes: `['all']`)
- `asset.manage` (Subject: `'Asset'`, Scopes: `['all']`)
- `asset.assign` (Subject: `'Asset'`, Scopes: `['all']`)
- `asset.request` (Subject: `'AssetRequest'`, Scopes: `['all', 'department', 'own']`)
- `asset.issue` (Subject: `'Asset'`, Scopes: `['own']`)

---

## 3. Prioritized User Stories & Acceptance Criteria

### User Story 1: Comprehensive Asset Inventory Register (BUILD-GUIDE Row 23.1 · Priority: P1)
**As an** HR Manager or Super Admin,  
**I want to** maintain an asset register of all company hardware and software licenses with unique asset tags and serial numbers,  
**So that** the organization maintains real-time auditability of company property.

#### Acceptance Criteria
- **Scenario 1.1 (Super Admin / HR creates new asset)**:
  - **Given** an authenticated user with `asset.create` permission (`Super Admin` or `HR Manager`),
  - **When** they submit `POST /api/v1/assets` with valid details (`name`, `assetTag`, `type: 'laptop'`, `serialNumber`, `purchaseDate`, `purchaseCostPaisa`, `warrantyExpiresAt`),
  - **Then** the system creates the asset with status `'available'`, assigns an audit log, and returns HTTP 201 with the created asset.
- **Scenario 1.2 (Unique constraint enforcement)**:
  - **Given** an existing asset with tag `"AST-LPT-001"`,
  - **When** a user attempts to create another asset with the same `assetTag` or duplicate `serialNumber`,
  - **Then** the API rejects the request with HTTP 400/409 (`"Asset tag or serial number already exists"`).
- **Scenario 1.3 (Unauthorized role creates asset)**:
  - **Given** an authenticated Department Manager or Employee without `asset.create`,
  - **When** they attempt `POST /api/v1/assets`,
  - **Then** the server halts execution with HTTP 403 Forbidden.
- **Scenario 1.4 (Filtering & Pagination)**:
  - **Given** the asset inventory list page `AssetsPage.jsx`,
  - **When** HR queries `GET /api/v1/assets?status=available&type=laptop&page=1&limit=10`,
  - **Then** the API responds with standard paginated envelope `{ success: true, data: [...], meta: { page, limit, total } }`.

---

### User Story 2: Custodian Assignment, Return & Lifecycle History (BUILD-GUIDE Row 23.2 · Priority: P1)
**As an** HR Manager,  
**I want to** assign available assets to employees and process returns with handover notes,  
**So that** physical custody is accounted for and past custodian history is preserved.

#### Acceptance Criteria
- **Scenario 2.1 (Assign asset to employee)**:
  - **Given** an asset with status `'available'`,
  - **When** HR submits `POST /api/v1/assets/:id/assign` with `{ employeeId, assignedDate, notes }`,
  - **Then** the asset status updates to `'assigned'`, `assignedTo` is set to `employeeId`, a new record is appended to `history[]` with `{ action: 'assigned', employeeId, date, notes }`, and an in-app notification is dispatched to the employee.
- **Scenario 2.2 (Prevent double assignment)**:
  - **Given** an asset currently with status `'assigned'`,
  - **When** a user attempts `POST /api/v1/assets/:id/assign`,
  - **Then** the API returns HTTP 400 (`"Asset is already assigned to another custodian. Please return it first."`).
- **Scenario 2.3 (Return asset to inventory)**:
  - **Given** an asset currently assigned to an employee,
  - **When** HR submits `POST /api/v1/assets/:id/return` with `{ returnDate, condition: 'good', notes }`,
  - **Then** the asset status updates to `'available'`, `assignedTo` is set to `null`, a return entry is appended to `history[]`, and the asset detail timeline updates immediately.
- **Scenario 2.4 (Employee / Manager access boundaries)**:
  - **Given** an Employee or Department Manager,
  - **When** they attempt `POST /api/v1/assets/:id/assign` or `POST /api/v1/assets/:id/return`,
  - **Then** the server responds with HTTP 403 Forbidden.

---

### User Story 3: Automated 30-Day Warranty & License Expiry Alerts (BUILD-GUIDE Row 23.3 · Priority: P2)
**As a** System Administrator or HR Manager,  
**I want to** receive automated alerts when hardware warranties or software licenses approach expiration (within 30 days),  
**So that** renewals, maintenance contracts, or replacements can be arranged without operational disruptions.

#### Acceptance Criteria
- **Scenario 3.1 (Daily cron evaluation)**:
  - **Given** assets in the database with `warrantyExpiresAt` or `licenseExpiresAt` falling between tomorrow and 30 days from today,
  - **When** the scheduled job `jobs/assetExpiry.job.js` runs (or is manually triggered via admin utility),
  - **Then** the job generates high-priority notifications to all users with `asset.manage` (`HR Manager` and `Super Admin`), and flags the assets in query filters.
- **Scenario 3.2 (De-duplication of alerts)**:
  - **Given** an alert was already dispatched within the last 7 days for asset `AST-001`,
  - **When** the cron job runs again the following day,
  - **Then** it does not flood recipients with duplicate daily alerts.

---

### User Story 4: Damage & Repair Maintenance Tracking (BUILD-GUIDE Row 23.4 · Priority: P2)
**As an** HR Manager,  
**I want to** log maintenance, repairs, and repair expenses for malfunctioning assets,  
**So that** asset service history, downtime, and repair costs are tracked.

#### Acceptance Criteria
- **Scenario 4.1 (Send asset for repair)**:
  - **Given** an asset requiring servicing or repair,
  - **When** HR submits `POST /api/v1/assets/:id/repairs` with `{ issueDescription, vendorName, expectedReturnDate, costPaisa }`,
  - **Then** the asset status switches to `'under_repair'`, a new subdocument is pushed to `repairs[]`, and an entry is logged in `history[]`.
- **Scenario 4.2 (Complete repair & return to service)**:
  - **Given** an asset currently `'under_repair'`,
  - **When** HR submits `PATCH /api/v1/assets/:id/repairs/:repairId` with `{ status: 'completed', actualReturnDate, finalCostPaisa, resolutionNotes }`,
  - **Then** the repair status marks `'completed'`, the asset status reverts to `'available'` (or `'assigned'` if re-issued), and total cumulative repair costs are updated.

---

### User Story 5: Department Manager Asset Requisition Workflow (BUILD-GUIDE Row 23.5 · Priority: P1)
**As a** Department Manager,  
**I want to** submit asset requisitions for my team members,  
**So that** required hardware or software licenses are officially requested and approved by HR.

#### Acceptance Criteria
- **Scenario 5.1 (Manager submits asset request)**:
  - **Given** an authenticated Department Manager with `asset.request` permission,
  - **When** they submit `POST /api/v1/asset-requests` with `{ employeeId, assetType, specifications, priority, justification }`,
  - **Then** the system verifies `employeeId` belongs to the manager's department, creates the request with status `'pending'`, and dispatches notification to HR Managers.
- **Scenario 5.2 (Manager tries to request for employee outside department)**:
  - **Given** an authenticated Department Manager,
  - **When** they attempt to request an asset for an employee in another department,
  - **Then** the request is rejected with HTTP 403 Forbidden (`"You can only request assets for members of your department"`).
- **Scenario 5.3 (HR approval & allocation)**:
  - **Given** a pending asset request,
  - **When** HR submits `POST /api/v1/asset-requests/:id/approve` with `{ allocatedAssetId }`,
  - **Then** the request status transitions to `'approved'`, the allocated asset is automatically assigned to `employeeId`, and notifications are sent to both the manager and the employee.
- **Scenario 5.4 (HR rejection with reason)**:
  - **Given** a pending asset request,
  - **When** HR submits `POST /api/v1/asset-requests/:id/reject` with `{ rejectionReason }`,
  - **Then** the request status transitions to `'rejected'` and the manager is notified.

---

### User Story 6: Employee "My Assets" Self-Service & Issue Reporting (BUILD-GUIDE Row 23.6 · Priority: P1)
**As an** Employee,  
**I want to** view all company hardware and software currently assigned to me and report faults or issues,  
**So that** I know my custodian responsibilities and can get hardware problems resolved quickly.

#### Acceptance Criteria
- **Scenario 6.1 (Employee views personal assets)**:
  - **Given** an authenticated Employee with `asset.view` (`scope: 'own'`),
  - **When** they navigate to `/assets/my` (which calls `GET /api/v1/assets/my`),
  - **Then** the API returns strictly the assets where `assignedTo === req.user.employeeId` and excludes assets assigned to other staff.
- **Scenario 6.2 (Employee reports asset issue)**:
  - **Given** an asset assigned to the logged-in employee,
  - **When** the employee submits `POST /api/v1/assets/:id/issue` with `{ issueType: 'hardware_failure', description, severity: 'high' }`,
  - **Then** the issue is recorded in the asset's `issues[]` array, the asset is flagged with `hasOpenIssue: true`, and an urgent notification is sent to HR Managers.
- **Scenario 6.3 (Employee reports issue on someone else's asset)**:
  - **Given** an asset assigned to another employee,
  - **When** the employee attempts `POST /api/v1/assets/:id/issue`,
  - **Then** the API responds with HTTP 403 Forbidden (`"You can only report issues on assets currently assigned to you"`).

---

## 4. Data Models Architecture & Schema Design

### 4.1. `Asset` Schema (`backend/src/models/asset.model.js`)
```javascript
import mongoose from 'mongoose';

const HistorySubSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['created', 'assigned', 'returned', 'repair_sent', 'repair_completed', 'retired'],
    required: true
  },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String, trim: true, default: '' },
  condition: { type: String, enum: ['new', 'good', 'fair', 'damaged', 'unusable'], default: 'good' }
}, { _id: true, timestamps: true });

const RepairSubSchema = new mongoose.Schema({
  issueDescription: { type: String, required: true, trim: true },
  vendorName: { type: String, required: true, trim: true },
  repairCostPaisa: { type: Number, default: 0 },
  sentDate: { type: Date, default: Date.now },
  expectedReturnDate: { type: Date },
  actualReturnDate: { type: Date },
  status: { type: String, enum: ['in_progress', 'completed', 'unrepairable'], default: 'in_progress' },
  resolutionNotes: { type: String, trim: true }
}, { _id: true, timestamps: true });

const IssueSubSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  issueType: { type: String, enum: ['hardware_failure', 'screen_damage', 'battery_battery', 'software_license', 'other'], required: true },
  description: { type: String, required: true, trim: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_review', 'resolved'], default: 'open' },
  reportedAt: { type: Date, default: Date.now },
  resolutionNotes: { type: String, trim: true }
}, { _id: true, timestamps: true });

const AssetSchema = new mongoose.Schema({
  assetTag: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['laptop', 'desktop', 'monitor', 'smartphone', 'tablet', 'printer', 'network_device', 'software_license', 'other'],
    required: true,
    index: true
  },
  modelNumber: { type: String, trim: true },
  serialNumber: { type: String, required: true, unique: true, trim: true, index: true },
  specifications: {
    processor: { type: String, trim: true },
    ramGb: { type: Number },
    storageGb: { type: Number },
    os: { type: String, trim: true },
    licenseKey: { type: String, trim: true }
  },
  purchaseDate: { type: Date },
  purchaseCostPaisa: { type: Number, default: 0 },
  vendorName: { type: String, trim: true },
  warrantyExpiresAt: { type: Date, index: true },
  licenseExpiresAt: { type: Date, index: true },
  status: {
    type: String,
    enum: ['available', 'assigned', 'under_repair', 'retired', 'lost'],
    default: 'available',
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null,
    index: true
  },
  hasOpenIssue: { type: Boolean, default: false },
  history: [HistorySubSchema],
  repairs: [RepairSubSchema],
  issues: [IssueSubSchema],
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });
```

### 4.2. `AssetRequest` Schema (`backend/src/models/assetRequest.model.js`)
```javascript
import mongoose from 'mongoose';

const AssetRequestSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  assetType: {
    type: String,
    enum: ['laptop', 'desktop', 'monitor', 'smartphone', 'tablet', 'software_license', 'other'],
    required: true
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  specificationsRequired: { type: String, trim: true },
  justification: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'allocated'],
    default: 'pending',
    index: true
  },
  allocatedAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date },
  rejectionReason: { type: String, trim: true }
}, { timestamps: true });
```

---

## 5. API Endpoints Specification

| Method | Endpoint | Description | Middleware / RBAC |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/assets` | Paginated asset registry list with filters | `auth`, `checkPermission('asset.view')`, `scopeFilter` |
| `POST` | `/api/v1/assets` | Register new hardware / software asset | `auth`, `validate(createAssetSchema)`, `checkPermission('asset.create')` |
| `GET` | `/api/v1/assets/my` | Retrieve assets assigned to logged-in user | `auth`, `checkPermission('asset.view', 'own')` |
| `GET` | `/api/v1/assets/:id` | Detailed asset profile, history, repairs | `auth`, `checkPermission('asset.view')` |
| `PUT` | `/api/v1/assets/:id` | Update asset attributes/specifications | `auth`, `validate(updateAssetSchema)`, `checkPermission('asset.manage')` |
| `DELETE` | `/api/v1/assets/:id` | Soft delete asset | `auth`, `checkPermission('asset.manage')` |
| `POST` | `/api/v1/assets/:id/assign` | Assign asset to employee custodian | `auth`, `validate(assignAssetSchema)`, `checkPermission('asset.assign')` |
| `POST` | `/api/v1/assets/:id/return` | Return asset from custodian to inventory | `auth`, `validate(returnAssetSchema)`, `checkPermission('asset.assign')` |
| `POST` | `/api/v1/assets/:id/repairs` | Log repair maintenance ticket | `auth`, `validate(repairAssetSchema)`, `checkPermission('asset.manage')` |
| `PATCH` | `/api/v1/assets/:id/repairs/:repairId` | Update/complete repair maintenance | `auth`, `validate(updateRepairSchema)`, `checkPermission('asset.manage')` |
| `POST` | `/api/v1/assets/:id/issue` | Employee reports issue on assigned asset | `auth`, `validate(reportIssueSchema)`, `checkPermission('asset.issue', 'own')` |
| `GET` | `/api/v1/asset-requests` | List asset requisitions (scoped) | `auth`, `checkPermission('asset.request')`, `scopeFilter` |
| `POST` | `/api/v1/asset-requests` | Manager submits asset requisition | `auth`, `validate(createRequestSchema)`, `checkPermission('asset.request')` |
| `POST` | `/api/v1/asset-requests/:id/approve` | HR approves requisition & allocates asset | `auth`, `validate(approveRequestSchema)`, `checkPermission('asset.manage')` |
| `POST` | `/api/v1/asset-requests/:id/reject` | HR rejects requisition with reason | `auth`, `validate(rejectRequestSchema)`, `checkPermission('asset.manage')` |

---

## 6. Official Library Patterns & Guidelines (Context7)

### Mongoose Array Subdocuments & References
- **Nested History & Repairs**: Use explicit Mongoose subdocument schemas (`HistorySubSchema`, `RepairSubSchema`, `IssueSubSchema`) embedded within parent `AssetSchema`.
- **Atomic Subdocument Mutation**: Use atomic array operators (`$push`) when recording new historical entries or repair records to avoid concurrency race conditions.
- **Indexes**: Compound index `{ isDeleted: 1, status: 1 }`, and unique index on `assetTag` and `serialNumber`.

### Zod Validation Contracts
- All strings trimmed and sanitised.
- Minor currency units (`purchaseCostPaisa`, `repairCostPaisa`) must be positive integers (`z.number().int().nonnegative()`).
- Asset type, status, and severity strictly bounded by Zod enums matching Mongoose schema.

---

## 7. Frontend Architecture & Component Directory

- **API Slice**: `frontend/src/features/assets/assetApi.js` (RTK Query hooks: `useGetAssetsQuery`, `useGetMyAssetsQuery`, `useGetAssetByIdQuery`, `useCreateAssetMutation`, `useAssignAssetMutation`, `useReturnAssetMutation`, `useReportIssueMutation`, `useGetAssetRequestsQuery`, `useCreateAssetRequestMutation`, `useApproveAssetRequestMutation`, `useRejectAssetRequestMutation`).
- **Pages**:
  - `AssetsPage.jsx`: Main asset inventory table with filter pills (Type, Status, Custodian), search bar, and "Register Asset" modal.
  - `AssetDetailPage.jsx`: Asset hardware card, current custodian badge, interactive timeline (`history[]`), repair history, and open issue banner.
  - `AssetRequestsPage.jsx`: Requisition Kanban/Table for Managers and HR with status badges (`pending`, `approved`, `rejected`), requisition modal, and allocation dialog.
  - `MyAssetsPage.jsx`: Clean employee card view showing assigned equipment, specs, assigned date, and "Report Issue" action button.
- **Navigation & RBAC Guarding**:
  - `Sidebar.jsx`: Add "Assets" section with "Asset Register", "Requisitions", and "My Assets" conditionally rendered using `<Can>`.

