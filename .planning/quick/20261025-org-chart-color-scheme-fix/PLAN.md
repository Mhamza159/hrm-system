# Quick Task: Fix Color Scheme in Organizational Chart Page

## Goal
Harmonize the Organizational Chart (`/org-chart`) color scheme with the application's Forest & Emerald design system (`DESIGN.md`). Replace hardcoded pitch-black slate elements (`bg-slate-900`, `bg-slate-950`, `bg-[#061A14]/95`) with responsive, theme-aware surfaces (`bg-white dark:bg-[#111D17]`, `border-slate-200 dark:border-[#1A3125]`, and subtle dot-grid blueprint canvas) so the page looks coherent, premium, and unified in both light and dark modes.

## User Requirements
1. **Interactive Controls Bar**:
   - Change container from hardcoded `bg-slate-900/80 border-slate-800` to `bg-white dark:bg-[#111D17] border-slate-200 dark:border-[#1A3125] shadow-xs`.
   - Style search input with `bg-slate-50 dark:bg-[#0A110D] border-slate-200 dark:border-[#1A3125] text-slate-800 dark:text-slate-100 placeholder-slate-400`.
   - Style department filter pills to match design system: active is solid emerald `#00C471 text-white`, inactive is `bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300`, and reload chip uses subtle emerald badge styling.
   - Style Zoom/Canvas toolset with `bg-slate-50 dark:bg-[#0A110D] border-slate-200 dark:border-[#1A3125]`.
2. **Org Chart Canvas**:
   - Replace heavy black slab with theme-aware canvas: `bg-slate-50/70 dark:bg-[#061A14]/95 border-slate-200 dark:border-[#1A3125]`.
   - Add subtle architectural dot-grid blueprint pattern (`radial-gradient`).
   - Theme loading, error, and empty state messages.
3. **Node Cards (`OrgChartNode.jsx`)**:
   - Standard nodes: `bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-xs text-slate-800 dark:text-slate-100`.
   - Logged-in user (`isMe`): `bg-emerald-50/80 dark:bg-emerald-950/60 border-2 border-[#00C471] shadow-emerald`.
   - Highlighted / Reporting chain: Theme-aware borders and backgrounds.
   - Tree connector lines: `bg-slate-300 dark:bg-slate-700` (or `bg-[#00C471]` when active).
   - Expand/collapse buttons, employee code chips, contact links, and direct reports badges: Fully themed for light/dark contrast.
4. **Employee Detail Modal**:
   - Convert modal from hardcoded `#0E1713 border-slate-700` to `bg-white dark:bg-[#0E1713] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100`.
   - Theme quick details cards, reports-to box, and subordinates list.

## Implementation Slices
1. **FE-1**: Refactor `OrgChartPage.jsx` controls toolbar, canvas container, and modal dialog to use theme-aware classes.
2. **FE-2**: Refactor `OrgChartNode.jsx` node cards, badges, text colors, and SVG/div connector lines to support light and dark modes.
3. **VERIFY**: Run `npm run build` and ensure clean compilation.
