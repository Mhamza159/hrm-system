/**
 * @file rewardsApi.js
 * @description RTK Query API slice for Module M20: Rewards, Celebrations & Surveys.
 */

import { baseApi } from '../../lib/baseApi.js';

export const rewardsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Awards & Employee of the Month (Row 20.1)
    getAwards: builder.query({
      query: (params) => ({
        url: '/rewards/awards',
        method: 'GET',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Awards', id: _id })),
              { type: 'Awards', id: 'LIST' }
            ]
          : [{ type: 'Awards', id: 'LIST' }]
    }),

    getAwardById: builder.query({
      query: (id) => `/rewards/awards/${id}`,
      providesTags: (result, error, id) => [{ type: 'Awards', id }]
    }),

    createAward: builder.mutation({
      query: (body) => ({
        url: '/rewards/awards',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Awards', id: 'LIST' }]
    }),

    nominateCandidate: builder.mutation({
      query: ({ awardId, ...body }) => ({
        url: `/rewards/awards/${awardId}/nominate`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { awardId }) => [
        { type: 'Awards', id: awardId },
        { type: 'Awards', id: 'LIST' }
      ]
    }),

    shortlistNomination: builder.mutation({
      query: ({ awardId, nominationId, shortlisted }) => ({
        url: `/rewards/awards/${awardId}/nominations/${nominationId}/shortlist`,
        method: 'PATCH',
        body: { shortlisted }
      }),
      invalidatesTags: (result, error, { awardId }) => [
        { type: 'Awards', id: awardId },
        { type: 'Awards', id: 'LIST' }
      ]
    }),

    updateAwardStatus: builder.mutation({
      query: ({ awardId, status }) => ({
        url: `/rewards/awards/${awardId}/status`,
        method: 'PATCH',
        body: { status }
      }),
      invalidatesTags: (result, error, { awardId }) => [
        { type: 'Awards', id: awardId },
        { type: 'Awards', id: 'LIST' }
      ]
    }),

    castVote: builder.mutation({
      query: ({ awardId, nomineeId }) => ({
        url: `/rewards/awards/${awardId}/vote`,
        method: 'POST',
        body: { nomineeId }
      }),
      invalidatesTags: (result, error, { awardId }) => [
        { type: 'Awards', id: awardId },
        { type: 'Awards', id: 'LIST' }
      ]
    }),

    announceWinner: builder.mutation({
      query: ({ awardId, ...body }) => ({
        url: `/rewards/awards/${awardId}/announce`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { awardId }) => [
        { type: 'Awards', id: awardId },
        { type: 'Awards', id: 'LIST' }
      ]
    }),

    getAwardVoteStats: builder.query({
      query: (awardId) => `/rewards/awards/${awardId}/stats`,
      providesTags: (result, error, awardId) => [{ type: 'Awards', id: `STATS_${awardId}` }]
    }),

    // Peer Appreciation Wall & Badges (Row 20.2)
    getKudos: builder.query({
      query: (params) => ({
        url: '/rewards/kudos',
        method: 'GET',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Kudos', id: _id })),
              { type: 'Kudos', id: 'LIST' }
            ]
          : [{ type: 'Kudos', id: 'LIST' }]
    }),

    createKudos: builder.mutation({
      query: (body) => ({
        url: '/rewards/kudos',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Kudos', id: 'LIST' }]
    }),

    toggleLikeKudos: builder.mutation({
      query: (id) => ({
        url: `/rewards/kudos/${id}/like`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Kudos', id },
        { type: 'Kudos', id: 'LIST' }
      ]
    }),

    // Celebration Wall & Milestones (Row 20.3)
    getTodayCelebrations: builder.query({
      query: () => '/rewards/celebrations/today',
      providesTags: [{ type: 'Celebrations', id: 'TODAY' }]
    }),

    getUpcomingCelebrations: builder.query({
      query: (days = 30) => `/rewards/celebrations/upcoming?days=${days}`,
      providesTags: [{ type: 'Celebrations', id: 'UPCOMING' }]
    }),

    // Pulse Surveys & Analytics (Row 20.4 & 20.5)
    getSurveys: builder.query({
      query: (params) => ({
        url: '/rewards/surveys',
        method: 'GET',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Surveys', id: _id })),
              { type: 'Surveys', id: 'LIST' }
            ]
          : [{ type: 'Surveys', id: 'LIST' }]
    }),

    getSurveyById: builder.query({
      query: (id) => `/rewards/surveys/${id}`,
      providesTags: (result, error, id) => [{ type: 'Surveys', id }]
    }),

    createSurvey: builder.mutation({
      query: (body) => ({
        url: '/rewards/surveys',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Surveys', id: 'LIST' }]
    }),

    submitSurveyResponse: builder.mutation({
      query: ({ surveyId, answers }) => ({
        url: `/rewards/surveys/${surveyId}/respond`,
        method: 'POST',
        body: { answers }
      }),
      invalidatesTags: (result, error, { surveyId }) => [
        { type: 'Surveys', id: surveyId },
        { type: 'Surveys', id: 'LIST' },
        { type: 'Surveys', id: `ANALYTICS_${surveyId}` }
      ]
    }),

    getSurveyAnalytics: builder.query({
      query: (surveyId) => `/rewards/surveys/${surveyId}/analytics`,
      providesTags: (result, error, surveyId) => [{ type: 'Surveys', id: `ANALYTICS_${surveyId}` }]
    })
  })
});

export const {
  useGetAwardsQuery,
  useGetAwardByIdQuery,
  useCreateAwardMutation,
  useNominateCandidateMutation,
  useShortlistNominationMutation,
  useUpdateAwardStatusMutation,
  useCastVoteMutation,
  useAnnounceWinnerMutation,
  useGetAwardVoteStatsQuery,
  useGetKudosQuery,
  useCreateKudosMutation,
  useToggleLikeKudosMutation,
  useGetTodayCelebrationsQuery,
  useGetUpcomingCelebrationsQuery,
  useGetSurveysQuery,
  useGetSurveyByIdQuery,
  useCreateSurveyMutation,
  useSubmitSurveyResponseMutation,
  useGetSurveyAnalyticsQuery
} = rewardsApi;

