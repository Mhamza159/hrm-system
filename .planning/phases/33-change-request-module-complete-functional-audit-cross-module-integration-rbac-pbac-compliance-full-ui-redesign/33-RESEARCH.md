# Phase 33: Change Request Module — Research, Architecture & Specification

## Executive Summary & Audit Baseline

The **Change Request Module** enables employees to request modifications to their profile and organizational data (banking coordinates, residential address, emergency contact, personal/contact information, department, designation, and reporting manager) through a governed workflow requiring managerial or HR approval.

### 1. Existing Implementation Audit & Gap Analysis

#### A. Data Model & Database (`backend/src/models/profileChangeRequest.model.js`)
- **Existing**: Minimal schema with only `employeeId`, `requestedBy`, `field`, `requestedValue`, `reason`, `status` (`pending`, `approved`, `rejected`), `decidedBy`, `decidedAt`, `rejectionReason`.
- **Gaps Identified**:
  1. **No Baseline Snapshot (`oldValue` / `currentValue`)**: Current values are not captured at submission time. If the employee profile changes in the interim or if reviewers need to inspect what is being modified without querying multiple collections, there is no historical baseline.
  2. **Primitive Categorization**: Only supports loose field string identifiers (`bankDetails`, `address`, `emergencyContact`). Lacks structured `category` enum (`personal`, `contact`, `address`, `emergency_contact`, `bank_details`, `department`, `designation`, `reporting_manager`).
  3. **No Document / Attachment Support**: No array of supporting documents (`attachments: [{ name, url, fileType, size, uploadedAt }]`) needed for statutory verification (e.g. marriage certificate for surname changes, scanned cheque/statement for bank changes, CNIC copy, utility bill).
  4. **No Workflow Lifecycle History**: Lacks `statusHistory` or `timeline` array recording chronological lifecycle events (`submitted`, `assigned`, `under_review`, `approved`, `rejected`, `returned`, `cancelled`).
  5. **No Return for Correction**: Only binary `approved` / `rejected`. No support for returning requests to employees for missing information (`returned`).
  6. **No Self-Cancellation**: Employees cannot cancel a pending request they submitted accidentally.
  7. **Missing Reviewer Assignment**: No field for assigning a specific HR specialist or department manager (`assignedTo`).
  8. **Missing Soft-Delete / Archival**: No `isDeleted` or `isArchived` flag.

#### B. Backend API & Authorization (`backend/src/modules/employees/`)
- **Existing**:
  - `POST /employees/me/change-request` (`submitChangeRequest`)
  - `GET /change-requests` (`getChangeRequests`) — Hardcoded to check `employee.edit` permission.
  - `PATCH /change-requests/:id/decide` (`decideChangeRequest`) — Hardcoded to check `employee.edit` permission.
- **Gaps Identified**:
  1. **Zero PBAC Scoping**: `getChangeRequests` simply performs `ProfileChangeRequest.find(filter)` with no organizational or department filtering. If a Department Manager has view access, they can view all company records.
  2. **No Dedicated Permissions**: Currently piggybacking entirely on `employee.edit`. Needs dedicated `change_request.view`, `change_request.create`, `change_request.edit`, `change_request.approve`, and `change_request.delete` registered in `permissions.js`.
  3. **Missing Essential Endpoints**:
     - `GET /change-requests/me` (or `GET /change-requests/my`): List logged-in employee's own requests.
     - `GET /change-requests/:id`: Single request inspection with full deep population.
     - `GET /change-requests/stats`: Metric counters (Total, Pending, Approved, Rejected, Returned, Pending My Action, Turnaround).
     - `PATCH /change-requests/:id/return`: Return request for correction with notes.
     - `PATCH /change-requests/:id/cancel`: Cancel pending request by requester.
     - `POST /change-requests/upload`: Secure attachment upload via Multer.
  4. **Incomplete Cross-Module Synchronization**:
     - Approval logic only updates `bankDetails`, `address`, and `emergencyContact`.
     - Fails to update `personal` fields (e.g., `fullName` should synchronize with `User.name`).
     - Fails to update `departmentId` or `designationId` on `Employee`.
     - Fails to record transfers/promotions in `EmployeeHistory` model.
     - Does not prevent circular reporting manager loops.

#### C. Frontend UI/UX (`frontend/src/features/employees/`)
- **Existing**:
  - `ChangeRequestsPage.jsx`: Basic flat list of cards with hardcoded status tabs, primitive text-area rejection popup, zero KPI metrics, zero filters (no search, category, department, date-range), zero pagination, and no detailed inspection modal.
  - `ChangeRequestModal.jsx`: Basic modal with only 3 hardcoded fields, no attachment upload, and no current value preview.
