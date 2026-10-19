/**
 * @file notificationsApi.js
 * @description RTK Query endpoints for Notifications & Channel Preferences (Module M8 / Slice 8.1 & 8.2).
 */

import { baseApi } from '../../lib/baseApi.js';

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch paginated notifications with optional unreadOnly filter
    getNotifications: builder.query({
      query: (params) => ({
        url: '/notifications',
        params
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ _id }) => ({ type: 'Notification', id: _id })),
              { type: 'Notification', id: 'LIST' }
            ]
          : [{ type: 'Notification', id: 'LIST' }]
    }),

    // Mark single notification as read
    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' }
      ]
    }),

    // Mark all notifications as read for current user
    markAllAsRead: builder.mutation({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH'
      }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }]
    }),

    // Fetch user notification channel preferences
    getNotificationPreferences: builder.query({
      query: () => ({
        url: '/notifications/preferences'
      }),
      providesTags: [{ type: 'Notification', id: 'PREFERENCES' }]
    }),

    // Update user notification channel preferences
    updateNotificationPreferences: builder.mutation({
      query: (body) => ({
        url: '/notifications/preferences',
        method: 'PATCH',
        body
      }),
      invalidatesTags: [{ type: 'Notification', id: 'PREFERENCES' }]
    })
  })
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation
} = notificationsApi;
