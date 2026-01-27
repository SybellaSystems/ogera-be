"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseStepModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class CourseStepModel extends sequelize_1.Model {
}
exports.CourseStepModel = CourseStepModel;
function default_1(sequelize) {
    CourseStepModel.init({
        step_id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        course_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'courses',
                key: 'course_id',
            },
            onDelete: 'CASCADE',
        },
        step_type: {
            type: sequelize_1.DataTypes.ENUM('video', 'link', 'pdf', 'image', 'text'),
            allowNull: false,
        },
        step_content: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        step_title: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true,
        },
        step_order: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
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
        tableName: 'course_steps',
        sequelize,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        timestamps: true,
    });
    return CourseStepModel;
}
