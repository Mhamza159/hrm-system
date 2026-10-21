/**
 * @file dashboardApi.js
 * @description RTK Query endpoints for Module M7 Role-Based Dashboards.
 */

import { baseApi } from '../../lib/baseApi.js';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 7.1: Super Admin Executive Dashboard
    getAdminDashboard: builder.query({
      query: () => '/dashboard/admin',
      providesTags: ['Dashboard']
    }),

    // 7.2: HR Manager Operational Dashboard
    getHrDashboard: builder.query({
      query: () => '/dashboard/hr',
      providesTags: ['Dashboard']
    }),

    // 7.3: Department Manager Team Dashboard
    getManagerDashboard: builder.query({
      query: () => '/dashboard/manager',
      providesTags: ['Dashboard']
    }),

    // 7.4: Employee Personal Dashboard
    getEmployeeDashboard: builder.query({
      query: () => '/dashboard/employee',
      providesTags: ['Dashboard']
    })
  })
});

export const {
  useGetAdminDashboardQuery,
  useGetHrDashboardQuery,
  useGetManagerDashboardQuery,
  useGetEmployeeDashboardQuery
} = dashboardApi;
