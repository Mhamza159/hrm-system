/**
 * @file departmentsApi.js
 * @description RTK Query endpoint definitions for Module M4 Departments, Designations, Shifts & Org Chart.
 * 
 * SPECIFICATION & ENDPOINTS:
 * - Slice 4.1: getDepartments -> GET /departments
 * - Slice 4.1: getDepartmentById -> GET /departments/:id
 * - Slice 4.1: createDepartment -> POST /departments
 * - Slice 4.1: updateDepartment -> PATCH /departments/:id
 * - Slice 4.1: deleteDepartment -> DELETE /departments/:id
 * - Slice 4.2: assignDepartmentHead -> PATCH /departments/:id/head
 */

import { baseApi } from '../../lib/baseApi.js';

export const departmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 4.1: Retrieve departments list
    getDepartments: builder.query({
      query: (params) => ({
        url: '/departments',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Departments', id: _id })),
              { type: 'Departments', id: 'LIST' }
            ]
          : [{ type: 'Departments', id: 'LIST' }]
    }),

    // 4.1: Retrieve single department
    getDepartmentById: builder.query({
      query: (id) => `/departments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Departments', id }]
    }),

    // 4.1: Create department
    createDepartment: builder.mutation({
      query: (data) => ({
        url: '/departments',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'Departments', id: 'LIST' }, 'OrgChart']
    }),

    // 4.1: Update department
    updateDepartment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/departments/${id}`,
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Departments', id },
        { type: 'Departments', id: 'LIST' },
        'OrgChart'
      ]
    }),

    // 4.2: Assign department head
    assignDepartmentHead: builder.mutation({
      query: ({ id, headId }) => ({
        url: `/departments/${id}/head`,
        method: 'PATCH',
        body: { headId }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Departments', id },
        { type: 'Departments', id: 'LIST' },
        'OrgChart'
      ]
    }),

    // 4.2: Retrieve eligible candidate users for department head
    getHeadCandidates: builder.query({
      query: () => '/departments/heads/candidates'
    }),

    // 4.1: Delete department
    deleteDepartment: builder.mutation({
      query: (id) => ({
        url: `/departments/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Departments', id: 'LIST' }, 'OrgChart']
    }),

    // 4.3: Designations Endpoints
    getDesignations: builder.query({
      query: (params) => ({
        url: '/designations',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Designations', id: _id })),
              { type: 'Designations', id: 'LIST' }
            ]
          : [{ type: 'Designations', id: 'LIST' }]
    }),

    getDesignationById: builder.query({
      query: (id) => `/designations/${id}`,
      providesTags: (result, error, id) => [{ type: 'Designations', id }]
    }),

    createDesignation: builder.mutation({
      query: (data) => ({
        url: '/designations',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'Designations', id: 'LIST' }, 'OrgChart']
    }),

    updateDesignation: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/designations/${id}`,
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Designations', id },
        { type: 'Designations', id: 'LIST' },
        'OrgChart'
      ]
    }),

    deleteDesignation: builder.mutation({
      query: (id) => ({
        url: `/designations/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Designations', id: 'LIST' }, 'OrgChart']
    }),

    // 4.4: Shifts Endpoints
    getShifts: builder.query({
      query: (params) => ({
        url: '/shifts',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Shifts', id: _id })),
              { type: 'Shifts', id: 'LIST' }
            ]
          : [{ type: 'Shifts', id: 'LIST' }]
    }),

    getShiftById: builder.query({
      query: (id) => `/shifts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Shifts', id }]
    }),

    createShift: builder.mutation({
      query: (data) => ({
        url: '/shifts',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'Shifts', id: 'LIST' }]
    }),

    updateShift: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/shifts/${id}`,
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Shifts', id },
        { type: 'Shifts', id: 'LIST' }
      ]
    }),

    deleteShift: builder.mutation({
      query: (id) => ({
        url: `/shifts/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Shifts', id: 'LIST' }]
    }),

    // 4.5 & 4.7: Org Chart Endpoint
    getOrgChart: builder.query({
      query: () => '/org-chart',
      providesTags: ['OrgChart']
    }),

    // 4.6: My Team View Endpoint
    getMyTeam: builder.query({
      query: () => '/teams/my',
      providesTags: ['Team']
    })
  })
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useGetHeadCandidatesQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useAssignDepartmentHeadMutation,
  useDeleteDepartmentMutation,
  useGetDesignationsQuery,
  useGetDesignationByIdQuery,
  useCreateDesignationMutation,
  useUpdateDesignationMutation,
  useDeleteDesignationMutation,
  useGetShiftsQuery,
  useGetShiftByIdQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useGetOrgChartQuery,
  useGetMyTeamQuery
} = departmentsApi;
