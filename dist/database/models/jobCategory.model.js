"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobCategoryModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class JobCategoryModel extends sequelize_1.Model {
}
exports.JobCategoryModel = JobCategoryModel;
function default_1(sequelize) {
    JobCategoryModel.init({
        category_id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        icon: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: true,
        },
        color: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: true,
        },
        job_count: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
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
        tableName: 'job_categories',
        sequelize,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        timestamps: true,
    });
    return JobCategoryModel;
}
