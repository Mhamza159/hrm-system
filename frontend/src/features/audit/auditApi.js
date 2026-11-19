/**
 * @file auditApi.js
 * @description RTK Query endpoints for immutable system audit logs, real-time analytics, export, and retention.
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
          status: params.status || undefined,
          severity: params.severity || undefined,
          category: params.category || undefined,
          actorRole: params.actorRole || undefined,
          actorId: params.actorId || undefined,
          targetId: params.targetId || undefined,
          targetModel: params.targetModel || undefined,
          isArchived: params.isArchived !== undefined ? params.isArchived : undefined,
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
    }),

    getAuditStats: builder.query({
      query: (params = {}) => ({
        url: '/audit-logs/stats',
        params: {
          module: params.module || undefined,
          startDate: params.startDate || undefined,
          endDate: params.endDate || undefined,
          search: params.search || undefined
        }
      }),
      providesTags: ['AuditLog']
    }),

    getAuditAnalytics: builder.query({
      query: (params = {}) => ({
        url: '/audit-logs/analytics',
        params: {
          timeRange: params.timeRange || '7d',
          module: params.module || undefined,
          startDate: params.startDate || undefined,
          endDate: params.endDate || undefined
        }
      }),
      providesTags: ['AuditLog']
    }),

    getAuditRetentionSummary: builder.query({
      query: () => '/audit-logs/retention',
      providesTags: ['AuditLog']
    }),

    archiveAuditLogs: builder.mutation({
      query: (body) => ({
        url: '/audit-logs/archive',
        method: 'POST',
        body
      }),
      invalidatesTags: ['AuditLog']
    })
  })
});

export const {
  useGetAuditLogsQuery,
  useGetAuditLogByIdQuery,
  useGetAuditStatsQuery,
  useGetAuditAnalyticsQuery,
  useGetAuditRetentionSummaryQuery,
  useArchiveAuditLogsMutation
} = auditApi;
