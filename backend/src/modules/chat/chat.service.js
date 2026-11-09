/**
 * @file chat.service.js
 * @description Core business logic for Internal Chat (M24).
 * Handles direct messaging, custom groups, automated department channels,
 * full-text search, online presence, and channel archival.
 */

import mongoose from 'mongoose';
import { Conversation } from '../../models/conversation.model.js';
import { Message } from '../../models/message.model.js';
import { User } from '../../models/user.model.js';
import { Employee } from '../../models/employee.model.js';
import { Department } from '../../models/department.model.js';
import { Role } from '../../models/role.model.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  emitToConversation,
  emitToUser,
  isUserOnline
} from '../../services/socket.service.js';

/**
 * Escapes characters with special meaning in RegExp to prevent ReDoS / injection
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => {
  return typeof str === 'string' ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
};

/**
 * Helper to format participant objects uniformly with display name and avatar
 * @param {Object} userDoc
 * @returns {Object}
 */
const formatParticipant = (userDoc) => {
  if (!userDoc) return null;
  const emp = userDoc.employeeId;
  return {
    _id: userDoc._id,
    email: userDoc.email,
    name: emp?.name || userDoc.email?.split('@')[0] || 'Coworker',
    avatar: emp?.avatar || '',
    isOnline: isUserOnline(userDoc._id)
  };
};

/**
 * Helper to format conversation with unread counts and clean participant metadata
 * @param {Object} conv - Lean conversation document
 * @param {string|mongoose.Types.ObjectId} currentUserId
 * @returns {Object}
 */
const formatConversation = async (conv, currentUserId) => {
  const currentUserIdStr = currentUserId.toString();
  
  // Format participants
  const formattedParticipants = (conv.participants || []).map(formatParticipant).filter(Boolean);
  
  // For direct chats, the display name and avatar are that of the other participant
  let displayName = conv.name;
  let displayAvatar = '';
  let otherParticipant = null;

  if (conv.type === 'direct') {
    otherParticipant = formattedParticipants.find(
      (p) => p._id.toString() !== currentUserIdStr
    ) || formattedParticipants[0];
    displayName = otherParticipant ? otherParticipant.name : 'Direct Chat';
    displayAvatar = otherParticipant?.avatar || '';
  } else if (conv.type === 'department') {
    displayName = conv.name || 'Department Channel';
  }

  // Calculate unread count for current user
  const unreadCount = await Message.countDocuments({
    conversationId: conv._id,
    senderId: { $ne: currentUserId },
    isDeleted: false,
    'readBy.userId': { $ne: currentUserId }
  });

  return {
    _id: conv._id,
    type: conv.type,
    name: displayName,
    rawName: conv.name,
    description: conv.description || '',
    departmentId: conv.departmentId,
    participants: formattedParticipants,
    admin: conv.admin,
    isArchived: conv.isArchived,
    archivedAt: conv.archivedAt,
    archivedBy: conv.archivedBy,
    lastMessage: conv.lastMessage,
    lastMessageAt: conv.lastMessageAt,
    unreadCount,
    otherParticipant,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt
  };
};

/**
 * Retrieve list of active conversations for the authenticated user
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<Array>}
 */
export const getConversations = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const rawConversations = await Conversation.find({
    participants: userObjectId
  })
    .sort({ lastMessageAt: -1 })
    .populate({
      path: 'participants',
      select: 'email employeeId',
      populate: {
        path: 'employeeId',
        select: 'name avatar departmentId'
      }
    })
    .populate('departmentId', 'name code')
    .lean();

  const formatted = await Promise.all(
    rawConversations.map((c) => formatConversation(c, userId))
  );

  return formatted;
};

/**
 * Get or create a 1-to-1 direct conversation with deterministic deduplication
 * @param {string|mongoose.Types.ObjectId} currentUserId
 * @param {string|mongoose.Types.ObjectId} targetUserId
 * @returns {Promise<Object>}
 */
export const getOrCreateDirectConversation = async (currentUserId, targetUserId) => {
  if (currentUserId.toString() === targetUserId.toString()) {
    throw new ApiError(400, 'Cannot initiate direct conversation with yourself');
  }

  const targetUser = await User.findById(targetUserId).lean();
  if (!targetUser) {
    throw new ApiError(404, 'Selected participant not found in employee directory');
  }

  // Deterministic direct key: [minId, maxId].join('_')
  const directKey = [currentUserId.toString(), targetUserId.toString()].sort().join('_');

  let conv = await Conversation.findOne({ directKey })
    .populate({
      path: 'participants',
      select: 'email employeeId',
      populate: {
        path: 'employeeId',
        select: 'name avatar departmentId'
      }
    })
    .lean();

  if (!conv) {
    const newConv = await Conversation.create({
      type: 'direct',
      directKey,
      participants: [currentUserId, targetUserId],
      lastMessageAt: new Date()
    });

    conv = await Conversation.findById(newConv._id)
      .populate({
        path: 'participants',
        select: 'email employeeId',
        populate: {
          path: 'employeeId',
          select: 'name avatar departmentId'
        }
      })
      .lean();
  }

  return formatConversation(conv, currentUserId);
};

