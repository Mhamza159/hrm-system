# Quick Task: Leave Types Table UI Redesign (Anti-AI-Slop & Design System Alignment)

**Task**: Redesign the Leave Types (`/leaves/types`) table according to `DESIGN.md` and `docs/UI-REFERENCE.md` to remove all "AI-generated slop" and establish an authentic, high-density enterprise tabular layout.  
**Path**: `.planning/quick/20261113-leave-types-table-ui-redesign/PLAN.md`  
**Date**: 2026-11-13  
**Status**: in-progress

---

## 1. Problem Analysis & "AI Slop" Audit

From inspecting the screenshot (`media_1794556175056_b690efc1.png`) and `LeaveTypesPage.jsx`:
1. **Redundant Duplicate Search Bars**:
   - The outer section header has a search input (`Search category or code...`) and view switcher.
   - Then `DataTable.jsx` is rendered inside with `showSearch={true}` (the default), generating a SECOND full-width search input (`Search records...`). This creates an amateurish, double-input interface.
2. **Double Nested Cards & Borders**:
   - An outer `<section>` card (`rounded-2xl border p-5 shadow-xs`) wraps a `div` (`border rounded-xl`), which wraps `DataTable` (`rounded-2xl border bg-white shadow-sm`). The UI has cards inside cards inside cards with redundant padding and mismatched border radii.
3. **Overcooked Badge Styling**:
   - The leave code (`PATERNITY`, `MATERNITY`) is rendered as a loud, saturated green pill badge with uppercase letters that overpowers the category name itself. It looks like a status badge rather than a code identifier.
   - "Remuneration" uses oversized bright bubble pills (`Paid`, `Unpaid`).
   - "Medical Certificate" uses a bright blue pill with a document icon (`📄 ≥ 3 days`) or plain grey text ("Not mandatory").
   - "Carry-Forward Limit" renders as plain text "None" rather than an enterprise tabular dash (`—`) or clean numeric styling.
4. **Poor Column & Data Alignment**:
   - Header alignments do not match cell data alignments (e.g. actions header is left-aligned while action buttons are right-aligned, yearly quota is not tabular-aligned).
   - "Actions" column contains bare floating pencil and trash icons without clean container styling or tooltips.
5. **Disconnected Table Architecture**:
   - Instead of wrapping an opaque black-box `DataTable` with conflicting search state, the table should be a beautifully crafted, semantic enterprise HTML table directly integrated with the filter toolbar, matching `LeaveApprovalsPage.jsx` and `MyLeavesPage.jsx`.

---

## 2. Target Design & Implementation Plan

Following `DESIGN.md` (Forest & Emerald Craft) and `docs/UI-REFERENCE.md`:
1. **Integrated Header & Unified Toolbar**:
   - Single unified card container (`rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111D17] shadow-xs overflow-hidden`).
   - Clean top toolbar holding:
     - Left: Category filter pills (`All Active`, `Paid Quotas`, `Unpaid`, `Medical Proof Required`, `Carry-Forward`) with subtle count pills.
     - Right: Exactly ONE search input (`w-64`) with icon and clear button, plus View Mode toggle (`Table` / `Card Grid`).
   - ZERO duplicate search inputs.
2. **High-Density, Precision Table Layout**:
   - Table `thead`: `bg-slate-50/75 dark:bg-[#0E1A14] border-b border-slate-200/80 dark:border-[#1A3125]` with `text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-3.5 px-4`.
   - Table `tbody`: Clean row dividers (`divide-y divide-slate-100 dark:divide-[#1A3125]`) with subtle hover (`hover:bg-slate-50/70 dark:hover:bg-white/[0.02]`).
3. **Refined Cell Craft**:
   - **Leave Category & Code**:
     - Category name in `text-xs font-semibold text-slate-900 dark:text-white`.
     - Code rendered as a subtle monospace technical tag: `font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 px-1.5 py-0.5 rounded`.
     - Description in `text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs`.
   - **Yearly Quota**:
     - Tabular numbers first: `<span className="font-mono font-bold text-slate-900 dark:text-white text-xs tabular-nums">{row.daysPerYear}</span> <span className="text-slate-500 dark:text-slate-400 text-[11px]">days / yr</span>`.
   - **Remuneration**:
     - Paid: `bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-medium px-2 py-0.5 rounded-md`.
     - Unpaid: `bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 text-[11px] font-medium px-2 py-0.5 rounded-md`.
   - **Carry-Forward Limit**:
     - If `carryForwardMax > 0`: `<span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 tabular-nums">Max {row.carryForwardMax}</span> <span className="text-slate-500 text-[11px]">days</span>`.
     - If none: `<span className="text-slate-300 dark:text-slate-600 font-mono text-xs">—</span>`.
   - **Medical Certificate**:
     - If `requiresAttachment`: `<div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300"><FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span>Required for <strong className="font-mono font-semibold text-slate-900 dark:text-white">≥ {row.minDaysForAttachment}d</strong></span></div>`.
     - If not required: `<span className="text-slate-400 dark:text-slate-500 text-xs">Optional</span>`.
   - **Status**:
     - Active: `bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5` with 1.5x1.5 emerald dot.
     - Archived: `bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5` with 1.5x1.5 slate dot.
   - **Actions**:
     - In Active Policies: Grouped clean action buttons (Edit & Move to Archive) with refined border, subtle hover, and tooltips.
     - In Archive Bucket: Revert button (`RotateCcw` in emerald) and Permanent Delete button (`Trash2` in rose).
4. **Card Grid View Harmonization**:
   - Ensure the Card Grid view also shares the same refined typography, code tags, and remuneration badges.

---

## 3. Verification Plan
- Build frontend: `npm --prefix frontend run build` (must pass with 0 errors).
- Vitest tests: `npm --prefix backend test tests/leave.archive-lifecycle.test.js` (must keep passing 6/6).
- Visual check: verify zero double search bars, zero AI slop, hairline 1px borders, proper tabular alignment.
