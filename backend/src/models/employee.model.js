/**
 * @file employee.model.js
 * @description Mongoose Employee Schema for Staff & Organizational Assignments.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Row 3.1)
 * - Layer: Model (Database persistence layer)
 * - Security: Stores sensitive fields (cnic, bankDetails.iban) as AES-256-GCM encrypted hex strings.
 */

import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['CNIC Copy', 'Degree Certificate', 'Employment Contract', 'NDA', 'Experience Letter', 'Other'],
      required: [true, 'Document type is required']
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required']
    },
    fileName: {
      type: String,
      trim: true
    },
    fileSize: {
      type: Number
    },
    mimeType: {
      type: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    publicId: {
      type: String
    }
  },
  { _id: true }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: [true, 'Employee code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true
    },
    avatar: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    cnic: {
      type: String,
      trim: true
    },
    cnicExpiry: {
      type: Date
    },
    dob: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'Pakistan' }
    },
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true }
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
      default: null
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      default: null
    },
    employmentType: {
      type: String,
      enum: ['Permanent', 'Contract', 'Intern', 'Probation'],
      default: 'Permanent'
    },
    status: {
      type: String,
      enum: ['Active', 'Probation', 'Notice', 'Resigned', 'Terminated', 'Suspended'],
      default: 'Active'
    },
    statusReason: {
      type: String,
      trim: true
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    probationEndDate: {
      type: Date
    },
    bankDetails: {
      bankName: { type: String, trim: true },
      accountTitle: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      iban: { type: String, trim: true } // Encrypted hex string
    },
    skills: [
      {
        type: String,
        trim: true
      }
    ],
    documents: [documentSchema],
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

employeeSchema.index({ departmentId: 1, isDeleted: 1 });
employeeSchema.index({ designationId: 1, isDeleted: 1 });
employeeSchema.index({ managerId: 1, isDeleted: 1 });
employeeSchema.index({ shiftId: 1, isDeleted: 1 });
employeeSchema.index({ status: 1, isDeleted: 1 });
employeeSchema.index({ skills: 1 });
employeeSchema.index({ isDeleted: 1 });

export const Employee = mongoose.model('Employee', employeeSchema);
