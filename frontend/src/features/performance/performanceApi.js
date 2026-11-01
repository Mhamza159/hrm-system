/**
 * @file performanceApi.js
 * @description RTK Query API slice for Module M19 Performance & Appraisal.
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Rows 19.1 to 19.9)
 * - Cache Tags: 'KpiTemplates', 'ReviewCycles', 'Reviews', 'PerformanceProgress'
 */

import { baseApi } from '../../lib/baseApi.js';

export const performanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ----------------------------------------------------
    // 19.1: KPI Templates
    // ----------------------------------------------------
    getKpiTemplates: builder.query({
      query: (params = {}) => ({
        url: '/performance/templates',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'KpiTemplates', id: _id })),
              { type: 'KpiTemplates', id: 'LIST' }
            ]
          : [{ type: 'KpiTemplates', id: 'LIST' }]
    }),

    getKpiTemplateById: builder.query({
      query: (id) => `/performance/templates/${id}`,
      providesTags: (result, error, id) => [{ type: 'KpiTemplates', id }]
    }),

    createKpiTemplate: builder.mutation({
      query: (body) => ({
        url: '/performance/templates',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'KpiTemplates', id: 'LIST' }]
    }),

    updateKpiTemplate: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/performance/templates/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'KpiTemplates', id },
        { type: 'KpiTemplates', id: 'LIST' }
      ]
    }),

    deleteKpiTemplate: builder.mutation({
      query: (id) => ({
        url: `/performance/templates/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'KpiTemplates', id: 'LIST' }]
    }),

    // ----------------------------------------------------
    // 19.2: Review Cycles
    // ----------------------------------------------------
    getReviewCycles: builder.query({
      query: (params = {}) => ({
        url: '/performance/cycles',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'ReviewCycles', id: _id })),
              { type: 'ReviewCycles', id: 'LIST' }
            ]
          : [{ type: 'ReviewCycles', id: 'LIST' }]
    }),

    getReviewCycleById: builder.query({
      query: (id) => `/performance/cycles/${id}`,
      providesTags: (result, error, id) => [{ type: 'ReviewCycles', id }]
    }),

    createReviewCycle: builder.mutation({
      query: (body) => ({
        url: '/performance/cycles',
        method: 'POST',
        body
      }),
      invalidatesTags: [
        { type: 'ReviewCycles', id: 'LIST' },
        { type: 'Reviews', id: 'LIST' }
      ]
    }),

    updateCycleStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/performance/cycles/${id}/status`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ReviewCycles', id },
        { type: 'ReviewCycles', id: 'LIST' }
      ]
    }),

    // ----------------------------------------------------
    // 19.9: Cycle Progress & Tracking
    // ----------------------------------------------------
    getCycleProgress: builder.query({
      query: (cycleId) => `/performance/cycles/${cycleId}/progress`,
      providesTags: (result, error, cycleId) => [{ type: 'PerformanceProgress', id: cycleId }]
    }),

    // ----------------------------------------------------
    // 19.3 - 19.7: Reviews & Evaluations
    // ----------------------------------------------------
    getReviews: builder.query({
      query: (params = {}) => ({
        url: '/performance/reviews',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Reviews', id: _id })),
              { type: 'Reviews', id: 'LIST' }
            ]
          : [{ type: 'Reviews', id: 'LIST' }]
    }),

    getReviewById: builder.query({
      query: (id) => `/performance/reviews/${id}`,
      providesTags: (result, error, id) => [{ type: 'Reviews', id }]
    }),

    updateGoals: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/performance/reviews/${id}/goals`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Reviews', id }]
    }),

    submitSelfReview: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/performance/reviews/${id}/self`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Reviews', id },
        { type: 'Reviews', id: 'LIST' }
      ]
    }),

    submitManagerReview: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/performance/reviews/${id}/manager`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Reviews', id },
        { type: 'Reviews', id: 'LIST' }
      ]
    }),

    finalizeReview: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/performance/reviews/${id}/finalize`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Reviews', id },
        { type: 'Reviews', id: 'LIST' },
        { type: 'ReviewCycles', id: 'LIST' }
      ]
    }),

    // ----------------------------------------------------
    // 19.6: 360 Peer Feedback
    // ----------------------------------------------------
    requestPeerFeedback: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/performance/reviews/${id}/peer-request`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Reviews', id }]
    }),

    submitPeerFeedback: builder.mutation({
      query: ({ requestId, ...body }) => ({
        url: `/performance/peer-feedback/${requestId}`,
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Reviews', id: 'LIST' }]
    }),

    // ----------------------------------------------------
    // 19.8: Historical Performance Timeline
    // ----------------------------------------------------
    getEmployeePerformanceHistory: builder.query({
      query: (employeeId) => `/performance/employees/${employeeId}/history`,
      providesTags: (result, error, employeeId) => [{ type: 'Reviews', id: `EMP-${employeeId}` }]
    })
  })
});

export const {
  useGetKpiTemplatesQuery,
  useGetKpiTemplateByIdQuery,
  useCreateKpiTemplateMutation,
  useUpdateKpiTemplateMutation,
  useDeleteKpiTemplateMutation,
  useGetReviewCyclesQuery,
  useGetReviewCycleByIdQuery,
  useCreateReviewCycleMutation,
  useUpdateCycleStatusMutation,
  useGetCycleProgressQuery,
  useGetReviewsQuery,
  useGetReviewByIdQuery,
  useUpdateGoalsMutation,
  useSubmitSelfReviewMutation,
  useSubmitManagerReviewMutation,
  useFinalizeReviewMutation,
  useRequestPeerFeedbackMutation,
  useSubmitPeerFeedbackMutation,
  useGetEmployeePerformanceHistoryQuery
} = performanceApi;

