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
const database_1 = require("../../database");
const repo = {
    createNotification: (notificationData) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.Notifications.create(notificationData);
    }),
    findNotificationById: (notification_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.Notifications.findOne({
            where: { notification_id },
        });
    }),
    findNotificationsByUserId: (user_id, options) => __awaiter(void 0, void 0, void 0, function* () {
        const where = { user_id };
        if ((options === null || options === void 0 ? void 0 : options.is_read) !== undefined) {
            where.is_read = options.is_read;
        }
        const queryOptions = {
            where,
            order: [['created_at', 'DESC']],
        };
        if (options === null || options === void 0 ? void 0 : options.limit) {
            queryOptions.limit = options.limit;
        }
        const notifications = yield database_1.DB.Notifications.findAll(queryOptions);
        // For job_application and application_status notifications, fetch application details
        const notificationsWithDetails = yield Promise.all(notifications.map((notification) => __awaiter(void 0, void 0, void 0, function* () {
            const notificationData = notification.toJSON ? notification.toJSON() : notification;
            // If it's a job application or application status notification and has related_id, fetch application details
            if ((notificationData.type === 'job_application' || notificationData.type === 'application_status')
                && notificationData.related_id) {
                try {
                    const application = yield database_1.DB.JobApplications.findOne({
                        where: { application_id: notificationData.related_id },
                        include: [
                            {
                                model: database_1.DB.Jobs,
                                as: 'job',
                                attributes: ['job_id', 'job_title', 'category', 'location', 'employer_id'],
                                include: [
                                    {
                                        model: database_1.DB.Users,
                                        as: 'employer',
                                        attributes: ['user_id', 'full_name', 'email'],
                                        required: false,
                                    },
                                ],
                            },
                            {
                                model: database_1.DB.Users,
                                as: 'student',
                                attributes: ['user_id', 'full_name', 'email', 'mobile_number'],
                            },
                        ],
                    });
                    if (application) {
                        notificationData.application = application.toJSON ? application.toJSON() : application;
                    }
                }
                catch (error) {
                    // If fetching fails, continue without application data
                    console.error('Error fetching application details for notification:', error);
                }
            }
            return notificationData;
        })));
        return notificationsWithDetails;
    }),
    countUnreadNotifications: (user_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.Notifications.count({
            where: {
                user_id,
                is_read: false,
            },
        });
    }),
    markAsRead: (notification_id, user_id) => __awaiter(void 0, void 0, void 0, function* () {
        const [rows] = yield database_1.DB.Notifications.update({ is_read: true }, {
            where: {
                notification_id,
                user_id, // Ensure user owns the notification
            },
        });
        return rows > 0;
    }),
    markAllAsRead: (user_id) => __awaiter(void 0, void 0, void 0, function* () {
        const [rows] = yield database_1.DB.Notifications.update({ is_read: true }, {
            where: {
                user_id,
                is_read: false,
            },
        });
        return rows;
    }),
    deleteNotification: (notification_id, user_id) => __awaiter(void 0, void 0, void 0, function* () {
        const rows = yield database_1.DB.Notifications.destroy({
            where: {
                notification_id,
                user_id, // Ensure user owns the notification
            },
        });
        return rows > 0;
    }),
};
exports.default = repo;
