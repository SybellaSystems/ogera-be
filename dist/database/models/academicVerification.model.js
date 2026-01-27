"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicVerificationModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class AcademicVerificationModel extends sequelize_1.Model {
}
exports.AcademicVerificationModel = AcademicVerificationModel;
function default_1(sequelize) {
    AcademicVerificationModel.init({
        id: {
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
        document_path: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        storage_type: {
            type: sequelize_1.DataTypes.ENUM('local', 's3'),
            allowNull: false,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('pending', 'accepted', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
        },
        rejection_reason: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        reviewed_by: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'user_id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        reviewed_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        assigned_to: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'user_id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.Sequelize.literal('NOW()'),
            allowNull: false,
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.Sequelize.literal('NOW()'),
            allowNull: false,
        },
    }, {
        tableName: 'academic_verifications',
        sequelize,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    return AcademicVerificationModel;
}
