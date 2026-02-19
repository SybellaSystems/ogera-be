import { Op } from 'sequelize';
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

// ----- Course support chat notifications -----

export const getUnreadCourseChatCountService = async (user_id: string, course_id: string) => {
  const count = await repo.countUnreadCourseChat(user_id, course_id);
  return { count };
};

export const markCourseChatAsReadService = async (user_id: string, course_id: string) => {
  const count = await repo.markCourseChatAsRead(user_id, course_id);
  return { count };
};

/** Notify recipients when a course chat message is sent. Student → superadmin/courseadmin; Admin → enrolled students. */
export const notifyCourseChatMessage = async (
  course_id: string,
  course_name: string,
  sender_user_id: string,
  sender_role: string,
  content_preview: string
) => {
  const preview = content_preview.length > 80 ? content_preview.slice(0, 77) + '...' : content_preview;
  const isSupport = ['superadmin', 'admin', 'courseadmin', 'employer'].some(
    (r) => sender_role?.toLowerCase() === r.toLowerCase()
  );

  if (isSupport) {
    const enrollments = await DB.CourseEnrollments.findAll({
      where: { course_id },
      attributes: ['user_id'],
    });
    const recipientIds = enrollments
      .map((e) => (e as any).user_id)
      .filter((id) => id !== sender_user_id);
    for (const recipient_id of recipientIds) {
      await createNotificationService({
        user_id: recipient_id,
        type: 'system',
        title: 'Course support: New reply',
        message: `Support replied in "${course_name}": ${preview}`,
        related_id: course_id,
      });
    }
  } else {
    const roles = await DB.Roles.findAll({
      where: { roleName: { [Op.in]: ['superadmin', 'courseadmin'] } },
      attributes: ['id'],
    });
    const roleIds = roles.map((r) => (r as any).id);
    if (roleIds.length === 0) return;
    const users = await DB.Users.findAll({
      where: { role_id: roleIds },
      attributes: ['user_id'],
    });
    const recipientIds = users.map((u) => (u as any).user_id).filter((id) => id !== sender_user_id);
    for (const recipient_id of recipientIds) {
      await createNotificationService({
        user_id: recipient_id,
        type: 'system',
        title: 'Course support: Student needs help',
        message: `A student sent a message in "${course_name}": ${preview}`,
        related_id: course_id,
      });
    }
  }
};

