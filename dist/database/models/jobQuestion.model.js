"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobQuestionModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class JobQuestionModel extends sequelize_1.Model {
}
exports.JobQuestionModel = JobQuestionModel;
function default_1(sequelize) {
    JobQuestionModel.init({
        question_id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        job_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'jobs',
                key: 'job_id',
            },
            onDelete: 'CASCADE',
        },
        question_text: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        question_type: {
            type: sequelize_1.DataTypes.ENUM('text', 'number', 'yes_no', 'multiple_choice'),
            allowNull: false,
            defaultValue: 'text',
        },
        is_required: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        options: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'JSON string for multiple choice options',
        },
        display_order: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
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
        tableName: 'job_questions',
        sequelize,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        timestamps: true,
    });
    return JobQuestionModel;
}
