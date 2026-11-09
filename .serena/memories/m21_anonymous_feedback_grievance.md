# Module M21 — Anonymous Feedback & Grievance Architectural Decisions

- **BUILD-GUIDE Section**: 28 (Rows 21.1 to 21.6)
- **Status**: Completed and Verified with Vitest (18/18) & Playwright Chromium E2E (All 4 roles)

## Security Invariants & Business Logic
1. **Zero-Trust Anonymity (Row 21.1)**:
   - When `isAnonymous: true`, Mongoose pre-save hook and service force `submittedBy = null`.
   - Complainant receives unique crypto tracking code (`TRK-XXXXXX`).
2. **Lifecycle & Case Notes (Row 21.2)**:
   - Stages: `Submitted` -> `Under Review` -> `In Investigation` -> `Resolved` (or `Dismissed`/`Escalated`).
   - Investigation notes have `isPublicToComplainant` flag; private notes are filtered out from public tracker.
3. **Quarantined Harassment Channel (Row 21.3)**:
   - Harassment complaints are quarantined from regular HR list queries (`category != 'Harassment'`).
   - Dedicated permission `grievance.committee` required to view or manage Harassment cases.
   - Super Admin has master compliance override.
4. **Public Status Tracker (Row 21.4)**:
   - Unauthenticated `GET /api/v1/feedback/track/:code` gives complainant real-time timeline and public updates.
5. **Super Admin Escalation (Row 21.5)**:
   - `PATCH /api/v1/feedback/:id/escalate` sets `isEscalated: true` and notifies Super Admin.
6. **Department Manager Isolation (Row 21.6)**:
   - Department Managers have `None` access to administrative feedback APIs (returns HTTP 403 Forbidden).
   - Sidebar completely hides "Grievance Admin" and "Inquiry Committee" for Department Managers.
