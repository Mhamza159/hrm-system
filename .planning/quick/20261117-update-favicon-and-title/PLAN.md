# Quick Task: Update Project Favicon & Title

**Task**: Update the project title and favicon to properly reflect the **ELVARA HRM Enterprise** brand identity across all browser tabs.  
**Path**: `.planning/quick/20261117-update-favicon-and-title/PLAN.md`  
**Date**: 2026-11-17  
**Status**: in-progress

---

## 1. Objectives

1. **Browser Tab Title**:
   - Replace generic `<title>frontend</title>` in `frontend/index.html` with professional brand title:  
     `<title>ELVARA | HRM Enterprise</title>`
   - Add enterprise meta description and brand theme color:
     - `description`: `ELVARA HRM Enterprise — Advanced Human Resource, Payroll, Attendance & Lifecycle Management Platform`
     - `theme-color`: `#061A14` (matching ELVARA Forest & Emerald header archetype)

2. **Custom Favicon SVG**:
   - Replace default purple/blue Vite/shadcn SVG at `frontend/public/favicon.svg` with a bespoke, scalable vector favicon.
   - Design:
     - Crisp 64x64 geometric emblem in Forest & Emerald theme (`#061A14` background squircle with `#00C471` vibrant emerald emblem).
     - Incorporates stylized geometric "E" monogram with corporate hierarchy elements.
     - Optimized for high legibility at 16x16, 32x32, and 48x48 on both dark and light browser chrome.

3. **Build & Quality Verification**:
   - Verify `npm --prefix frontend run build` completes cleanly with the new favicon and title emitted into `dist/`.
   - Ensure zero runtime or compilation regressions.
