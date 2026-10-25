---
status: complete
date: 2026-10-25
slug: 20261025-org-chart-refresh-button
---

# Quick Task Summary: Org Chart Module Refresh Action

## Overview
Added direct, in-app data reload functionality to the Organizational Chart (`/org-chart`) page, eliminating the need for users to manually reload the entire browser page to reflect recent employee or reporting structure updates.

## Changes Made
1. **OrgChartPage (`frontend/src/features/departments/pages/OrgChartPage.jsx`)**:
   - Extracted `isFetching` and `refetch` from `useGetOrgChartQuery()`.
   - Created `handleRefresh` with instant toast notification via `sonner` (`toast.success('Org chart reloaded successfully')`).
   - Added `Refresh` button in `PageHeader` actions beside "Find My Position" with animated `RefreshCw` spinner when reloading.
   - Added `Reload Chart` pill in the Department Filter tabs bar.
   - Added `Refresh` button in the canvas zoom/control toolset bar.
2. **PageHeader Component (`frontend/src/components/common/PageHeader.jsx`)**:
   - Added support for `children` prop fallback for `displayActions` (`actions || action || children`).

## Verification
- Vite production build passed cleanly (`✓ 1819 modules transformed, 0 errors, built in 10.22s`).
