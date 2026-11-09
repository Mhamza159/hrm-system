/**
 * @file chatApi.js
 * @description RTK Query API slice for Module M24: Internal Chat.
 */

import { baseApi } from '../../lib/baseApi.js';

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query({
      query: () => '/conversations',
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Conversation', id: _id })),
              { type: 'Conversation', id: 'LIST' }
            ]
          : [{ type: 'Conversation', id: 'LIST' }]
    }),

    getConversation: builder.query({
      query: (id) => `/conversations/${id}`,
      providesTags: (result, error, id) => [{ type: 'Conversation', id }]
    }),

    createConversation: builder.mutation({
      query: (body) => ({
        url: '/conversations',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }]
    }),

    syncDepartmentChannel: builder.mutation({
      query: () => ({
        url: '/conversations/sync-department',
        method: 'GET'
      }),
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }]
    }),

    modifyParticipants: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/conversations/${id}/participants`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Conversation', id },
        { type: 'Conversation', id: 'LIST' }
      ]
    }),

    archiveConversation: builder.mutation({
      query: (id) => ({
        url: `/conversations/${id}/archive`,
        method: 'PATCH'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Conversation', id },
        { type: 'Conversation', id: 'LIST' }
      ]
    }),

    getMessages: builder.query({
      query: ({ conversationId, page = 1, limit = 50 }) =>
        `/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
      providesTags: (result, error, { conversationId }) => [
        { type: 'Message', id: conversationId }
      ]
    }),

    sendMessage: builder.mutation({
      query: ({ conversationId, ...body }) => ({
        url: `/conversations/${conversationId}/messages`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Message', id: conversationId },
        { type: 'Conversation', id: 'LIST' }
      ]
    }),

    markConversationAsRead: builder.mutation({
      query: (id) => ({
        url: `/conversations/${id}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Conversation', id: 'LIST' }]
    }),

    searchMessages: builder.query({
      query: (q) => `/messages/search?q=${encodeURIComponent(q)}`
    }),

    uploadAttachment: builder.mutation({
      query: (formData) => ({
        url: '/chat/upload',
        method: 'POST',
        body: formData
      })
    }),

    getDirectoryUsers: builder.query({
      query: () => '/users?limit=100'
    })
  })
});

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useCreateConversationMutation,
  useSyncDepartmentChannelMutation,
  useModifyParticipantsMutation,
  useArchiveConversationMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkConversationAsReadMutation,
  useLazySearchMessagesQuery,
  useUploadAttachmentMutation,
  useGetDirectoryUsersQuery
} = chatApi;
