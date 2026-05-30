import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  getUnreadCount,
  getUnreadSummary,
  markConversationRead,
  deleteConversation,
} from './messages.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { messageFileUpload } from '@/utils/messageFileUpload';

const messagesRouter = express.Router();

// Get all conversations for the authenticated user
messagesRouter.get(
  '/conversations',
  authMiddleware,
  getConversations
);

// Create or get a conversation
messagesRouter.post(
  '/conversations',
  authMiddleware,
  createConversation
);

// Get total unread message count
messagesRouter.get(
  '/unread-summary',
  authMiddleware,
  getUnreadSummary
);

// Get messages for a specific conversation
messagesRouter.get(
  '/:conversationId',
  authMiddleware,
  getMessages
);

// Send a message in a conversation (with optional file upload)
messagesRouter.post(
  '/:conversationId/send',
  authMiddleware,
  messageFileUpload.single('file'),
  sendMessage
);

// Get unread message count
messagesRouter.get(
  '/:conversationId/unread-count',
  authMiddleware,
  getUnreadCount
);

// Mark a conversation as read
messagesRouter.post(
  '/:conversationId/read',
  authMiddleware,
  markConversationRead
);

// Delete a conversation
messagesRouter.delete(
  '/:conversationId',
  authMiddleware,
  deleteConversation
);

export default messagesRouter;
