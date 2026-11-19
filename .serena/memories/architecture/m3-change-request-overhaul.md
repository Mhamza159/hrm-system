# Phase 33: Change Request Module Overhaul & Cross-Module Master Synchronization

## Overview
Comprehensive overhaul of the Change Request Module into an enterprise-grade multi-category lifecycle workflow engine with transactional cross-module synchronization, scoped PBAC governance, and Elvara Forest & Emerald UI.

## Data Model & Schema Updates (`profileChangeRequest.model.js`)
- **8 Supported Categories**:
  - `personal`: Full name, gender, dob, marital status, blood group
  - `contact`: Phone number, personal email
  - `address`: Street, city, state, postal code
  - `emergency_contact`: Contact name, relationship, phone number
  - `bank_details`: Bank name, account title, account number, encrypted IBAN (AES-256-GCM)
  - `department`: Department ID reassignment with `EmployeeHistory` mutation
  - `designation`: Designation ID reassignment with `EmployeeHistory` mutation
  - `reporting_manager`: Reporting manager ID reassignment with circular loop detection
- **Lifecycle & Auditing Fields**:
  - `oldValue`: Baseline snapshot automatically captured from Employee record at submission time
  - `requestedValue`: New values requested by employee or manager
  - `attachments`: File attachments with url, fileName, fileType, fileSize, uploadedAt
  - `priority`: 'low' | 'medium' | 'high' | 'urgent' (default 'medium')
  - `assignedTo`: Designated reviewer reference
  - `timeline`: Chronological log tracking `action`, `performedBy`, `timestamp`, `note`, `previousStatus`, `newStatus`
  - `decisionReason`: Reviewer feedback/justification for approval, rejection, or return
  - `isDeleted`: Soft deletion flag

## Permissions & PBAC Scoping
- Registered dedicated permissions:
  - `change_request.view`
  - `change_request.create`
  - `change_request.edit`
  - `change_request.approve`
  - `change_request.delete`
- PBAC Scope Enforcement:
  - Super Admin: All requests across organization, can review HR applicants
  - HR Manager: Department-wide or company-wide scope (`all`); auto-escalates to Super Admin if applicant is an HR Manager
  - Department Manager: Scoped to their department (`department`)
  - Employee: Scoped strictly to own requests (`own`)

## Transactional Master Synchronization (`employee.service.js`)
- Approval execution atomically updates:
  - `Employee` schema: personal, contact, address, emergencyContact, bankDetails (with AES-256 encrypted IBAN), departmentId, designationId, managerId
  - `User` schema: Synchronizes `name` with employee's updated personal name
  - `EmployeeHistory`: Logs transfer or promotion records on department/designation changes
  - Circular reporting loop check: Validates applicant cannot set their manager to themselves or their own subordinates
- Audit Log & Notifications:
  - Dispatches `AuditService.log` for submission, approval, rejection, return, and cancellation
  - Sends in-app and Socket.io notifications to employee and reviewers

## Standardized Envelope Contract & Response Shape
- `GET /change-requests`:
  - `data`: Array of `ProfileChangeRequest` records (preserves backward compatibility with `data.length`)
  - `meta`: Pagination metadata (`{ total, page, limit, totalPages }`) matching M0 Foundation standard
- Defensive Decryption & Scope Checking:
  - `getChangeRequestById(id, actor)` enforces PBAC scoping on single record inspection
  - `returnChangeRequest` checks `assertSuperAdminIfApplicantIsHR` to protect peer HR requests

## Frontend Architecture
- Strictly conforms to `docs/UI-REFERENCE.md` (Elvara Forest `#061A14`, Emerald `#00C471`, Slate `#F8FAFC`, Borders `#EAECF0`):
  - `ChangeRequestsPage.jsx`: Master review portal with KPI dashboard, SVG analytics, and multi-criteria filters
  - `ChangeRequestDashboard.jsx`: 6-card KPI metrics + Category breakdown and resolution velocity curves
  - `ChangeRequestFilterBar.jsx`: Debounced search, category dropdown, status chips, department filter, and clear actions
  - `ChangeRequestTable.jsx`: Enterprise DataTable with employee badge, delta preview, priority pills, and action dropdowns
  - `ChangeRequestInspectModal.jsx`: Forensic side-by-side Before/After diff, document attachments preview, and chronological timeline
  - `ChangeRequestDecisionModal.jsx`: Guarded confirmation dialogs for Approve, Reject, and Return for Correction
  - `ChangeRequestSubmitModal.jsx`: Dynamic 8-category submission modal with current baseline prefill and file uploads
  - `MyChangeRequestsTab.jsx`: Self-service request tracking tab embedded in `MyProfilePage.jsx`
