/**
 * @file expensesApi.js
 * @description RTK Query endpoints for Module M11 Expense Claims & Categories.
 *
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Rows 11.1 to 11.5)
 * - Invariant: Monetary amounts transmitted in integer paisa (1 PKR = 100 paisa).
 */

import { baseApi } from "../../lib/baseApi.js";

export const expensesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 11.1: Expense Categories Endpoints
    getExpenseCategories: builder.query({
      query: (params) => ({
        url: "/expenses/categories",
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({
                type: "ExpenseCategory",
                id: _id,
              })),
              { type: "ExpenseCategory", id: "LIST" },
            ]
          : [{ type: "ExpenseCategory", id: "LIST" }],
    }),

    createExpenseCategory: builder.mutation({
      query: (body) => ({
        url: "/expenses/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ExpenseCategory", id: "LIST" }],
    }),

    updateExpenseCategory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/expenses/categories/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ExpenseCategory", id },
        { type: "ExpenseCategory", id: "LIST" },
      ],
    }),

    deleteExpenseCategory: builder.mutation({
      query: (id) => ({
        url: `/expenses/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ExpenseCategory", id: "LIST" }],
    }),

    // 11.2: Expense Claims Submission & Queries
    getMyExpenses: builder.query({
      query: (params) => ({
        url: "/expenses/my",
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "Expense", id: _id })),
              { type: "Expense", id: "LIST" },
            ]
          : [{ type: "Expense", id: "LIST" }],
    }),

    getExpenseById: builder.query({
      query: (id) => `/expenses/${id}`,
      providesTags: (result, error, id) => [{ type: "Expense", id }],
    }),

    applyExpense: builder.mutation({
      query: (formData) => ({
        url: "/expenses",
        method: "POST",
        body: formData, // multipart/form-data with receipt file
      }),
      invalidatesTags: [{ type: "Expense", id: "LIST" }, "Expense"],
    }),

    // 11.3: Approval Decisions
    getPendingExpenseApprovals: builder.query({
      query: (params) => ({
        url: "/expenses/pending-approvals",
        params,
      }),
      providesTags: [{ type: "Expense", id: "APPROVALS" }],
    }),

    decideExpense: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/expenses/${id}/decide`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Expense", id },
        { type: "Expense", id: "LIST" },
        { type: "Expense", id: "APPROVALS" },
      ],
    }),

    // 11.4: Reimbursement
    reimburseExpense: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/expenses/${id}/reimburse`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Expense", id },
        { type: "Expense", id: "LIST" },
        { type: "Expense", id: "APPROVALS" },
        "Payroll",
      ],
    }),

    // 11.5: Reports
    getExpenseMonthlyReport: builder.query({
      query: (params) => ({
        url: "/expenses/reports/monthly",
        params,
      }),
      providesTags: ["ExpenseReport"],
    }),
  }),
});

export const {
  useGetExpenseCategoriesQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
  useGetMyExpensesQuery,
  useGetExpenseByIdQuery,
  useApplyExpenseMutation,
  useGetPendingExpenseApprovalsQuery,
  useDecideExpenseMutation,
  useReimburseExpenseMutation,
  useGetExpenseMonthlyReportQuery,
} = expensesApi;
