import { DB } from '@/database';
import { Op } from 'sequelize';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';

// Get all conversations for a user (employer or student)
export const getConversationsRepo = async (
  user_id: string,
  role: 'employer' | 'student',
  limit: number = 50,
  offset: number = 0
) => {
  try {
    const whereClause = role === 'employer' 
      ? { employer_id: user_id }
      : { student_id: user_id };

    const conversations = await DB.Conversations.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: DB.Users,
          as: role === 'employer' ? 'student' : 'employer',
          attributes: ['user_id', 'full_name', 'profile_image_url'],
        },
        {
          model: DB.Jobs,
          as: 'job',
          attributes: ['job_id', 'job_title'],
        },
      ],
      order: [['last_message_at', 'DESC'], ['created_at', 'DESC']],
      limit,
      offset,
    });

    const rows = await Promise.all(
      conversations.rows.map(async (conversation) => {
        const [lastMessage, unreadCount] = await Promise.all([
          DB.Messages.findOne({
            where: { conversation_id: conversation.conversation_id },
            include: [
              {
                model: DB.Users,
                as: 'sender',
                attributes: ['user_id', 'full_name', 'profile_image_url'],
              },
            ],
            order: [['created_at', 'DESC']],
          }),
          DB.Messages.count({
            where: {
              conversation_id: conversation.conversation_id,
              receiver_id: user_id,
              read_status: false,
            },
          }),
        ]);

        return {
          ...conversation.toJSON(),
          lastMessage: lastMessage?.toJSON?.() || lastMessage || null,
          unreadCount,
        };
      })
    );

    return {
      ...conversations,
      rows,
    };
  } catch (error: any) {
    throw new CustomError(
      `Failed to fetch conversations: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// Get a specific conversation
export const getConversationRepo = async (conversation_id: string) => {
  try {
    const conversation = await DB.Conversations.findByPk(conversation_id, {
      include: [
        {
          model: DB.Users,
          as: 'employer',
          attributes: ['user_id', 'full_name', 'profile_image_url'],
        },
        {
          model: DB.Users,
          as: 'student',
          attributes: ['user_id', 'full_name', 'profile_image_url'],
        },
        {
          model: DB.Jobs,
          as: 'job',
          attributes: ['job_id', 'job_title'],
        },
      ],
    });

    if (!conversation) {
      throw new CustomError(
        'Conversation not found',
        StatusCodes.NOT_FOUND
      );
    }

    return conversation;
  } catch (error: any) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      `Failed to fetch conversation: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// Check if conversation exists
export const checkConversationExistsRepo = async (
  employer_id: string,
  student_id: string,
  job_id: string
) => {
  try {
    const conversation = await DB.Conversations.findOne({
      where: {
        employer_id,
        student_id,
        job_id,
      },
    });
    return conversation;
  } catch (error: any) {
    throw new CustomError(
      `Failed to check conversation: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// Create or get conversation
export const createOrGetConversationRepo = async (
  employer_id: string,
  student_id: string,
  job_id: string
) => {
  try {
    // Check if conversation exists
    let conversation = await checkConversationExistsRepo(
      employer_id,
      student_id,
      job_id
    );

    if (!conversation) {
      // Create new conversation
      conversation = await DB.Conversations.create({
        employer_id,
        student_id,
        job_id,
      });
    }

    return conversation;
  } catch (error: any) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      `Failed to create conversation: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// Get messages for a conversation
export const getMessagesRepo = async (
  conversation_id: string,
  limit: number = 50,
  offset: number = 0
) => {
  try {
    // First verify conversation exists
    const conversation = await getConversationRepo(conversation_id);

    const total = await DB.Messages.count({
      where: { conversation_id },
    });

    const rows = await DB.Messages.findAll({
      where: { conversation_id },
      include: [
        {
          model: DB.Users,
          as: 'sender',
          attributes: ['user_id', 'full_name', 'profile_image_url'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      count: total,
      rows: rows.reverse(),
    };
  } catch (error: any) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      `Failed to fetch messages: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// Create a message
export const createMessageRepo = async (
  conversation_id: string,
  sender_id: string,
  receiver_id: string,
  content: string,
  file_url?: string,
  file_name?: string,
  file_type?: string
) => {
  try {
    // Verify conversation exists and user is part of it
    const conversation = await getConversationRepo(conversation_id);

    const isValidParticipant = 
      (conversation.employer_id === sender_id || conversation.student_id === sender_id) &&
      (conversation.employer_id === receiver_id || conversation.student_id === receiver_id);

    if (!isValidParticipant) {
      throw new CustomError(
        'User is not part of this conversation',
        StatusCodes.FORBIDDEN
      );
    }

    // Create message
    const message = await DB.Messages.create({
      conversation_id,
      sender_id,
      receiver_id,
      content,
      read_status: false,
      file_url: file_url || null,
      file_name: file_name || null,
      file_type: file_type || null,
    });

    // Update conversation's last_message_at
    await DB.Conversations.update(
      { last_message_at: new Date() },
      { where: { conversation_id } }
    );

    // Fetch full message with sender info
    return await DB.Messages.findByPk(message.message_id, {
      include: [
        {
          model: DB.Users,
          as: 'sender',
          attributes: ['user_id', 'full_name', 'profile_image_url'],
        },
      ],
    });
  } catch (error: any) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      `Failed to create message: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// Mark messages as read
export const markMessagesAsReadRepo = async (
  conversation_id: string,
  receiver_id: string
) => {
  try {
    const result = await DB.Messages.update(
      { read_status: true },
      {
        where: {
          conversation_id,
          receiver_id,
          read_status: false,
        },
      }
    );

    return { updated: result[0] };
  } catch (error: any) {
    throw new CustomError(
      `Failed to mark messages as read: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// Get unread message count for a conversation
export const getUnreadCountRepo = async (
  conversation_id: string,
  receiver_id: string
) => {
  try {
    const count = await DB.Messages.count({
      where: {
        conversation_id,
        receiver_id,
        read_status: false,
      },
    });

    return count;
  } catch (error: any) {
    throw new CustomError(
      `Failed to get unread count: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// Get total unread message count across all conversations for a user
export const getTotalUnreadCountRepo = async (user_id: string) => {
  try {
    const count = await DB.Messages.count({
      where: {
        receiver_id: user_id,
        read_status: false,
      },
    });

    return count;
  } catch (error: any) {
    throw new CustomError(
      `Failed to get total unread count: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// Delete a conversation (soft delete by archiving)
export const deleteConversationRepo = async (
  conversation_id: string,
  user_id: string
) => {
  try {
    const conversation = await getConversationRepo(conversation_id);

    // Verify user is part of conversation
    if (conversation.employer_id !== user_id && conversation.student_id !== user_id) {
      throw new CustomError(
        'Unauthorized to delete this conversation',
        StatusCodes.FORBIDDEN
      );
    }

    // Delete associated messages
    await DB.Messages.destroy({
      where: { conversation_id },
    });

    // Delete conversation
    await DB.Conversations.destroy({
      where: { conversation_id },
    });

    return { success: true };
  } catch (error: any) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      `Failed to delete conversation: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
