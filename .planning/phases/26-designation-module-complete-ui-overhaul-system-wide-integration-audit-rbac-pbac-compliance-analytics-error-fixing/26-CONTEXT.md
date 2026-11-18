# Phase 26: Designation Module — Complete UI Overhaul, System-Wide Integration Audit, RBAC/PBAC Compliance, Analytics & Error Fixing

## 1. Executive Summary & Audit Findings

The **Designation Module** (Module M4 / Slice 4.3) defines corporate job titles, professional grade tiers (`Junior`, `Mid`, `Senior`, `Lead`, `Executive`), and organizational roles across business departments. It is directly integrated with Employee Profiles, Career Progression Timeline, Performance KPI Templates, Recruitment Job Postings, Payroll Structure definitions, and Organizational Reporting Lines.

### Comprehensive Audit Analysis:

1. **Schema & Archival Lifecycle Gaps (`designation.model.js`)**:
   - **Current State**: Model only possesses `title`, `code`, `grade`, `departmentId`, `description`, `isActive`, `isDeleted`, and `createdBy`.
   - **Gaps**:
     - Lacks explicit archival tracking: missing `isArchived: { type: Boolean, default: false }`, `archivedAt`, and `archivedBy`.
     - Lacks compound indexes for active/archived queries: `{ isArchived: 1, isDeleted: 1 }`, `{ departmentId: 1, isArchived: 1 }`.
     - No soft-archive vs permanent delete distinction; `isDeleted` was previously used as a simple flag without an archive bucket.

2. **Backend Services & Lifecycle Gaps (`department.service.js` & `designation.routes.js`)**:
   - **Current State**: Only provides baseline CRUD (`getAllDesignations`, `getDesignationById`, `createDesignation`, `updateDesignation`, `deleteDesignation`).
   - **Gaps**:
     - Missing archival endpoint (`PATCH /api/v1/designations/:id/archive`).
     - Missing restore endpoint (`PATCH /api/v1/designations/:id/restore`) with department code uniqueness check.
     - Missing permanent delete endpoint (`DELETE /api/v1/designations/:id/permanent`).
     - **CRITICAL RESTRICTION GUARD**: A designation must NEVER be permanently deleted while even one employee is assigned to it in MongoDB. If linked employees exist (`designationId == id`), permanent deletion must be rejected with HTTP 400 and an authoritative message.
     - Missing Employee Archival Guard in `employee.service.js`: Onboarding (`createEmployee`) and profile updates (`updateEmployee`, `recordPromotionHistory`) must verify that employees cannot be assigned to an archived or deleted designation.
     - Missing KPI aggregation (`GET /api/v1/designations/stats`) and workforce analytics (`GET /api/v1/designations/analytics`).

3. **Frontend UI/UX & Architecture Gaps (`DesignationsPage.jsx`)**:
   - **Current State**: Flat single-view table without an Archive tab, lacking visual analytics, dual view mode, and rich inspection.
   - **Gaps**:
     - Missing dual-tab switcher: **Active Designations** vs **Archived Designations** with live count badges.
     - Missing 7-KPI summary cards (Total, Active, Archived, Assigned Staff, Staffed Units, Empty Units, Grade Coverage).
     - Missing visual analytics section (`DesignationAnalyticsSection.jsx`) with horizontal bar chart (staff per designation), native SVG Donut chart (department-wise share), and grade distribution pills.
     - Missing Card Grid View (`DesignationCardView.jsx`) and view switcher toggle (Table vs Cards).
     - Missing multi-dimensional filter bar (`DesignationFilterBar.jsx`) with search, department selector, grade filter, status pills, headcount filter, and active filter chips.
     - Missing detailed inspection modal (`DesignationDetailModal.jsx`) displaying full metadata and the assigned staff roster with live search.
     - Missing Archive modal (`DesignationArchiveModal.jsx`), Restore modal (`DesignationRestoreModal.jsx`), and Permanent Delete modal (`DesignationPermanentDeleteModal.jsx`) with active staff block.

---

## 2. Critical Business Rules & Invariants

