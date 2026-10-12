# Official UI Reference Specification — HRM System

> **Official Design Benchmark**: [`docs/ui-reference.png`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/ui-reference.png)  
> Every current and future screen, modal, card, and component across the HRM System must strictly adhere to the layout, color palette, typography, spacing, and styling defined below.

---

## 1. Overall Architectural Layout

- **Split View Paradigm**:
  - **Left Sidebar**: Fixed full-height navigation bar (~280px–300px width) in **Deep Forest Black-Green** (`#061A14`).
  - **Main Workspace Area**: Light Slate/Gray canvas background (`#F8FAFC`) on the right.
- **Top Elevation**: Pure White Topbar (`#FFFFFF`) with a 1px border bottom (`#EAECF0`), anchoring global search, theme toggle, and user status profile.
- **Workspace Hierarchy**:
  - Global `PageHeader` featuring greeting title, contextual description, and right-aligned calendar/live-clock status card.
  - Responsive multi-row grid composed of discrete, high-craft white cards (`rounded-2xl`, 1px border `#EAECF0`, subtle shadow).

---

## 2. Color Palette & Semantic Tokens

| Token Name | Hex Code | Visual Application |
| :--- | :--- | :--- |
| **Brand Primary (Emerald)** | `#00C471` / `#05B86B` | Active menu pills, primary CTA buttons, brand badges, progress fills, live time indicators |
| **Brand Primary Dark** | `#049856` | Hover state for primary buttons and active pills |
| **Sidebar Background** | `#061A14` | Left navigation sidebar background |
| **Sidebar Card / Muted** | `#0C2B21` | Sidebar elevated cards, subtle hover backgrounds |
| **App Canvas (Light)** | `#F8FAFC` | Workspace background canvas |
| **Surface Card (Light)** | `#FFFFFF` | All cards, modals, dropdown menus, data tables |
| **Border Subdued** | `#EAECF0` / `#E2E8F0` | 1px card borders, table dividers, topbar bottom border |
| **Text Heading** | `#0F172A` | Primary card headers, greeting title, table headers |
| **Text Body** | `#334155` | Data table cells, form values, descriptive copy |
| **Text Muted** | `#64748B` / `#94A3B8` | Subtitles, timestamps, metadata labels, icon accents |
| **Accent Emerald (Success)** | `#10B981` | Completed tasks, active accounts, positive status pills |
| **Accent Blue (In Progress)** | `#3B82F6` | In Progress items, active projects, progress donut ring |
| **Accent Purple (Dev / Track)** | `#8B5CF6` | Under development stat card, secondary metrics |
| **Accent Amber (Warning / Review)** | `#F59E0B` | Pending approvals, review queues, medium priority pills |
| **Accent Red (Danger / Badge)** | `#EF4444` | Notification count badges, deactivation buttons, critical errors |
| **Accent Cyan (On Hold)** | `#06B6D4` | On-hold status markers |

### Semantic Tinted Status Pills
Status badges use a light tinted pastel background with bold text in the same accent color:
- **Active / Completed / Success**: `bg-emerald-50 text-emerald-700 border border-emerald-150`
- **In Progress / Info**: `bg-blue-50 text-blue-700 border border-blue-150`
- **Review / Pending / Medium**: `bg-amber-50 text-amber-700 border border-amber-150`
- **Deactivated / Danger**: `bg-rose-50 text-rose-700 border border-rose-150`
- **Offline / Muted / Draft**: `bg-slate-100 text-slate-700 border border-slate-200`

---

## 3. Sidebar Specification (`docs/ui-reference.png`)

- **Container**: Fixed width `280px`, background `#061A14`, zero borders on the right or thin subtle `#0B281F`.
- **Brand Header (Top)**:
  - Height: `72px`, padded `px-6`.
  - Icon: Rounded-xl square badge (`w-9 h-9`) in `#00C471` with clean white brand emblem.
  - Typography: **ELVARA** / **HRM PORTAL** in `text-lg font-bold tracking-wider text-white`.
- **Navigation Links**:
  - Margin & Padding: `px-3.5 py-2.5`, radius `rounded-xl`.
  - Default Item: `text-white/70 hover:text-white hover:bg-white/5 font-medium text-sm flex items-center gap-3`. Outline Lucide icons (`18px`).
  - Active Item: Solid `#00C471` emerald pill, full width, `text-white font-semibold text-sm shadow-[0_2px_8px_rgba(0,196,113,0.3)]`.
  - Counter Badges: Pill on right in `#00C471` or `#10B981` with white bold text (e.g., `1`, `3`).