/**
 * Create a multi-user group conversation
 * @param {string|mongoose.Types.ObjectId} creatorId
 * @param {Object} data - { name, description, participants }
 * @returns {Promise<Object>}
 */
export const createGroupConversation = async (creatorId, { name, description, participants = [] }) => {
  const memberSet = new Set([creatorId.toString(), ...participants.map((p) => p.toString())]);
  const allParticipantIds = Array.from(memberSet).map((id) => new mongoose.Types.ObjectId(id));

  if (allParticipantIds.length < 2) {
    throw new ApiError(400, 'A group chat must include at least 2 participants');
  }

  const newConv = await Conversation.create({
    type: 'group',
    name,
    description: description || '',
    admin: creatorId,
    participants: allParticipantIds,
    lastMessageAt: new Date()
  });

  const populated = await Conversation.findById(newConv._id)
    .populate({
      path: 'participants',
      select: 'email employeeId',
      populate: {
        path: 'employeeId',
        select: 'name avatar departmentId'
      }
    })
    .lean();

  const formatted = await formatConversation(populated, creatorId);

  // Notify all added members via socket personal room
  allParticipantIds.forEach((pId) => {
    emitToUser(pId, 'chat:conversation_new', formatted);
  });

  return formatted;
};

/**
 * Ensure automated department channels exist and synchronize caller membership
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<Object|null>}
 */
export const syncDepartmentChannels = async (userId) => {
  const employee = await Employee.findOne({ userId, isDeleted: false })
    .select('departmentId')
    .lean();

  if (!employee?.departmentId) {
    return null;
  }

  const department = await Department.findById(employee.departmentId).lean();
  if (!department) {
    return null;
  }

  // Find or create department channel
  let deptConv = await Conversation.findOne({
    type: 'department',
    departmentId: department._id
  });

  if (!deptConv) {
    deptConv = await Conversation.create({
      type: 'department',
      name: `${department.name} Channel`,
      description: `Official collaboration channel for ${department.name}`,
      departmentId: department._id,
      participants: [userId],
      lastMessageAt: new Date()
    });
  } else if (!deptConv.participants.some((p) => p.toString() === userId.toString())) {
    deptConv.participants.push(userId);
    await deptConv.save();
  }

  const populated = await Conversation.findById(deptConv._id)
    .populate({
      path: 'participants',
      select: 'email employeeId',
      populate: {
        path: 'employeeId',
        select: 'name avatar departmentId'
      }
    })
    .populate('departmentId', 'name code')
    .lean();

  return formatConversation(populated, userId);
};

/**
 * Retrieve single conversation details
 * @param {string|mongoose.Types.ObjectId} conversationId
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {Array} userRoles
 * @returns {Promise<Object>}
 */
export const getConversationById = async (conversationId, userId, userRoles = []) => {
  const conv = await Conversation.findById(conversationId)
    .populate({
      path: 'participants',
      select: 'email employeeId',
      populate: {
        path: 'employeeId',
        select: 'name avatar departmentId'
      }
    })
    .populate('departmentId', 'name code')
    .lean();

  if (!conv) {
    throw new ApiError(404, 'Conversation not found');
  }

  const isSuperAdmin = userRoles.some(
    (r) => (r.name || r) === 'Super Admin'
  );
  const isParticipant = conv.participants.some(
    (p) => p._id.toString() === userId.toString()
  );

  if (!isParticipant && !isSuperAdmin) {
    throw new ApiError(403, 'You are not a participant in this conversation');
  }

  return formatConversation(conv, userId);
};

/**
 * Add or remove member from group conversation
 * @param {string|mongoose.Types.ObjectId} conversationId
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {Array} userRoles
 * @param {Object} data - { action: 'add'|'remove', targetUserId }
 * @returns {Promise<Object>}
 */
