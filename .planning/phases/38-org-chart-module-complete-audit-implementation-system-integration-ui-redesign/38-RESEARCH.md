# Phase 38 Research: Org Chart Module — Complete Audit, Architecture, System Integration & UI Redesign

## 1. Executive Summary & Domain Scope
The **Org Chart Module** (Row 4.5 & 4.7 in `docs/BUILD-GUIDE.md`) serves as the central visual authority for corporate hierarchy, chain-of-command, department structures, and span of control across the HRMS.

An in-depth audit of the existing implementation (`backend/src/modules/departments/department.service.js`, `department.controller.js`, and `frontend/src/features/departments/pages/OrgChartPage.jsx` + `OrgChartNode.jsx`) revealed critical architectural deficiencies, hardcoded legacy assumptions, missing view modes, performance bottlenecks on broad hierarchies, and data leakage risks.

This research establishes the comprehensive technical blueprint for transforming the Org Chart into an enterprise-grade, highly interactive, cycle-proof, PBAC-governed, dynamic organizational visualization canvas.

---

## 2. Deep-Dive Codebase Audit & Deficiencies Identified

### A. Backend & Database Deficiencies
1. **Hardcoded Executive Fallbacks**:
   - In `department.service.js` (lines 2307-2310):
     ```javascript
     const isRootExecutive = emp.employeeCode === 'EMP-000' || !emp.managerId;
     department: emp.departmentId?.name || (isRootExecutive ? 'Executive Management' : 'General'),
     designation: emp.designationId?.title || (isRootExecutive ? 'Chief Executive Officer' : 'Team Member'),
     grade: emp.designationId?.grade || (isRootExecutive ? 'Executive' : 'Mid'),
     ```
   - *Impact*: Violates Requirement 3.A ("Do not hardcode specific designations such as CEO, Director, Manager... Use actual configured employee designations and reporting relationships"). Any employee without a manager or with code `EMP-000` is forcefully labeled as "Chief Executive Officer" and "Executive Management".
   - *Remedy*: Dynamically resolve designation and department from actual populated records. If unassigned, label cleanly as `Unassigned Department` / `Unassigned Role`.

2. **No Query Filter Support in Backend Controller**:
   - `department.controller.js` `getOrgChart` completely ignores query parameters (`departmentId`, `viewMode`, `maxDepth`, `includeInactive`).
   - *Impact*: Frontend cannot request server-side scoped trees; all filtering had to happen client-side, causing unnecessary payload transfer.
   - *Remedy*: Support `req.query.departmentId`, `req.query.viewMode` (`company`, `department`, `team`, `employee`), `req.query.employeeId`, `req.query.maxDepth`, and `req.query.status`.

3. **Orphan Subtree Pruning vs Safe Rooting**:
   - In `department.service.js` lines 2351-2355: If an employee's `managerId` references a deleted or inactive user who is excluded from the query, the employee's subtree is completely pruned or dropped from the root set.
   - *Remedy*: Gracefully detect dangling manager references (`node.managerId && !employeeMap.has(node.managerId)`) and promote them to isolated root branches with a `danglingManager: true` flag so company headcounts remain 100% accurate.

4. **Missing Hierarchy Analytics Metadata**:
   - The API only returns `{ tree, reportingChain, totalNodes }`. It lacks high-value enterprise statistics: `maxDepth`, `departmentsCount`, `managersCount`, `spanOfControlAvg`, and `unassignedManagerCount`.

5. **PBAC Sensitivity Masking**:
   - In `department.service.js` lines 2304-2305, `email` and `phone` are included for all employees regardless of whether the requester has permission to view employee contact details.
   - *Remedy*: Apply PBAC field masking: if caller lacks sensitive employee read permissions, phone and personal email must be sanitized or masked (`***@company.com`, `+92-***`).

### B. Frontend & UI/UX Deficiencies
1. **Lack of True Canvas Drag-to-Pan**:
   - `OrgChartPage.jsx` currently relies solely on native container scrollbars (`overflow-auto`). There is no mouse drag-to-pan, pinch-to-zoom, or canvas navigation studio.
   - *Remedy*: Implement a lightweight, butter-smooth custom pan/zoom viewport using standard React pointer events (`onPointerDown`, `onPointerMove`, `onPointerUp`) with CSS transform translation (`translate(x, y) scale(zoom)`).

2. **Card Layout Horizontal Explosion (Span of Control Bloat)**:
   - `OrgChartNode.jsx` has a fixed card width of `w-80` (320px) with `gap-8`. If an engineering manager has 12 direct reports, the subtree expands horizontally to `12 * (320 + 32) = 4,224px`!
   - *Remedy*:
     - Support a **Compact Node View** toggle (mini chip cards: 180px wide).
     - Multi-column leaf grid mode for teams with > 5 individual contributors.

