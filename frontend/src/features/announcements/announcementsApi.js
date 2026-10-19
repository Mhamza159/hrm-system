/**
 * @file announcementsApi.js
 * @description RTK Query endpoints for Announcements, Pinning & Read Receipts (Module M8 / Slices 8.6, 8.7, 8.8).
 */

import { baseApi } from '../../lib/baseApi.js';

export const announcementsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnnouncements: builder.query({
      query: (params = {}) => ({
        url: '/announcements',
        method: 'GET',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Announcement', id: _id })),
              { type: 'Announcement', id: 'LIST' }
            ]
          : [{ type: 'Announcement', id: 'LIST' }]
    }),

    createAnnouncement: builder.mutation({
      query: (body) => ({
        url: '/announcements',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Announcement', id: 'LIST' }]
    }),

    updateAnnouncement: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/announcements/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Announcement', id },
        { type: 'Announcement', id: 'LIST' }
      ]
    }),

    deleteAnnouncement: builder.mutation({
      query: (id) => ({
        url: `/announcements/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Announcement', id },
        { type: 'Announcement', id: 'LIST' }
      ]
    }),

    togglePinAnnouncement: builder.mutation({
      query: ({ id, pinned }) => ({
        url: `/announcements/${id}/pin`,
        method: 'PATCH',
        body: { pinned }
      }),
      invalidatesTags: [{ type: 'Announcement', id: 'LIST' }]
    }),

    recordReadReceipt: builder.mutation({
      query: (id) => ({
        url: `/announcements/${id}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Announcement', id }]
    }),

    getReadReceipts: builder.query({
      query: (id) => ({
        url: `/announcements/${id}/receipts`,
        method: 'GET'
      }),
      providesTags: (result, error, id) => [{ type: 'Announcement', id: `RECEIPTS_${id}` }]
    })
  })
});

export const {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useTogglePinAnnouncementMutation,
  useRecordReadReceiptMutation,
  useGetReadReceiptsQuery
} = announcementsApi;
