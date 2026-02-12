import repo from './notification.repo';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { DB } from '@/database';

// Create a notification
export const createNotificationService = async (notificationData: {
  user_id: string;
  type: 'job_application' | 'application_status' | 'job_posted' | 'system';
  title: string;
  message: string;
  related_id?: string;
}) => {
  return await repo.createNotification(notificationData);
};

// Get all notifications for a user
export const getNotificationsService = async (
  user_id: string,
  options?: { is_read?: boolean; limit?: number }
) => {
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
  return await repo.findNotificationById(notification_id);
};

// Mark all notifications as read
export const markAllNotificationsAsReadService = async (user_id: string) => {
  const count = await repo.markAllAsRead(user_id);
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
  return { success: true };
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

