/**
 * @file appreciation.model.js
 * @description Mongoose Schema for Peer Recognition, Kudos, and Badges (BUILD-GUIDE Row 20.2).
 */

import mongoose from 'mongoose';

export const RECOGNITION_BADGES = [
  'Team Player',
  'Problem Solver',
  'Customer Hero',
  'Innovation Champ',
  'Leadership Star',
  'Above & Beyond',
  'Rockstar'
];

const appreciationSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender user reference is required'],
      index: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Receiver employee reference is required'],
      index: true
    },
    badge: {
      type: String,
      enum: {
        values: RECOGNITION_BADGES,
        message: '{VALUE} is not a valid recognition badge'
      },
      required: [true, 'Recognition badge is required']
    },
    message: {
      type: String,
      required: [true, 'Recognition message citation is required'],
      trim: true,
      minlength: [5, 'Message must be at least 5 characters'],
      maxlength: [500, 'Message cannot exceed 500 characters']
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

appreciationSchema.index({ receiverId: 1, createdAt: -1 });
appreciationSchema.index({ senderId: 1, createdAt: -1 });
appreciationSchema.index({ isPublic: 1, isDeleted: 1, createdAt: -1 });

const Appreciation = mongoose.model('Appreciation', appreciationSchema);

export default Appreciation;