1. **Employee Assignment Restriction Guard (Non-Negotiable)**:
   - A designation must **NEVER** be permanently deleted while $\ge 1$ employee is assigned to it.
   - Backend enforcement in `department.service.js`:
     ```javascript
     const assignedCount = await Employee.countDocuments({ designationId: id });
     if (assignedCount > 0) {
       throw new ApiError(
         400,
         `This designation cannot be permanently deleted because ${assignedCount} employee(s) are still assigned to it. Please reassign all employees to another designation before proceeding.`
       );
     }
     ```
   - Zero cascading deletion of employee records; employee histories and profiles must remain completely intact.

2. **Archived Designation Assignment Guard**:
   - Employees already holding a designation when it is archived maintain their historical link.
   - However, no new employee onboarding (`createEmployee`), profile update (`updateEmployee`), or promotion (`recordPromotionHistory`) may assign an employee to an archived designation (`isArchived: true`).

3. **Department Association & Code Uniqueness**:
   - Designation code (`code`) is uppercase, alphanumeric, and unique within its associated department.
   - Cannot associate a designation with an archived or deleted department.

4. **Grade Tier Hierarchy**:
   - Every designation belongs to one of the 5 canonical grade tiers:
     - `Junior`: Entry-level professionals (e.g. Associate, Junior Developer)
     - `Mid`: Intermediate specialists (e.g. Software Engineer, HR Specialist)
     - `Senior`: Experienced contributors (e.g. Senior Engineer, Senior Accountant)
     - `Lead`: Technical / Operational leads (e.g. Tech Lead, Principal Architect)
     - `Executive`: Departmental heads and executives (e.g. Director, VP, CTO, CEO)

---

## 3. RBAC & PBAC Permissions Matrix

Complies strictly with `backend/src/shared/permissions.js` under `module: 'organization'`:

| Action | Required Permission | Description | Allowed Roles |
| :--- | :--- | :--- | :--- |
| `org.view` | `checkPermission('org.view')` | View designation directory, details, KPI stats, analytics, and archive | Super Admin, HR Manager, Department Manager, Employee |
| `org.manage` | `checkPermission('org.manage')` | Create, edit, archive, restore designations | Super Admin, HR Manager |
| `org.manage` (Permanent Delete) | `checkPermission('org.manage')` | Permanently purge empty archived designation from database | Super Admin only |

---

## 4. API Endpoints Specification

| Method | Endpoint | Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/designations` | `org.view` | Paginated query of active designations with department info & staff headcount |
| `GET` | `/api/v1/designations/archived` | `org.view` | Paginated query of archived designations with archive metadata and actor |
| `GET` | `/api/v1/designations/stats` | `org.view` | 7-metric KPI aggregation (Total, Active, Archived, Staff, Staffed, Empty, Depts) |
| `GET` | `/api/v1/designations/analytics` | `org.view` | Workforce distribution, grade breakdown, and department-wise shares |
| `GET` | `/api/v1/designations/:id` | `org.view` | Enriched single designation details with assigned staff roster |
| `POST` | `/api/v1/designations` | `org.manage` | Create new designation with validation and department code uniqueness |
| `PATCH` | `/api/v1/designations/:id` | `org.manage` | Update designation details, code, grade tier, department, or status |
| `PATCH` | `/api/v1/designations/:id/archive` | `org.manage` | Soft-archive designation (`isArchived: true, archivedAt, archivedBy`) |
| `PATCH` | `/api/v1/designations/:id/restore` | `org.manage` | Restore archived designation back to active listing |
| `DELETE` | `/api/v1/designations/:id/permanent` | `org.manage` | Permanently delete designation (strictly blocked if $\ge 1$ employee assigned) |
| `DELETE` | `/api/v1/designations/:id` | `org.manage` | Soft-delete designation (guarded against assigned active employees) |

---

## 5. UI/UX Design System Compliance

Conforms strictly to `DESIGN.md` and `docs/UI-REFERENCE.md` in the **Forest & Emerald Enterprise** theme:
- Canvas: `#061A14` / `#0B130E`
- Surfaces & Cards: `#111D17` with `#1A3125` hairline borders
- Primary Brand Accent: Emerald `#00C471`
- Semantic Grade Badges:
  - Junior: Slate (`#64748B`)
  - Mid: Cobalt Blue (`#3B82F6`)
  - Senior: Emerald (`#00C471`)
  - Lead: Purple (`#8B5CF6`)
  - Executive: Amber (`#F59E0B`)
- Monospace font for official designation and department codes (`font-mono text-xs`)
- Responsive multi-column grid and high-density tabular presentation
