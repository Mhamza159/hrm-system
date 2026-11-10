import mongoose from 'mongoose';

const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'group', 'department'],
      default: 'direct',
      required: true
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    // Deterministic key for 1-to-1 conversations: [minId, maxId].join('_')
    directKey: {
      type: String
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    archivedAt: {
      type: Date,
      default: null
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    lastMessage: {
      content: { type: String, default: '' },
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      sentAt: { type: Date },
      messageType: { type: String, default: 'text' }
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index(
  { directKey: 1 },
  { unique: true, partialFilterExpression: { directKey: { $type: 'string' } } }
);
conversationSchema.index({ type: 1, departmentId: 1 });
conversationSchema.index({ updatedAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
