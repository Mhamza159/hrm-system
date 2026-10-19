/**
 * @file employeesApi.js
 * @description RTK Query endpoints for Employee Management (Module M3).
 * 
 * SPECIFICATION & DATAFLOW:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Rows 3.1 to 3.17)
 * - Layer: Frontend API Service (Injected into centralized baseApi)
 */

import { baseApi } from '../../lib/baseApi.js';

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query({
      query: (params) => ({
        url: '/employees',
        params
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ _id }) => ({ type: 'Employee', id: _id })),
              { type: 'Employee', id: 'LIST' }
            ]
          : [{ type: 'Employee', id: 'LIST' }]
    }),

    getEmployeeById: builder.query({
      query: (id) => `/employees/${id}`,
      providesTags: (result, error, id) => [{ type: 'Employee', id }]
    }),

    getMyProfile: builder.query({
      query: () => '/employees/me',
      providesTags: [{ type: 'Employee', id: 'ME' }]
    }),

    createEmployee: builder.mutation({
      query: (body) => ({
        url: '/employees',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }, 'Users']
    }),

    getNextEmployeeCode: builder.query({
      query: () => '/employees/next-code',
      providesTags: [{ type: 'Employee', id: 'NEXT_CODE' }]
    }),

    updateEmployee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/employees/${id}`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
        { type: 'Employee', id: 'ME' }
      ]
    }),

    updateEmployeeStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/employees/${id}/status`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
        'Users'
      ]
    }),

    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `/employees/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }, 'Users']
    }),

    uploadDocument: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/employees/${id}/documents`,
        method: 'POST',
        body: formData
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'ME' }
      ]
    }),

    deleteDocument: builder.mutation({
      query: ({ id, docId }) => ({
        url: `/employees/${id}/documents/${docId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'ME' }
      ]
    }),

    importEmployees: builder.mutation({
      query: (formData) => ({
        url: '/employees/import',
        method: 'POST',
        body: formData
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }]
    }),

    updateSkills: builder.mutation({
      query: ({ id, skills }) => ({
        url: id ? `/employees/${id}/skills` : '/employees/me/skills',
        method: 'PATCH',
        body: { skills }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employee', id: id || 'ME' },
        { type: 'Employee', id: 'LIST' }
      ]
    }),

    uploadAvatar: builder.mutation({
      query: ({ id, formData }) => ({
        url: id ? `/employees/${id}/avatar` : '/employees/me/avatar',
        method: 'PATCH',
        body: formData
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employee', id: id || 'ME' },
        { type: 'Employee', id: 'LIST' }
      ]
    }),

    recordJobHistory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/employees/${id}/history`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
        { type: 'Employee', id: 'HISTORY' }
      ]
    }),

    getJobHistory: builder.query({
      query: (id) => `/employees/${id}/history`,
      providesTags: (result, error, id) => [{ type: 'Employee', id: 'HISTORY' }]
    }),

    getSalaryHistory: builder.query({
      query: (id) => `/employees/${id}/salary-history`,
      providesTags: (result, error, id) => [{ type: 'Employee', id: 'SALARY' }]
    }),

    submitChangeRequest: builder.mutation({
      query: (body) => ({
        url: '/employees/me/change-request',
        method: 'POST',
        body
      }),
      invalidatesTags: ['ChangeRequests']
    }),

    getChangeRequests: builder.query({
      query: (params) => ({
        url: '/change-requests',
        params
      }),
      providesTags: ['ChangeRequests']
    }),

    decideChangeRequest: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/change-requests/${id}/decide`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['ChangeRequests', { type: 'Employee', id: 'LIST' }]
    })
  })
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useGetMyProfileQuery,
  useGetNextEmployeeCodeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useUpdateEmployeeStatusMutation,
  useDeleteEmployeeMutation,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useImportEmployeesMutation,
  useUpdateSkillsMutation,
  useUploadAvatarMutation,
  useRecordJobHistoryMutation,
  useGetJobHistoryQuery,
  useGetSalaryHistoryQuery,
  useSubmitChangeRequestMutation,
  useGetChangeRequestsQuery,
  useDecideChangeRequestMutation
} = employeesApi;
