# Audit Log Module — Stage 2 UI Refinement, Actor Enrichment & Modal Overhaul

## Architectural Decisions & Enhancements
- **Deep Actor Population**: Resolved `actorId` via a 2-level Mongoose population path (`User` $\rightarrow$ `roles`, `employeeId` $\rightarrow$ `departmentId`, `designationId`).
- **Normalized Actor Structure**: Added `formatAuditActor` in `audit.service.js` which guarantees consistent output `{ name, avatar, employeeCode, email, role, designation, department, accountStatus, employmentStatus, isSystem }` for:
  1. Full employees with linked accounts.
  2. Standalone administrators.
  3. Automated background jobs / system daemons.
- **Design Tokens**: Standardized all semantic tinted pills (Emerald, Rose, Amber, Orange, Indigo, Cyan, Slate) and buttons (Primary `#00C471`, Outline, Ghost, Danger) per `docs/UI-REFERENCE.md` inside `auditTheme.js`.
- **View Overhauls**:
  - `AuditLogTableView.jsx`: Rich Actor column with avatars, name, employee code badge, role pill, department, and outline "Inspect" action.
  - `AuditLogTimelineView.jsx`: Enriched timeline nodes with full actor credentials and date-grouped headers.
  - `AuditLogUserActivityView.jsx`: Actor group cards with photo avatars, mini operation KPI counters, and quick inspection lists.
- **Modal Overhauls**:
  - `AuditLogDiffModal.jsx`: Full actor profile card, 4-card execution context (Resource, IP/Origin, Device/OS, User-Agent), dual-mode Before/After diff matrix (visual field comparison + raw JSON).
  - `AuditRetentionModal.jsx`: Pakistan statutory 365-day compliance card, live active/archived record metric counters, guarded two-step archival confirmation dialog.
  - `AuditExportModal.jsx`: Authenticated Redux token integration with active filter scope preview.
- **Verification**: 34/34 passing Vitest tests, 0 Oxlint errors, and successful Vite production build.