- **Section Dividers**:
  - Section title: "ADMIN" in `text-[11px] font-semibold text-emerald-400/60 uppercase tracking-widest px-3.5 mt-6 mb-2`.
  - Child items: Users & Roles, Reports, Settings.
- **User Footer (Bottom)**:
  - Border top `1px border-emerald-950/80`, padding `p-4`.
  - Round avatar `w-9 h-9 rounded-full`.
  - Name: `text-sm font-semibold text-white truncate`.
  - Role: `text-xs font-medium text-emerald-400` ("General" / role name).
  - Logout action: Outline logout icon `w-4 h-4 text-white/50 hover:text-white cursor-pointer ml-auto`.

---

## 4. Topbar Specification (`docs/ui-reference.png`)

- **Container**: Height `70px`, background `#FFFFFF`, border-b `1px solid #EAECF0`, padded `px-8`.
- **Global Search (Left)**:
  - Shape: Fully rounded `rounded-full` (`h-10 w-[320px] md:w-[380px]`).
  - Style: Background `#FFFFFF`, border `1px solid #E2E8F0`, placeholder "Search anything..." (`text-xs text-slate-400`).
  - Search icon (`16px`) in `#94A3B8`.
  - Shortcut Key Chip: Right-aligned chip `"⌘K"` in `bg-slate-100 border border-slate-200 text-slate-500 rounded px-1.5 py-0.5 text-[10px] font-mono`.
- **Utility Actions (Right)**:
  - Bell Notification: Outline bell (`20px`, `#64748B`), with round red pill count badge (`w-4 h-4 text-[10px] bg-rose-500 text-white font-bold`).
  - Dark Mode Toggle: Outline moon icon (`20px`, `#64748B hover:text-slate-900`).
  - Vertical Separator: `h-6 w-[1px] bg-slate-200 mx-2`.
  - User Status Capsule:
    - Round avatar `w-8 h-8 rounded-full`.
    - Stacked text: Name in `text-xs font-bold text-slate-900`, Subtitle with green status dot + `"Member"` in `text-[11px] font-medium text-emerald-600`.
    - Dropdown chevron or logout action icon.

---

## 5. Page Header & Cards Specification

- **Header Block**:
  - Title: Greeting text `text-2xl font-bold text-slate-900 tracking-tight` (e.g. "Good Afternoon, Basit Aziz 👋").
  - Subtitle: `text-xs text-slate-500 mt-1`.
  - Right Status Card: White card `bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm`.
    - Calendar icon + Date string ("Oct 12, 2026").
    - Small separator dot `#CBD5E1`.
    - Green-tinted live pill: `bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5` with pulsing green dot.
- **Grid Layout**:
  - Row 1: 4 Stat Cards (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5`).
  - Row 2: 3 Cards (Progress Donut, Status Bar Chart, Recent Activity Feed).
  - Row 3: 3 Cards (My Projects, Upcoming Deadlines, Team Members).
- **Card Primitives**:
  - Radius: `rounded-2xl` (~16px).
  - Border: `1px solid #EAECF0`.
  - Surface: Pure `#FFFFFF`.
  - Padding: `p-5` to `p-6`.
  - Header actions: Right-aligned emerald link `text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1` ("View All >") or arrow icon.

---

## 6. Shared Component Guidelines

1. **Buttons**:
   - Primary: Solid Emerald `#00C471`, `hover:bg-[#049856]`, `text-white font-medium rounded-xl px-4 py-2 text-xs shadow-sm`.
   - Secondary / Outline: White background, border `1px solid #E2E8F0`, `text-slate-700 hover:bg-slate-50 rounded-xl`.
   - Danger: Soft Rose `bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl`.
2. **DataTable**:
   - Header: Light slate text (`#64748B`), uppercase tracking-wider `text-[11px] font-semibold bg-slate-50/70 border-b border-slate-200 py-3 px-4`.
   - Row Dividers: `border-b border-slate-100 hover:bg-slate-50/80 transition-colors`.
   - Cells: `text-xs text-slate-700 py-3.5 px-4`.
   - Status Badges: Tinted pill components.
3. **Form Controls (Inputs, Selects, Modals)**:
   - Inputs: `bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-800 rounded-xl px-3.5 py-2.5`.
   - Labels: `text-xs font-semibold text-slate-700 block mb-1.5`.
   - Error messages: `text-xs text-rose-500 mt-1`.
   - Modals / Dialogs: White surface `#FFFFFF`, `rounded-2xl`, border `1px solid #EAECF0`, backdrop `bg-slate-900/40 backdrop-blur-sm`.
