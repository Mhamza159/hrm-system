/**
 * @file candidateCv.model.js
 * @description Persistent Binary Storage for Candidate Resumes in MongoDB Atlas.
 * 
 * ARCHITECTURE & PERSISTENCE:
 * - Module: M15 Recruitment & ATS
 * - Purpose: Provides permanent cloud storage for uploaded candidate CVs/resumes
 *   across ephemeral container restarts (Render) and local development environments.
 * - Guarantees the original submitted document is always retrievable anywhere.
 */

import mongoose from 'mongoose';

const candidateCvSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      unique: true,
      index: true
    },
    filename: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      default: 'application/pdf'
    },
    size: {
      type: Number,
      required: true
    },
    fileBuffer: {
      type: Buffer,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const CandidateCv =
  mongoose.models.CandidateCv || mongoose.model('CandidateCv', candidateCvSchema);
