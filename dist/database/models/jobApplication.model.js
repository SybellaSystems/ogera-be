"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobApplicationModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class JobApplicationModel extends sequelize_1.Model {
}
exports.JobApplicationModel = JobApplicationModel;
function default_1(sequelize) {
    JobApplicationModel.init({
        application_id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        job_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "jobs",
                key: "job_id",
            },
            onDelete: "CASCADE",
        },
        student_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "user_id",
            },
            onDelete: "CASCADE",
        },
        status: {
            type: sequelize_1.DataTypes.ENUM("Pending", "Accepted", "Rejected"),
            allowNull: false,
            defaultValue: "Pending",
        },
        cover_letter: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        resume_url: {
            type: sequelize_1.DataTypes.STRING(500),
            allowNull: true,
        },
        applied_at: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.Sequelize.literal("NOW()"),
            allowNull: false,
        },
        completed_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        reviewed_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        reviewed_by: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            references: {
                model: "users",
                key: "user_id",
            },
            onDelete: "SET NULL",
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.Sequelize.literal("NOW()"),
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.Sequelize.literal("NOW()"),
        },
    }, {
        tableName: "job_applications",
        sequelize,
        createdAt: "created_at",
        updatedAt: "updated_at",
        timestamps: true,
    });
    return JobApplicationModel;
}
