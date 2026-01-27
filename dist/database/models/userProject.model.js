"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProjectModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class UserProjectModel extends sequelize_1.Model {
}
exports.UserProjectModel = UserProjectModel;
function default_1(sequelize) {
    UserProjectModel.init({
        project_id: {
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
        project_title: {
            type: sequelize_1.DataTypes.STRING(300),
            allowNull: false,
        },
        project_url: {
            type: sequelize_1.DataTypes.STRING(500),
            allowNull: true,
        },
        start_date: {
            type: sequelize_1.DataTypes.DATEONLY,
            allowNull: true,
        },
        end_date: {
            type: sequelize_1.DataTypes.DATEONLY,
            allowNull: true,
        },
        is_ongoing: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        technologies: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
        },
        role_in_project: {
            type: sequelize_1.DataTypes.STRING(200),
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
        tableName: 'user_projects',
        sequelize,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['user_id'],
            },
        ],
    });
    return UserProjectModel;
}
