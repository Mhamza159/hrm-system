# HRM System — Design System Specification (DESIGN.md)

> **Official UI reference: docs/ui-reference.png and docs/UI-REFERENCE.md. Every screen must follow them.**
> 
> **Design Archetype:** Forest & Emerald Enterprise Craft (Inspired by Elvara Reference)  
> **Target Application:** High-Density Enterprise HRM & Payroll Admin Platform (Single Software House, Pakistan)  
> **Scripting Standard:** Plain JavaScript (`.js` / `.jsx`), Tailwind CSS, shadcn/ui (`tsx: false`)

---

## 1. Design Vision & Guiding Principles

The HRM System pairs the **engineering precision and dark-canvas craft of Linear** with the **clarity, financial trustworthiness, and tabular rigor of Stripe**. 

1. **Information Density with Breathing Room:** Human resource dashboards handle large amounts of data (attendance logs, employee records, payroll slabs). UI elements must be compact, readable, and structured without visual clutter.
2. **Hairline Precision:** Surfaces rely on 1px subtle hairline borders rather than heavy drop shadows to establish visual hierarchy.
3. **Tabular Numerics First:** All financial values (PKR in paisa), CNIC numbers, timestamps, and percentages use tabular monospace figures (`font-variant-numeric: tabular-nums`) to ensure vertical alignment in tables.
4. **Immediate Status Recognition:** Attendance and approval workflows depend on instantaneous visual comprehension. Status badges use strictly codified, immutable semantic color pairs.
5. **Bilingual Harmony:** Flawless transition between English LTR and Urdu RTL without layout breakage.

---

## 2. Typography System

### Font Stacks
```css
/* Primary UI Sans (Headings, Controls, Labels) */
--font-sans: 'Outfit', 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Data, Numerics, Code, Financials */
--font-mono: 'Geist Mono', 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;

/* Urdu Script Fallback (RTL Mode) */
--font-urdu: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Noto Sans Arabic', Tahoma, sans-serif;
```

### Type Scale & Hierarchy
| Token | Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `text-display` | `32px` | 600 (SemiBold) | `1.15` | `-0.03em` | Main dashboard titles, payroll totals |
| `text-title-lg` | `24px` | 600 (SemiBold) | `1.20` | `-0.025em` | Page headers, modal headlines |
| `text-title-md` | `18px` | 600 (SemiBold) | `1.30` | `-0.02em` | Section headers, card titles |
| `text-title-sm` | `15px` | 600 (SemiBold) | `1.35` | `-0.015em` | Table group headers, form step titles |
| `text-body` | `14px` | 400 (Regular) | `1.50` | `-0.005em` | Primary body copy, table cell content |
| `text-body-medium` | `14px` | 500 (Medium) | `1.50` | `-0.005em` | Interactive buttons, navigation items |
| `text-caption` | `12px` | 400 (Regular) | `1.40` | `0` | Field helper text, timestamps, breadcrumbs |
| `text-badge` | `11px` | 600 (SemiBold) | `1.20` | `0.02em` | Status badges, category pills (uppercase) |
| `text-stat-number` | `28px` | 600 (SemiBold) | `1.10` | `-0.02em` | KPI stat values (`tabular-nums font-mono`) |

---

## 3. Color Palettes & UI Reference Tokens (`docs/UI-REFERENCE.md`)

The official UI theme is governed by [`docs/ui-reference.png`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/ui-reference.png).

