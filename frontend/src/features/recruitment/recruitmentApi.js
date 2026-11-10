/**
 * @file recruitmentApi.js
 * @description RTK Query endpoints for Module M15 Recruitment & AI Resume Screening.
 * 
 * SPECIFICATION & FEATURES:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Rows 15.1 to 15.13)
 * - Cache tags: 'Requisitions', 'Jobs', 'Candidates', 'Interviews'
 */

import { baseApi } from '../../lib/baseApi.js';

export const recruitmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 15.1: Requisitions
    getRequisitions: builder.query({
      query: (params = {}) => ({
        url: '/recruitment/requisitions',
        params
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ _id }) => ({ type: 'Requisitions', id: _id })),
              { type: 'Requisitions', id: 'LIST' }
            ]
          : [{ type: 'Requisitions', id: 'LIST' }]
    }),

    createRequisition: builder.mutation({
      query: (body) => ({
        url: '/recruitment/requisitions',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Requisitions', id: 'LIST' }]
    }),

    // 15.2: Decide Requisition (Super Admin)
    decideRequisition: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/recruitment/requisitions/${id}/decide`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: [
        { type: 'Requisitions', id: 'LIST' },
        { type: 'Jobs', id: 'LIST' }
      ]
    }),

    // 15.3: Jobs (Admin & Internal)
    getJobs: builder.query({
      query: (params = {}) => ({
        url: '/recruitment/jobs',
        params
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ _id }) => ({ type: 'Jobs', id: _id })),
              { type: 'Jobs', id: 'LIST' }
            ]
          : [{ type: 'Jobs', id: 'LIST' }]
    }),

    getJobById: builder.query({
      query: (id) => `/recruitment/jobs/${id}`,
      providesTags: (result, error, id) => [{ type: 'Job', id }]
    }),

    createJob: builder.mutation({
      query: (body) => ({
        url: '/recruitment/jobs',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Jobs', id: 'LIST' }]
    }),

    updateJob: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/recruitment/jobs/${id}`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Job', id },
        { type: 'Jobs', id: 'LIST' }
      ]
    }),

    deleteJob: builder.mutation({
      query: (id) => ({
        url: `/recruitment/jobs/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Job', id },
        { type: 'Jobs', id: 'LIST' }
      ]
    }),

    // 15.3: Public Jobs (No auth required)
    getPublicJobs: builder.query({
      query: (params = {}) => ({
        url: '/recruitment/public/jobs',
        params
      }),
      providesTags: [{ type: 'Jobs', id: 'PUBLIC_LIST' }]
    }),

    getPublicJobBySlug: builder.query({
      query: (slug) => `/recruitment/public/jobs/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'Job', id: slug }]
    }),

    // 15.4: Public Apply with CV (Multipart form data)
    applyForJob: builder.mutation({
      query: ({ jobId, formData }) => ({
        url: `/recruitment/public/jobs/${jobId}/apply`,
        method: 'POST',
        body: formData
      }),
      invalidatesTags: [{ type: 'Candidates', id: 'LIST' }]
    }),

    // 15.4 / 15.7: Candidates
    getCandidates: builder.query({
      query: (params = {}) => ({
        url: '/recruitment/candidates',
        params
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ _id }) => ({ type: 'Candidates', id: _id })),
              { type: 'Candidates', id: 'LIST' }
            ]
          : [{ type: 'Candidates', id: 'LIST' }]
    }),

    getCandidateById: builder.query({
      query: (id) => `/recruitment/candidates/${id}`,
      providesTags: (result, error, id) => [{ type: 'Candidate', id }]
    }),

    // 15.6: AI Resume Screening
    screenCandidate: builder.mutation({
      query: (id) => ({
        url: `/recruitment/candidates/${id}/screen`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Candidate', id },
        { type: 'Candidates', id: 'LIST' }
      ]
    }),

    // 15.7: Stage Transition (Kanban)
    updateCandidateStage: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/recruitment/candidates/${id}/stage`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Candidate', id },
        { type: 'Candidates', id: 'LIST' }
      ]
    }),

    deleteCandidate: builder.mutation({
      query: (id) => ({
        url: `/recruitment/candidates/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Candidate', id },
        { type: 'Candidates', id: 'LIST' },
        { type: 'Interviews', id: 'LIST' }
      ]
    }),

    // 15.8: Interviews & Scorecards
    getInterviews: builder.query({
      query: (params = {}) => ({
        url: '/recruitment/interviews',
        params
      }),
      providesTags: [{ type: 'Interviews', id: 'LIST' }]
    }),

    scheduleInterview: builder.mutation({
      query: ({ candidateId, ...body }) => ({
        url: `/recruitment/candidates/${candidateId}/interviews`,
        method: 'POST',
        body
      }),
      invalidatesTags: [
        { type: 'Interviews', id: 'LIST' },
        { type: 'Candidate', id: 'LIST' }
      ]
    }),

    submitScorecard: builder.mutation({
      query: ({ interviewId, ...body }) => ({
        url: `/recruitment/interviews/${interviewId}/scorecard`,
        method: 'POST',
        body
      }),
      invalidatesTags: [
        { type: 'Interviews', id: 'LIST' },
        { type: 'Candidates', id: 'LIST' }
      ]
    }),

    // 15.9: Send Technical Test
    sendTechnicalTest: builder.mutation({
      query: ({ candidateId, ...body }) => ({
        url: `/recruitment/candidates/${candidateId}/technical-test`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { candidateId }) => [
        { type: 'Candidate', id: candidateId },
        { type: 'Candidates', id: 'LIST' }
      ]
    }),

    // 15.10: Offer Letter
    issueOfferLetter: builder.mutation({
      query: ({ candidateId, ...body }) => ({
        url: `/recruitment/candidates/${candidateId}/offer`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { candidateId }) => [
        { type: 'Candidate', id: candidateId },
        { type: 'Candidates', id: 'LIST' }
      ]
    }),

    // 15.11: One-Click Hire to Employee
    hireCandidate: builder.mutation({
      query: ({ candidateId, ...body }) => ({
        url: `/recruitment/candidates/${candidateId}/hire`,
        method: 'POST',
        body
      }),
      invalidatesTags: [
        { type: 'Candidates', id: 'LIST' },
        { type: 'Employee', id: 'LIST' },
        { type: 'Checklists', id: 'LIST' }
      ]
    }),

    // 15.12: Internal Jobs & Referrals
    getInternalJobs: builder.query({
      query: (params = {}) => ({
        url: '/recruitment/jobs/internal',
        params
      }),
      providesTags: [{ type: 'Jobs', id: 'INTERNAL_LIST' }]
    }),

    submitReferral: builder.mutation({
      query: (formData) => ({
        url: '/recruitment/referrals',
        method: 'POST',
        body: formData
      }),
      invalidatesTags: [
        { type: 'Candidates', id: 'LIST' },
        { type: 'Jobs', id: 'INTERNAL_LIST' }
      ]
    })
  })
});

export const {
  useGetRequisitionsQuery,
  useCreateRequisitionMutation,
  useDecideRequisitionMutation,
  useGetJobsQuery,
  useGetJobByIdQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useGetPublicJobsQuery,
  useGetPublicJobBySlugQuery,
  useApplyForJobMutation,
  useGetCandidatesQuery,
  useGetCandidateByIdQuery,
  useDeleteCandidateMutation,
  useScreenCandidateMutation,
  useUpdateCandidateStageMutation,
  useGetInterviewsQuery,
  useScheduleInterviewMutation,
  useSubmitScorecardMutation,
  useSendTechnicalTestMutation,
  useIssueOfferLetterMutation,
  useHireCandidateMutation,
  useGetInternalJobsQuery,
  useSubmitReferralMutation
} = recruitmentApi;

