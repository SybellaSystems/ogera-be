import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import {
  getNotificationsService,
  getUnreadNotificationCountService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  deleteNotificationService,
} from './notification.service';

const response = new ResponseFormat();

/**
 * GET /notifications
 * Fetches all notification data from the database for the authenticated user.
 * Query: ?is_read=true|false (optional), ?limit=number (optional; omit for all).
 * Response: { success, status, message, data: Notification[] }
 */
export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      response.errorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        false,
        'User not authenticated'
      );
      return;
    }

    const { is_read, limit } = req.query;
    const options: { is_read?: boolean; limit?: number } = {};
    if (is_read !== undefined) {
      options.is_read = is_read === 'true';
    }
    if (limit) {
      const parsed = parseInt(limit as string, 10);
      if (!isNaN(parsed) && parsed > 0) {
        options.limit = Math.min(parsed, 5000);
      }
    }

    const notifications = await getNotificationsService(
      req.user.user_id,
      options,
      req.user.role
    );
    const list = Array.isArray(notifications) ? notifications : [];
    response.response(
      res,
      true,
      StatusCodes.OK,
      list,
      'Notifications retrieved successfully'
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      response.errorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        false,
        'User not authenticated'
      );
      return;
    }

    const result = await getUnreadNotificationCountService(req.user.user_id);
    response.response(
      res,
      true,
      StatusCodes.OK,
      result,
      'Unread notification count retrieved successfully'
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// Mark notification as read
export const markNotificationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      response.errorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        false,
        'User not authenticated'
      );
      return;
    }

    const notification = await markNotificationAsReadService(
      req.params.notification_id as string,
      req.user.user_id
    );
    if (!notification) {
      response.errorResponse(
        res,
        StatusCodes.NOT_FOUND,
        false,
        'Notification not found'
      );
      return;
    }
    response.response(
      res,
      true,
      StatusCodes.OK,
      notification,
      'Notification marked as read'
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      response.errorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        false,
        'User not authenticated'
      );
      return;
    }

    const result = await markAllNotificationsAsReadService(
      req.user.user_id,
      req.user.role
    );
    response.response(
      res,
      true,
      StatusCodes.OK,
      result,
      'All notifications marked as read'
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// Delete notification
export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      response.errorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        false,
        'User not authenticated'
      );
      return;
    }

    const result = await deleteNotificationService(
      req.params.notification_id as string,
      req.user.user_id
    );
    response.response(
      res,
      true,
      StatusCodes.OK,
      result,
      'Notification deleted successfully'
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

