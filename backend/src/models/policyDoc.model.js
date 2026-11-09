/**
 * @file policyDoc.model.js
 * @description Mongoose schema for Company Policy Documents & Handbooks used by M16 HR Chatbot.
 * 
 * SPECIFICATION:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Row 16.1 & 16.3)
 * - Text search indexed on title and extractedText for RAG/grounding retrieval.
 */

import mongoose from 'mongoose';

const policyDocSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Policy document title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    category: {
      type: String,
      enum: ['General', 'Leave', 'Attendance', 'Conduct', 'Benefits', 'Travel', 'Security', 'Probation'],
      default: 'General',
      index: true
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required']
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'doc', 'txt'],
      default: 'pdf'
    },
    fileSize: {
      type: Number,
      default: 0
    },
    extractedText: {
      type: String,
      required: [true, 'Extracted text is required for AI search grounding']
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    version: {
      type: Number,
      default: 1
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound text index for MongoDB full-text query search in searchPolicy tool
policyDocSchema.index(
  { title: 'text', extractedText: 'text' },
  { weights: { title: 5, extractedText: 1 }, name: 'PolicyDocTextIndex' }
);

export const PolicyDoc = mongoose.models.PolicyDoc || mongoose.model('PolicyDoc', policyDocSchema);

