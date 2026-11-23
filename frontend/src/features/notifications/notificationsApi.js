/**
 * @file notificationsApi.js
 * @description RTK Query endpoints for Notifications & Channel Preferences (Module M8 / Slice 8.1 & 8.2).
 */

import { baseApi } from '../../lib/baseApi.js';

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch paginated notifications with optional filters (module, priority, isArchived, search)
    getNotifications: builder.query({
      query: (params) => ({
        url: '/notifications',
        params
      }),
      transformResponse: (res) => res?.data ?? res,
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ _id }) => ({ type: 'Notification', id: _id })),
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
        { type: 'Notification', id: 'LIST' },
        'NotificationCounts'
      ]
    }),

    // Mark single notification as unread
    markAsUnread: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/unread`,
        method: 'PATCH'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
        'NotificationCounts'
      ]
    }),

    // Mark all notifications as read for current user
    markAllAsRead: builder.mutation({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH'
      }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }, 'NotificationCounts']
    }),

    // Archive single notification
    archiveNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/archive`,
        method: 'PATCH'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
        'NotificationCounts'
      ]
    }),

    // Restore archived notification back to active feed
    unarchiveNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/unarchive`,
        method: 'PATCH'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
        'NotificationCounts'
      ]
    }),

    // Archive all read notifications
    archiveAllNotifications: builder.mutation({
      query: () => ({
        url: '/notifications/archive-all',
        method: 'PATCH'
      }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }, 'NotificationCounts']
    }),

    // Delete single notification permanently
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
        'NotificationCounts'
      ]
    }),

    // Fetch dynamic module unread counts for sidebar indicators & badges
    getModuleNotificationCounts: builder.query({
      query: () => ({
        url: '/notifications/module-counts'
      }),
      transformResponse: (res) => res?.data ?? res,
      providesTags: ['NotificationCounts']
    }),

    // Fetch unread notification counts grouped by module & link (legacy)
    getNotificationUnreadSummary: builder.query({
      query: () => ({
        url: '/notifications/unread-summary'
      }),
      transformResponse: (res) => res?.data ?? res,
      providesTags: ['NotificationCounts']
    }),

    // Fetch user notification channel preferences
    getNotificationPreferences: builder.query({
      query: () => ({
        url: '/notifications/preferences'
      }),
      transformResponse: (res) => res?.data ?? res,
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
  useGetModuleNotificationCountsQuery,
  useGetNotificationUnreadSummaryQuery,
  useMarkAsReadMutation,
  useMarkAsUnreadMutation,
  useMarkAllAsReadMutation,
  useArchiveNotificationMutation,
  useUnarchiveNotificationMutation,
  useArchiveAllNotificationsMutation,
  useDeleteNotificationMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation
} = notificationsApi;
