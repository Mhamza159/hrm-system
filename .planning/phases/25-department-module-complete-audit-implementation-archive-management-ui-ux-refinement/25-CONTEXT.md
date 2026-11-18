# Phase 25: Department Module — Complete Audit, Implementation, Archive Management & UI/UX Refinement

## 1. Executive Summary & Audit Findings

The **Department Module** (Module M4 / Slice 4.1) is the foundational organizational backbone of the HRMS. It governs business directorates, division hierarchies, head assignments, and workforce allocations across all functional domains.

### Comprehensive Audit Analysis:

1. **Schema & Model Gaps (`department.model.js`)**:
   - **Current State**: Schema only has basic fields `name`, `code`, `description`, `parentId`, `headId`, `isActive`, `isDeleted`, `createdBy`.
   - **Gaps**:
     - No explicit archival tracking: Lacks `isArchived: { type: Boolean, default: false }`, `archivedAt`, and `archivedBy`.
     - `isDeleted` was previously used as a naive soft delete flag without a distinct archival lifecycle, making it impossible to separate active, archived, and permanently purged records.
     - Compound query indexes are missing for `{ isArchived: 1, isDeleted: 1 }`, `{ parentId: 1, isArchived: 1 }`.

2. **Backend Services & Lifecycle Gaps (`department.service.js` & `department.controller.js`)**:
   - **Current State**: Only provides basic CRUD (`getAllDepartments`, `getDepartmentById`, `createDepartment`, `updateDepartment`, `deleteDepartment`, `getHeadCandidates`).
   - **Gaps**:
     - No dedicated archival endpoint (`PATCH /api/v1/departments/:id/archive`).
     - No dedicated restore/revert endpoint (`PATCH /api/v1/departments/:id/restore`) with uniqueness & circular hierarchy conflict validation.
     - No dedicated permanent delete endpoint (`DELETE /api/v1/departments/:id/permanent`).
     - **CRITICAL RESTRICTION GAP**: Permanent delete must strictly verify that **zero employees** (both active and inactive) are currently assigned to the department in MongoDB. If even one employee is linked (`departmentId == id`), the permanent deletion MUST be rejected with HTTP 400.
     - Child department cascade guard: Cannot archive or permanently delete if sub-departments exist without explicit reassignment.
     - New employee assignment guard: The employee onboarding and editing services (`employee.service.js`) must verify that new employees cannot be assigned to an archived or inactive department.
     - No KPI summary aggregation endpoint (`GET /api/v1/departments/stats`) providing live database counts: Total Departments, Active, Archived, With Employees, Without Employees.

3. **Frontend UI/UX & Architecture Gaps (`DepartmentsPage.jsx`)**:
   - **Current State**: Single flat table without an **Archive tab**, without KPI summary cards, without backend pagination or multi-filters.
   - **Gaps**:
     - Missing dual-tab switcher: **Active Departments** vs **Archived Departments** (with real-time count badges).
     - Missing KPI Stat Cards (Total Departments, Active Departments, Archived Departments, With Assigned Staff, Unassigned/Empty Units).
     - Missing **DepartmentDetailModal.jsx** to inspect unit hierarchy, assigned department head, created metadata, and assigned staff roster.
     - Missing **DepartmentArchiveModal.jsx** with clear warnings regarding existing staff associations.
     - Missing **DepartmentRestoreModal.jsx** with conflict checks.
     - Missing **DepartmentPermanentDeleteModal.jsx** with authoritative **Employee Guard**: if staff are assigned, the delete button is disabled and a prominent red blocker message advises the user to reassign staff first.

---

## 2. Critical Business Rules & Invariants

1. **Employee Assignment Restriction Guard (Non-Negotiable)**:
   - **Rule**: A department must **NEVER** be permanently deleted as long as one or more employees are assigned to it.
   - **Backend Enforcement**:
     ```javascript
     const assignedCount = await Employee.countDocuments({ departmentId: id });
     if (assignedCount > 0) {
       throw new ApiError(
         400,
         `This department cannot be permanently deleted because ${assignedCount} employee(s) are still assigned to it. Please reassign all employees to another department before proceeding.`
       );
     }
     ```
   - **Data Integrity**: Under no circumstance shall employee records be cascade-deleted or silently stripped of their department association during department operations.

