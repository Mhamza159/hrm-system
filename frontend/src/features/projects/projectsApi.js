/**
 * @file projectsApi.js
 * @description RTK Query API slice for Module M22 Projects & Timesheets.
 * 
 * SPECIFICATION:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Rows 22.1 to 22.7)
 * - Cache Invalidation: 'Clients', 'Projects', 'Timesheets'
 */

import { baseApi } from '../../lib/baseApi.js';

export const projectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =======================================================================
    // 22.1: Clients Endpoints
    // =======================================================================
    getClients: builder.query({
      query: (params = {}) => ({
        url: '/clients',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Clients', id: _id })),
              { type: 'Clients', id: 'LIST' }
            ]
          : [{ type: 'Clients', id: 'LIST' }]
    }),

    getClientById: builder.query({
      query: (id) => `/clients/${id}`,
      providesTags: (result, error, id) => [{ type: 'Clients', id }]
    }),

    createClient: builder.mutation({
      query: (body) => ({
        url: '/clients',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Clients', id: 'LIST' }]
    }),

    updateClient: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/clients/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Clients', id },
        { type: 'Clients', id: 'LIST' }
      ]
    }),

    deleteClient: builder.mutation({
      query: (id) => ({
        url: `/clients/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Clients', id: 'LIST' }]
    }),

    // =======================================================================
    // 22.1: Projects Endpoints
    // =======================================================================
    getProjects: builder.query({
      query: (params = {}) => ({
        url: '/projects',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Projects', id: _id })),
              { type: 'Projects', id: 'LIST' }
            ]
          : [{ type: 'Projects', id: 'LIST' }]
    }),

    getProjectById: builder.query({
      query: (id) => `/projects/${id}`,
      providesTags: (result, error, id) => [{ type: 'Projects', id }]
    }),

    createProject: builder.mutation({
      query: (body) => ({
        url: '/projects',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Projects', id: 'LIST' }]
    }),

    updateProject: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/projects/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Projects', id },
        { type: 'Projects', id: 'LIST' }
      ]
    }),

    deleteProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Projects', id: 'LIST' }]
    }),

    // =======================================================================
    // 22.2: Project Members Assignment Endpoint
    // =======================================================================
    assignProjectMembers: builder.mutation({
      query: ({ id, members }) => ({
        url: `/projects/${id}/members`,
        method: 'PUT',
        body: { members }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Projects', id },
        { type: 'Projects', id: 'LIST' }
      ]
    }),

    // =======================================================================
    // 22.3: Weekly Timesheet & Daily Logging Endpoints
    // =======================================================================
    getMyWeeklyTimesheets: builder.query({
      query: (params = {}) => ({
        url: '/timesheets/my-week',
        params
      }),
      providesTags: (result) => [{ type: 'Timesheets', id: 'MY_WEEK' }]
    }),

    logTimeEntry: builder.mutation({
      query: (body) => ({
        url: '/timesheets',
        method: 'POST',
        body
      }),
      invalidatesTags: [
        { type: 'Timesheets', id: 'MY_WEEK' },
        { type: 'Timesheets', id: 'LIST' }
      ]
    }),

    updateTimesheet: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/timesheets/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: [
        { type: 'Timesheets', id: 'MY_WEEK' },
        { type: 'Timesheets', id: 'LIST' }
      ]
    }),

    deleteTimesheet: builder.mutation({
      query: (id) => ({
        url: `/timesheets/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [
        { type: 'Timesheets', id: 'MY_WEEK' },
        { type: 'Timesheets', id: 'LIST' }
      ]
    }),

    // =======================================================================
    // 22.4: Timesheet Submission & Approval Endpoints
    // =======================================================================
    submitWeekTimesheets: builder.mutation({
      query: (body) => ({
        url: '/timesheets/submit',
        method: 'POST',
        body
      }),
      invalidatesTags: [
        { type: 'Timesheets', id: 'MY_WEEK' },
        { type: 'Timesheets', id: 'PENDING' }
      ]
    }),

    getPendingTimesheets: builder.query({
      query: (params = {}) => ({
        url: '/timesheets/pending',
        params
      }),
      providesTags: (result) => [{ type: 'Timesheets', id: 'PENDING' }]
    }),

    decideTimesheet: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/timesheets/${id}/decide`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: [
        { type: 'Timesheets', id: 'PENDING' },
        { type: 'Timesheets', id: 'MY_WEEK' }
      ]
    }),

    // =======================================================================
    // 22.5: Utilization Report Endpoint
    // =======================================================================
    getUtilizationReport: builder.query({
      query: (params = {}) => ({
        url: '/reports/utilization',
        params
      })
    }),

    // =======================================================================
    // 22.6: Project Profitability Endpoint (Super Admin Only)
    // =======================================================================
    getProjectProfitabilityReport: builder.query({
      query: () => '/reports/project-profitability'
    }),

    // =======================================================================
    // 22.7: HR Missing Timesheet Compliance Endpoints
    // =======================================================================
    getMissingTimesheets: builder.query({
      query: (params = {}) => ({
        url: '/timesheets/missing',
        params
      }),
      providesTags: [{ type: 'Timesheets', id: 'COMPLIANCE' }]
    }),

    remindMissingTimesheets: builder.mutation({
      query: (body) => ({
        url: '/timesheets/remind-missing',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Timesheets', id: 'COMPLIANCE' }]
    })
  })
});

export const {
  useGetClientsQuery,
  useGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAssignProjectMembersMutation,
  useGetMyWeeklyTimesheetsQuery,
  useLogTimeEntryMutation,
  useUpdateTimesheetMutation,
  useDeleteTimesheetMutation,
  useSubmitWeekTimesheetsMutation,
  useGetPendingTimesheetsQuery,
  useDecideTimesheetMutation,
  useGetUtilizationReportQuery,
  useGetProjectProfitabilityReportQuery,
  useGetMissingTimesheetsQuery,
  useRemindMissingTimesheetsMutation
} = projectsApi;

