---
task: on-leave-modal-ui-redesign
date: 2026-11-13
status: complete
---

# Quick Task Summary: On-Leave Attendance Blocking Modal UI Redesign

## Changes Completed

1. **Enterprise Craft Redesign (`OnLeaveModal.jsx`)**:
   - Replaced generic AI orange/pink gradient button (`from-amber-600 to-rose-600`) with high-craft brand primary button (`bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700`) adhering to `DESIGN.md` and `docs/UI-REFERENCE.md`.
   - Replaced cartoonish yellow palm tree emblem with a crisp, authoritative `CalendarClock` icon badge in a subtle amber container (`bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60`).
   - Refined the "APPROVED LEAVE IN EFFECT" status badge with hairline borders and proper font tracking.
   - Restructured the Leave Details card with 1px hairline borders (`border-slate-200` / `border-slate-800`), dedicated semantic category chips with uppercase code pills, monospace tabular duration (`font-mono tabular-nums`), and a clean quote card for submitted reasons.
   - Replaced harsh orange warning callout with an informative, reassuring self-service guidance card (`bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/40`) explaining that unused days will be credited back to annual quota immediately upon cancellation.
   - Balanced the secondary action buttons into symmetric, cleanly spaced controls (`View My Leaves` and `Keep Leave (Close)`).

## Verification
- **Frontend Production Build (`npm --prefix frontend run build`)**: PASSED (2,016 modules transformed, 0 errors).
- **Theme Compatibility**: 100% verified across Light and Dark Mode surfaces.
