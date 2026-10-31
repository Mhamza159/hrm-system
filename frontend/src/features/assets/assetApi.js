/**
 * @file assetApi.js
 * @description RTK Query Endpoints for Module M23 Asset Management.
 * 
 * SPECIFICATION:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Rows 23.1 to 23.6)
 * - Cache tags: 'Assets', 'Asset', 'AssetRequests'
 */

import { baseApi } from '../../lib/baseApi.js';

export const assetApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 23.1: Get paginated assets list
    getAssets: builder.query({
      query: (params = {}) => ({
        url: '/assets',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Asset', id: _id })),
              { type: 'Assets', id: 'LIST' }
            ]
          : [{ type: 'Assets', id: 'LIST' }]
    }),

    // 23.1: Get single asset by ID
    getAssetById: builder.query({
      query: (id) => `/assets/${id}`,
      providesTags: (result, error, id) => [{ type: 'Asset', id }]
    }),

    // 23.1: Create/register new asset
    createAsset: builder.mutation({
      query: (body) => ({
        url: '/assets',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Assets', id: 'LIST' }]
    }),

    // 23.1: Update asset attributes
    updateAsset: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/assets/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Asset', id },
        { type: 'Assets', id: 'LIST' }
      ]
    }),

    // 23.1: Soft-delete asset
    deleteAsset: builder.mutation({
      query: (id) => ({
        url: `/assets/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Assets', id: 'LIST' }]
    }),

    // 23.2: Assign asset to custodian
    assignAsset: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/assets/${id}/assign`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Asset', id },
        { type: 'Assets', id: 'LIST' },
        'AssetRequests'
      ]
    }),

    // 23.2: Return asset to inventory
    returnAsset: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/assets/${id}/return`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Asset', id },
        { type: 'Assets', id: 'LIST' }
      ]
    }),

    // 23.4: Send asset for repair
    sendAssetForRepair: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/assets/${id}/repairs`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Asset', id },
        { type: 'Assets', id: 'LIST' }
      ]
    }),

    // 23.4: Update / complete repair
    updateAssetRepair: builder.mutation({
      query: ({ id, repairId, ...body }) => ({
        url: `/assets/${id}/repairs/${repairId}`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Asset', id },
        { type: 'Assets', id: 'LIST' }
      ]
    }),

    // 23.6: Employee Self-Service "My Assets"
    getMyAssets: builder.query({
      query: () => '/assets/my',
      providesTags: ['Assets']
    }),

    // 23.6: Report issue on assigned asset
    reportAssetIssue: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/assets/${id}/issue`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Asset', id },
        { type: 'Assets', id: 'LIST' }
      ]
    }),

    // 23.5: Get asset requisitions
    getAssetRequests: builder.query({
      query: () => '/assets/requests',
      providesTags: ['AssetRequests']
    }),

    // 23.5: Create asset requisition
    createAssetRequest: builder.mutation({
      query: (body) => ({
        url: '/assets/requests',
        method: 'POST',
        body
      }),
      invalidatesTags: ['AssetRequests']
    }),

    // 23.5: Approve asset requisition and allocate asset
    approveAssetRequest: builder.mutation({
      query: ({ id, allocatedAssetId }) => ({
        url: `/assets/requests/${id}/approve`,
        method: 'POST',
        body: { allocatedAssetId }
      }),
      invalidatesTags: ['AssetRequests', { type: 'Assets', id: 'LIST' }]
    }),

    // 23.5: Reject asset requisition
    rejectAssetRequest: builder.mutation({
      query: ({ id, rejectionReason }) => ({
        url: `/assets/requests/${id}/reject`,
        method: 'POST',
        body: { rejectionReason }
      }),
      invalidatesTags: ['AssetRequests']
    }),

    // 23.3: Manual trigger for asset expiry check
    triggerExpiryCheck: builder.mutation({
      query: () => ({
        url: '/assets/check-expiry',
        method: 'POST'
      }),
      invalidatesTags: [{ type: 'Assets', id: 'LIST' }]
    })
  })
});

export const {
  useGetAssetsQuery,
  useGetAssetByIdQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useAssignAssetMutation,
  useReturnAssetMutation,
  useSendAssetForRepairMutation,
  useUpdateAssetRepairMutation,
  useGetMyAssetsQuery,
  useReportAssetIssueMutation,
  useGetAssetRequestsQuery,
  useCreateAssetRequestMutation,
  useApproveAssetRequestMutation,
  useRejectAssetRequestMutation,
  useTriggerExpiryCheckMutation
} = assetApi;

