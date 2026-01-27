"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEmploymentModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class UserEmploymentModel extends sequelize_1.Model {
}
exports.UserEmploymentModel = UserEmploymentModel;
function default_1(sequelize) {
    UserEmploymentModel.init({
        employment_id: {
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
        job_title: {
            type: sequelize_1.DataTypes.STRING(200),
            allowNull: false,
        },
        company_name: {
            type: sequelize_1.DataTypes.STRING(200),
            allowNull: false,
        },
        employment_type: {
            type: sequelize_1.DataTypes.ENUM('full_time', 'part_time', 'contract', 'internship', 'freelance'),
            allowNull: false,
            defaultValue: 'full_time',
        },
        start_date: {
            type: sequelize_1.DataTypes.DATEONLY,
            allowNull: false,
        },
        end_date: {
            type: sequelize_1.DataTypes.DATEONLY,
            allowNull: true,
        },
        is_current: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        location: {
            type: sequelize_1.DataTypes.STRING(200),
            allowNull: true,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        notice_period: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: true,
        },
        current_salary: {
            type: sequelize_1.DataTypes.DECIMAL(15, 2),
            allowNull: true,
        },
        salary_currency: {
            type: sequelize_1.DataTypes.STRING(10),
            allowNull: true,
            defaultValue: 'INR',
        },
        key_skills: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
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
        tableName: 'user_employments',
        sequelize,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['user_id'],
            },
            {
                fields: ['is_current'],
            },
        ],
    });
    return UserEmploymentModel;
}
