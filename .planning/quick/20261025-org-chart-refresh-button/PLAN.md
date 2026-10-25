# Quick Task: Add Refresh Action to Organizational Chart Module

## Goal
Add a dedicated data-refresh action to the Organizational Chart (`/org-chart`) module so users can instantly reload company hierarchy and reporting structure from the server without having to reload the browser.

## User Requirements
1. **Org Chart Data Reload**:
   - Provide a prominent "Refresh" action button in `OrgChartPage.jsx`.
   - Trigger RTK Query `refetch()` for `useGetOrgChartQuery()`.
   - Provide active loading state (`isFetching`) with an animated spinning `RefreshCw` icon and disabled state while fetching.
   - Display instant feedback toast via `sonner` (`toast.success('Org chart reloaded successfully')`).
2. **Placement**:
   - **Page Header**: Add styled Refresh button in `PageHeader` actions beside "Find My Position".
   - **Canvas Controls Bar**: Add quick-refresh tool button in the canvas zoom/control strip.
3. **PageHeader Component Enhancements**:
   - Support `children` prop alongside `actions` in `PageHeader.jsx` to ensure clean composition.

## Implementation Slices
1. **FE-1**: Enhance `PageHeader.jsx` to accept `children` as fallback for `displayActions`.
2. **FE-2**: Update `OrgChartPage.jsx` with `RefreshCw` icon, `isFetching` state, `handleRefresh` logic with `sonner` toast notification, and render the refresh action in both header and canvas toolbar.
3. **VERIFY**: Run Vite production build to verify zero syntax, bundle, or type issues.
