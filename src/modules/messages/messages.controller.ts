import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import messagesService from './messages.service';
import { CustomError } from '@/utils/custom-error';
import logger from '@/utils/logger';

/**
 * GET /api/messages/conversations
 * Get all conversations for the authenticated user
 */
export const getConversations = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const user_role = req.user?.role?.toLowerCase();
    const { limit = '50', offset = '0' } = req.query;

    logger.info(`[getConversations] user_id=${user_id}, user_role=${user_role} (original: ${req.user?.role})`);

    if (!user_id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (user_role !== 'employer' && user_role !== 'student') {
      logger.warn(`[getConversations] Access denied for role: ${user_role}`);
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `Only employers and students can access conversations. Your role: ${user_role}`,
      });
    }

    const result = await messagesService.getConversationsService(
      user_id,
      user_role as 'employer' | 'student',
      Math.min(parseInt(String(limit), 10), 100),
      parseInt(String(offset), 10)
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result.rows,
      total: result.count,
      limit: parseInt(String(limit), 10),
      offset: parseInt(String(offset), 10),
    });
  } catch (error: any) {
    logger.error('Get conversations error:', error);

    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch conversations',
    });
  }
};

/**
 * GET /api/messages/:conversationId
 * Get messages for a specific conversation
 */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const conversationId = String(req.params.conversationId);
    const user_id = req.user?.user_id;
    const { limit = '50', offset = '0' } = req.query;

    if (!user_id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await messagesService.getMessagesService(
      conversationId,
      user_id,
      Math.min(parseInt(String(limit), 10), 100),
      parseInt(String(offset), 10)
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result.rows,
      total: result.count,
      limit: parseInt(String(limit), 10),
      offset: parseInt(String(offset), 10),
    });
  } catch (error: any) {
    logger.error('Get messages error:', error);

    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch messages',
    });
  }
};

/**
 * POST /api/messages/:conversationId/send
 * Send a message in a conversation (with optional file)
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const conversationId = String(req.params.conversationId);
    const { content } = req.body;
    const user_id = req.user?.user_id;
    const file = (req as any).file;

    if (!user_id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Content is required unless a file is provided
    if (!content && !file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Message content or file is required',
      });
    }

    // Prepare file data if file was uploaded
    let fileUrl: string | undefined;
    let fileName: string | undefined;
    let fileType: string | undefined;

    if (file) {
      fileUrl = `/uploads/messages/${file.filename}`;
      fileName = file.originalname;
      fileType = file.mimetype;
    }

    const message = await messagesService.sendMessageService(
      conversationId,
      user_id,
      content || '',
      fileUrl,
      fileName,
      fileType
    );

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: message,
      message: 'Message sent successfully',
    });
  } catch (error: any) {
    logger.error('Send message error:', error);

    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to send message',
    });
  }
};

/**
 * POST /api/messages/conversations
 * Create or get a conversation
 */
export const createConversation = async (req: Request, res: Response) => {
  try {
    const { employer_id, student_id, job_id } = req.body;
    const user_id = req.user?.user_id;
    const user_role = req.user?.role?.toLowerCase();

    if (!user_id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!employer_id || !student_id || !job_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'employer_id, student_id, and job_id are required',
      });
    }

    const conversation = await messagesService.createConversationService(
      employer_id,
      student_id,
      job_id,
      user_id,
      user_role || 'unknown'
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: conversation,
      message: 'Conversation created or retrieved successfully',
    });
  } catch (error: any) {
    logger.error('Create conversation error:', error);

    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to create conversation',
    });
  }
};

/**
 * GET /api/messages/:conversationId/unread-count
 * Get unread message count for a conversation
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const conversationId = String(req.params.conversationId);
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await messagesService.getUnreadCountService(
      conversationId,
      user_id
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Get unread count error:', error);

    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get unread count',
    });
  }
};

/**
 * GET /api/messages/unread-summary
 * Get total unread message count across all conversations
 */
export const getUnreadSummary = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await messagesService.getUnreadSummaryService(user_id);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Get unread summary error:', error);

    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get unread summary',
    });
  }
};

/**
 * POST /api/messages/:conversationId/read
 * Mark messages in a conversation as read for the current user
 */
export const markConversationRead = async (req: Request, res: Response) => {
  try {
    const conversationId = String(req.params.conversationId);
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await messagesService.markConversationReadService(
      conversationId,
      user_id
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
      message: 'Conversation marked as read',
    });
  } catch (error: any) {
    logger.error('Mark conversation as read error:', error);

    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to mark conversation as read',
    });
  }
};

/**
 * DELETE /api/messages/:conversationId
 * Delete a conversation
 */
export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const conversationId = String(req.params.conversationId);
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await messagesService.deleteConversationService(
      conversationId,
      user_id
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
      message: 'Conversation deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete conversation error:', error);

    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete conversation',
    });
  }
};

export default {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  getUnreadCount,
  getUnreadSummary,
  markConversationRead,
  deleteConversation,
};
