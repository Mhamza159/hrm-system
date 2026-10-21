/**
 * @file auditApi.js
 * @description RTK Query endpoints for immutable system audit logs.
 */

import { baseApi } from '../../lib/baseApi.js';

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query({
      query: (params = {}) => ({
        url: '/audit-logs',
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          module: params.module || undefined,
          action: params.action || undefined,
          actorId: params.actorId || undefined,
          startDate: params.startDate || undefined,
          endDate: params.endDate || undefined,
          search: params.search || undefined
        }
      }),
      providesTags: ['AuditLog']
    }),
    getAuditLogById: builder.query({
      query: (id) => `/audit-logs/${id}`,
      providesTags: (result, error, id) => [{ type: 'AuditLog', id }]
    })
  })
});

export const { useGetAuditLogsQuery, useGetAuditLogByIdQuery } = auditApi;
