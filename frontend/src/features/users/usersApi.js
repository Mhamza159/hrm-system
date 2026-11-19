/**
 * @file usersApi.js
 * @description RTK Query endpoint definitions for User Access, RBAC/PBAC Governance & Account Security.
 */

import { baseApi } from '../../lib/baseApi.js';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/users (supports pagination, search, roleId, departmentId, status, accessStatus, has2fa)
    getUsers: builder.query({
      query: (params = {}) => ({
        url: '/users',
        params
      }),
      providesTags: (result) =>
        result?.data && Array.isArray(result.data)
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Users', id: _id })),
              { type: 'Users', id: 'LIST' }
            ]
          : [{ type: 'Users', id: 'LIST' }]
    }),

    // GET /api/v1/users/stats
    getUserStats: builder.query({
      query: () => '/users/stats',
      providesTags: ['UserStats']
    }),

    // GET /api/v1/users/:id
    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'UserDetail', id }]
    }),

    // GET /api/v1/users/:id/effective-permissions
    getEffectivePermissions: builder.query({
      query: (id) => `/users/${id}/effective-permissions`,
      providesTags: (result, error, id) => [{ type: 'EffectivePermissions', id }]
    }),

    // PATCH /api/v1/users/:id/status
    updateUserStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/users/${id}/status`,
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id },
        { type: 'UserDetail', id },
        'UserStats',
        'Auth'
      ]
    }),

    // POST /api/v1/users/:id/unlock
    unlockUserAccount: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/users/${id}/unlock`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id },
        { type: 'UserDetail', id },
        'UserStats'
      ]
    }),

    // POST /api/v1/users/:id/revoke-sessions
    revokeUserSessions: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/users/${id}/revoke-sessions`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id },
        { type: 'UserDetail', id },
        'UserStats'
      ]
    }),

    // POST /api/v1/users/:id/force-password-change
    forcePasswordChange: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/users/${id}/force-password-change`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id },
        { type: 'UserDetail', id },
        'UserStats'
      ]
    }),

    // POST /api/v1/users/:id/reset-password
    adminResetPassword: builder.mutation({
      query: (id) => ({
        url: `/users/${id}/reset-password`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id },
        { type: 'UserDetail', id },
        'UserStats'
      ]
    }),

    // POST /api/v1/users/:id/reset-device
    resetDeviceBinding: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/users/${id}/reset-device`,
        method: 'POST',
        body: { reason }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id },
        { type: 'UserDetail', id },
        'UserStats'
      ]
    }),

    // PATCH /api/v1/users/:id/roles
    assignUserRoles: builder.mutation({
      query: ({ userId, roleIds }) => ({
        url: `/users/${userId}/roles`,
        method: 'PATCH',
        body: { roleIds }
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id: userId },
        { type: 'UserDetail', id: userId },
        { type: 'EffectivePermissions', id: userId },
        'UserStats',
        'Roles'
      ]
    })
  })
});

export const {
  useGetUsersQuery,
  useGetUserStatsQuery,
  useGetUserByIdQuery,
  useGetEffectivePermissionsQuery,
  useUpdateUserStatusMutation,
  useUnlockUserAccountMutation,
  useRevokeUserSessionsMutation,
  useForcePasswordChangeMutation,
  useAdminResetPasswordMutation,
  useResetDeviceBindingMutation,
  useAssignUserRolesMutation
} = usersApi;
