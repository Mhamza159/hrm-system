/**
 * @file reportsApi.js
 * @description RTK Query endpoints for Multi-Axis Organizational Reports.
 */

import { baseApi } from '../../lib/baseApi.js';

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReportData: builder.query({
      query: ({ type, from, to, departmentId, employeeId, status, page = 1, limit = 25 }) => ({
        url: `/reports/${type}`,
        params: {
          from: from || undefined,
          to: to || undefined,
          departmentId: departmentId || undefined,
          employeeId: employeeId || undefined,
          status: status || undefined,
          page,
          limit
        }
      }),
      providesTags: (result, error, { type }) => [{ type: 'Report', id: type }]
    })
  })
});

export const { useGetReportDataQuery } = reportsApi;