### Light Canvas (Primary Application Mode)
```css
:root {
  --bg-canvas: #F8FAFC;            /* Clean light slate workspace canvas */
  --bg-canvas-subtle: #F1F5F9;
  --bg-surface: #FFFFFF;           /* Pure white cards & modals */
  --bg-surface-card: #FFFFFF;
  --bg-surface-muted: #F8FAFC;

  --border-color: #EAECF0;          /* 1px light card & table borders */
  --border-subtle: #F1F5F9;
  --border-strong: #CBD5E1;

  --text-heading: #0F172A;          /* Slate-900 bold headings */
  --text-body: #334155;             /* Slate-700 body text */
  --text-muted: #64748B;            /* Slate-500 subtitles and timestamps */

  /* Brand Accents (Emerald Green) */
  --brand-primary: #00C471;         /* Vibrant Emerald CTA and active pills */
  --brand-hover: #049856;
  --brand-light: #E6F9F1;

  /* Sidebar Theme (Always Dark Forest) */
  --sidebar-bg: #061A14;            /* Very dark forest black-green */
  --sidebar-hover: #0C2A20;
  --sidebar-active: #00C471;
  --sidebar-border: #0B261D;
  --sidebar-muted: #4E7A68;
}
```

### Dark Canvas (Dark Mode Mode)
```css
:root.dark, body.dark {
  --bg-canvas: #0A110D;            /* Deep dark forest canvas */
  --bg-surface: #111D17;           /* Dark green-tinted card surface */
  --bg-surface-card: #13221B;
  --border-color: #1A3125;         /* Deep green hairline borders */
  --text-heading: #F8FAFC;
  --text-body: #CBD5E1;
  --text-muted: #7E9E8F;
  --brand-primary: #00C471;
  --brand-hover: #05D87D;
}
```
  /* Brand Accents (Stripe Indigo) */
  --accent-primary: #4F46E5;   /* Indigo-600 */
  --accent-primary-hover: #4338CA;
  --accent-focus-ring: rgba(79, 70, 229, 0.25);
}
```

---

## 4. Fixed Semantic HRM Status Badges

To avoid cognitive load across attendance, payroll, and leave views, these **status colors are permanently locked**:

| Status | Meaning | Light Mode (Bg / Text / Border) | Dark Mode (Bg / Text / Border) | Preview Token |
| :--- | :--- | :--- | :--- | :--- |
| **Present** | On time, in office | `bg-emerald-50 text-emerald-700 border-emerald-200` | `bg-emerald-950/40 text-emerald-400 border-emerald-800/60` | `badge-present` |
| **Late** | Arrived after grace period | `bg-amber-50 text-amber-700 border-amber-200` | `bg-amber-950/40 text-amber-400 border-amber-800/60` | `badge-late` |
| **Absent** | Missed work without leave | `bg-rose-50 text-rose-700 border-rose-200` | `bg-rose-950/40 text-rose-400 border-rose-800/60` | `badge-absent` |
| **Leave** | Approved leave day | `bg-blue-50 text-blue-700 border-blue-200` | `bg-blue-950/40 text-blue-400 border-blue-800/60` | `badge-leave` |
| **Pending** | Awaiting manager review | `bg-violet-50 text-violet-700 border-violet-200` | `bg-violet-950/40 text-violet-400 border-violet-800/60` | `badge-pending` |
| **Approved** | Leave/Expense authorized | `bg-teal-50 text-teal-700 border-teal-200` | `bg-teal-950/40 text-teal-400 border-teal-800/60` | `badge-approved` |
| **Rejected** | Request declined | `bg-red-50 text-red-700 border-red-200` | `bg-red-950/40 text-red-400 border-red-800/60` | `badge-rejected` |
| **Draft** | Payroll run unfinalized | `bg-slate-100 text-slate-700 border-slate-200` | `bg-slate-800/50 text-slate-300 border-slate-700` | `badge-draft` |
| **Paid** | Salary disbursed | `bg-cyan-50 text-cyan-700 border-cyan-200` | `bg-cyan-950/40 text-cyan-400 border-cyan-800/60` | `badge-paid` |

---

## 5. Spacing, Elevation & Corner Radius Tokens

### Border Radii
- `rounded-sm`: `4px` — Table inner chips, small status badges.
- `rounded-md`: `6px` — Standard inputs, buttons, dropdown triggers (**Default**).
- `rounded-lg`: `8px` — Cards, modals, drawers.
- `rounded-xl`: `12px` — Dashboard metric widgets, calendar outer frames.
- `rounded-full`: `9999px` — Avatars, presence indicators, pill badges.

### Elevation & Hairline Shadows
```css
/* Ambient Hairline Shadows */
--shadow-subtle: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-card: 0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--border-subtle);
--shadow-dropdown: 0 10px 25px -5px rgba(0, 0, 0, 0.20), 0 0 0 1px var(--border-strong);
--shadow-modal: 0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--border-strong);
```

---

## 6. Key HRM Component Blueprints

### A. Data-Dense Table (`DataTable.jsx`)
- **Row Height:** Compact `38px` per row (34px for extra-dense reports, 44px for card lists).
- **Header:** Sticky `top-0`, `bg-surface-1`, font uppercase `11px font-semibold text-muted tracking-wider`.
- **Numerics & Money:** Right-aligned, `font-mono tabular-nums`.
- **Search & Filter Bar:** Integrated top bar with live input search, department dropdown filter, status filter chips, and column toggle dropdown.
- **Bulk Selection:** Checkbox column with sticky selection count actions (e.g. *"Bulk Approve 4 Leaves"*).
- **Pagination:** Bottom right compact pagination (`Page 1 of 12` with `<` and `>` controls, row limit picker `[10, 25, 50, 100]`).

### B. Multi-Step Form (`EmployeeFormPage.jsx`)
- **Stepper Header:** Clean horizontal numbered progression:
  `1. Personal Details` $\longrightarrow$ `2. Contact & Emergency` $\longrightarrow$ `3. Job & Shift` $\longrightarrow$ `4. Bank Account` $\longrightarrow$ `5. Document Vault`.
- **Field Anatomy:**
  - Label: `text-body-medium font-medium` with red asterisk `*` on required fields.
  - Input: `h-9 rounded-md border-subtle bg-surface-2 focus:ring-2 focus:ring-accent-primary`.
  - Helper / Error: `text-caption text-rose-500 mt-1` directly below the offending input.
- **Footer Actions:** Sticky bottom bar with `Back`, `Save as Draft`, and primary `Next / Submit` button.

### C. Dashboard KPI Stat Cards (`StatCard.jsx`)
- Linear-inspired minimalist card:
  - Header: Metric label (`text-caption text-secondary uppercase tracking-wider`) + Lucide icon in subtle rounded badge.
  - Value: `text-stat-number font-mono tabular-nums text-primary font-bold`.
  - Footer: Trend indicator pill (`+4.2% vs last month` in emerald, `-2 absent today` in rose).

### D. Attendance Calendar (`AttendanceCalendar.jsx`)
- Month grid view based on `react-big-calendar`:
  - Weekday columns (Monday–Sunday) with distinct weekend shading (`bg-surface-2/40`).
  - Day Cell: Date number top-right; bottom area populated with compact status badges (`Present 09:02 - 18:15`, `Casual Leave`, `Pakistan Day Holiday`).
  - Quick detail popover on click with check-in method (Web / QR / Face / GPS) and punch snapshot thumbnail.

### E. Mobile-First Web Attendance Screen (`MobilePunch.jsx`)
- Optimized for phone PWA viewports (375px–420px):
  - Prominent Live Digital Clock (`text-4xl font-mono font-bold text-center tracking-tight`).
  - Real-time GPS status chip (`● Inside Office Geo-fence (92m away)` vs `▲ Outside Geo-fence`).
  - Giant Action Button: `h-16 w-full rounded-xl text-lg font-bold shadow-lg` (`Punch In` in emerald / `Punch Out` in rose).
  - Shift summary card showing today's work hours elapsed (`04h 32m / 08h 00m`).

### F. Feedback States (Loading, Empty, Error)
- **Loading:** Skeleton placeholders matching actual table rows / card structures (`animate-pulse bg-surface-3 rounded`). **Never use a full-screen blank spinning spinner**.
- **Empty State:** Minimal outline illustration or Lucide icon in a muted circle, clear title (`No Pending Leave Requests`), explanation text, and primary call-to-action button (`Apply for Leave`).
- **Error State:** Subtle destructive hairline card (`bg-rose-950/20 border-rose-900/50`), human-readable error explanation, and explicit `Retry` button.

---

## 7. Bilingual & Urdu RTL Support Strategy

The application provides a seamless single-click toggle between English (`en`) and Urdu (`ur`) via `i18next`:

1. **Root Direction Switching:**
   - When language is set to `ur`:
     ```html
     <html lang="ur" dir="rtl">
     ```
   - Automatically flips layout axes, flex directions, and sidebar dock sides.
2. **Typography Adaptation in Urdu:**
   - Urdu text natively requires **1.75–2.0 line-height** (compared to 1.5 in English) to prevent Nastaliq vowel diacritics (aerab) from clipping.
   - Font stack:
     ```css
     [dir="rtl"] body {
       font-family: var(--font-urdu);
       line-height: 1.85;
     }
     ```
3. **Tailwind Logical Properties:**
   - Use Tailwind logical properties across all components to ensure automatic mirroring:
     - `ps-4` (padding-inline-start) instead of `pl-4`
     - `pe-4` (padding-inline-end) instead of `pr-4`
     - `ms-auto` (margin-inline-start) instead of `ml-auto`
     - `border-s-2` instead of `border-l-2`
4. **Numerics in Urdu Mode:**
   - Financial amounts (PKR), CNIC numbers, and dates remain in Western Arabic digits (`1, 2, 3...`) in tabular monospace font for standard banking clarity.

---

## 8. shadcn/ui Component Inventory & CLI Commands

### Project Configuration (`components.json`)
The project is strictly plain JavaScript (Vite + React, NO TypeScript). The configuration file must enforce `"tsx": false` and place components in `.jsx` format.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": false,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Installation CLI Command
Install the 15 required components for the HRM platform:

```bash
npx shadcn@latest add button input form select dialog sheet dropdown-menu table tabs badge card calendar sonner avatar tooltip
```

### Component Mapping in HRM
| shadcn Component | File Generated | HRM Feature Usage |
| :--- | :--- | :--- |
| `button` | `@/components/ui/button.jsx` | Primary CTAs, icon buttons, punch action triggers |
| `input` | `@/components/ui/input.jsx` | Masked CNIC, search fields, text boxes |
| `form` | `@/components/ui/form.jsx` | React Hook Form + Zod resolver field wrappers |
| `select` | `@/components/ui/select.jsx` | Department, shift, and role dropdowns |
| `dialog` | `@/components/ui/dialog.jsx` | Approval modals, salary revision confirm, photo preview |
| `sheet` | `@/components/ui/sheet.jsx` | Notification drawer, quick employee edit panel |
| `dropdown-menu` | `@/components/ui/dropdown-menu.jsx` | Table row action menus (`Edit`, `Archive`, `View`) |
| `table` | `@/components/ui/table.jsx` | Core primitive for `@tanstack/react-table` |
| `tabs` | `@/components/ui/tabs.jsx` | Multi-tab employee profile, settings categories |
| `badge` | `@/components/ui/badge.jsx` | Codified status badges (`Present`, `Late`, `Paid`) |
| `card` | `@/components/ui/card.jsx` | Dashboard metric widgets, announcement cards |
| `calendar` | `@/components/ui/calendar.jsx` | Date pickers, holiday calendar inspector |
| `sonner` | `@/components/ui/sonner.jsx` | Toast notifications for mutation successes & errors |
| `avatar` | `@/components/ui/avatar.jsx` | Employee avatar with image fallback initials |
| `tooltip` | `@/components/ui/tooltip.jsx` | Truncated text hints, icon button explanations |
