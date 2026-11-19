# Phase 32: Audit Log Module — UI Refinement Phase 2 | Research & Architectural Foundations

## Executive Summary

Phase 32 builds upon the successful backend and frontend overhaul established in Phase 31. While Phase 31 established the underlying schema, aggregation pipelines, streaming export, and the initial multi-view explorer, forensic inspection reveals several critical UI/UX and data attribution deficiencies:
1. **Actor Identity Loss**: The backend populated `actorId` with `firstName`, `lastName`, and `profilePicture`—fields that do not exist on the Mongoose `User` model (which stores `avatar`, `roles`, and references `Employee` via `employeeId`). Consequently, actor information in the UI was reduced to a truncated email string and basic role text.
2. **Inconsistent Button & Pill Tokens**: Buttons across the module used inconsistent borders, hover states, and background tints. Badges for actions, severities, and statuses lacked a unified semantic mapping adhering to `docs/UI-REFERENCE.md`.
3. **Inspect Details Modal Layout**: The forensic inspection modal (`AuditLogDiffModal.jsx`) lacked structured actor profile presentation, visual change highlighting was rudimentary, and metadata density was suboptimal for enterprise compliance officers.
4. **Retention Modal Interaction Flow**: `AuditRetentionModal.jsx` lacked clear statutory explanations (Pakistan labor compliance 365-day retention mandate), lacked a guarded two-step archival confirmation dialog, and presented raw form inputs without policy status cards.
5. **Multi-View Explorer Polish**: Table view, Timeline view, User Activity view, Filter toolbar, and Export modal required visual polish, proper avatar image loading with fallback initial generators, and seamless theme support (Elvara Forest & Emerald).

---

## 1. Actor Data Flow & Population Analysis

### Model Relationships
- **AuditLog Model (`backend/src/models/auditLog.model.js`)**:
  - `actorId`: References `User` (`_id`).
  - `actorEmail`: Snapshot string (`system` by default).
  - `actorRole`: Snapshot string (`SYSTEM` by default).
- **User Model (`backend/src/models/user.model.js`)**:
  - `email`: String.
  - `avatar`: String (URL).
  - `isActive`: Boolean.
  - `roles`: Array of ObjectIds referencing `Role`.
  - `employeeId`: ObjectId referencing `Employee`.
- **Employee Model (`backend/src/models/employee.model.js`)**:
  - `name`: Full string name.
  - `employeeCode`: Unique employee code (e.g., `EMP-001`).
  - `avatar`: String (profile image URL).
  - `departmentId`: ObjectId referencing `Department` (`name`, `code`).
  - `designationId`: ObjectId referencing `Designation` (`title`, `grade`).
  - `status`: Employment status (`Active`, `Notice Period`, `Resigned`, `Terminated`).

### Required Population Strategy
To deliver the requested Actor details (Full Name, Avatar, Employee ID, Email, Role, Designation, Department, Account Status) without breaking existing data or leaking sensitive credentials, Mongoose population in `queryAuditLogs` and `getAuditLogById` must execute a two-level deep population:
```javascript
.populate({
  path: 'actorId',
  select: 'email avatar isActive roles employeeId',
  populate: [
    { path: 'roles', select: 'name label' },
    {
      path: 'employeeId',
      select: 'name employeeCode avatar departmentId designationId status',
      populate: [
        { path: 'departmentId', select: 'name code' },
        { path: 'designationId', select: 'title titleUrdu grade' }
      ]
    }
  ]
})
```

### Edge Cases Handled:
1. **Automated System Tasks / Crons**: `actorId` is null. Helper safely derives:
   - Name: `System Automation Engine`
   - Code: `SYS-CRON`
   - Role: `SYSTEM`
   - Status: `Automated`
   - Department: `Infrastructure & Kernel`
2. **Standalone Admin Accounts (No Employee Record)**: `actorId.employeeId` is null. Helper extracts name from email prefix, displays role as assigned, and sets designation to `System Administrator`.
3. **Historical / Deleted User Accounts**: `actorId` fails to resolve. Fallback to immutable snapshots `actorEmail` and `actorRole` with `Historical Archive` status.

