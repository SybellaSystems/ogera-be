import { DB } from '@/database';
import { Op } from 'sequelize';

const repo = {
  createNotification: async (notificationData: any) => {
    return await DB.Notifications.create(notificationData);
  },

  findNotificationById: async (notification_id: string) => {
    return await DB.Notifications.findOne({
      where: { notification_id },
    });
  },

  findNotificationsByUserId: async (user_id: string, options?: { is_read?: boolean; limit?: number }) => {
    const where: any = { user_id };
    if (options?.is_read !== undefined) {
      where.is_read = options.is_read;
    }

    const queryOptions: any = {
      where,
      order: [['created_at', 'DESC']],
    };

    if (options?.limit) {
      queryOptions.limit = options.limit;
    }

    const notifications = await DB.Notifications.findAll(queryOptions);
    
    // For job_application and application_status notifications, fetch application details
    const notificationsWithDetails = await Promise.all(
      notifications.map(async (notification: any) => {
        const notificationData = notification.toJSON ? notification.toJSON() : notification;
        
        // If it's a job application or application status notification and has related_id, fetch application details
        if ((notificationData.type === 'job_application' || notificationData.type === 'application_status') 
            && notificationData.related_id) {
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
            // If fetching fails, continue without application data
            console.error('Error fetching application details for notification:', error);
          }
        }
        
        return notificationData;
      })
    );
    
    return notificationsWithDetails;
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

