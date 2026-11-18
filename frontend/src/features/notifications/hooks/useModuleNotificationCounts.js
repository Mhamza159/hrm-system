/**
 * @file useModuleNotificationCounts.js
 * @description Custom hook mapping backend unread notification categories to sidebar modules & routes.
 * 
 * Note: Real-time cache updates are driven reactively by `useSocket.js` invalidating
 * the `NotificationCounts` tag on incoming socket events (`notification:new`, `notification:read`, `notification:read_all`).
 */

import { useGetModuleNotificationCountsQuery } from '../notificationsApi.js';

export function useModuleNotificationCounts() {
  const { data, refetch } = useGetModuleNotificationCountsQuery(undefined, {
    pollingInterval: 30000 // Fallback poll every 30s
  });

  const summary = data || { totalUnread: 0, byModule: {}, byRoute: {} };
  const byModule = summary.byModule || {};
  const byRoute = summary.byRoute || {};

  // Group-level unread counts for collapsible sidebar categories
  const groupCounts = {
    'Attendance': byModule.attendance || 0,
    'Leaves & Holidays': byModule.leaves || 0,
    'Payroll': byModule.payroll || 0,
    'Loans & Advances': byModule.loans || 0,
    'Expenses': byModule.expenses || 0,
    'Assets': byModule.assets || 0,
    'Recruitment & ATS': byModule.recruitment || 0,
    'Projects & Timesheets': byModule.projects || 0,
    'Performance': byModule.performance || 0,
    'Lifecycle': byModule.lifecycle || 0,
    'Rewards & Engagement': byModule.rewards || 0,
    'Feedback & Grievance': byModule.feedback || 0
  };

  // Top-level standalone link counts
  const moduleCounts = {
    employees: byModule.employees || 0,
    policies: byModule.policies || 0,
    announcements: byModule.announcements || 0,
    chat: byModule.chat || 0,
    attrition: byModule.attrition || 0,
    reports: byModule.reports || 0,
    notifications: summary.totalUnread || 0
  };

  // Route-level unread counts for individual child items
  const getRouteCount = (routePath) => {
    if (!routePath) return 0;
    if (byRoute[routePath] !== undefined) {
      return byRoute[routePath];
    }
    // Check partial prefix matching (e.g. /leaves/approvals matching /leaves/approvals/6aea...)
    let count = 0;
    for (const [link, c] of Object.entries(byRoute)) {
      if (link && link.startsWith(routePath) && routePath !== '/') {
        count += c;
      }
    }
    return count;
  };

  return {
    totalUnread: summary.totalUnread || 0,
    byModule,
    byRoute,
    groupCounts,
    moduleCounts,
    getRouteCount,
    refetch
  };
}
