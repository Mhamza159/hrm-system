/**
 * @file chatbotApi.js
 * @description RTK Query endpoints for Module M16 HR Chatbot & AI Assistant.
 * 
 * SPECIFICATION & FEATURES:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Rows 16.1 to 16.9)
 * - Cache tags: 'PolicyDoc', 'Chatbot', 'UnansweredQuestion', 'Settings'
 */

import { baseApi } from '../../lib/baseApi.js';

export const chatbotApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 16.1: Policy Documents Ingestion
    getPolicyDocs: builder.query({
      query: (params = {}) => ({
        url: '/chatbot/policies',
        params
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ _id }) => ({ type: 'PolicyDoc', id: _id })),
              { type: 'PolicyDoc', id: 'LIST' }
            ]
          : [{ type: 'PolicyDoc', id: 'LIST' }]
    }),

    uploadPolicyDoc: builder.mutation({
      query: (formData) => ({
        url: '/chatbot/policies',
        method: 'POST',
        body: formData
      }),
      invalidatesTags: [{ type: 'PolicyDoc', id: 'LIST' }]
    }),

    deletePolicyDoc: builder.mutation({
      query: (id) => ({
        url: `/chatbot/policies/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'PolicyDoc', id: 'LIST' }]
    }),

    // 16.2 & 16.3 & 16.4 & 16.5 & 16.7: Ask Chatbot
    askChatbot: builder.mutation({
      query: (body) => ({
        url: '/chatbot/ask',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Chatbot', id: 'HISTORY' }]
    }),

    // 16.8: Chat History & Clear
    getChatHistory: builder.query({
      query: () => ({
        url: '/chatbot/history'
      }),
      providesTags: [{ type: 'Chatbot', id: 'HISTORY' }]
    }),

    clearChatHistory: builder.mutation({
      query: () => ({
        url: '/chatbot/history',
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Chatbot', id: 'HISTORY' }]
    }),

    // 16.6: Escalation & HR Queue
    escalateQuestion: builder.mutation({
      query: (body) => ({
        url: '/chatbot/escalate',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'UnansweredQuestion', id: 'LIST' }]
    }),

    getUnansweredQuestions: builder.query({
      query: (params = {}) => ({
        url: '/chatbot/unanswered',
        params
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ _id }) => ({ type: 'UnansweredQuestion', id: _id })),
              { type: 'UnansweredQuestion', id: 'LIST' }
            ]
          : [{ type: 'UnansweredQuestion', id: 'LIST' }]
    }),

    answerUnansweredQuestion: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/chatbot/unanswered/${id}/answer`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: [{ type: 'UnansweredQuestion', id: 'LIST' }]
    }),

    // 16.9: Chatbot Settings
    getChatbotSettings: builder.query({
      query: () => ({
        url: '/chatbot/settings'
      }),
      providesTags: [{ type: 'Settings', id: 'CHATBOT' }]
    }),

    updateChatbotSettings: builder.mutation({
      query: (body) => ({
        url: '/chatbot/settings',
        method: 'PATCH',
        body
      }),
      invalidatesTags: [{ type: 'Settings', id: 'CHATBOT' }]
    })
  })
});

export const {
  useGetPolicyDocsQuery,
  useUploadPolicyDocMutation,
  useDeletePolicyDocMutation,
  useAskChatbotMutation,
  useGetChatHistoryQuery,
  useClearChatHistoryMutation,
  useEscalateQuestionMutation,
  useGetUnansweredQuestionsQuery,
  useAnswerUnansweredQuestionMutation,
  useGetChatbotSettingsQuery,
  useUpdateChatbotSettingsMutation
} = chatbotApi;

