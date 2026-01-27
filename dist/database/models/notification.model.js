"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class NotificationModel extends sequelize_1.Model {
}
exports.NotificationModel = NotificationModel;
function default_1(sequelize) {
    NotificationModel.init({
        notification_id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'user_id',
            },
            onDelete: 'CASCADE',
        },
        type: {
            type: sequelize_1.DataTypes.ENUM('job_application', 'application_status', 'job_posted', 'system'),
            allowNull: false,
        },
        title: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        message: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        related_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
        },
        is_read: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.Sequelize.literal('NOW()'),
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.Sequelize.literal('NOW()'),
        },
    }, {
        tableName: 'notifications',
        sequelize,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        timestamps: true,
    });
    return NotificationModel;
}
