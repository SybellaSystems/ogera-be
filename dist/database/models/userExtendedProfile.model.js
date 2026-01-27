"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserExtendedProfileModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class UserExtendedProfileModel extends sequelize_1.Model {
}
exports.UserExtendedProfileModel = UserExtendedProfileModel;
function default_1(sequelize) {
    UserExtendedProfileModel.init({
        user_id: {
            type: sequelize_1.DataTypes.UUID,
            primaryKey: true,
            references: {
                model: 'users',
                key: 'user_id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        resume_headline: {
            type: sequelize_1.DataTypes.STRING(500),
            allowNull: true,
        },
        profile_summary: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        total_experience_years: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        total_experience_months: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        current_salary: {
            type: sequelize_1.DataTypes.DECIMAL(15, 2),
            allowNull: true,
        },
        expected_salary: {
            type: sequelize_1.DataTypes.DECIMAL(15, 2),
            allowNull: true,
        },
        salary_currency: {
            type: sequelize_1.DataTypes.STRING(10),
            allowNull: true,
            defaultValue: 'INR',
        },
        notice_period: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: true,
        },
        date_of_birth: {
            type: sequelize_1.DataTypes.DATEONLY,
            allowNull: true,
        },
        gender: {
            type: sequelize_1.DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
            allowNull: true,
        },
        marital_status: {
            type: sequelize_1.DataTypes.ENUM('single', 'married', 'divorced', 'widowed', 'prefer_not_to_say'),
            allowNull: true,
        },
        languages: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
        },
        social_profiles: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
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
        tableName: 'user_extended_profiles',
        sequelize,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    return UserExtendedProfileModel;
}
