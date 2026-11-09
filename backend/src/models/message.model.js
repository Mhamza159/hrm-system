import mongoose from 'mongoose';

const { Schema } = mongoose;

const attachmentSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true
    },
    fileType: {
      type: String,
      default: 'application/octet-stream'
    },
    fileName: {
      type: String,
      default: 'attachment'
    },
    fileSize: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const readReceiptSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      trim: true,
      default: ''
    },
    messageType: {
      type: String,
      enum: ['text', 'file', 'image', 'system'],
      default: 'text'
    },
    attachments: [attachmentSchema],
    readBy: [readReceiptSchema],
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ content: 'text' });

export const Message = mongoose.model('Message', messageSchema);
export default Message;
