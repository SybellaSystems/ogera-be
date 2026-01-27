"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAccomplishmentModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class UserAccomplishmentModel extends sequelize_1.Model {
}
exports.UserAccomplishmentModel = UserAccomplishmentModel;
function default_1(sequelize) {
    UserAccomplishmentModel.init({
        accomplishment_id: {
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
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        accomplishment_type: {
            type: sequelize_1.DataTypes.ENUM('certification', 'award', 'publication', 'patent', 'other'),
            allowNull: false,
            defaultValue: 'certification',
        },
        title: {
            type: sequelize_1.DataTypes.STRING(300),
            allowNull: false,
        },
        issuing_organization: {
            type: sequelize_1.DataTypes.STRING(300),
            allowNull: true,
        },
        issue_date: {
            type: sequelize_1.DataTypes.DATEONLY,
            allowNull: true,
        },
        expiry_date: {
            type: sequelize_1.DataTypes.DATEONLY,
            allowNull: true,
        },
        credential_id: {
            type: sequelize_1.DataTypes.STRING(200),
            allowNull: true,
        },
        credential_url: {
            type: sequelize_1.DataTypes.STRING(500),
            allowNull: true,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
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
        tableName: 'user_accomplishments',
        sequelize,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['user_id'],
            },
            {
                fields: ['accomplishment_type'],
            },
        ],
    });
    return UserAccomplishmentModel;
}
