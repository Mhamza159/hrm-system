/**
 * @file awardVote.model.js
 * @description Mongoose Schema for single-ballot voting on shortlisted award nominees (BUILD-GUIDE Row 20.1).
 */

import mongoose from 'mongoose';

const awardVoteSchema = new mongoose.Schema(
  {
    awardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Award',
      required: [true, 'Award reference is required'],
      index: true
    },
    voterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Voter reference is required']
    },
    nomineeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Nominee reference is required']
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index enforces exactly ONE vote per voter per award cycle
awardVoteSchema.index({ awardId: 1, voterId: 1 }, { unique: true });
awardVoteSchema.index({ awardId: 1, nomineeId: 1 });

const AwardVote = mongoose.model('AwardVote', awardVoteSchema);

export default AwardVote;

