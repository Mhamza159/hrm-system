/**
 * @file authApi.js
 * @description RTK Query endpoint definitions for Module M1 Authentication.
 * 
 * ENDPOINTS & SLICES:
 * - Slice 1.2: login -> POST /auth/login
 * - Slice 1.4: refreshToken -> POST /auth/refresh
 * - Slice 1.5: logout -> POST /auth/logout
 * - Slice 1.6: getMe -> GET /auth/me
 * - Slice 1.7: forgotPassword -> POST /auth/forgot-password
 * - Slice 1.8: resetPassword -> POST /auth/reset-password
 * - Slice 1.9: changePassword -> PATCH /auth/change-password
 */

import { baseApi } from '../../lib/baseApi.js';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST /api/v1/auth/login
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials
      })
    }),

    // POST /api/v1/auth/refresh
    refreshToken: builder.mutation({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST'
      })
    }),

    // POST /api/v1/auth/logout
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST'
      })
    }),

    // GET /api/v1/auth/me
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['Auth']
    }),

    // POST /api/v1/auth/forgot-password
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data
      })
    }),

    // POST /api/v1/auth/reset-password
    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data
      })
    }),

    // PATCH /api/v1/auth/change-password
    changePassword: builder.mutation({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'PATCH',
        body: data
      })
    }),

    // PATCH /api/v1/users/:id/status (Slice 1.13)
    updateUserStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/users/${id}/status`,
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: ['Users', 'Auth']
    }),

    // GET /api/v1/users (Slice 1.13)
    getUsers: builder.query({
      query: () => '/users',
      providesTags: ['Users']
    }),

    // POST /api/v1/auth/verify-otp (Slice 1.10)
    verifyOtp: builder.mutation({
      query: (data) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body: data
      })
    }),

    // POST /api/v1/auth/2fa/enable (Slice 1.10)
    enable2fa: builder.mutation({
      query: () => ({
        url: '/auth/2fa/enable',
        method: 'POST'
      })
    }),

    // POST /api/v1/auth/2fa/verify-enable (Slice 1.10)
    verifyEnable2fa: builder.mutation({
      query: (data) => ({
        url: '/auth/2fa/verify-enable',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Auth', 'User']
    }),

    // POST /api/v1/auth/2fa/disable (Slice 1.10)
    disable2fa: builder.mutation({
      query: (data) => ({
        url: '/auth/2fa/disable',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Auth', 'User']
    }),

    // GET /api/v1/auth/login-history (Slice 1.12)
    getLoginHistory: builder.query({
      query: (params) => ({
        url: '/auth/login-history',
        params
      }),
      providesTags: ['Auth']
    }),

    // POST /api/v1/users/:id/reset-password (Slice 1.14)
    adminResetPassword: builder.mutation({
      query: (id) => ({
        url: `/users/${id}/reset-password`,
        method: 'POST'
      }),
      invalidatesTags: ['Users', 'Auth']
    })
  })
});

export const {
  useLoginMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useUpdateUserStatusMutation,
  useGetUsersQuery,
  useVerifyOtpMutation,
  useEnable2faMutation,
  useVerifyEnable2faMutation,
  useDisable2faMutation,
  useGetLoginHistoryQuery,
  useAdminResetPasswordMutation
} = authApi;



