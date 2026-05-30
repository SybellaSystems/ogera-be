import repo from './notification.repo';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { emailService, EmailType } from '@/services/email/email.service';
import { DB } from '@/database';
import { Op } from 'sequelize';
import {
  AdminBroadcastNotificationTemplate,
  MessageNotificationTemplate,
} from '@/templete/emailTemplete';
import { emitToUser, isUserActiveInConversation } from '@/utils/socket';

type NotificationType =
  | 'job_application'
  | 'application_status'
  | 'job_posted'
  | 'system'
  | 'new_message';

const emitUnreadNotificationCount = async (user_id: string) => {
  const count = await repo.countUnreadNotifications(user_id);
  emitToUser(user_id, 'notifications:unread_count', { count });
  return count;
};

// Create a notification
export const createNotificationService = async (notificationData: {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_id?: string;
  action_url?: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, any> | null;
}) => {
  const notification = await repo.createNotification(notificationData);
  emitToUser(notification.user_id, 'notification:new', notification);
  await emitUnreadNotificationCount(notification.user_id);
  return notification;
};

export const sendAdminNotificationService = async (params: {
  /** Present so the sender gets the same message in their own inbox (and unread count). */
  sender_user_id: string;
  sender_role?: string;
  title: string;
  message: string;
  target_mode: 'specific' | 'role';
  target_user_ids?: string[];
  target_roles?: Array<'student' | 'employer'>;
  send_email?: boolean;
}) => {
  const normalizedSenderRole = (params.sender_role || '').toLowerCase().trim();
  const senderLabel: 'Admin' | 'SuperAdmin' =
    normalizedSenderRole === 'superadmin' ? 'SuperAdmin' : 'Admin';
  const title = (params.title || '').trim();
  const message = (params.message || '').trim();
  if (!title || !message) {
    throw new CustomError('Title and message are required', StatusCodes.BAD_REQUEST);
  }
  const decoratedTitle = `[${senderLabel}] ${title}`;
  const decoratedMessage = `${message}\n\nSent by ${senderLabel}`;

  const targetMode = params.target_mode;
  const targetRoles =
    targetMode === 'role'
      ? Array.from(new Set((params.target_roles || []).map((r) => r.toLowerCase()))).filter(
          (r) => r === 'student' || r === 'employer'
        )
      : [];
  const targetUserIds =
    targetMode === 'specific'
      ? Array.from(new Set((params.target_user_ids || []).filter(Boolean)))
      : [];

  if (targetMode === 'role' && targetRoles.length === 0) {
    throw new CustomError('At least one target role is required', StatusCodes.BAD_REQUEST);
  }
  if (targetMode === 'specific' && targetUserIds.length === 0) {
    throw new CustomError('At least one target user is required', StatusCodes.BAD_REQUEST);
  }

  const recipients = await repo.findUsersForNotificationTargets(targetMode, targetRoles, targetUserIds);
  if (!recipients.length) {
    throw new CustomError('No recipients found for selected target', StatusCodes.NOT_FOUND);
  }

  const notificationsPayload = recipients.map((recipient: any) => ({
    user_id: recipient.user_id,
    type: 'system',
    title: decoratedTitle,
    message: decoratedMessage,
  }));
  // Guard against accidental double-submit (or retried request) creating duplicate rows.
  // If the same user already has the same system notification in the last 60 seconds, skip it.
  const uniqueRecipients = Array.from(
    new Set(notificationsPayload.map((n) => String(n.user_id)))
  );
  const duplicateWindowStart = new Date(Date.now() - 60 * 1000);
  const recentDuplicates = await DB.Notifications.findAll({
    where: {
      user_id: { [Op.in]: uniqueRecipients },
      type: 'system',
      title: decoratedTitle,
      message: decoratedMessage,
      created_at: { [Op.gte]: duplicateWindowStart },
    },
    attributes: ['user_id'],
  });
  const recentlyNotifiedUserIds = new Set(
    recentDuplicates.map((row: any) => String(row.user_id))
  );
  const notificationsToCreate = notificationsPayload.filter(
    (n) => !recentlyNotifiedUserIds.has(String(n.user_id))
  );
  const createdNotifications = await repo.createNotificationsBulk(notificationsToCreate);
  await Promise.all(
    createdNotifications.map(async (notification: any) => {
      emitToUser(notification.user_id, 'notification:new', notification);
      await emitUnreadNotificationCount(notification.user_id);
    })
  );

  // Create exactly one sender copy so sender inbox shows a single broadcast item,
  // regardless of how many recipients were targeted.
  const shouldCreateSenderCopy = true;
  const senderWasRecipient = recipients.some(
    (r: any) => String(r.user_id) === String(params.sender_user_id)
  );
  if (shouldCreateSenderCopy && !senderWasRecipient) {
    try {
      const senderAlreadyHasRecentCopy = await DB.Notifications.findOne({
        where: {
          user_id: params.sender_user_id,
          type: 'system',
          title: decoratedTitle,
          message: decoratedMessage,
          created_at: { [Op.gte]: duplicateWindowStart },
        },
        attributes: ['notification_id'],
      });
      if (senderAlreadyHasRecentCopy) {
        throw new Error('skip_sender_copy_duplicate');
      }
      const senderNotification = await repo.createNotification({
        user_id: params.sender_user_id,
        type: 'system',
        title: decoratedTitle,
        message: decoratedMessage,
      });
      emitToUser(senderNotification.user_id, 'notification:new', senderNotification);
      await emitUnreadNotificationCount(senderNotification.user_id);
    } catch (e) {
      if ((e as Error)?.message !== 'skip_sender_copy_duplicate') {
        console.error('Failed to create sender notification copy:', e);
      }
    }
  }

  let emailSentCount = 0;
  if (params.send_email) {
    await Promise.all(
      recipients.map(async (recipient: any) => {
        if (!recipient.email) return;
        try {
          const { html, text } = AdminBroadcastNotificationTemplate({
            recipientName: recipient.full_name,
            title,
            message,
            senderLabel,
          });
          await emailService.sendEmail({
            to: recipient.email,
            type: EmailType.CUSTOM,
            subject: decoratedTitle,
            html,
            text,
          });
          emailSentCount += 1;
        } catch (error) {
          console.error(`Failed sending notification email to ${recipient.email}:`, error);
        }
      })
    );
  }

  return {
    sent_count: recipients.length,
    email_sent_count: emailSentCount,
    target_mode: targetMode,
  };
};

