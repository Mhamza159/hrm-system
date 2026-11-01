/**
 * @file onboardingApi.js
 * @description RTK Query API slice for Module M18 Onboarding & Offboarding Lifecycle.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Rows 18.1 to 18.11)
 * - Cache Tags: 'ChecklistTemplates', 'Checklists', 'ChecklistTasks', 'Resignations', 'ExitInterviews'
 */

import { baseApi } from '../../lib/baseApi.js';

export const onboardingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ----------------------------------------------------
    // 18.1: Checklist Template Endpoints
    // ----------------------------------------------------
    getChecklistTemplates: builder.query({
      query: (params = {}) => ({
        url: '/onboarding/templates',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'ChecklistTemplates', id: _id })),
              { type: 'ChecklistTemplates', id: 'LIST' }
            ]
          : [{ type: 'ChecklistTemplates', id: 'LIST' }]
    }),

    getChecklistTemplateById: builder.query({
      query: (id) => `/onboarding/templates/${id}`,
      providesTags: (result, error, id) => [{ type: 'ChecklistTemplates', id }]
    }),

    createChecklistTemplate: builder.mutation({
      query: (body) => ({
        url: '/onboarding/templates',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'ChecklistTemplates', id: 'LIST' }]
    }),

    updateChecklistTemplate: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/onboarding/templates/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ChecklistTemplates', id },
        { type: 'ChecklistTemplates', id: 'LIST' }
      ]
    }),

    deleteChecklistTemplate: builder.mutation({
      query: (id) => ({
        url: `/onboarding/templates/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'ChecklistTemplates', id: 'LIST' }]
    }),

    // ----------------------------------------------------
    // 18.2: Onboarding Instance Endpoints
    // ----------------------------------------------------
    getOnboardings: builder.query({
      query: (params = {}) => ({
        url: '/onboarding',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Checklists', id: _id })),
              { type: 'Checklists', id: 'LIST' }
            ]
          : [{ type: 'Checklists', id: 'LIST' }]
    }),

    getOnboardingById: builder.query({
      query: (id) => `/onboarding/${id}`,
      providesTags: (result, error, id) => [{ type: 'Checklists', id }]
    }),

    // ----------------------------------------------------
    // 18.3: Task Ownership & Completion
    // ----------------------------------------------------
    getMyTasks: builder.query({
      query: () => '/onboarding/tasks/my',
      providesTags: [{ type: 'ChecklistTasks', id: 'MY_LIST' }]
    }),

    completeTask: builder.mutation({
      query: ({ taskId, ...body }) => ({
        url: `/onboarding/tasks/${taskId}/complete`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: [
        { type: 'Checklists', id: 'LIST' },
        { type: 'ChecklistTasks', id: 'MY_LIST' }
      ]
    }),

    // ----------------------------------------------------
    // 18.4: Welcome Email
    // ----------------------------------------------------
    resendWelcomeEmail: builder.mutation({
      query: (id) => ({
        url: `/onboarding/${id}/welcome-email`,
        method: 'POST'
      })
    }),

    // ----------------------------------------------------
    // 18.5 & 18.6: Resignation Endpoints
    // ----------------------------------------------------
    getMyResignation: builder.query({
      query: () => '/resignations/my',
      providesTags: [{ type: 'Resignations', id: 'MY' }]
    }),

    getResignations: builder.query({
      query: (params = {}) => ({
        url: '/resignations',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Resignations', id: _id })),
              { type: 'Resignations', id: 'LIST' }
            ]
          : [{ type: 'Resignations', id: 'LIST' }]
    }),

    submitResignation: builder.mutation({
      query: (body) => ({
        url: '/resignations',
        method: 'POST',
        body
      }),
      invalidatesTags: [
        { type: 'Resignations', id: 'MY' },
        { type: 'Resignations', id: 'LIST' }
      ]
    }),

    decideResignation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/resignations/${id}/decide`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: [
        { type: 'Resignations', id: 'LIST' },
        { type: 'Checklists', id: 'LIST' }
      ]
    }),

    // ----------------------------------------------------
    // 18.7: Exit Clearance
    // ----------------------------------------------------
    getOffboardings: builder.query({
      query: (params = {}) => ({
        url: '/offboarding',
        params
      }),
      providesTags: [{ type: 'Checklists', id: 'OFFBOARDING_LIST' }]
    }),

    signoffExitClearance: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/offboarding/${id}/clear`,
        method: 'POST',
        body
      }),
      invalidatesTags: [
        { type: 'Checklists', id: 'OFFBOARDING_LIST' },
        { type: 'Checklists', id: 'LIST' }
      ]
    }),

    // ----------------------------------------------------
    // 18.9: Final Settlement Summary Linkage
    // ----------------------------------------------------
    getSettlementSummary: builder.query({
      query: (id) => `/offboarding/${id}/settlement-summary`
    }),

    // ----------------------------------------------------
    // 18.11: Scheduled / Manual Deactivation Trigger
    // ----------------------------------------------------
    triggerDeactivation: builder.mutation({
      query: () => ({
        url: '/offboarding/trigger-deactivation',
        method: 'POST'
      }),
      invalidatesTags: [{ type: 'Checklists', id: 'LIST' }]
    }),

    // ----------------------------------------------------
    // 18.8: Exit Interview Endpoints
    // ----------------------------------------------------
    submitExitInterview: builder.mutation({
      query: (body) => ({
        url: '/exit-interviews',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'ExitInterviews', id: 'LIST' }]
    }),

    getExitInterviewByResignation: builder.query({
      query: (resignationId) => `/exit-interviews/${resignationId}`,
      providesTags: (result, error, id) => [{ type: 'ExitInterviews', id }]
    })
  })
});

export const {
  useGetChecklistTemplatesQuery,
  useGetChecklistTemplateByIdQuery,
  useCreateChecklistTemplateMutation,
  useUpdateChecklistTemplateMutation,
  useDeleteChecklistTemplateMutation,
  useGetOnboardingsQuery,
  useGetOnboardingByIdQuery,
  useGetMyTasksQuery,
  useCompleteTaskMutation,
  useResendWelcomeEmailMutation,
  useGetMyResignationQuery,
  useGetResignationsQuery,
  useSubmitResignationMutation,
  useDecideResignationMutation,
  useGetOffboardingsQuery,
  useSignoffExitClearanceMutation,
  useGetSettlementSummaryQuery,
  useTriggerDeactivationMutation,
  useSubmitExitInterviewMutation,
  useGetExitInterviewByResignationQuery
} = onboardingApi;

