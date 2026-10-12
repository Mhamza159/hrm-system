/**
 * @file role.model.js
 * @description Mongoose Role Schema for RBAC & CASL Access Control.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 4 · Row 26.2)
 * - Layer: Model (Database persistence layer)
 * - System Roles: 'Super Admin', 'HR Manager', 'Department Manager', 'Employee'
 */

import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    // Unique system name identifier of the role
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true
    },

    // Human-readable description of responsibilities
    description: {
      type: String,
      default: ''
    },

    // System flag preventing accidental deletion or renaming of default core roles
    isSystem: {
      type: Boolean,
      default: false
    },

    // Granular permissions array containing CASL action-subject-scope rules (M26)
    permissions: [
      {
        action: { type: String, required: true },
        subject: { type: String, required: true },
        scope: { type: String, enum: ['own', 'team', 'department', 'all'], default: 'all' },
        fields: [{ type: String }],
        limit: { type: Number }
      }
    ]
  },
  {
    timestamps: true
  }
);

export const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);
