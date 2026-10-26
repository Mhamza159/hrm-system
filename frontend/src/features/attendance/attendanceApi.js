/**
 * @file attendanceApi.js
 * @description RTK Query Endpoints for Module M5 Attendance, Breaks, Shifts, WFH, and Month Locking.
 */

import { baseApi } from '../../lib/baseApi.js';

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 5.9: Get self monthly attendance
    getMyAttendance: builder.query({
      query: (params) => ({
        url: '/attendance/my',
        params
      }),
      providesTags: ['Attendance']
    }),

    // 5.10: Get team live presence & attendance records
    getTeamAttendance: builder.query({
      query: (params) => ({
        url: '/attendance/team',
        params
      }),
      providesTags: ['Attendance']
    }),

    // 5.15: Get attendance monthly history matrix
    getAttendanceHistory: builder.query({
      query: (params) => ({
        url: '/attendance/history',
        params
      }),
      providesTags: ['Attendance']
    }),

    // 5.3: Clock in
    checkIn: builder.mutation({
      query: (body) => ({
        url: '/attendance/check-in',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Attendance']
    }),

    // 5.4: Clock out
    checkOut: builder.mutation({
      query: (body) => ({
        url: '/attendance/check-out',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Attendance']
    }),

    // 5.5: Start break
    startBreak: builder.mutation({
      query: (body) => ({
        url: '/attendance/break-start',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Attendance']
    }),

    // 5.5: End break
    endBreak: builder.mutation({
      query: (body) => ({
        url: '/attendance/break-end',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Attendance']
    }),

    // 5.11: Manual Attendance Override
    updateAttendance: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/attendance/${id}`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Attendance']
    }),

    // 5.14: Month Lock status & toggle
    getLockStatus: builder.query({
      query: (yearMonth) => ({
        url: '/attendance/lock-status',
        params: { yearMonth }
      }),
      providesTags: ['AttendanceLock']
    }),

    lockMonth: builder.mutation({
      query: (body) => ({
        url: '/attendance/lock',
        method: 'POST',
        body
      }),
      invalidatesTags: ['AttendanceLock', 'Attendance']
    }),

    unlockMonth: builder.mutation({
      query: (body) => ({
        url: '/attendance/unlock',
        method: 'POST',
        body
      }),
      invalidatesTags: ['AttendanceLock', 'Attendance']
    }),

    // 5.8: WFH
    applyWFH: builder.mutation({
      query: (body) => ({
        url: '/attendance/wfh',
        method: 'POST',
        body
      }),
      invalidatesTags: ['WFH', 'Dashboard']
    }),

    getMyWFHRequests: builder.query({
      query: (params) => ({
        url: '/attendance/wfh/my',
        params
      }),
      providesTags: ['WFH']
    }),

    getTeamWFHRequests: builder.query({
      query: (params) => ({
        url: '/attendance/wfh/team',
        params
      }),
      providesTags: ['WFH']
    }),

    decideWFH: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/attendance/wfh/${id}/decide`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['WFH', 'Attendance', 'Dashboard']
    }),

    getWFHAuditContext: builder.query({
      query: (id) => `/attendance/wfh/${id}/audit-context`,
      providesTags: (result, error, id) => [{ type: 'WFH', id }]
    }),

    // 5.12: Attendance Corrections
    applyCorrection: builder.mutation({
      query: (body) => ({
        url: '/attendance/corrections',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Correction', 'Dashboard']
    }),

    getMyCorrections: builder.query({
      query: (params) => ({
        url: '/attendance/corrections/my',
        params
      }),
      providesTags: ['Correction']
    }),

    getTeamCorrections: builder.query({
      query: (params) => ({
        url: '/attendance/corrections/team',
        params
      }),
      providesTags: ['Correction']
    }),

    decideCorrection: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/attendance/corrections/${id}/decide`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Correction', 'Attendance', 'Dashboard']
    }),

    getCorrectionAuditContext: builder.query({
      query: (id) => `/attendance/corrections/${id}/audit-context`,
      providesTags: (result, error, id) => [{ type: 'Correction', id }]
    }),

    // 5.2: Shift Management
    getShifts: builder.query({
      query: () => '/shifts',
      providesTags: ['Shifts']
    }),

    createShift: builder.mutation({
      query: (body) => ({
        url: '/shifts',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Shifts']
    }),

    updateShift: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/shifts/${id}`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Shifts']
    }),

    deleteShift: builder.mutation({
      query: (id) => ({
        url: `/shifts/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Shifts']
    })
  })
});

export const {
  useGetMyAttendanceQuery,
  useGetTeamAttendanceQuery,
  useGetAttendanceHistoryQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useStartBreakMutation,
  useEndBreakMutation,
  useUpdateAttendanceMutation,
  useGetLockStatusQuery,
  useLockMonthMutation,
  useUnlockMonthMutation,
  useApplyWFHMutation,
  useGetMyWFHRequestsQuery,
  useGetTeamWFHRequestsQuery,
  useDecideWFHMutation,
  useGetWFHAuditContextQuery,
  useApplyCorrectionMutation,
  useGetMyCorrectionsQuery,
  useGetTeamCorrectionsQuery,
  useDecideCorrectionMutation,
  useGetCorrectionAuditContextQuery,
  useGetShiftsQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation
} = attendanceApi;
