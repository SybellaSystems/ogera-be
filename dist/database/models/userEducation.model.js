"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEducationModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class UserEducationModel extends sequelize_1.Model {
}
exports.UserEducationModel = UserEducationModel;
function default_1(sequelize) {
    UserEducationModel.init({
        education_id: {
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
        degree: {
            type: sequelize_1.DataTypes.STRING(200),
            allowNull: false,
        },
        field_of_study: {
            type: sequelize_1.DataTypes.STRING(200),
            allowNull: false,
        },
        institution_name: {
            type: sequelize_1.DataTypes.STRING(300),
            allowNull: false,
        },
        start_year: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        end_year: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
        },
        is_current: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        grade: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: true,
        },
        grade_type: {
            type: sequelize_1.DataTypes.ENUM('percentage', 'cgpa', 'gpa'),
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
        tableName: 'user_educations',
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
    return UserEducationModel;
}
