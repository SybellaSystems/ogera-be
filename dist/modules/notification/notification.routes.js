"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notification_controller_1 = require("./notification.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const notificationRouter = express_1.default.Router();
// Get all notifications for the authenticated user
notificationRouter.get('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/notifications', 'view'), notification_controller_1.getNotifications);
// Get unread notification count
notificationRouter.get('/unread/count', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/notifications', 'view'), notification_controller_1.getUnreadNotificationCount);
// Mark notification as read
notificationRouter.patch('/:notification_id/read', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/notifications', 'edit'), notification_controller_1.markNotificationAsRead);
// Mark all notifications as read
notificationRouter.patch('/read-all', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/notifications', 'edit'), notification_controller_1.markAllNotificationsAsRead);
// Delete notification
notificationRouter.delete('/:notification_id', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/notifications', 'delete'), notification_controller_1.deleteNotification);
exports.default = notificationRouter;
