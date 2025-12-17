import express from 'express';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from './notification.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { PermissionChecker } from '@/middlewares/role.middleware';

const notificationRouter = express.Router();

// Get all notifications for the authenticated user
notificationRouter.get(
  '/',
  authMiddleware,
  PermissionChecker('/notifications', 'view'),
  getNotifications
);

// Get unread notification count
notificationRouter.get(
  '/unread/count',
  authMiddleware,
  PermissionChecker('/notifications', 'view'),
  getUnreadNotificationCount
);

// Mark notification as read
notificationRouter.patch(
  '/:notification_id/read',
  authMiddleware,
  PermissionChecker('/notifications', 'edit'),
  markNotificationAsRead
);

// Mark all notifications as read
notificationRouter.patch(
  '/read-all',
  authMiddleware,
  PermissionChecker('/notifications', 'edit'),
  markAllNotificationsAsRead
);

// Delete notification
notificationRouter.delete(
  '/:notification_id',
  authMiddleware,
  PermissionChecker('/notifications', 'delete'),
  deleteNotification
);

export default notificationRouter;

