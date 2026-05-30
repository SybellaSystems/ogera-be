import * as repo from './messages.repo';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { DB } from '@/database';
import { emitToConversation, emitToUser, isUserOnline } from '@/utils/socket';
import { createMessageNotification } from '@/modules/notification/notification.service';

export const getConversationsService = async (
  user_id: string,
  role: 'employer' | 'student',
  limit?: number,
  offset?: number
) => {
  return await repo.getConversationsRepo(user_id, role, limit, offset);
};

export const getMessagesService = async (
  conversation_id: string,
  user_id: string,
  limit?: number,
  offset?: number
) => {
  // Verify user is part of conversation
  const conversation = await repo.getConversationRepo(conversation_id);
  
  if (conversation.employer_id !== user_id && conversation.student_id !== user_id) {
    throw new CustomError(
      'Unauthorized to access this conversation',
      StatusCodes.FORBIDDEN
    );
  }

  return await repo.getMessagesRepo(conversation_id, limit, offset);
};

export const sendMessageService = async (
  conversation_id: string,
  sender_id: string,
  content: string,
  file_url?: string,
  file_name?: string,
  file_type?: string
) => {
  const normalizedContent = String(content || '')
    .replace(/\u0000/g, '')
    .trim();

  // Content is required unless a file is provided
  if (!normalizedContent && !file_url) {
    throw new CustomError(
      'Message content or file is required',
      StatusCodes.BAD_REQUEST
    );
  }

  if (normalizedContent.length > 5000) {
    throw new CustomError(
      'Message content is too long (max 5000 characters)',
      StatusCodes.BAD_REQUEST
    );
  }

  // Get conversation to find receiver
  const conversation = await repo.getConversationRepo(conversation_id);

  // Verify sender is part of conversation
  if (conversation.employer_id !== sender_id && conversation.student_id !== sender_id) {
    throw new CustomError(
      'Unauthorized to send message in this conversation',
      StatusCodes.FORBIDDEN
    );
  }

  // Determine receiver
  const receiver_id = conversation.employer_id === sender_id 
    ? conversation.student_id 
    : conversation.employer_id;

  const message = await repo.createMessageRepo(
    conversation_id,
    sender_id,
    receiver_id,
    normalizedContent,
    file_url,
    file_name,
    file_type
  );

  if (!message) {
    throw new CustomError('Failed to create message', StatusCodes.INTERNAL_SERVER_ERROR);
  }

  const sender = await DB.Users.findByPk(sender_id, {
    attributes: ['user_id', 'full_name', 'email'],
  });
  const receiver = await DB.Users.findByPk(receiver_id, {
    attributes: ['user_id', 'full_name', 'email'],
  });

  emitToUser(receiver_id, 'message:new', {
    conversation_id,
    message,
  });

  emitToConversation(conversation_id, 'conversation:updated', {
    conversation_id,
    message,
  });

  if (isUserOnline(receiver_id)) {
    emitToUser(sender_id, 'message:delivered', {
      conversation_id,
      message_id: message.message_id,
      delivered_at: new Date().toISOString(),
    });
  }

  try {
    await createMessageNotification({
      receiver_id,
      sender_id,
      sender_name: sender?.full_name || 'Someone',
      receiver_email: receiver?.email || null,
      receiver_name: receiver?.full_name || null,
      conversation_id,
      job_title: conversation.job?.job_title || null,
      preview:
        normalizedContent ||
        (file_name ? `Sent an attachment: ${file_name}` : 'Sent you a new message'),
    });
  } catch (notificationError) {
    // Do not block message delivery if notification/email work fails.
    console.error('Failed to create message notification:', notificationError);
  }

  return message;
};

export const createConversationService = async (
  employer_id: string,
  student_id: string,
  job_id: string,
  requesting_user_id: string,
  _requesting_user_role: string
) => {
  // Verify job exists and belongs to employer
  const job = await DB.Jobs.findByPk(job_id);
  if (!job) {
    throw new CustomError(
      'Job not found',
      StatusCodes.NOT_FOUND
    );
  }

  if (job.employer_id !== employer_id) {
    throw new CustomError(
      'Job does not belong to employer',
      StatusCodes.BAD_REQUEST
    );
  }

  // Verify application exists and is Accepted
  const application = await DB.JobApplications.findOne({
    where: {
      job_id,
      student_id,
      status: 'Accepted', // Only allow messaging if application is accepted
    },
  });

  if (!application) {
    throw new CustomError(
      'Student application for this job must be accepted first',
      StatusCodes.BAD_REQUEST
    );
  }

  // Verify requesting user is employer or student in the conversation
  if (
    requesting_user_id !== employer_id &&
    requesting_user_id !== student_id
  ) {
    throw new CustomError(
      'Unauthorized',
      StatusCodes.FORBIDDEN
    );
  }

  return await repo.createOrGetConversationRepo(
    employer_id,
    student_id,
    job_id
  );
};

export const getUnreadCountService = async (
  conversation_id: string,
  user_id: string
) => {
  // Verify user is part of conversation
  const conversation = await repo.getConversationRepo(conversation_id);

  if (conversation.employer_id !== user_id && conversation.student_id !== user_id) {
    throw new CustomError(
      'Unauthorized to access this conversation',
      StatusCodes.FORBIDDEN
    );
  }

  const count = await repo.getUnreadCountRepo(conversation_id, user_id);
  return { unread_count: count };
};

export const markConversationReadService = async (
  conversation_id: string,
  user_id: string
) => {
  const conversation = await repo.getConversationRepo(conversation_id);

  if (conversation.employer_id !== user_id && conversation.student_id !== user_id) {
    throw new CustomError(
      'Unauthorized to access this conversation',
      StatusCodes.FORBIDDEN
    );
  }

  const result = await repo.markMessagesAsReadRepo(conversation_id, user_id);
  const otherParticipantId =
    conversation.employer_id === user_id ? conversation.student_id : conversation.employer_id;

  if (result.updated > 0) {
    emitToUser(otherParticipantId, 'messages:read', {
      conversation_id,
      reader_id: user_id,
      read_at: new Date().toISOString(),
    });
  }

  return result;
};

export const getUnreadSummaryService = async (user_id: string) => {
  const unread_count = await repo.getTotalUnreadCountRepo(user_id);
  return { unread_count };
};

export const deleteConversationService = async (
  conversation_id: string,
  user_id: string
) => {
  return await repo.deleteConversationRepo(conversation_id, user_id);
};

export default {
  getConversationsService,
  getMessagesService,
  sendMessageService,
  createConversationService,
  getUnreadCountService,
  markConversationReadService,
  getUnreadSummaryService,
  deleteConversationService,
};
