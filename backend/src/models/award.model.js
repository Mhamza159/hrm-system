/**
 * @file award.model.js
 * @description Mongoose Schema for Employee of the Month cycles and nominations (BUILD-GUIDE Row 20.1).
 */

import mongoose from 'mongoose';

const nominationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Nominee employee is required']
    },
    nominatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Nominator user is required']
    },
    reason: {
      type: String,
      required: [true, 'Nomination reason citation is required'],
      trim: true,
      minlength: [10, 'Nomination reason must be at least 10 characters'],
      maxlength: [1000, 'Nomination reason cannot exceed 1000 characters']
    },
    shortlisted: {
      type: Boolean,
      default: false
    },
    nominatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const awardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Award cycle title is required'],
      trim: true,
      minlength: [3, 'Award title must be at least 3 characters'],
      maxlength: [150, 'Award title cannot exceed 150 characters']
    },
    month: {
      type: String, // Format: YYYY-MM
      required: [true, 'Award cycle month (YYYY-MM) is required'],
      trim: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format']
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null // null indicates company-wide award
    },
    status: {
      type: String,
      enum: {
        values: ['nomination', 'voting', 'announced', 'archived'],
        message: '{VALUE} is not a valid award status'
      },
      default: 'nomination'
    },
    nominationDeadline: {
      type: Date,
      required: [true, 'Nomination deadline is required']
    },
    votingDeadline: {
      type: Date,
      required: [true, 'Voting deadline is required']
    },
    nominations: [nominationSchema],
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    winnerCitation: {
      type: String,
      trim: true,
      default: ''
    },
    prizeDetails: {
      type: String,
      trim: true,
      default: ''
    },
    announcedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

awardSchema.index({ month: 1, departmentId: 1, isDeleted: 1 });
awardSchema.index({ status: 1, isDeleted: 1 });

const Award = mongoose.model('Award', awardSchema);

export default Award;

