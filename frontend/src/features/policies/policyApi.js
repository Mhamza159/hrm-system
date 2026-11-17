/**
 * @file policyApi.js
 * @description RTK Query endpoints for Company Policies Module.
 * 
 * SPECIFICATION:
 * - Module: Company Policies (Phase 21)
 * - Layer: Frontend API Slice (injected into baseApi)
 */

import { baseApi } from '../../lib/baseApi.js';

export const policyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPolicies: builder.query({
      query: (params = {}) => ({
        url: '/policies',
        params: {
          search: params.search || undefined,
          category: params.category || undefined,
          status: params.status || undefined,
          scope: params.scope || undefined,
          page: params.page || 1,
          limit: params.limit || 20,
          myPoliciesOnly: params.myPoliciesOnly || undefined
        }
      }),
      transformResponse: (response) => response?.data ?? response,
      providesTags: ['Policies']
    }),

    getPolicyStats: builder.query({
      query: () => '/policies/stats',
      transformResponse: (response) => response?.data ?? response,
      providesTags: ['Policies']
    }),

    getPolicyById: builder.query({
      query: (id) => `/policies/${id}`,
      transformResponse: (response) => response?.data ?? response,
      providesTags: (result, error, id) => [{ type: 'Policies', id }]
    }),

    createPolicy: builder.mutation({
      query: (body) => ({
        url: '/policies',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Policies']
    }),

    updatePolicy: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/policies/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, { id }) => ['Policies', { type: 'Policies', id }]
    }),

    deletePolicy: builder.mutation({
      query: (id) => ({
        url: `/policies/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Policies']
    }),

    submitPolicyForApproval: builder.mutation({
      query: (id) => ({
        url: `/policies/${id}/submit`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, id) => ['Policies', { type: 'Policies', id }]
    }),

    approvePolicy: builder.mutation({
      query: ({ id, notes = '' }) => ({
        url: `/policies/${id}/approve`,
        method: 'POST',
        body: { notes }
      }),
      invalidatesTags: (result, error, { id }) => ['Policies', { type: 'Policies', id }]
    }),

    rejectPolicy: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/policies/${id}/reject`,
        method: 'POST',
        body: { reason }
      }),
      invalidatesTags: (result, error, { id }) => ['Policies', { type: 'Policies', id }]
    }),

    publishPolicy: builder.mutation({
      query: ({ id, effectiveDate, notifyWorkforce = true }) => ({
        url: `/policies/${id}/publish`,
        method: 'POST',
        body: { effectiveDate, notifyWorkforce }
      }),
      invalidatesTags: (result, error, { id }) => ['Policies', { type: 'Policies', id }]
    }),

    acknowledgePolicy: builder.mutation({
      query: ({ id, signatureText }) => ({
        url: `/policies/${id}/acknowledge`,
        method: 'POST',
        body: { signatureText }
      }),
      invalidatesTags: (result, error, { id }) => ['Policies', { type: 'Policies', id }]
    }),

    getPolicyAcknowledgements: builder.query({
      query: ({ id, departmentId, search }) => ({
        url: `/policies/${id}/acknowledgements`,
        params: {
          departmentId: departmentId || undefined,
          search: search || undefined
        }
      }),
      transformResponse: (response) => response?.data ?? response,
      providesTags: (result, error, { id }) => [{ type: 'Policies', id }]
    }),

    getPolicyVersions: builder.query({
      query: (id) => `/policies/${id}/versions`,
      transformResponse: (response) => response?.data ?? response,
      providesTags: (result, error, id) => [{ type: 'Policies', id }]
    }),

    getCategories: builder.query({
      query: () => '/policies/categories',
      transformResponse: (response) => response?.data ?? response,
      providesTags: ['Policies']
    }),

    createCategory: builder.mutation({
      query: (body) => ({
        url: '/policies/categories',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Policies']
    }),

    updateCategory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/policies/categories/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Policies']
    }),

    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/policies/categories/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Policies']
    })
  })
});

export const {
  useGetPoliciesQuery,
  useGetPolicyStatsQuery,
  useGetPolicyByIdQuery,
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
  useDeletePolicyMutation,
  useSubmitPolicyForApprovalMutation,
  useApprovePolicyMutation,
  useRejectPolicyMutation,
  usePublishPolicyMutation,
  useAcknowledgePolicyMutation,
  useGetPolicyAcknowledgementsQuery,
  useGetPolicyVersionsQuery,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation
} = policyApi;
