/**
 * @file rolesApi.js
 * @description RTK Query endpoint definitions for Module M26 Roles & Permissions.
 * 
 * SPECIFICATION & FEATURES:
 * - Slice 26.1: getPermissions -> GET /permissions
 * - Slice 26.7: getRoles -> GET /roles
 * - Slice 26.7: getRoleById -> GET /roles/:id
 * - Slice 26.7: createRole -> POST /roles
 * - Slice 26.7 & 26.8: updateRole -> PATCH /roles/:id
 * - Slice 26.7 & 26.13: deleteRole -> DELETE /roles/:id
 * - Slice 26.10: cloneRole -> POST /roles/:id/clone
 * - Slice 26.11: assignUserRoles -> PATCH /users/:id/roles
 */

import { baseApi } from '../../lib/baseApi.js';

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 26.1: Retrieve full permission catalogue
    getPermissions: builder.query({
      query: () => '/permissions',
      providesTags: ['Permissions']
    }),

    // 26.7: Retrieve paginated roles list
    getRoles: builder.query({
      query: (params) => ({
        url: '/roles',
        params
      }),
      providesTags: ['Roles']
    }),

    // 26.7: Retrieve single role detail
    getRoleById: builder.query({
      query: (id) => `/roles/${id}`,
      providesTags: (result, error, id) => [{ type: 'Roles', id }]
    }),

    // 26.7: Create custom role
    createRole: builder.mutation({
      query: (data) => ({
        url: '/roles',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Roles']
    }),

    // 26.7 & 26.8: Update role metadata & permissions matrix
    updateRole: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/roles/${id}`,
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        'Roles',
        { type: 'Roles', id },
        'Auth'
      ]
    }),

    // 26.7 & 26.13: Delete custom role
    deleteRole: builder.mutation({
      query: (id) => ({
        url: `/roles/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Roles']
    }),

    // 26.10: Clone existing role
    cloneRole: builder.mutation({
      query: ({ id, newName }) => ({
        url: `/roles/${id}/clone`,
        method: 'POST',
        body: { newName }
      }),
      invalidatesTags: ['Roles']
    }),

    // 26.11: Assign roles to user
    assignUserRoles: builder.mutation({
      query: ({ userId, roleIds }) => ({
        url: `/users/${userId}/roles`,
        method: 'PATCH',
        body: { roleIds }
      }),
      invalidatesTags: ['Users', 'Auth']
    }),

    // 26.14: Delegations
    getDelegations: builder.query({
      query: () => '/delegations',
      providesTags: ['Delegations']
    }),

    createDelegation: builder.mutation({
      query: (data) => ({
        url: '/delegations',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Delegations', 'Auth']
    }),

    cancelDelegation: builder.mutation({
      query: (id) => ({
        url: `/delegations/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Delegations', 'Auth']
    }),

    // 26.15: Effective permissions inspector
    getEffectivePermissions: builder.query({
      query: (userId) => `/users/${userId}/effective-permissions`,
      providesTags: (result, error, userId) => [{ type: 'Users', id: userId }]
    })
  })
});

export const {
  useGetPermissionsQuery,
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useCloneRoleMutation,
  useAssignUserRolesMutation,
  useGetDelegationsQuery,
  useCreateDelegationMutation,
  useCancelDelegationMutation,
  useGetEffectivePermissionsQuery
} = rolesApi;
