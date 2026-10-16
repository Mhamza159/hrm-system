/**
 * @file employee.validation.js
 * @description Zod Validation Schemas for Employee Lifecycle & Data Contracts.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Rows 3.1 to 3.17)
 * - Layer: Validation Middleware (Zod schema assertions)
 * - Enforces: Pakistani CNIC standard (XXXXX-XXXXXXX-X), IBAN format, required step fields.
 */

import { z } from 'zod';

export const CNIC_REGEX = /^\d{5}-\d{7}-\d{1}$/;

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z
  .string()
  .regex(objectIdRegex, 'Must be a valid 24-character hexadecimal ObjectId')
  .nullable()
  .optional();

export const createEmployeeSchema = z.object({
  body: z.object({
    employeeCode: z
      .string()
      .min(2, 'Employee code must be at least 2 characters')
      .max(20, 'Employee code cannot exceed 20 characters')
      .trim()
      .toUpperCase()
      .optional()
      .nullable(),
    name: z
      .string({ required_error: 'Full name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address format')
      .trim()
      .toLowerCase(),
    phone: z.string().trim().optional().nullable(),
    cnic: z
      .string()
      .regex(CNIC_REGEX, 'CNIC must match format XXXXX-XXXXXXX-X (13 digits)')
      .optional()
      .nullable()
      .or(z.literal('')),
    cnicExpiry: z.string().or(z.date()).optional().nullable(),
    dob: z.string().or(z.date()).optional().nullable(),
    gender: z.enum(['Male', 'Female', 'Other']).optional().nullable(),
    address: z
      .object({
        street: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        postalCode: z.string().optional().nullable(),
        country: z.string().default('Pakistan').optional().nullable()
      })
      .optional()
      .nullable(),
    emergencyContact: z
      .object({
        name: z.string().optional().nullable(),
        relationship: z.string().optional().nullable(),
        phone: z.string().optional().nullable()
      })
      .optional()
      .nullable(),
    departmentId: objectIdSchema,
    designationId: objectIdSchema,
    managerId: objectIdSchema,
    shiftId: objectIdSchema,
    employmentType: z
      .enum(['Permanent', 'Contract', 'Intern', 'Probation'])
      .default('Permanent')
      .optional(),
    status: z
      .enum(['Active', 'Probation', 'Notice', 'Resigned', 'Terminated', 'Suspended'])
      .default('Active')
      .optional(),
    joiningDate: z.string().or(z.date()).optional().nullable(),
    probationEndDate: z.string().or(z.date()).optional().nullable(),
    bankDetails: z
      .object({
        bankName: z.string().optional().nullable(),
        accountTitle: z.string().optional().nullable(),
        accountNumber: z.string().optional().nullable(),
        iban: z.string().trim().optional().nullable()
      })
      .optional()
      .nullable(),
    skills: z.array(z.string().trim()).optional().default([]),
    createAccount: z.boolean().optional().default(false)
  })
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid employee ID')
  }),
  body: z.object({
    name: z.string().min(2).max(100).trim().optional(),
    email: z.string().email().trim().toLowerCase().optional(),
    phone: z.string().trim().optional().nullable(),
    cnic: z
      .string()
      .regex(CNIC_REGEX, 'CNIC must match format XXXXX-XXXXXXX-X (13 digits)')
      .optional()
      .nullable()
      .or(z.literal('')),
    cnicExpiry: z.string().or(z.date()).optional().nullable(),
    dob: z.string().or(z.date()).optional().nullable(),
    gender: z.enum(['Male', 'Female', 'Other']).optional().nullable(),
    address: z
      .object({
        street: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        postalCode: z.string().optional().nullable(),
        country: z.string().optional().nullable()
      })
      .optional()
      .nullable(),
    emergencyContact: z
      .object({
        name: z.string().optional().nullable(),
        relationship: z.string().optional().nullable(),
        phone: z.string().optional().nullable()
      })
      .optional()
      .nullable(),
    departmentId: objectIdSchema,
    designationId: objectIdSchema,
    managerId: objectIdSchema,
    shiftId: objectIdSchema,
    employmentType: z
      .enum(['Permanent', 'Contract', 'Intern', 'Probation'])
      .optional(),
    joiningDate: z.string().or(z.date()).optional().nullable(),
    probationEndDate: z.string().or(z.date()).optional().nullable(),
    bankDetails: z
      .object({
        bankName: z.string().optional().nullable(),
        accountTitle: z.string().optional().nullable(),
        accountNumber: z.string().optional().nullable(),
        iban: z.string().trim().optional().nullable()
      })
      .optional()
      .nullable(),
    skills: z.array(z.string().trim()).optional()
  })
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid employee ID')
  }),
  body: z.object({
    status: z.enum(['Active', 'Probation', 'Notice', 'Resigned', 'Terminated', 'Suspended'], {
      required_error: 'Status is required'
    }),
    reason: z
      .string({ required_error: 'Status change reason is mandatory' })
      .min(3, 'Reason must be at least 3 characters')
      .trim()
  })
});

export const updateSkillsSchema = z.object({
  params: z
    .object({
      id: z.string().regex(objectIdRegex, 'Invalid employee ID').optional()
    })
    .optional(),
  body: z.object({
    skills: z.array(z.string().trim(), {
      required_error: 'Skills must be an array of string tags'
    })
  })
});

export const changeRequestSchema = z.object({
  body: z.object({
    field: z.string({ required_error: 'Field is required' }),
    requestedValue: z.any({ required_error: 'Requested value is required' }),
    reason: z
      .string({ required_error: 'Reason is required' })
      .min(3, 'Reason must be at least 3 characters')
      .trim()
  })
});

export const decideChangeRequestSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid change request ID')
  }),
  body: z.object({
    action: z.enum(['approved', 'rejected'], { required_error: 'Action must be approved or rejected' }),
    rejectionReason: z.string().trim().optional()
  })
});

export const jobHistorySchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid employee ID')
  }),
  body: z.object({
    eventType: z.string({ required_error: 'Event type is required' }).trim(),
    previousDepartmentId: objectIdSchema,
    newDepartmentId: objectIdSchema,
    previousDesignationId: objectIdSchema,
    newDesignationId: objectIdSchema,
    effectiveDate: z.string().or(z.date()).optional().nullable(),
    remarks: z.string().trim().optional().nullable()
  })
});