---

## 2. Design System Tokens & Semantic Color Palette

Per `docs/UI-REFERENCE.md`, the HRM system strictly follows the **Elvara Enterprise Design System**:
- **Brand Colors**: Emerald Primary `#00C471`, Primary Dark Hover `#049856`, Forest Background `#061A14`.
- **Surfaces**: Canvas `#F8FAFC`, Surface Cards `#FFFFFF`, Borders `#EAECF0`.

### Standardized Semantic Tinted Pills:
| Concept | Light Theme Classes | Dark Theme Classes | Example Usage |
| :--- | :--- | :--- | :--- |
| **Success** | `bg-emerald-50 text-emerald-700 border-emerald-200` | `dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20` | `SUCCESS`, Active accounts |
| **Failure / Critical** | `bg-rose-50 text-rose-700 border-rose-200` | `dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20` | `FAILURE`, `CRITICAL` severity, Deleted |
| **High / Alert** | `bg-orange-50 text-orange-700 border-orange-200` | `dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20` | `HIGH` severity, Overrides |
| **Warning / Review** | `bg-amber-50 text-amber-700 border-amber-200` | `dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20` | `MEDIUM` severity, Warning, Pending |
| **Administrative / Info** | `bg-indigo-50 text-indigo-700 border-indigo-200` | `dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20` | `ADMINISTRATIVE`, Configs |
| **Security / Auth** | `bg-cyan-50 text-cyan-700 border-cyan-200` | `dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20` | `AUTHENTICATION`, `SECURITY` |
| **Neutral / Low** | `bg-slate-100 text-slate-700 border-slate-200` | `dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700` | `LOW` severity, `DATA_CHANGE`, Read |

---

## 3. UI Component Inspection & Refinement Targets

### A. Master Explorer Table View (`AuditLogTableView.jsx`)
- **Actor Column**: Replace simple text with a rich identity card component:
  - User avatar image (with fallback initials in a styled emerald/forest circle).
  - Full Name (`text-foreground font-semibold`).
  - Employee Code badge (`text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono px-1.5 py-0.5 rounded`).
  - Role pill + Department subtitle in `text-[10px] text-muted-foreground`.
- **Action & Severity**: Distinct badges with high contrast and subtle icons.
- **Forensics CTA Button**: Consistent secondary outline button (`hover:border-primary hover:text-primary transition-all`).

### B. Forensic Details Modal (`AuditLogDiffModal.jsx`)
- **Top Header**: Event title, status pill, severity tag, category badge, timestamp, reference ID.
- **Actor Identity Block**: Two-column responsive card featuring avatar, name, employee ID, role badge, designation, department, email, and active status pill.
- **Activity Summary & Execution Context**: Target entity, model, target ID, client IP, parsed browser/OS, device type.
- **State Transition Diff**: Enhanced side-by-side inspection with:
  - Key identifier badge.
  - Changed, Added, and Removed indicators.
  - Formatted JSON / primitive values with syntax color coding.
  - Tabbed toggle between "Visual Field Diff" and "Raw Forensic JSON".

### C. Statutory Retention Modal (`AuditRetentionModal.jsx`)
- **Compliance Badge**: "Pakistan Statutory Labor Records Compliance (365 Days)".
- **Policy Summary Cards**: Active records, Archived records, Immutability policy assurance.
- **Threshold Controller**: Day slider/input with dynamic preview of eligible records.
- **Guarded Action**: Two-step confirmation preventing accidental archival.

### D. Export Modal (`AuditExportModal.jsx`)
- Use Redux access token from state (`useSelector((state) => state.auth.accessToken)`) or cookie fallback instead of plain `localStorage.getItem('token')`.
- Clean layout with format choice, active filter recap, and live progress state.

---

## 4. Verification & Testing Strategy

- **Backend Unit Tests**: Verify two-level deep population, actor identity normalization, and non-blocking fallbacks (`backend/tests/audit.actor.enrichment.test.js`).
- **Regression Tests**: Ensure existing 32 tests in `backend/tests/` remain 100% green.
- **Frontend Quality Gates**: 0 Oxlint errors, clean Vite production build.