export const modifyParticipants = async (conversationId, userId, userRoles, { action, userId: targetUserId }) => {
  const conv = await Conversation.findById(conversationId);
  if (!conv) {
    throw new ApiError(404, 'Conversation not found');
  }

  if (conv.type !== 'group') {
    throw new ApiError(400, 'Participants can only be modified for group conversations');
  }

  const isSuperAdmin = userRoles.some((r) => (r.name || r) === 'Super Admin');
  const isAdmin = conv.admin?.toString() === userId.toString();

  if (!isAdmin && !isSuperAdmin) {
    throw new ApiError(403, 'Only group admin or Super Admin can modify group participants');
  }

  if (action === 'add') {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) throw new ApiError(404, 'Target user not found');
    
    if (!conv.participants.some((p) => p.toString() === targetUserId.toString())) {
      conv.participants.push(targetUserId);
    }
  } else if (action === 'remove') {
    conv.participants = conv.participants.filter(
      (p) => p.toString() !== targetUserId.toString()
    );
  }

  await conv.save();

  const populated = await Conversation.findById(conv._id)
    .populate({
      path: 'participants',
      select: 'email employeeId',
      populate: {
        path: 'employeeId',
        select: 'name avatar departmentId'
      }
    })
    .lean();

  const formatted = await formatConversation(populated, userId);

  // Emit real-time member update event to the room
  emitToConversation(conversationId, 'chat:member_updated', {
    conversationId,
    action,
    targetUserId,
    participants: formatted.participants
  });

  return formatted;
};

/**
 * Archive or lock a conversation into read-only mode (Super Admin only)
 * @param {string|mongoose.Types.ObjectId} conversationId
 * @param {string|mongoose.Types.ObjectId} adminUserId
 * @returns {Promise<Object>}
 */
export const archiveConversation = async (conversationId, adminUserId) => {
  const conv = await Conversation.findById(conversationId);
  if (!conv) {
    throw new ApiError(404, 'Conversation not found');
  }

  conv.isArchived = true;
  conv.archivedAt = new Date();
  conv.archivedBy = adminUserId;
  await conv.save();

  const formatted = await formatConversation(conv.toObject(), adminUserId);

  // Broadcast archival event to all participants
  emitToConversation(conversationId, 'chat:conversation_archived', {
    conversationId,
    archivedAt: conv.archivedAt,
    archivedBy: adminUserId
  });

  return formatted;
};

/**
 * Retrieve paginated message stream for a conversation
 * @param {string|mongoose.Types.ObjectId} conversationId
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {Array} userRoles
 * @param {Object} query - { page, limit }
 * @returns {Promise<Object>}
 */
