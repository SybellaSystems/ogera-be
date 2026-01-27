"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class JobModel extends sequelize_1.Model {
}
exports.JobModel = JobModel;
function default_1(sequelize) {
    JobModel.init({
        job_id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        employer_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'user_id',
            },
            onDelete: 'CASCADE',
        },
        job_title: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        applications: {
            type: sequelize_1.DataTypes.INTEGER,
            defaultValue: 0,
        },
        category: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
        },
        budget: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
        },
        duration: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
        },
        location: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        requirements: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        skills: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        employment_type: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: true,
        },
        experience_level: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: true,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('Pending', 'Active', 'Inactive', 'Completed'),
            allowNull: false,
            defaultValue: 'Active',
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
        tableName: 'jobs',
        sequelize,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        timestamps: true,
    });
    return JobModel;
}
