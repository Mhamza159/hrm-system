/**
 * @file assetRequest.model.js
 * @description Mongoose Schema for Department Manager Asset Requisitions & HR Allocations.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Row 23.5)
 * - Layer: Persistence / Data Model
 * - Scoping: Department Managers can only request assets for members in their assigned department.
 */

import mongoose from 'mongoose';

const AssetRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    assetType: {
      type: String,
      enum: ['laptop', 'desktop', 'monitor', 'smartphone', 'tablet', 'printer', 'network_device', 'software_license', 'other'],
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    specificationsRequired: {
      type: String,
      trim: true,
      default: ''
    },
    justification: {
      type: String,
      required: [true, 'Justification for asset requisition is mandatory'],
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'allocated'],
      default: 'pending',
      index: true
    },
    allocatedAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

AssetRequestSchema.index({ departmentId: 1, status: 1 });
AssetRequestSchema.index({ employeeId: 1, status: 1 });

export const AssetRequest = mongoose.model('AssetRequest', AssetRequestSchema);
export default AssetRequest;

