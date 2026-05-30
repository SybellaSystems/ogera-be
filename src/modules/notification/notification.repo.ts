import { DB } from '@/database';
import { Op } from 'sequelize';

/** Enrich notifications with application/job/student details when type is job_application or application_status */
async function notificationsWithDetails(notifications: any[]) {
  return Promise.all(
    notifications.map(async (notification: any) => {
      const notificationData = notification.toJSON ? notification.toJSON() : notification;
      if (
        (notificationData.type === 'job_application' || notificationData.type === 'application_status') &&
        notificationData.related_id
      ) {
        try {
          const application = await DB.JobApplications.findOne({
            where: { application_id: notificationData.related_id },
            include: [
              {
                model: DB.Jobs,
                as: 'job',
                attributes: ['job_id', 'job_title', 'category', 'location', 'employer_id'],
                include: [
                  {
                    model: DB.Users,
                    as: 'employer',
                    attributes: ['user_id', 'full_name', 'email'],
                    required: false,
                  },
                ],
              },
              {
                model: DB.Users,
                as: 'student',
                attributes: ['user_id', 'full_name', 'email', 'mobile_number'],
              },
            ],
          });
          if (application) {
            notificationData.application = application.toJSON ? application.toJSON() : application;
          }
        } catch (error) {
          console.error('Error fetching application details for notification:', error);
        }
      }
      return notificationData;
    })
  );
}

const repo = {
  createNotification: async (notificationData: any) => {
    return await DB.Notifications.create(notificationData);
  },

  createNotificationsBulk: async (notificationsData: any[]) => {
    if (!notificationsData.length) return [];
    return await DB.Notifications.bulkCreate(notificationsData);
  },

  findUsersForNotificationTargets: async (
    targetMode: 'specific' | 'role',
    targetRoleTypes: string[],
    targetUserIds: string[]
  ) => {
    const where: any = {};

    if (targetMode === 'role') {
      where.role_type = {
        [Op.in]: targetRoleTypes,
      };
    } else {
      where.user_id = {
        [Op.in]: targetUserIds,
      };
      where.role_type = {
        [Op.in]: ['student', 'employer'],
      };
    }

    return await DB.Users.findAll({
      where,
      attributes: ['user_id', 'email', 'role_type', 'full_name'],
    });
  },

  findNotificationById: async (notification_id: string) => {
    return await DB.Notifications.findOne({
      where: { notification_id },
    });
  },

  updateNotification: async (notification_id: string, data: any) => {
    await DB.Notifications.update(data, {
      where: { notification_id },
    });

    return await DB.Notifications.findByPk(notification_id);
  },

  /**
   * Read all notifications from the database `notifications` table (no user filter).
   * Used for superAdmin to see every notification. Optional: is_read, limit.
   */
  findAllNotifications: async (options?: { is_read?: boolean; limit?: number }) => {
    const where: any = {};
    if (options?.is_read !== undefined) {
      where.is_read = options.is_read;
    }

    const queryOptions: any = {
      where,
      order: [['created_at', 'DESC']],
    };

    if (options?.limit && options.limit > 0) {
      queryOptions.limit = options.limit;
    }

    const notifications = await DB.Notifications.findAll(queryOptions);
    return notificationsWithDetails(notifications);
  },

  /**
   * Superadmin inbox view:
   * - Keep global visibility for normal product notifications.
   * - Hide per-recipient admin broadcast duplicates generated for other users.
   *   (titles prefixed with [Admin] / [SuperAdmin] are shown only for superadmin's own user_id)
   */
  findAllNotificationsForSuperAdminInbox: async (
    superadmin_user_id: string,
    options?: { is_read?: boolean; limit?: number }
  ) => {
    const where: any = {};
    if (options?.is_read !== undefined) {
      where.is_read = options.is_read;
    }

    const queryOptions: any = {
      where,
      order: [['created_at', 'DESC']],
    };
    if (options?.limit && options.limit > 0) {
      queryOptions.limit = options.limit;
    }

    const notifications = await DB.Notifications.findAll(queryOptions);
    const filtered = notifications.filter((notification: any) => {
      const row = notification?.toJSON ? notification.toJSON() : notification;
      const title = String(row?.title || '');
      const isAdminBroadcast =
        title.startsWith('[Admin] ') || title.startsWith('[SuperAdmin] ');

      // For superadmin inbox, show only sender's own copy for admin broadcasts.
      if (isAdminBroadcast) {
        return String(row?.user_id) === String(superadmin_user_id);
      }
      return true;
    });

    return notificationsWithDetails(filtered);
  },

  /**
   * Read all notifications for a user from the database `notifications` table.
   * Optional: filter by is_read, limit count. Omit limit to return all rows.
   */
  findNotificationsByUserId: async (
    user_id: string,
    options?: { is_read?: boolean; limit?: number; offset?: number }
  ) => {
    const where: any = { user_id };
    if (options?.is_read !== undefined) {
      where.is_read = options.is_read;
    }

    const queryOptions: any = {
      where,
      order: [['created_at', 'DESC']],
    };

    if (options?.limit && options.limit > 0) {
      queryOptions.limit = options.limit;
    }

    if (options?.offset && options.offset > 0) {
      queryOptions.offset = options.offset;
    }

    const notifications = await DB.Notifications.findAll(queryOptions);
    return notificationsWithDetails(notifications);
  },

  countUnreadNotifications: async (user_id: string) => {
    return await DB.Notifications.count({
      where: {
        user_id,
        is_read: false,
      },
    });
  },

  markAsRead: async (notification_id: string, user_id: string) => {
    const [rows] = await DB.Notifications.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          notification_id,
          user_id, // Ensure user owns the notification
        },
      }
    );
    return rows > 0;
  },

  // Mark all notifications as read for a specific user
  markAllAsRead: async (user_id: string) => {
    const [rows] = await DB.Notifications.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          user_id,
          is_read: false,
        },
      }
    );
    return rows;
  },

  // Mark all notifications as read for all users (superadmin action)
  markAllAsReadAll: async () => {
    const [rows] = await DB.Notifications.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          is_read: false,
        },
      }
    );
    return rows;
  },

  /** Course chat: count unread notifications for a course (title "Course support:...", related_id = course_id). */
  countUnreadCourseChat: async (user_id: string, course_id: string) => {
    return await DB.Notifications.count({
      where: {
        user_id,
        is_read: false,
        related_id: course_id,
        title: { [Op.like]: 'Course support:%' },
      },
    });
  },

  /** Mark all course-chat notifications for this course as read. */
  markCourseChatAsRead: async (user_id: string, course_id: string) => {
    const [rows] = await DB.Notifications.update(
      { is_read: true },
      {
        where: {
          is_read: false,
        },
      }
    );
    return rows;
  },

  deleteNotification: async (notification_id: string, user_id: string) => {
    const rows = await DB.Notifications.destroy({
      where: {
        notification_id,
        user_id, // Ensure user owns the notification
      },
    });
    return rows > 0;
  },

  findRecentMessageEmailNotification: async (
    user_id: string,
    conversation_id: string,
    windowStart: Date
  ) => {
    return await DB.Notifications.findOne({
      where: {
        user_id,
        type: 'new_message',
        related_id: conversation_id,
        email_sent_at: {
          [Op.ne]: null,
        },
        created_at: {
          [Op.gte]: windowStart,
        },
      },
      order: [['created_at', 'DESC']],
    });
  },
};

export default repo;

