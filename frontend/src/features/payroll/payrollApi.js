/**
 * @file payrollApi.js
 * @description RTK Query endpoints for Module M9 Payroll & Statutory Compliance.
 */

import { baseApi } from '../../lib/baseApi.js';

export const payrollApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 9.1: Salary Structures
    getSalaryStructures: builder.query({
      query: (params) => ({
        url: '/salary-structures',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'SalaryStructure', id: _id })),
              { type: 'SalaryStructure', id: 'LIST' }
            ]
          : [{ type: 'SalaryStructure', id: 'LIST' }]
    }),

    getEmployeeSalaryStructure: builder.query({
      query: (employeeId) => `/salary-structures/employee/${employeeId}`,
      providesTags: (result, error, id) => [{ type: 'SalaryStructure', id }]
    }),

    createSalaryStructure: builder.mutation({
      query: (body) => ({
        url: '/salary-structures',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'SalaryStructure', id: 'LIST' }]
    }),

    reviseSalaryStructure: builder.mutation({
      query: ({ employeeId, ...body }) => ({
        url: `/salary-structures/employee/${employeeId}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, { employeeId }) => [
        { type: 'SalaryStructure', id: employeeId },
        { type: 'SalaryStructure', id: 'LIST' }
      ]
    })
  })
});

export const {
  useGetSalaryStructuresQuery,
  useGetEmployeeSalaryStructureQuery,
  useCreateSalaryStructureMutation,
  useReviseSalaryStructureMutation
} = payrollApi;
