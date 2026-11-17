/**
 * @file reportsApi.js
 * @description RTK Query endpoints for Multi-Axis Organizational Reports.
 */

import { baseApi } from '../../lib/baseApi.js';

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReportData: builder.query({
      query: ({ type, from, to, departmentId, employeeId, status, view, page = 1, limit = 25 }) => ({
        url: `/reports/${type}`,
        params: {
          from: from || undefined,
          to: to || undefined,
          departmentId: departmentId || undefined,
          employeeId: employeeId || undefined,
          status: status || undefined,
          view: view || undefined,
          page,
          limit
        }
      }),
      providesTags: (result, error, { type }) => [{ type: 'Report', id: type }]
    }),
    getReportInspection: builder.query({
      query: ({ type, employeeId, departmentId, runId, from, to }) => ({
        url: `/reports/${type}/inspect`,
        params: {
          employeeId: employeeId || undefined,
          departmentId: departmentId || undefined,
          runId: runId || undefined,
          from: from || undefined,
          to: to || undefined
        }
      })
    })
  })
});

export const { useGetReportDataQuery, useGetReportInspectionQuery } = reportsApi;
