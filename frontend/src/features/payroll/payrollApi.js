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
    }),

    // 9.7: Payroll Runs
    getPayrollRuns: builder.query({
      query: (params) => ({
        url: '/payroll/runs',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'PayrollRun', id: _id })),
              { type: 'PayrollRun', id: 'LIST' }
            ]
          : [{ type: 'PayrollRun', id: 'LIST' }]
    }),

    getPayrollRunById: builder.query({
      query: ({ id, ...params }) => ({
        url: `/payroll/runs/${id}`,
        params
      }),
      providesTags: (result, error, { id }) => [
        { type: 'PayrollRun', id },
        { type: 'Payslip', id: 'LIST' }
      ]
    }),

    generatePayrollRun: builder.mutation({
      query: (body) => ({
        url: '/payroll/runs/generate',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'PayrollRun', id: 'LIST' }]
    }),

    adjustPayslip: builder.mutation({
      query: ({ runId, slipId, ...body }) => ({
        url: `/payroll/runs/${runId}/payslips/${slipId}`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { runId, slipId }) => [
        { type: 'PayrollRun', id: runId },
        { type: 'Payslip', id: slipId },
        { type: 'Payslip', id: 'LIST' }
      ]
    }),

    approvePayrollRun: builder.mutation({
      query: (runId) => ({
        url: `/payroll/runs/${runId}/approve`,
        method: 'PATCH'
      }),
      invalidatesTags: (result, error, runId) => [
        { type: 'PayrollRun', id: runId },
        { type: 'PayrollRun', id: 'LIST' },
        { type: 'Payslip', id: 'LIST' }
      ]
    }),

    markPayrollPaid: builder.mutation({
      query: ({ runId, ...body }) => ({
        url: `/payroll/runs/${runId}/mark-paid`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { runId }) => [
        { type: 'PayrollRun', id: runId },
        { type: 'PayrollRun', id: 'LIST' },
        { type: 'Payslip', id: 'LIST' }
      ]
    }),

    // 9.11: My Payslips
    getMyPayslips: builder.query({
      query: (params) => ({
        url: '/payslips/my',
        params
      }),
      providesTags: ['MyPayslips']
    })
  })
});

export const {
  useGetSalaryStructuresQuery,
  useGetEmployeeSalaryStructureQuery,
  useCreateSalaryStructureMutation,
  useReviseSalaryStructureMutation,
  useGetPayrollRunsQuery,
  useGetPayrollRunByIdQuery,
  useGeneratePayrollRunMutation,
  useAdjustPayslipMutation,
  useApprovePayrollRunMutation,
  useMarkPayrollPaidMutation,
  useGetMyPayslipsQuery
} = payrollApi;
