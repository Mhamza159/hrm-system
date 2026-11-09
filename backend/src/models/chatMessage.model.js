/**
 * @file chatMessage.model.js
 * @description Mongoose schema for persistent user-assistant conversational turns in M16 HR Chatbot.
 * 
 * SPECIFICATION:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Rows 16.2 & 16.8)
 */

import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      index: true
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system', 'tool'],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    language: {
      type: String,
      enum: ['en', 'ur-roman'],
      default: 'en'
    },
    toolCalls: [
      {
        id: String,
        name: String,
        arguments: mongoose.Schema.Types.Mixed,
        result: mongoose.Schema.Types.Mixed
      }
    ],
    actions: [
      {
        type: { type: String }, // 'apply_leave', 'download_payslip', 'escalate_hr'
        label: { type: String },
        payload: mongoose.Schema.Types.Mixed
      }
    ],
    sources: [
      {
        policyDocId: { type: mongoose.Schema.Types.ObjectId, ref: 'PolicyDoc' },
        title: String,
        category: String,
        snippet: String
      }
    ],
    isCleared: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

chatMessageSchema.index({ userId: 1, createdAt: 1 });

export const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema);

