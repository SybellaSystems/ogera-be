"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUnreadNotificationCount = exports.getNotifications = void 0;
const http_status_codes_1 = require("http-status-codes");
const responseFormat_1 = require("../../exception/responseFormat");
const notification_service_1 = require("./notification.service");
const response = new responseFormat_1.ResponseFormat();
// Get all notifications for the authenticated user
const getNotifications = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const { is_read, limit } = req.query;
        const options = {};
        if (is_read !== undefined) {
            options.is_read = is_read === 'true';
        }
        if (limit) {
            options.limit = parseInt(limit, 10);
        }
        const notifications = yield (0, notification_service_1.getNotificationsService)(req.user.user_id, options);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, notifications, 'Notifications retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getNotifications = getNotifications;
// Get unread notification count
const getUnreadNotificationCount = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const result = yield (0, notification_service_1.getUnreadNotificationCountService)(req.user.user_id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Unread notification count retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getUnreadNotificationCount = getUnreadNotificationCount;
// Mark notification as read
const markNotificationAsRead = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const notification = yield (0, notification_service_1.markNotificationAsReadService)(req.params.notification_id, req.user.user_id);
        if (!notification) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.NOT_FOUND, false, 'Notification not found');
            return;
        }
        response.response(res, true, http_status_codes_1.StatusCodes.OK, notification, 'Notification marked as read');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.markNotificationAsRead = markNotificationAsRead;
// Mark all notifications as read
const markAllNotificationsAsRead = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const result = yield (0, notification_service_1.markAllNotificationsAsReadService)(req.user.user_id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'All notifications marked as read');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// Delete notification
const deleteNotification = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const result = yield (0, notification_service_1.deleteNotificationService)(req.params.notification_id, req.user.user_id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Notification deleted successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.deleteNotification = deleteNotification;