export const getMessages = async (conversationId, userId, userRoles = [], { page = 1, limit = 30 }) => {
  const conv = await Conversation.findById(conversationId).lean();
  if (!conv) {
    throw new ApiError(404, 'Conversation not found');
  }

  const isSuperAdmin = userRoles.some((r) => (r.name || r) === 'Super Admin');
  const isParticipant = conv.participants.some((p) => p.toString() === userId.toString());

  if (!isParticipant && !isSuperAdmin) {
    throw new ApiError(403, 'You are not a participant in this conversation');
  }

  const numLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);
  const numPage = Math.max(parseInt(page, 10) || 1, 1);
  const skip = (numPage - 1) * numLimit;

  const total = await Message.countDocuments({
    conversationId,
    isDeleted: false
  });

  const rawMessages = await Message.find({
    conversationId,
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(numLimit)
    .populate({
      path: 'senderId',
      select: 'email employeeId',
      populate: {
        path: 'employeeId',
        select: 'name avatar'
      }
    })
    .lean();

  // Reverse so the client receives chronological stream
  const messages = rawMessages.reverse().map((msg) => {
    const sender = msg.senderId;
    const emp = sender?.employeeId;
    return {
      _id: msg._id,
      conversationId: msg.conversationId,
      senderId: sender?._id || msg.senderId,
      senderName: emp?.name || sender?.email?.split('@')[0] || 'Coworker',
      senderAvatar: emp?.avatar || '',
      content: msg.content,
      messageType: msg.messageType,
      attachments: msg.attachments || [],
      readBy: msg.readBy || [],
      isMine: sender?._id?.toString() === userId.toString(),
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt
    };
  });

  return {
    messages,
    meta: {
      page: numPage,
      limit: numLimit,
      total,
      pages: Math.ceil(total / numLimit) || 1
    }
  };
};

/**
 * Send a new message to a conversation
 * @param {string|mongoose.Types.ObjectId} conversationId
 * @param {string|mongoose.Types.ObjectId} senderId
 * @param {Object} data - { content, messageType, attachments }
 * @returns {Promise<Object>}
 */
export const sendMessage = async (conversationId, senderId, { content, messageType = 'text', attachments = [] }) => {
  const conv = await Conversation.findById(conversationId);
  if (!conv) {
    throw new ApiError(404, 'Conversation not found');
  }

  if (conv.isArchived) {
    throw new ApiError(403, 'This conversation has been archived and is read-only');
  }

  const isParticipant = conv.participants.some((p) => p.toString() === senderId.toString());
  if (!isParticipant) {
    throw new ApiError(403, 'You are not a participant in this conversation');
  }

  const now = new Date();

  // Create message record
  const newMsg = await Message.create({
    conversationId,
    senderId,
    content: content || '',
    messageType,
    attachments: attachments || [],
    readBy: [{ userId: senderId, readAt: now }]
  });

  // Update conversation's last message metadata
  conv.lastMessage = {
    content: content || (attachments.length ? `Shared ${attachments.length} attachment(s)` : ''),
    senderId,
    sentAt: now,
    messageType
  };
  conv.lastMessageAt = now;
  await conv.save();

  const populated = await Message.findById(newMsg._id)
    .populate({
      path: 'senderId',
      select: 'email employeeId',
      populate: {
        path: 'employeeId',
        select: 'name avatar'
      }
    })
    .lean();

  const sender = populated.senderId;
  const emp = sender?.employeeId;
  const formattedMessage = {
    _id: populated._id,
    conversationId: populated.conversationId,
    senderId: sender?._id || populated.senderId,
    senderName: emp?.name || sender?.email?.split('@')[0] || 'Coworker',
    senderAvatar: emp?.avatar || '',
    content: populated.content,
    messageType: populated.messageType,
    attachments: populated.attachments || [],
    readBy: populated.readBy || [],
    createdAt: populated.createdAt,
    updatedAt: populated.updatedAt
  };

  // 1. Dispatch real-time message event to conversation room
  emitToConversation(conversationId, 'chat:message', formattedMessage);

  // 2. Dispatch unobtrusive notification to all other participants' personal rooms
  conv.participants.forEach((pId) => {
    if (pId.toString() !== senderId.toString()) {
      emitToUser(pId, 'chat:notification', {
        conversationId,
        message: formattedMessage
      });
    }
  });

  return formattedMessage;
};

/**
 * Mark all unread messages in a conversation as read by caller
 * @param {string|mongoose.Types.ObjectId} conversationId
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<Object>}
 */
export const markConversationAsRead = async (conversationId, userId) => {
  const conv = await Conversation.findById(conversationId).lean();
  if (!conv) {
    throw new ApiError(404, 'Conversation not found');
  }

  const now = new Date();

  const result = await Message.updateMany(
    {
      conversationId,
      senderId: { $ne: userId },
      isDeleted: false,
      'readBy.userId': { $ne: userId }
    },
    {
      $addToSet: {
        readBy: {
          userId,
          readAt: now
        }
      }
    }
  );

  // Broadcast read acknowledgment to the conversation room
  emitToConversation(conversationId, 'chat:read', {
    conversationId,
    readByUserId: userId,
    readAt: now
  });

  return { updatedCount: result.modifiedCount };
};

/**
 * Search past messages across all conversations user participates in
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string} query
 * @param {Object} options - { page, limit }
 * @returns {Promise<Object>}
 */
export const searchMessages = async (userId, query, { page = 1, limit = 20 }) => {
  const safeQuery = escapeRegex(query.trim());
  if (!safeQuery) {
    return { messages: [], meta: { page: 1, limit: 20, total: 0, pages: 1 } };
  }

  // 1. Get all conversations the user is a participant of
  const userConversations = await Conversation.find({
    participants: userId
  })
    .select('_id name type')
    .lean();

  const userConvIds = userConversations.map((c) => c._id);
  const convMap = new Map(userConversations.map((c) => [c._id.toString(), c]));

  const numLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const numPage = Math.max(parseInt(page, 10) || 1, 1);
  const skip = (numPage - 1) * numLimit;

  const filter = {
    conversationId: { $in: userConvIds },
    content: { $regex: safeQuery, $options: 'i' },
    isDeleted: false
  };

  const total = await Message.countDocuments(filter);

  const rawMessages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(numLimit)
    .populate({
      path: 'senderId',
      select: 'email employeeId',
      populate: {
        path: 'employeeId',
        select: 'name avatar'
      }
    })
    .lean();

  const messages = rawMessages.map((msg) => {
    const sender = msg.senderId;
    const emp = sender?.employeeId;
    const conv = convMap.get(msg.conversationId.toString());
    return {
      _id: msg._id,
      conversationId: msg.conversationId,
      conversationName: conv?.name || (conv?.type === 'direct' ? 'Direct Chat' : 'Channel'),
      conversationType: conv?.type,
      senderId: sender?._id || msg.senderId,
      senderName: emp?.name || sender?.email?.split('@')[0] || 'Coworker',
      senderAvatar: emp?.avatar || '',
      content: msg.content,
      attachments: msg.attachments || [],
      createdAt: msg.createdAt
    };
  });

  return {
    messages,
    meta: {
      page: numPage,
      limit: numLimit,
      total,
      pages: Math.ceil(total / numLimit) || 1
    }
  };
};
