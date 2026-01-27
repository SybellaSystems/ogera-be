"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobApplicationAnswerModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class JobApplicationAnswerModel extends sequelize_1.Model {
}
exports.JobApplicationAnswerModel = JobApplicationAnswerModel;
function default_1(sequelize) {
    JobApplicationAnswerModel.init({
        answer_id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        application_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'job_applications',
                key: 'application_id',
            },
            onDelete: 'CASCADE',
        },
        question_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'job_questions',
                key: 'question_id',
            },
            onDelete: 'CASCADE',
        },
        answer_text: {
            type: sequelize_1.DataTypes.TEXT,
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
        tableName: 'job_application_answers',
        sequelize,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        timestamps: true,
    });
    return JobApplicationAnswerModel;
}
