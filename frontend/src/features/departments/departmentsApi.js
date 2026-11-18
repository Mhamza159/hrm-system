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

    // Department Stats KPI Aggregation
    getDepartmentStats: builder.query({
      query: () => '/departments/stats',
      providesTags: ['DepartmentStats']
    }),

    // Department Comprehensive Workforce Analytics
    getDepartmentAnalytics: builder.query({
      query: () => '/departments/analytics',
      providesTags: ['DepartmentAnalytics', 'DepartmentStats']
    }),

    // Retrieve Archived Departments
    getArchivedDepartments: builder.query({
      query: (params) => ({
        url: '/departments/archived',
        params
      }),
      providesTags: (result) =>
        result?.data?.docs
          ? [
              ...result.data.docs.map(({ _id }) => ({ type: 'ArchivedDepartments', id: _id })),
              { type: 'ArchivedDepartments', id: 'LIST' }
            ]
          : [{ type: 'ArchivedDepartments', id: 'LIST' }]
    }),

    // Archive Department
    archiveDepartment: builder.mutation({
      query: (id) => ({
        url: `/departments/${id}/archive`,
        method: 'PATCH'
      }),
      invalidatesTags: [
        { type: 'Departments', id: 'LIST' },
        { type: 'ArchivedDepartments', id: 'LIST' },
        'DepartmentStats',
        'OrgChart'
      ]
    }),

    // Restore Department
    restoreDepartment: builder.mutation({
      query: (id) => ({
        url: `/departments/${id}/restore`,
        method: 'PATCH'
      }),
      invalidatesTags: [
        { type: 'Departments', id: 'LIST' },
        { type: 'ArchivedDepartments', id: 'LIST' },
        'DepartmentStats',
        'OrgChart'
      ]
    }),

    // Permanent Delete Department
    permanentDeleteDepartment: builder.mutation({
      query: (id) => ({
        url: `/departments/${id}/permanent`,
        method: 'DELETE'
      }),
      invalidatesTags: [
        { type: 'Departments', id: 'LIST' },
        { type: 'ArchivedDepartments', id: 'LIST' },
        'DepartmentStats',
        'OrgChart'
      ]
    }),

    // 4.1: Create department
    createDepartment: builder.mutation({
      query: (data) => ({
        url: '/departments',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [
        { type: 'Departments', id: 'LIST' },
        'DepartmentStats',
        'DepartmentAnalytics',
        'OrgChart'
      ]
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
        'DepartmentStats',
        'DepartmentAnalytics',
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
        'DepartmentStats',
        'DepartmentAnalytics',
        'OrgChart'
      ]
    }),

    // 4.2: Retrieve eligible candidate users for department head with rich profile details
    getHeadCandidates: builder.query({
      query: (params) => ({
        url: '/departments/heads/candidates',
        params: typeof params === 'string' ? { search: params } : params
      }),
      providesTags: ['DepartmentCandidates']
    }),

    // 4.1: Delete department
    deleteDepartment: builder.mutation({
      query: (id) => ({
        url: `/departments/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [
        { type: 'Departments', id: 'LIST' },
        'DepartmentStats',
        'DepartmentAnalytics',
        'OrgChart'
      ]
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

    getDesignationStats: builder.query({
      query: () => '/designations/stats',
      providesTags: ['DesignationStats']
    }),

    getDesignationAnalytics: builder.query({
      query: () => '/designations/analytics',
      providesTags: ['DesignationAnalytics', 'DesignationStats']
    }),

    getArchivedDesignations: builder.query({
      query: (params) => ({
        url: '/designations/archived',
        params
      }),
      providesTags: (result) =>
        result?.data?.docs
          ? [
              ...result.data.docs.map(({ _id }) => ({ type: 'ArchivedDesignations', id: _id })),
              { type: 'ArchivedDesignations', id: 'LIST' }
            ]
          : [{ type: 'ArchivedDesignations', id: 'LIST' }]
    }),

    createDesignation: builder.mutation({
      query: (data) => ({
        url: '/designations',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [
        { type: 'Designations', id: 'LIST' },
        'DesignationStats',
        'DesignationAnalytics',
        'OrgChart'
      ]
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
        'DesignationStats',
        'DesignationAnalytics',
        'OrgChart'
      ]
    }),

    archiveDesignation: builder.mutation({
      query: (id) => ({
        url: `/designations/${id}/archive`,
        method: 'PATCH'
      }),
      invalidatesTags: [
        { type: 'Designations', id: 'LIST' },
        { type: 'ArchivedDesignations', id: 'LIST' },
        'DesignationStats',
        'DesignationAnalytics',
        'OrgChart'
      ]
    }),

    restoreDesignation: builder.mutation({
      query: (id) => ({
        url: `/designations/${id}/restore`,
        method: 'PATCH'
      }),
      invalidatesTags: [
        { type: 'Designations', id: 'LIST' },
        { type: 'ArchivedDesignations', id: 'LIST' },
        'DesignationStats',
        'DesignationAnalytics',
        'OrgChart'
      ]
    }),

    permanentDeleteDesignation: builder.mutation({
      query: (id) => ({
        url: `/designations/${id}/permanent`,
        method: 'DELETE'
      }),
      invalidatesTags: [
        { type: 'Designations', id: 'LIST' },
        { type: 'ArchivedDesignations', id: 'LIST' },
        'DesignationStats',
        'DesignationAnalytics',
        'OrgChart'
      ]
    }),

    deleteDesignation: builder.mutation({
      query: (id) => ({
        url: `/designations/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [
        { type: 'Designations', id: 'LIST' },
        'DesignationStats',
        'DesignationAnalytics',
        'OrgChart'
      ]
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

    getShiftStats: builder.query({
      query: () => '/shifts/stats',
      providesTags: [{ type: 'Shifts', id: 'STATS' }]
    }),

    getShiftAnalytics: builder.query({
      query: () => '/shifts/analytics',
      providesTags: [{ type: 'Shifts', id: 'ANALYTICS' }]
    }),

    getArchivedShifts: builder.query({
      query: (params) => ({
        url: '/shifts/archived',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Shifts', id: `ARCHIVED_${_id}` })),
              { type: 'Shifts', id: 'ARCHIVED' }
            ]
          : [{ type: 'Shifts', id: 'ARCHIVED' }]
    }),

    getShiftEmployees: builder.query({
      query: ({ id, params }) => ({
        url: `/shifts/${id}/employees`,
        params
      }),
      providesTags: (result, error, { id }) => [{ type: 'Shifts', id: `STAFF_${id}` }]
    }),

    assignEmployeesToShift: builder.mutation({
      query: ({ id, employeeIds, action = 'add' }) => ({
        url: `/shifts/${id}/assign`,
        method: 'POST',
        body: { employeeIds, action }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Shifts', id },
        { type: 'Shifts', id: 'LIST' },
        { type: 'Shifts', id: 'STATS' },
        { type: 'Shifts', id: 'ANALYTICS' },
        { type: 'Shifts', id: `STAFF_${id}` },
        'Employees'
      ]
    }),

    createShift: builder.mutation({
      query: (data) => ({
        url: '/shifts',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [
        { type: 'Shifts', id: 'LIST' },
        { type: 'Shifts', id: 'STATS' },
        { type: 'Shifts', id: 'ANALYTICS' }
      ]
    }),

    updateShift: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/shifts/${id}`,
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Shifts', id },
        { type: 'Shifts', id: 'LIST' },
        { type: 'Shifts', id: 'STATS' },
        { type: 'Shifts', id: 'ANALYTICS' }
      ]
    }),

    archiveShift: builder.mutation({
      query: (id) => ({
        url: `/shifts/${id}/archive`,
        method: 'PATCH'
      }),
      invalidatesTags: [
        { type: 'Shifts', id: 'LIST' },
        { type: 'Shifts', id: 'ARCHIVED' },
        { type: 'Shifts', id: 'STATS' },
        { type: 'Shifts', id: 'ANALYTICS' }
      ]
    }),

    restoreShift: builder.mutation({
      query: (id) => ({
        url: `/shifts/${id}/restore`,
        method: 'PATCH'
      }),
      invalidatesTags: [
        { type: 'Shifts', id: 'LIST' },
        { type: 'Shifts', id: 'ARCHIVED' },
        { type: 'Shifts', id: 'STATS' },
        { type: 'Shifts', id: 'ANALYTICS' }
      ]
    }),

    permanentDeleteShift: builder.mutation({
      query: (id) => ({
        url: `/shifts/${id}/permanent`,
        method: 'DELETE'
      }),
      invalidatesTags: [
        { type: 'Shifts', id: 'LIST' },
        { type: 'Shifts', id: 'ARCHIVED' },
        { type: 'Shifts', id: 'STATS' },
        { type: 'Shifts', id: 'ANALYTICS' }
      ]
    }),

    deleteShift: builder.mutation({
      query: (id) => ({
        url: `/shifts/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [
        { type: 'Shifts', id: 'LIST' },
        { type: 'Shifts', id: 'STATS' },
        { type: 'Shifts', id: 'ANALYTICS' }
      ]
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
  useGetDepartmentStatsQuery,
  useGetDepartmentAnalyticsQuery,
  useGetArchivedDepartmentsQuery,
  useArchiveDepartmentMutation,
  useRestoreDepartmentMutation,
  usePermanentDeleteDepartmentMutation,
  useGetHeadCandidatesQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useAssignDepartmentHeadMutation,
  useDeleteDepartmentMutation,
  useGetDesignationsQuery,
  useGetDesignationByIdQuery,
  useGetDesignationStatsQuery,
  useGetDesignationAnalyticsQuery,
  useGetArchivedDesignationsQuery,
  useCreateDesignationMutation,
  useUpdateDesignationMutation,
  useArchiveDesignationMutation,
  useRestoreDesignationMutation,
  usePermanentDeleteDesignationMutation,
  useDeleteDesignationMutation,
  useGetShiftsQuery,
  useGetShiftByIdQuery,
  useGetShiftStatsQuery,
  useGetShiftAnalyticsQuery,
  useGetArchivedShiftsQuery,
  useGetShiftEmployeesQuery,
  useAssignEmployeesToShiftMutation,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useArchiveShiftMutation,
  useRestoreShiftMutation,
  usePermanentDeleteShiftMutation,
  useDeleteShiftMutation,
  useGetOrgChartQuery,
  useGetMyTeamQuery
} = departmentsApi;
