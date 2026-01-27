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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApplicationStatusNotification = exports.createJobApplicationNotification = exports.deleteNotificationService = exports.markAllNotificationsAsReadService = exports.markNotificationAsReadService = exports.getUnreadNotificationCountService = exports.getNotificationsService = exports.createNotificationService = void 0;
const notification_repo_1 = __importDefault(require("./notification.repo"));
const custom_error_1 = require("../../utils/custom-error");
const http_status_codes_1 = require("http-status-codes");
// Create a notification
const createNotificationService = (notificationData) => __awaiter(void 0, void 0, void 0, function* () {
    return yield notification_repo_1.default.createNotification(notificationData);
});
exports.createNotificationService = createNotificationService;
// Get all notifications for a user
const getNotificationsService = (user_id, options) => __awaiter(void 0, void 0, void 0, function* () {
    return yield notification_repo_1.default.findNotificationsByUserId(user_id, options);
});
exports.getNotificationsService = getNotificationsService;
// Get unread notification count
const getUnreadNotificationCountService = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const count = yield notification_repo_1.default.countUnreadNotifications(user_id);
    return { count };
});
exports.getUnreadNotificationCountService = getUnreadNotificationCountService;
// Mark notification as read
const markNotificationAsReadService = (notification_id, user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const updated = yield notification_repo_1.default.markAsRead(notification_id, user_id);
    if (!updated) {
        throw new custom_error_1.CustomError('Notification not found or access denied', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    return yield notification_repo_1.default.findNotificationById(notification_id);
});
exports.markNotificationAsReadService = markNotificationAsReadService;
// Mark all notifications as read
const markAllNotificationsAsReadService = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const count = yield notification_repo_1.default.markAllAsRead(user_id);
    return { count };
});
exports.markAllNotificationsAsReadService = markAllNotificationsAsReadService;
// Delete notification
const deleteNotificationService = (notification_id, user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const deleted = yield notification_repo_1.default.deleteNotification(notification_id, user_id);
    if (!deleted) {
        throw new custom_error_1.CustomError('Notification not found or access denied', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    return { success: true };
});
exports.deleteNotificationService = deleteNotificationService;
// Helper: Create job application notification for employer
const createJobApplicationNotification = (employer_id, application_id, student_name, job_title) => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, exports.createNotificationService)({
        user_id: employer_id,
        type: 'job_application',
        title: 'New Job Application',
        message: `${student_name} has applied for your job: ${job_title}`,
        related_id: application_id,
    });
});
exports.createJobApplicationNotification = createJobApplicationNotification;
// Helper: Create application status notification for student
const createApplicationStatusNotification = (student_id, application_id, job_title, status) => __awaiter(void 0, void 0, void 0, function* () {
    const statusText = status === 'Accepted' ? 'accepted' : 'rejected';
    const emoji = status === 'Accepted' ? '✅' : '❌';
    return yield (0, exports.createNotificationService)({
        user_id: student_id,
        type: 'application_status',
        title: `Application ${status}`,
        message: `${emoji} Your application for "${job_title}" has been ${statusText}`,
        related_id: application_id,
    });
});
exports.createApplicationStatusNotification = createApplicationStatusNotification;
