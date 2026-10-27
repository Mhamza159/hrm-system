/**
 * @file leavesApi.js
 * @description RTK Query endpoints for Module M6 Leave & Holidays.
 */

import { baseApi } from '../../lib/baseApi.js';

export const leavesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 6.1: Leave Types
    getLeaveTypes: builder.query({
      query: (params) => ({
        url: '/leave-types',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'LeaveType', id: _id })),
              { type: 'LeaveType', id: 'LIST' }
            ]
          : [{ type: 'LeaveType', id: 'LIST' }]
    }),

    getLeaveTypeById: builder.query({
      query: (id) => `/leave-types/${id}`,
      providesTags: (result, error, id) => [{ type: 'LeaveType', id }]
    }),

    createLeaveType: builder.mutation({
      query: (body) => ({
        url: '/leave-types',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'LeaveType', id: 'LIST' }, 'Leave']
    }),

    updateLeaveType: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/leave-types/${id}`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'LeaveType', id },
        { type: 'LeaveType', id: 'LIST' },
        'Leave'
      ]
    }),

    deleteLeaveType: builder.mutation({
      query: (id) => ({
        url: `/leave-types/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'LeaveType', id },
        { type: 'LeaveType', id: 'LIST' },
        'Leave'
      ]
    }),

    // 6.11: Holidays
    getHolidays: builder.query({
      query: (params) => ({
        url: '/holidays',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Holiday', id: _id })),
              { type: 'Holiday', id: 'LIST' }
            ]
          : [{ type: 'Holiday', id: 'LIST' }]
    }),

    getHolidayById: builder.query({
      query: (id) => `/holidays/${id}`,
      providesTags: (result, error, id) => [{ type: 'Holiday', id }]
    }),

    createHoliday: builder.mutation({
      query: (body) => ({
        url: '/holidays',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Holiday', id: 'LIST' }, 'Leave']
    }),

    updateHoliday: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/holidays/${id}`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Holiday', id },
        { type: 'Holiday', id: 'LIST' },
        'Leave'
      ]
    }),

    deleteHoliday: builder.mutation({
      query: (id) => ({
        url: `/holidays/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Holiday', id },
        { type: 'Holiday', id: 'LIST' },
        'Leave'
      ]
    }),

    seedHolidays: builder.mutation({
      query: (body = {}) => ({
        url: '/holidays/seed',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Holiday', id: 'LIST' }, 'Leave']
    }),
    // 6.9: Live Leave Balance
    getLeaveBalance: builder.query({
      query: (params) => ({
        url: '/leaves/balance',
        params
      }),
      providesTags: ['Leave']
    }),

    // 6.3: Apply Leave
    applyLeave: builder.mutation({
      query: (body) => ({
        url: '/leaves',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Leave']
    }),

    // 6.3: My Leaves History
    getMyLeaves: builder.query({
      query: (params) => ({
        url: '/leaves/my',
        params
      }),
      providesTags: ['Leave']
    }),

    // 6.6 & 6.7: Approval Queue
    getPendingApprovals: builder.query({
      query: (params) => ({
        url: '/leaves/approvals',
        params
      }),
      providesTags: ['Leave']
    }),

    // 6.7b: Applicant Leave & Attendance Audit Dossier
    getLeaveApplicantAudit: builder.query({
      query: (leaveId) => `/leaves/${leaveId}/audit`,
      providesTags: (result, error, leaveId) => [{ type: 'Leave', id: `AUDIT_${leaveId}` }]
    }),

    // 6.7: Decide Leave (Approve/Reject)
    decideLeave: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/leaves/${id}/decide`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Leave']
    }),

    // 6.8: Cancel Leave
    cancelLeave: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/leaves/${id}/cancel`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Leave']
    }),

    // 6.10: Team Leave Conflict Calendar
    getLeaveCalendar: builder.query({
      query: (params) => ({
        url: '/leaves/calendar',
        params
      }),
      providesTags: ['Leave']
    }),

    // 6.13: Year-End Leave Encashment
    getLeaveEncashments: builder.query({
      query: (params) => ({
        url: '/leaves/encash',
        params
      }),
      providesTags: ['Leave']
    }),

    requestLeaveEncashment: builder.mutation({
      query: (body) => ({
        url: '/leaves/encash',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Leave']
    }),

    decideLeaveEncashment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/leaves/encash/${id}`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Leave']
    }),

    // 6.14: HR Manual Balance Adjustment
    adjustLeaveBalance: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/leaves/balance/${id}`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Leave']
    })
  })
});

export const {
  useGetLeaveTypesQuery,
  useGetLeaveTypeByIdQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useDeleteLeaveTypeMutation,
  useGetHolidaysQuery,
  useGetHolidayByIdQuery,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
  useSeedHolidaysMutation,
  useGetLeaveBalanceQuery,
  useApplyLeaveMutation,
  useGetMyLeavesQuery,
  useGetPendingApprovalsQuery,
  useGetLeaveApplicantAuditQuery,
  useDecideLeaveMutation,
  useCancelLeaveMutation,
  useGetLeaveCalendarQuery,
  useGetLeaveEncashmentsQuery,
  useRequestLeaveEncashmentMutation,
  useDecideLeaveEncashmentMutation,
  useAdjustLeaveBalanceMutation
} = leavesApi;
