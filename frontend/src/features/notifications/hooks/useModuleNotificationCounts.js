/**
 * @file useModuleNotificationCounts.js
 * @description Custom hook mapping backend unread notification categories to sidebar modules & routes.
 */

import { useGetNotificationUnreadSummaryQuery } from '../notificationsApi.js';

export function useModuleNotificationCounts() {
  const { data } = useGetNotificationUnreadSummaryQuery(undefined, {
    pollingInterval: 30000
  });

  const summary = data?.data || { totalUnread: 0, byType: {}, byLink: {} };
  const byType = summary.byType || {};
  const byLink = summary.byLink || {};

  // Group-level unread counts for collapsible sidebar categories
  const groupCounts = {
    'Attendance': (byType.attendance || 0),
    'Leaves & Holidays': (byType.leave || 0),
    'Payroll': (byType.payroll || 0),
    'Loans & Advances': (byType.loan || 0),
    'Expenses': (byType.expense || 0),
    'Assets': (byType.asset || 0),
    'Projects & Timesheets': (byType.project || 0) + (byType.timesheet || 0),
    'Performance': (byType.performance || 0),
    'Lifecycle': (byType.resignation || 0) + (byType.onboard || 0)
  };

  // Route-level unread counts for individual child items
  const getRouteCount = (routePath) => {
    if (!routePath) return 0;
    if (byLink[routePath] !== undefined) {
      return byLink[routePath];
    }
    // Check partial prefix matching (e.g. /leaves/approvals matching /leaves/approvals/6aea...)
    let count = 0;
    for (const [link, c] of Object.entries(byLink)) {
      if (link && link.startsWith(routePath) && routePath !== '/') {
        count += c;
      }
    }
    return count;
  };

  return {
    totalUnread: summary.totalUnread || 0,
    groupCounts,
    getRouteCount
  };
}