3. **Limited View Modes**:
   - Currently, there is only a flat tree with a department dropdown filter that merely fades non-matching nodes to `opacity-40`.
   - *Remedy*: Implement 4 distinct first-class view modes:
     1. **Company Hierarchy** (Executive downward).
     2. **Department Tree View** (Department units with heads and member rosters).
     3. **My Team View** (Direct reports & subordinate teams of the logged-in user).
     4. **Employee-Centered Focus** (Immediate manager above, peers sideways, and direct reports below).

4. **Missing Bulk Tree Operations**:
   - Users can only expand/collapse nodes one by one.
   - *Remedy*: Add **Expand All**, **Collapse to Level 1 (Executive)**, **Collapse to Level 2 (Heads)**, and **Depth Limiter Slider / Selector**.

5. **Basic Modal vs Enterprise Inspection Drawer**:
   - The current employee modal is a centered dialog that blocks the canvas.
   - *Remedy*: Provide an enterprise slide-over drawer that displays complete reporting hierarchy, direct reports roster with quick-nav clickability, peer navigation, and a permission-aware "View Full Profile" bridge to the Employee Module.

---

## 3. Data Flow & Architectural Integrity

```mermaid
flowchart TD
    Client["OrgChartPage.jsx (Canvas + Pan/Zoom + View Modes)"]
    API["GET /api/v1/departments/org-chart"]
    Controller["department.controller.js (Scope & Query Parsing)"]
    Service["department.service.js (Graph Engine & Cycle Prevention)"]
    DB[("MongoDB: Employee, Department, Designation")]

    Client -->|Query: dept, viewMode, depth, employeeId| API
    API --> Controller
    Controller -->|PBAC & RBAC Scoping| Service
    Service -->|Populate & Lean Query| DB
    DB --> Service
    Service -->|Cycle Detection (Visited Set)| Service
    Service -->|Multi-Root DAG + Stats + Masked Payload| Controller
    Controller --> Client
```

---

## 4. Hierarchy Validation Rules (DAG Safety)

1. **Cycle Prevention**:
   - Utilize a visited-path `Set` during depth-first tree assembly. If `visitedPath.has(nodeId)`, the branch is pruned, and a diagnostic warning is logged.
2. **Self-Reporting Guard**:
   - `if (emp.managerId && emp.managerId.toString() === emp._id.toString()) emp.managerId = null;`
3. **Mutual Reporting Guard**:
   - If Employee A reports to B and B reports to A, the loop is broken by prioritizing the higher organizational designation grade or elevating the senior record to root.
4. **Inactive & Terminated Personnel**:
   - By default, employees with status `Terminated` or `Resigned` are excluded from active reporting lines. If an active employee reports to an inactive manager, the hierarchy engine safely links the subordinate to the inactive manager's superior (skip-level re-parenting) so no subtrees become invisible.

---

## 5. UI/UX Specifications (`docs/UI-reference.md` & `DESIGN.md`)

- **Canvas Palette**: Elvara Forest `#061A14`, Blueprint dot grid `radial-gradient(#1A3125 1.5px, transparent 1.5px)` with `28px 28px` spacing.
- **Card Backgrounds**: Deep card `#111D17`, border `#1A3125`, hover glow `rgba(0, 196, 113, 0.25)`.
- **Logged-in User Node**: Distinct `#00C471` Emerald border, emerald ambient glow, and `"You"` shield pill.
- **Ancestral Reporting Path**: Animated emerald connector lines connecting the logged-in or searched user all the way to the executive root.
- **Typography**: Inter / Outfit fonts, mono badges for employee codes (`EMP-014`).
- **Responsive Controls**: Floating bottom-right or top-right HUD with Zoom In, Zoom Out, Fit-to-Screen, Reset, Compact View, and Fullscreen.

---

## 6. Implementation Plan Breakdown

- **Plan 38-01: Backend API & Hierarchy Engine Hardening** (Multi-root DAG, cycle prevention, query params, stats computation, PBAC sensitive field masking).
- **Plan 38-02: Interactive Canvas & Viewport Navigation Studio** (Custom drag-to-pan, wheel zoom, fit-to-screen, center on root, depth levels 1-5, expand/collapse all, export PNG/SVG).
- **Plan 38-03: High-Density Enterprise Node & Connector Redesign** (Elvara Forest styling, compact vs standard layout, dynamic status pills, SVG curved branch lines).
- **Plan 38-04: Multi-Dimensional Filters, Real-Time Search & View Modes** (Company Wide, Department Tree, My Team, Employee Centric, instant search illumination).
- **Plan 38-05: Employee Detail Inspection Drawer & Profile Bridge** (Slide-over drawer, direct reports roster, reporting chain breadcrumbs, peer navigation, permission-checked profile link).
- **Plan 38-06: Automated Test Suite, System-Wide End-to-End Verification & Master Phase Documentation** (Vitest integration tests, Oxlint, Vite build, Serena memory update).
