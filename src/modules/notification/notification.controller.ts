import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import {
  getNotificationsService,
  getUnreadNotificationCountService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  deleteNotificationService,
  getUnreadCourseChatCountService,
  markCourseChatAsReadService,
} from './notification.service';

const response = new ResponseFormat();

// Get all notifications for the authenticated user
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
    const options: any = {};
    if (is_read !== undefined) {
      options.is_read = is_read === 'true';
    }
    if (limit) {
      options.limit = parseInt(limit as string, 10);
    }

    const notifications = await getNotificationsService(req.user.user_id, options);
    response.response(
      res,
      true,
      StatusCodes.OK,
      notifications,
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

    const result = await markAllNotificationsAsReadService(req.user.user_id);
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

// Unread count for course support chat (for badge on Course Support button)
export const getUnreadCourseChatCount = async (
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
    const course_id = req.query.course_id as string;
    if (!course_id) {
      response.errorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        'course_id query required'
      );
      return;
    }
    const result = await getUnreadCourseChatCountService(req.user.user_id, course_id);
    response.response(
      res,
      true,
      StatusCodes.OK,
      result,
      'Unread course chat count'
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

// Mark course support chat notifications as read (when user opens the chat panel)
export const markCourseChatAsRead = async (
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
    const course_id = (req.query.course_id || req.body?.course_id) as string;
    if (!course_id) {
      response.errorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        'course_id required'
      );
      return;
    }
    const result = await markCourseChatAsReadService(req.user.user_id, course_id);
    response.response(
      res,
      true,
      StatusCodes.OK,
      result,
      'Course chat marked as read'
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

