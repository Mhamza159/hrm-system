# Phase 21 Context: Company Policies Module Complete Audit, Refinement, Implementation & UI/UX Redesign

## 1. Objectives & Architectural Boundaries
- Transform the minimal static policy view (Slice 2.11) and basic chatbot document uploader (Slice 16.1) into an enterprise-grade, comprehensive **Company Policies Module** across both administrative and employee dimensions.
- Deliver end-to-end policy lifecycle management:
  - Drafting, Scoping (All Employees, Department Specific, Role Specific, Management Only).
  - Multi-tier Review, Approval, Rejection with feedback, and Scheduled/Immediate Publishing.
  - Semantic Version Control (`1.0`, `1.1`, `2.0`) with immutable historical version snapshots, change summaries, and non-destructive revisions.
  - Mandatory Employee Acknowledgement: Formal digital sign-off with timestamp, IP address, version binding, and real-time compliance rate tracking.
  - Dynamic Database-Driven Categories (General, Conduct, Information Security, Compensation & Benefits, Leave & Attendance, Health & Safety, Remote Work).
  - Executive Analytics Dashboard: Real-time KPIs for Total Policies, Published, Draft, Pending Approval, Archived, Requiring Acknowledgement, and Workforce Compliance %.
  - Compliance & Acknowledgement Tracking: Administrative roster of signed vs pending employees with department breakdown and CSV export.
  - Secure File Attachments: Ephemeral signed URLs, verified downloads, and RAG grounding integration with the AI Chatbot.
  - Strict PBAC/RBAC Enforcement: `policy.view`, `policy.create`, `policy.edit`, `policy.delete`, `policy.manage`, `policy.approve`, `policy.publish`, `policy.acknowledge`, `policy.track`.
  - Design Standards: Seamless integration into Forest & Emerald Enterprise theme (`#061A14`, `#111D17`, `#1A3125`, `#00C471`).

---

## 2. Plan Breakdown (4 Plans)

### Plan 21-01: Backend Policies Architecture, Schemas, Validation & RBAC Engine
- **File**: `.planning/phases/21-company-policies-module-complete-audit-refinement-implementation-ui-ux-redesign/21-01-PLAN.md`
- **Scope**:
  - Mongoose models: `Policy`, `PolicyCategory`, `PolicyVersion`, `PolicyAcknowledgement`.
  - Permissions catalogue additions in `backend/src/shared/permissions.js` and role seeding updates in `backend/src/seed/roles.seed.js`.
  - Request validation schemas in `backend/src/modules/policies/policy.validation.js`.
  - Comprehensive service layer in `backend/src/modules/policies/policy.service.js` (scoping, versioning, status transitions, lifecycle notifications via `notify.service.js`, aggregations).
  - Express controller and routes in `backend/src/modules/policies/policy.controller.js` and `policy.routes.js`.
  - App mounting in `backend/src/app.js` at `/api/v1/policies`.
  - Automated integration test suite in `backend/tests/policies.test.js`.

### Plan 21-02: Administrative Policy Console, Analytics Dashboard & Category Management
- **File**: `.planning/phases/21-company-policies-module-complete-audit-refinement-implementation-ui-ux-redesign/21-02-PLAN.md`
- **Scope**:
  - RTK Query API slice in `frontend/src/features/policies/policyApi.js`.
  - Executive Policy Console in `frontend/src/features/policies/pages/PoliciesDashboardPage.jsx` with KPI cards (Total, Published, Draft, Pending Approval, Archived, Requiring Signature, Overall Compliance %).
  - Filter toolbar with Category segmented pills, status dropdown, search bar, and grid/table view toggle.
  - Policy card view (`PolicyCard.jsx`) and data table view (`PolicyTable.jsx`) with Forest & Emerald styling, status pills, version tags, and action dropdowns.
  - Category Management Modal (`CategoryManagementModal.jsx`) for dynamic category administration.
  - Policy Authoring Modal (`PolicyFormModal.jsx`) supporting structured content, category assignment, department/role scoping, acknowledgement requirements, and file attachments.

### Plan 21-03: Version History, Approval Workflow & Detail Inspection Drawer/View
- **File**: `.planning/phases/21-company-policies-module-complete-audit-refinement-implementation-ui-ux-redesign/21-03-PLAN.md`
- **Scope**:
  - Full Policy Detail Drawer & Reader (`PolicyDetailDrawer.jsx`): Metadata sidebar, structured typography, active version badge, revision history access, and secure document streaming.
  - Immutable Version History Timeline (`PolicyVersionHistoryModal.jsx`): Displays historical revisions, change summaries, author, published timestamp, and non-destructive past version preview.
  - Review & Approval Interface (`PolicyApprovalModal.jsx`): For managers/approvers to review submitted drafts, inspect diffs, and Approve or Reject with feedback.
  - Publishing Workflow Modal (`PublishPolicyModal.jsx`): Effective date validation, acknowledgement mandate toggle, and multi-channel employee alert dispatch.

### Plan 21-04: Employee Policy Portal, Acknowledgement Workflow, Tracking Roster & Verification Gate
- **File**: `.planning/phases/21-company-policies-module-complete-audit-refinement-implementation-ui-ux-redesign/21-04-PLAN.md`
- **Scope**:
  - Dedicated Employee Portal (`EmployeePoliciesPage.jsx`) with filtered tabs: "Action Required / Pending Sign-off", "Acknowledged", "All Applicable Policies".
  - Formal Policy Acknowledgement Modal (`PolicyAcknowledgementModal.jsx`): Legal sign-off statement, checkbox declaration, digital signature recording, and instant status update.
  - Compliance & Acknowledgement Tracking Sheet (`PolicyAcknowledgementRosterModal.jsx`): Administrative roster of required vs signed employees, department completion progress bars, search, and CSV export.
  - Router and Sidebar integration in `App.jsx` and `Sidebar.jsx`.
  - Final Quality Gate: 0 Oxlint warnings, 100% backend tests passing, clean Vite build, responsive mobile testing.