- **Gaps Identified**:
  1. **Visual Hierarchy & Design Compliance**: Does not adhere to `docs/UI-REFERENCE.md` (Elvara Forest `#061A14`, Emerald `#00C471`, Card `#FFFFFF`, Canvas `#F8FAFC`).
  2. **No Metrics & Visual Analytics**: Lacks top-level KPI cards (Total, Pending Review, Approved, Rejected, Returned, Pending My Action) and category distribution charts.
  3. **No Enterprise Explorer**: Lacks a proper filterable DataTable with sorting, pagination, search, employee avatar/code/dept badges, and category pills.
  4. **No Detailed Forensic Diff Modal**: Missing an Inspect Details modal comparing Current Information vs Requested Information side-by-side with color-coded diffs and attachment viewers.
  5. **No History Timeline**: No interactive step-by-step visual timeline tracking the request from submission to decision.
  6. **No Employee Self-Service View**: In `MyProfilePage.jsx`, employees cannot view their past change requests or status.

---

## 2. Target Architecture & Module Specifications

### A. Enriched Data Model: `ChangeRequest` (`backend/src/models/profileChangeRequest.model.js`)

```javascript
const changeRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: [
        'personal',           // fullName, dob, gender, maritalStatus, bloodGroup
        'contact',            // phone, personalEmail
        'address',            // street, city, state, postalCode, country
        'emergency_contact',  // name, relationship, phone
        'bank_details',       // bankName, accountTitle, accountNumber, iban
        'department',         // departmentId
        'designation',        // designationId
        'reporting_manager'   // reportingManagerId
      ],
      required: true,
      index: true
    },
    field: {
      type: String,
      required: true,
      trim: true
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    requestedValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    priority: {
      type: String,
      enum: ['normal', 'high', 'urgent'],
      default: 'normal'
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'returned', 'cancelled'],
      default: 'pending',
      index: true
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        fileType: { type: String, default: 'application/pdf' },
        size: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decidedAt: {
      type: Date,
      default: null
    },
    decisionReason: {
      type: String,
      trim: true,
      default: null
    },
    timeline: [
      {
        action: {
          type: String,
          enum: ['submitted', 'assigned', 'review_started', 'approved', 'rejected', 'returned', 'resubmitted', 'cancelled']
        },
        actor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        actorName: String,
        actorRole: String,
        note: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);
```

### B. Cross-Module Master Synchronization Matrix

| Category | Target Field(s) | Pre-Validation | Post-Approval Mutation | Secondary Side-Effects |
|---|---|---|---|---|
| `personal` | `fullName`, `gender`, `dob`, `maritalStatus`, `bloodGroup` | Valid date format, allowed enum values | Updates `Employee.name` / `firstName` / `lastName` | If `name` changed, updates `User.name` in auth collection. Logs in `AuditService`. |
| `contact` | `phone`, `personalEmail` | Valid email and Pakistani phone format | Updates `Employee.phone`, `Employee.personalEmail` | Logs in `AuditService`. |
| `address` | `street`, `city`, `state`, `postalCode` | Non-empty strings, country defaults to Pakistan | Updates `Employee.address` object | Logs in `AuditService`. |
| `emergency_contact`| `name`, `relationship`, `phone` | Non-empty contact name & valid phone | Updates `Employee.emergencyContact` object | Logs in `AuditService`. |
| `bank_details` | `bankName`, `accountTitle`, `accountNumber`, `iban` | Valid IBAN (PKxx...), encrypts IBAN with AES-256-GCM | Updates `Employee.bankDetails` | Encrypted at rest. Downstream payroll picks up new IBAN. |
| `department` | `departmentId` | Target department exists and `isActive: true` | Updates `Employee.departmentId` | Records entry in `EmployeeHistory` (transfer). Notifies previous & new Dept Heads. |
| `designation` | `designationId` | Target designation exists and `isActive: true` | Updates `Employee.designationId` | Records entry in `EmployeeHistory` (promotion/redesignation). |
| `reporting_manager`| `reportingManagerId` | Target employee exists, active, not self, not subordinate (anti-cycle) | Updates `Employee.reportingManagerId` | Org chart structure updates automatically. |

### C. RBAC & PBAC Permissions Catalogue

In `backend/src/shared/permissions.js`:
- Module: `change_requests` (or within `employees` with dedicated actions)
  - `change_request.view`: View change requests. Scopes: `own`, `team`, `department`, `all`.
  - `change_request.create`: Submit profile/organizational change requests. Scope: `own`.
  - `change_request.edit`: Edit/resubmit returned or pending change requests. Scope: `own`.
  - `change_request.approve`: Approve, reject, or return change requests. Scopes: `department`, `all`.
  - `change_request.delete`: Cancel/archive change requests. Scopes: `own`, `all`.

