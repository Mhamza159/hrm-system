/**
 * @file attritionApi.js
 * @description RTK Query slice endpoints for Module M17 Attrition Prediction.
 * 
 * SPECIFICATION:
 * - Module: M17 Attrition Prediction (BUILD-GUIDE Section 26 · Rows 17.1 to 17.5)
 * - Cache Management: Tags 'AttritionScore' and 'AttritionAnalytics' ensure immediate UI sync upon note creation or calculation.
 */

import { baseApi } from '../../lib/baseApi.js';

export const attritionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAttritionScores: builder.query({
      query: (params) => ({
        url: '/attrition/scores',
        method: 'GET',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'AttritionScore', id: _id })),
              { type: 'AttritionScore', id: 'LIST' }
            ]
          : [{ type: 'AttritionScore', id: 'LIST' }]
    }),

    getAttritionScoreById: builder.query({
      query: (id) => `/attrition/scores/${id}`,
      providesTags: (result, error, id) => [{ type: 'AttritionScore', id }]
    }),

    getDepartmentRiskAnalytics: builder.query({
      query: () => '/attrition/departments',
      providesTags: [{ type: 'AttritionAnalytics', id: 'DEPARTMENTS' }]
    }),

    recalculateAttritionScores: builder.mutation({
      query: () => ({
        url: '/attrition/calculate',
        method: 'POST'
      }),
      invalidatesTags: [
        { type: 'AttritionScore', id: 'LIST' },
        { type: 'AttritionAnalytics', id: 'DEPARTMENTS' }
      ]
    }),

    addRetentionNote: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/attrition/${id}/notes`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AttritionScore', id },
        { type: 'AttritionScore', id: 'LIST' }
      ]
    }),

    getRetentionNotes: builder.query({
      query: (id) => `/attrition/${id}/notes`,
      providesTags: (result, error, id) => [{ type: 'AttritionScore', id: `NOTES_${id}` }]
    })
  })
});

export const {
  useGetAttritionScoresQuery,
  useGetAttritionScoreByIdQuery,
  useGetDepartmentRiskAnalyticsQuery,
  useRecalculateAttritionScoresMutation,
  useAddRetentionNoteMutation,
  useGetRetentionNotesQuery
} = attritionApi;

