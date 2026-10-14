/**
 * @file department.validation.js
 * @description Zod Validation Schemas for Module M4 Departments, Designations, Shifts & Org Chart.
 * 
 * SPECIFICATION:
 * - Module: M4 Departments, Designations, Shifts & Org Chart (BUILD-GUIDE Section 7 · Rows 4.1 - 4.7)
 * - Layer: Validation (Runtime Type Safety & Payload Integrity Guard)
 */

import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format'
});

/**
 * 4.1: Schema for creating a department
 */
export const createDepartmentSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Department name is required' })
      .trim()
      .min(2, 'Department name must be at least 2 characters')
      .max(100, 'Department name cannot exceed 100 characters'),
    code: z
      .string({ required_error: 'Department code is required' })
      .trim()
      .min(2, 'Department code must be at least 2 characters')
      .max(20, 'Department code cannot exceed 20 characters')
      .toUpperCase(),
    description: z.string().max(500, 'Description cannot exceed 500 characters').optional().default(''),
    parentId: objectIdSchema.nullable().optional().default(null),
    headId: objectIdSchema.nullable().optional().default(null),
    isActive: z.boolean().optional().default(true)
  })
});

/**
 * 4.1: Schema for updating a department
 */
export const updateDepartmentSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    code: z.string().trim().min(2).max(20).toUpperCase().optional(),
    description: z.string().max(500).optional(),
    parentId: objectIdSchema.nullable().optional(),
    headId: objectIdSchema.nullable().optional(),
    isActive: z.boolean().optional()
  })
});

/**
 * 4.2: Schema for assigning department head
 */
export const assignHeadSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    headId: objectIdSchema.nullable()
  })
});

/**
 * 4.3: Schema for designation creation & updates
 */
export const createDesignationSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Designation title is required' }).trim().min(2).max(100),
    code: z.string({ required_error: 'Designation code is required' }).trim().min(2).max(20).toUpperCase(),
    grade: z.enum(['Junior', 'Mid', 'Senior', 'Lead', 'Executive'], {
      required_error: 'Grade tier is required'
    }),
    departmentId: objectIdSchema,
    description: z.string().max(500).optional().default(''),
    isActive: z.boolean().optional().default(true)
  })
});

export const updateDesignationSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    title: z.string().trim().min(2).max(100).optional(),
    code: z.string().trim().min(2).max(20).toUpperCase().optional(),
    grade: z.enum(['Junior', 'Mid', 'Senior', 'Lead', 'Executive']).optional(),
    departmentId: objectIdSchema.optional(),
    description: z.string().max(500).optional(),
    isActive: z.boolean().optional()
  })
});

/**
 * 4.4: Schema for shift creation & updates (with cross-midnight validation)
 */
export const createShiftSchema = z.object({
  body: z
    .object({
      name: z.string({ required_error: 'Shift name is required' }).trim().min(2).max(100),
      code: z.string({ required_error: 'Shift code is required' }).trim().min(2).max(20).toUpperCase(),
      type: z.enum(['fixed', 'flexible', 'night']).default('fixed'),
      startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm 24h format'),
      endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm 24h format'),
      graceMinutes: z.number().int().min(0).max(120).default(15),
      breakMinutes: z.number().int().min(0).max(240).default(60),
      halfDayMinutes: z.number().int().min(0).max(480).default(240),
      workDays: z.array(z.string()).min(1, 'At least one work day is required').default([
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday'
      ]),
      isActive: z.boolean().optional().default(true)
    })
    .refine(
      (data) => {
        // Break minutes should not exceed total work window
        const [startH, startM] = data.startTime.split(':').map(Number);
        const [endH, endM] = data.endTime.split(':').map(Number);
        let durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        if (durationMinutes <= 0) {
          durationMinutes += 24 * 60; // Crosses midnight
        }
        return data.breakMinutes < durationMinutes;
      },
      {
        message: 'Break minutes cannot exceed total shift duration',
        path: ['breakMinutes']
      }
    )
});

export const updateShiftSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    code: z.string().trim().min(2).max(20).toUpperCase().optional(),
    type: z.enum(['fixed', 'flexible', 'night']).optional(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm 24h format').optional(),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm 24h format').optional(),
    graceMinutes: z.number().int().min(0).max(120).optional(),
    breakMinutes: z.number().int().min(0).max(240).optional(),
    halfDayMinutes: z.number().int().min(0).max(480).optional(),
    workDays: z.array(z.string()).min(1).optional(),
    isActive: z.boolean().optional()
  })
});