### D. REST API Endpoints Specification

1. `GET /api/v1/change-requests`
   - Scoped query listing requests based on PBAC (`own`, `team`, `department`, `all`).
   - Query filters: `status`, `category`, `departmentId`, `search`, `startDate`, `endDate`, `page`, `limit`, `sortBy`, `sortOrder`.
2. `GET /api/v1/change-requests/stats`
   - Returns aggregated metrics: `total`, `pending`, `under_review`, `approved`, `rejected`, `returned`, `myPendingAction`, `categoryBreakdown`, `monthlyTrend`.
3. `GET /api/v1/change-requests/my`
   - Self-service endpoint for logged-in employee to retrieve their own change requests.
4. `GET /api/v1/change-requests/:id`
   - Deeply populated single request details with requester, employee, reviewer, department, designation, and timeline.
5. `POST /api/v1/change-requests`
   - Submit new change request. Captures baseline snapshot (`oldValue`), validates requested changes, attaches uploaded files, pushes initial timeline entry, sends notifications.
6. `PATCH /api/v1/change-requests/:id/decide`
   - Approve or reject request. For `approved`, atomically mutates employee record and triggers cross-module side-effects.
7. `PATCH /api/v1/change-requests/:id/return`
   - Return request for correction with mandatory reviewer notes.
8. `PATCH /api/v1/change-requests/:id/cancel`
   - Cancel pending request (requester only or HR admin).
9. `POST /api/v1/change-requests/upload`
   - Multer middleware handling secure file uploads with validation (PDF, JPG, PNG, max 5MB).

---

## 3. UI/UX Design System Specifications

Adhering strictly to `docs/UI-REFERENCE.md`:
- **Palette**:
  - Forest Header & Deep Accents: `#061A14`, `#102A20`, `#16382C`
  - Emerald Primary & Accents: `#00C471`, Hover `#00A860`, Subtle `#E8F8F1`
  - Canvas & Neutral Surfaces: `#F8FAFC` (Light), `#0A110D` (Dark)
  - Card & Container Surfaces: `#FFFFFF` (Light), `#111D17` (Dark)
  - Borders: `#EAECF0` (Light), `#1A3125` (Dark)
- **Status Pills**:
  - `pending`: Amber badge (`bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40`)
  - `under_review`: Blue badge (`bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40`)
  - `approved`: Emerald badge (`bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40`)
  - `rejected`: Rose badge (`bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40`)
  - `returned`: Purple/Violet badge (`bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40`)
  - `cancelled`: Slate badge (`bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800/40`)
- **Key Components**:
  1. `ChangeRequestsPage.jsx`: Main administrative/HR review hub.
  2. `ChangeRequestDashboard.jsx`: 6-card KPI metrics deck + pure SVG visual analytics.
  3. `ChangeRequestTable.jsx`: Responsive DataTable with rich employee identity cell, category badges, before/after preview, and action menu.
  4. `ChangeRequestFilterBar.jsx`: Sticky filter toolbar with search, category select, status chips, department filter, and clear actions.
  5. `ChangeRequestInspectModal.jsx`: Full-screen/large modal featuring actor profile card, side-by-side diff comparison, document previewer, and interactive timeline.
  6. `ChangeRequestDecisionModal.jsx`: Reusable confirmation and rationale capture dialog for Approve, Reject, and Return actions.
  7. `ChangeRequestSubmitModal.jsx`: Redesigned employee creation/editing modal with category switching, dynamic fields, document uploader, and diff preview.
  8. `MyChangeRequestsTab.jsx`: Self-service tab integrated into `MyProfilePage.jsx`.

---

## 4. Phased Plan Structure

- **Plan 33-01**: Change Request Data Model, Lifecycle Engine & Cross-Module Master Synchronization
- **Plan 33-02**: Backend Change Request APIs, Multi-Tier Approval Chain, Scoped PBAC & Audit/Notification Integration
- **Plan 33-03**: Change Request Dashboard, Actionable KPI Metrics & Category Analytics UI
- **Plan 33-04**: Enterprise Change Request Explorer & Multi-Criteria Filter Suite
- **Plan 33-05**: Request Details Forensic Modal, Before/After Diff Inspector & Reviewer Decision Studio
- **Plan 33-06**: Employee Self-Service Hub, Dynamic Multi-Category Submission Modal & End-to-End Testing
