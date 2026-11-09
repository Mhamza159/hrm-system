/**
 * @file chatbot.controller.js
 * @description HTTP Controllers for Module M16 HR Chatbot.
 * 
 * SPECIFICATION:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Rows 16.1 to 16.9)
 * - Layer: Controller (HTTP parameter parsing, response normalization)
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import * as chatbotService from './chatbot.service.js';

// 16.1: Policy Documents Ingestion
export const uploadPolicy = asyncHandler(async (req, res) => {
  const result = await chatbotService.uploadPolicyDoc(req.file, req.body, req.user);
  res.status(201).json({
    success: true,
    message: 'Policy document uploaded and indexed successfully.',
    data: result
  });
});

export const getPolicies = asyncHandler(async (req, res) => {
  const result = await chatbotService.getPolicyDocs(req.query);
  res.status(200).json({
    success: true,
    data: result
  });
});

export const deletePolicy = asyncHandler(async (req, res) => {
  const result = await chatbotService.deletePolicyDoc(req.params.id);
  res.status(200).json({
    success: true,
    message: result.message
  });
});

// 16.2 & 16.3 & 16.4 & 16.5 & 16.7: Ask Chatbot
export const ask = asyncHandler(async (req, res) => {
  const result = await chatbotService.askChatbot(req.body, req.user);
  res.status(200).json({
    success: true,
    data: result
  });
});

// 16.8: Chat History & Clear
export const getHistory = asyncHandler(async (req, res) => {
  const result = await chatbotService.getChatHistory(req.user);
  res.status(200).json({
    success: true,
    data: { items: result }
  });
});

export const clearHistory = asyncHandler(async (req, res) => {
  const result = await chatbotService.clearChatHistory(req.user);
  res.status(200).json({
    success: true,
    message: result.message
  });
});

// 16.6: Escalation & HR Queue
export const escalate = asyncHandler(async (req, res) => {
  const result = await chatbotService.escalateQuestion(req.body, req.user);
  res.status(201).json({
    success: true,
    message: 'Question escalated to HR team successfully.',
    data: result
  });
});

export const getUnanswered = asyncHandler(async (req, res) => {
  const result = await chatbotService.getUnansweredQuestions(req.query);
  res.status(200).json({
    success: true,
    data: result
  });
});

export const answerUnanswered = asyncHandler(async (req, res) => {
  const result = await chatbotService.answerUnansweredQuestion(req.params.id, req.body, req.user);
  res.status(200).json({
    success: true,
    message: 'Answer recorded and employee notified successfully.',
    data: result
  });
});

// 16.9: Chatbot Settings
export const getSettings = asyncHandler(async (req, res) => {
  const result = await chatbotService.getChatbotSettings();
  res.status(200).json({
    success: true,
    data: result
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const result = await chatbotService.updateChatbotSettings(req.body, req.user);
  res.status(200).json({
    success: true,
    message: 'Chatbot settings updated successfully.',
    data: result
  });
});

