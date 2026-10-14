/**
 * @file settingsApi.js
 * @description RTK Query endpoint definitions for Module M2 Company Settings.
 * 
 * SPECIFICATION & FEATURES:
 * - Slice 2.1: getSettings -> GET /settings
 * - Slice 2.1: getSettingByKey -> GET /settings/:key
 * - Slice 2.1: updateSetting -> PATCH /settings/:key
 * - Slice 2.2: uploadLogo -> POST /settings/company/logo
 * - Slice 2.10: getBackupStatus -> GET /settings/backup-status
 * - Slice 2.10: triggerBackup -> POST /settings/backup-now
 * - Slice 2.11: getPublicPolicies -> GET /settings/public-policies
 */

import { baseApi } from '../../lib/baseApi.js';

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 2.1: Retrieve all settings in consolidated payload
    getSettings: builder.query({
      query: () => '/settings',
      providesTags: ['Settings']
    }),

    // 2.1: Retrieve single setting key
    getSettingByKey: builder.query({
      query: (key) => `/settings/${key}`,
      providesTags: (result, error, key) => [{ type: 'Settings', id: key }]
    }),

    // 2.1 - 2.9: Update specific setting key
    updateSetting: builder.mutation({
      query: ({ key, value, description }) => ({
        url: `/settings/${key}`,
        method: 'PATCH',
        body: { value, description }
      }),
      invalidatesTags: (result, error, { key }) => [
        'Settings',
        { type: 'Settings', id: key },
        'Policies'
      ]
    }),

    // 2.2: Upload company logo (multipart/form-data)
    uploadLogo: builder.mutation({
      query: (formData) => ({
        url: '/settings/company/logo',
        method: 'POST',
        body: formData
      }),
      invalidatesTags: ['Settings', { type: 'Settings', id: 'company' }, 'Policies']
    }),

    // 2.10: Inspect database backup status and metrics
    getBackupStatus: builder.query({
      query: () => '/settings/backup-status',
      providesTags: ['Settings']
    }),

    // 2.10: Trigger manual database backup snapshot (Super Admin only)
    triggerBackup: builder.mutation({
      query: () => ({
        url: '/settings/backup-now',
        method: 'POST'
      }),
      invalidatesTags: ['Settings']
    }),

    // 2.11: Retrieve sanitized public company policies for all staff
    getPublicPolicies: builder.query({
      query: () => '/settings/public-policies',
      providesTags: ['Policies']
    })
  })
});

export const {
  useGetSettingsQuery,
  useGetSettingByKeyQuery,
  useUpdateSettingMutation,
  useUploadLogoMutation,
  useGetBackupStatusQuery,
  useTriggerBackupMutation,
  useGetPublicPoliciesQuery
} = settingsApi;
