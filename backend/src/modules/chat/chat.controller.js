/**
 * @file chat.controller.js
 * @description Controller for Module M24: Internal Chat.
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { isCloudinaryConfigured, uploadBufferToCloudinary } from '../../config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as chatService from './chat.service.js';

export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await chatService.getConversations(req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, conversations, 'Conversations retrieved successfully'));
});

export const createConversation = asyncHandler(async (req, res) => {
  const { type = 'direct', participantId, name, description, participants } = req.body;
  let result;

  if (type === 'direct') {
    result = await chatService.getOrCreateDirectConversation(req.user._id, participantId);
  } else {
    result = await chatService.createGroupConversation(req.user._id, {
      name,
      description,
      participants
    });
  }

  return res
    .status(201)
    .json(new ApiResponse(201, result, 'Conversation initiated successfully'));
});

export const getConversation = asyncHandler(async (req, res) => {
  const conversation = await chatService.getConversationById(
    req.params.id,
    req.user._id,
    req.user.roles
  );
  return res
    .status(200)
    .json(new ApiResponse(200, conversation, 'Conversation details retrieved'));
});

export const syncDepartmentChannel = asyncHandler(async (req, res) => {
  const channel = await chatService.syncDepartmentChannels(req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, channel, 'Department channel synchronized'));
});

export const modifyParticipants = asyncHandler(async (req, res) => {
  const result = await chatService.modifyParticipants(
    req.params.id,
    req.user._id,
    req.user.roles,
    req.body
  );
  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Group participants updated successfully'));
});

export const archiveConversation = asyncHandler(async (req, res) => {
  const result = await chatService.archiveConversation(req.params.id, req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Conversation archived successfully'));
});

export const getMessages = asyncHandler(async (req, res) => {
  const { messages, meta } = await chatService.getMessages(
    req.params.id,
    req.user._id,
    req.user.roles,
    req.query
  );
  return res
    .status(200)
    .json(new ApiResponse(200, messages, 'Messages retrieved', meta));
});

export const sendMessage = asyncHandler(async (req, res) => {
  const message = await chatService.sendMessage(
    req.params.id,
    req.user._id,
    req.body
  );
  return res
    .status(201)
    .json(new ApiResponse(201, message, 'Message sent successfully'));
});

export const markConversationAsRead = asyncHandler(async (req, res) => {
  const result = await chatService.markConversationAsRead(req.params.id, req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Conversation marked as read'));
});

export const searchMessages = asyncHandler(async (req, res) => {
  const { messages, meta } = await chatService.searchMessages(
    req.user._id,
    req.query.q,
    req.query
  );
  return res
    .status(200)
    .json(new ApiResponse(200, messages, 'Message search completed', meta));
});

export const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  const { originalname, mimetype, size, buffer } = req.file;

  // Validate allowed extensions and mime types
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg'
  ];

  if (!allowedMimes.includes(mimetype)) {
    throw new ApiError(400, 'Unsupported file type. Allowed: images, PDF, documents, audio.');
  }

  let fileUrl = '';

  if (isCloudinaryConfigured()) {
    const result = await uploadBufferToCloudinary(buffer, {
      folder: 'hrm_chat_attachments',
      resource_type: 'auto'
    });
    fileUrl = result.secure_url;
  } else {
    // Local storage fallback
    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'chat');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(originalname);
    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const targetPath = path.join(uploadsDir, safeName);
    fs.writeFileSync(targetPath, buffer);

    fileUrl = `/uploads/chat/${safeName}`;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        url: fileUrl.startsWith('http') ? fileUrl : `https://${req.get('host') || 'localhost'}${fileUrl}`,
        fileName: originalname,
        fileType: mimetype,
        fileSize: size
      },
      'Attachment uploaded successfully'
    )
  );
});
