/**
 * @file loansApi.js
 * @description RTK Query endpoints for Module M10 Loans & Salary Advances.
 * 
 * SPECIFICATION:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Rows 10.1 - 10.6)
 * - Invariant: Monetary amounts transmitted in integer paisa (1 PKR = 100 paisa).
 */

import { baseApi } from '../../lib/baseApi.js';

export const loansApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 10.1: Apply for Loan / Advance
    applyLoan: builder.mutation({
      query: (body) => ({
        url: '/loans',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Loans', id: 'LIST' }, 'Loan']
    }),

    // 10.2: Live Borrowing Limit & Eligibility
    getLoanEligibility: builder.query({
      query: () => '/loans/my-eligibility',
      providesTags: ['Loan']
    }),

    // List Loans (Scoped by CASL ability: own/team/dept/all)
    getLoans: builder.query({
      query: (params) => ({
        url: '/loans',
        params
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Loan', id: _id })),
              { type: 'Loans', id: 'LIST' }
            ]
          : [{ type: 'Loans', id: 'LIST' }]
    }),

    // Get specific loan
    getLoanById: builder.query({
      query: (id) => `/loans/${id}`,
      providesTags: (result, error, id) => [{ type: 'Loan', id }]
    }),

    // 10.4: Installment Repayment Schedule
    getLoanSchedule: builder.query({
      query: (id) => `/loans/${id}/schedule`,
      providesTags: (result, error, id) => [{ type: 'Loan', id: `schedule-${id}` }]
    }),

    // 10.3: Multi-Tier Approval Decision
    decideLoan: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/loans/${id}/decide`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Loan', id },
        { type: 'Loans', id: 'LIST' }
      ]
    }),

    // 10.6: Early Prepayment & Full Settlement
    prepayLoan: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/loans/${id}/prepay`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Loan', id },
        { type: 'Loan', id: `schedule-${id}` },
        { type: 'Loans', id: 'LIST' }
      ]
    }),

    // 10.6: Executive Loan Ledger Summary
    getLoanLedgerSummary: builder.query({
      query: () => '/loans/ledger/summary',
      providesTags: [{ type: 'Loans', id: 'SUMMARY' }]
    })
  })
});

export const {
  useApplyLoanMutation,
  useGetLoanEligibilityQuery,
  useGetLoansQuery,
  useGetLoanByIdQuery,
  useGetLoanScheduleQuery,
  useDecideLoanMutation,
  usePrepayLoanMutation,
  useGetLoanLedgerSummaryQuery
} = loansApi;
