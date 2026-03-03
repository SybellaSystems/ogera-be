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

  findNotificationById: async (notification_id: string) => {
    return await DB.Notifications.findOne({
      where: { notification_id },
    });
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
   * Read all notifications for a user from the database `notifications` table.
   * Optional: filter by is_read, limit count. Omit limit to return all rows.
   */
  findNotificationsByUserId: async (user_id: string, options?: { is_read?: boolean; limit?: number }) => {
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
      { is_read: true },
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
      { is_read: true },
      {
        where: {
          user_id,
          is_read: false,
        },
      }
    );
    return rows;
  },

  // Mark all notifications as read for all users (superadmin only)
  markAllAsReadAll: async () => {
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
};

export default repo;

