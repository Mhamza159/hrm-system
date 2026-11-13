---
task: on-leave-modal-ui-redesign
date: 2026-11-13
status: in-progress
---

# Quick Task: On-Leave Attendance Blocking Modal UI Redesign

## Objectives
1. **Redesign OnLeaveModal Component**:
   - Transform `frontend/src/features/attendance/components/OnLeaveModal.jsx` to adhere 100% to the **Forest & Emerald Enterprise Craft** archetype specified in `DESIGN.md` and `docs/UI-REFERENCE.md`.
   - Eliminate generic AI color gradients (`from-amber-600 to-rose-600`), unpolished warning callouts with harsh orange contrast, and cartoonish iconography.
   - Implement hairline 1px borders (`border-slate-200` / `border-slate-800`), refined emerald accents (`#00C471`), `rounded-2xl` modal boundary with subtle shadows, and crisp typography (`Outfit` / `Geist`).
   - Clean up leave category badge, monospace date duration (`font-mono tabular-nums`), submitted reason card, and an informative, reassuring self-service leave cancellation notice.
   - Refactor primary action button to use the enterprise emerald design system (`bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700`) with clear status spinners and icons.
2. **Verification**:
   - Verify frontend production build (`npm --prefix frontend run build`).
   - Verify existing attendance tests to ensure zero regressions.