// Get all notifications for a user; superAdmin gets all notifications from the table
export const getNotificationsService = async (
  user_id: string,
  options?: { is_read?: boolean; limit?: number; offset?: number },
  role?: string
) => {
  const isSuperAdmin = role?.toLowerCase() === 'superadmin';
  if (isSuperAdmin) {
    return await repo.findAllNotificationsForSuperAdminInbox(user_id, options);
  }
  return await repo.findNotificationsByUserId(user_id, options);
};

// Get unread notification count
export const getUnreadNotificationCountService = async (user_id: string) => {
  const count = await repo.countUnreadNotifications(user_id);
  return { count };
};

// Mark notification as read
export const markNotificationAsReadService = async (
  notification_id: string,
  user_id: string
) => {
  const updated = await repo.markAsRead(notification_id, user_id);
  if (!updated) {
    throw new CustomError('Notification not found or access denied', StatusCodes.NOT_FOUND);
  }
  const notification = await repo.findNotificationById(notification_id);
  await emitUnreadNotificationCount(user_id);
  return notification;
};

// Mark all notifications as read
export const markAllNotificationsAsReadService = async (user_id: string, role?: string) => {
  const isSuperAdmin = role?.toLowerCase() === 'superadmin';
  const count = isSuperAdmin
    ? await repo.markAllAsReadAll()
    : await repo.markAllAsRead(user_id);
  if (!isSuperAdmin) {
    await emitUnreadNotificationCount(user_id);
  }
  return { count };
};

// Delete notification
export const deleteNotificationService = async (
  notification_id: string,
  user_id: string
) => {
  const deleted = await repo.deleteNotification(notification_id, user_id);
  if (!deleted) {
    throw new CustomError('Notification not found or access denied', StatusCodes.NOT_FOUND);
  }
  await emitUnreadNotificationCount(user_id);
  return { success: true };
};

export const createMessageNotification = async (params: {
  receiver_id: string;
  sender_id: string;
  sender_name: string;
  receiver_email?: string | null;
  receiver_name?: string | null;
  conversation_id: string;
  job_title?: string | null;
  preview: string;
}) => {
  const notification = await createNotificationService({
    user_id: params.receiver_id,
    type: 'new_message',
    title: `New message from ${params.sender_name}`,
    message: params.preview,
    related_id: params.conversation_id,
    action_url: `/dashboard/messages?conversationId=${params.conversation_id}`,
    entity_type: 'conversation',
    entity_id: params.conversation_id,
    metadata: {
      conversation_id: params.conversation_id,
      sender_id: params.sender_id,
      sender_name: params.sender_name,
      job_title: params.job_title || null,
      preview: params.preview,
    },
  });

  const receiverIsActiveInConversation = isUserActiveInConversation(
    params.receiver_id,
    params.conversation_id
  );

  if (receiverIsActiveInConversation || !params.receiver_email) {
    return notification;
  }

  const recentWindowStart = new Date(Date.now() - 15 * 60 * 1000);
  const recentEmailNotification = await repo.findRecentMessageEmailNotification(
    params.receiver_id,
    params.conversation_id,
    recentWindowStart
  );

  if (recentEmailNotification) {
    return notification;
  }

  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
  const chatUrl = `${frontendBase.replace(/\/$/, '')}/dashboard/messages?conversationId=${params.conversation_id}`;
  const { html, text } = MessageNotificationTemplate({
    recipientName: params.receiver_name || 'there',
    senderName: params.sender_name,
    preview: params.preview,
    openChatUrl: chatUrl,
    jobTitle: params.job_title || undefined,
  });

  await emailService.sendEmail({
    to: params.receiver_email,
    type: EmailType.CUSTOM,
    subject: `${params.sender_name} sent you a message on Ogera`,
    html,
    text,
  });

  await repo.updateNotification(notification.notification_id, {
    email_sent_at: new Date(),
  });

  return notification;
};

// Helper: Create job application notification for employer
export const createJobApplicationNotification = async (
  employer_id: string,
  application_id: string,
  student_name: string,
  job_title: string
) => {
  return await createNotificationService({
    user_id: employer_id,
    type: 'job_application',
    title: 'New Job Application',
    message: `${student_name} has applied for your job: ${job_title}`,
    related_id: application_id,
  });
};

// Helper: Create application status notification for student
export const createApplicationStatusNotification = async (
  student_id: string,
  application_id: string,
  job_title: string,
  status: 'Accepted' | 'Rejected'
) => {
  const statusText = status === 'Accepted' ? 'accepted' : 'rejected';
  const emoji = status === 'Accepted' ? '✅' : '❌';
  
  return await createNotificationService({
    user_id: student_id,
    type: 'application_status',
    title: `Application ${status}`,
    message: `${emoji} Your application for "${job_title}" has been ${statusText}`,
    related_id: application_id,
  });
};

