/**
 * @file feedbackApi.js
 * @description RTK Query API slice for Module M21: Anonymous Feedback & Grievance.
 */

import { baseApi } from '../../lib/baseApi.js';

export const feedbackApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // 21.1: Submit feedback or grievance
    submitFeedback: build.mutation({
      query: (body) => ({
        url: '/feedback',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Feedback', id: 'LIST' }]
    }),

    // 21.2 & 21.3: List feedback/grievances (admin / committee)
    getFeedbackList: build.query({
      query: (params = {}) => ({
        url: '/feedback',
        method: 'GET',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...(Array.isArray(result.data) ? result.data : []).map(({ _id }) => ({
                type: 'Feedback',
                id: _id
              })),
              { type: 'Feedback', id: 'LIST' }
            ]
          : [{ type: 'Feedback', id: 'LIST' }]
    }),

    // Single grievance case details
    getFeedbackById: build.query({
      query: (id) => `/feedback/${id}`,
      providesTags: (result, error, id) => [{ type: 'Feedback', id }]
    }),

    // 21.4: Public or confidential tracking by tracking code
    getTrackedFeedback: build.query({
      query: (code) => `/feedback/track/${code}`,
      providesTags: (result, error, code) => [{ type: 'Feedback', id: code }]
    }),

    // 21.2: Update status
    updateFeedbackStatus: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/feedback/${id}/status`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Feedback', id },
        { type: 'Feedback', id: 'LIST' }
      ]
    }),

    // 21.2: Add case note
    addCaseNote: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/feedback/${id}/notes`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Feedback', id }]
    }),

    // 21.5: Escalate grievance to Super Admin
    escalateFeedback: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/feedback/${id}/escalate`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Feedback', id },
        { type: 'Feedback', id: 'LIST' }
      ]
    }),

    // My submissions
    getMyFeedbackSubmissions: build.query({
      query: (params = {}) => ({
        url: '/feedback/my',
        method: 'GET',
        params
      }),
      providesTags: [{ type: 'Feedback', id: 'MY_LIST' }]
    }),

    // Summary statistics
    getGrievanceStats: build.query({
      query: () => '/feedback/stats/summary',
      providesTags: [{ type: 'Feedback', id: 'STATS' }]
    })
  })
});

export const {
  useSubmitFeedbackMutation,
  useGetFeedbackListQuery,
  useGetFeedbackByIdQuery,
  useLazyGetTrackedFeedbackQuery,
  useGetTrackedFeedbackQuery,
  useUpdateFeedbackStatusMutation,
  useAddCaseNoteMutation,
  useEscalateFeedbackMutation,
  useGetMyFeedbackSubmissionsQuery,
  useGetGrievanceStatsQuery
} = feedbackApi;