2. **Archived Department Assignment Guard**:
   - Employees already assigned to a department before it was archived maintain their historical link.
   - However, **no new employee onboarding or reassignment** may assign an employee to an archived or deleted department (`isArchived: true` or `isDeleted: true`).

3. **Sub-Department Hierarchy Guard**:
   - A department cannot be archived or permanently deleted if active sub-departments report to it (`parentId: id`). Sub-departments must first be reassigned to a new parent or to the top level.
   - Circular hierarchy is strictly blocked during creation, updating, or restoration.

4. **Code and Name Uniqueness**:
   - Department code (`code`) is uppercase, alphanumeric, and globally unique among non-purged departments.
   - Restoring an archived department must check for conflicts against existing active departments.

---

## 3. RBAC & PBAC Permissions Matrix

Complies strictly with `backend/src/shared/permissions.js` under `module: 'organization'`:

| Action | Required Permission | Description | Allowed Roles |
| :--- | :--- | :--- | :--- |
| `org.view` | `checkPermission('org.view')` | View department directory, hierarchy, stats, and archived list | Super Admin, HR Manager, Department Manager, Employee |
| `org.manage` | `checkPermission('org.manage')` | Create, edit, assign head, archive, restore departments | Super Admin, HR Manager |
| `org.manage` (Permanent Delete)| `checkPermission('org.manage')` | Permanently purge empty archived department from database | Super Admin only (or authorized HR with permanent delete capability) |

---

## 4. API Endpoints Specification

| Method | Endpoint | Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/departments` | `org.view` | Paginated query of active departments with hierarchy, heads, and staff counts |
| `GET` | `/api/v1/departments/archived` | `org.view` | Paginated query of archived departments with archive timestamps and actor |
| `GET` | `/api/v1/departments/stats` | `org.view` | Aggregated KPI stats (Total, Active, Archived, With Staff, Without Staff) |
| `GET` | `/api/v1/departments/:id` | `org.view` | Single department details with assigned employee roster snapshot |
| `POST` | `/api/v1/departments` | `org.manage` | Create new department with validation and circular check |
| `PATCH` | `/api/v1/departments/:id` | `org.manage` | Update department details, code, parent, or status |
| `PATCH` | `/api/v1/departments/:id/archive` | `org.manage` | Soft-archive department (marks `isArchived: true, archivedAt, archivedBy`) |
| `PATCH` | `/api/v1/departments/:id/restore` | `org.manage` | Restore archived department back to active list |
| `DELETE` | `/api/v1/departments/:id/permanent` | `org.manage` | Permanently delete department (strictly guarded by 0 assigned employees) |

---

## 5. UI/UX Architecture & Component Hierarchy

Adheres to **Forest & Emerald Enterprise Theme** (`#061A14`, `#111D17`, `#1A3125`, `#00C471`):

1. **Page Header & Quick Actions**:
   - Modern breadcrumb, authoritative title, and primary actions: "Add Department" and live data refresh.
2. **KPI Summary Cards (`DepartmentStatsCards.jsx`)**:
   - Total Units, Active Units, Archived Units, With Assigned Staff, Empty Units.
3. **Pills & Tab Navigation**:
   - Two top-level view tabs: **Active Departments (N)** and **Archived Departments (N)**.
4. **Filter Toolbar (`DepartmentFilterBar.jsx`)**:
   - Instant search (name / code), Parent Division filter, Status filter, Reset & Refresh controls.
5. **Data Table (`DepartmentsPage.jsx`)**:
   - High-density enterprise layout, department icon with squircle badge, code tag, parent pill, department head with avatar/initials, staff headcount badge, status badge, action dropdown/buttons.
6. **Modal Suite**:
   - **`DepartmentModal.jsx`**: Create / Edit department form with parent selector and code input.
   - **`DepartmentDetailModal.jsx`**: Comprehensive unit inspection with assigned staff roster and hierarchy tree preview.
   - **`DepartmentArchiveModal.jsx`**: Confirmation dialog for moving department to archive.
   - **`DepartmentRestoreModal.jsx`**: Confirmation dialog for restoring archived department.
   - **`DepartmentPermanentDeleteModal.jsx`**: Strict confirmation dialog with **Employee Guard**: displays assigned employee count; if count > 0, deletion is locked with guidance.
