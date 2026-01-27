"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class UserModel extends sequelize_1.Model {
}
exports.UserModel = UserModel;
function default_1(sequelize) {
    UserModel.init({
        user_id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        mobile_number: {
            type: sequelize_1.DataTypes.STRING(15),
            allowNull: false,
        },
        password_hash: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        role_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'roles',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        role_type: {
            type: sequelize_1.DataTypes.ENUM('student', 'employer', 'superAdmin', 'admin'),
            allowNull: false,
        },
        two_fa_enabled: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        two_fa_secret: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        full_name: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        national_id_number: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: true,
        },
        business_registration_id: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: true,
        },
        resume_url: {
            type: sequelize_1.DataTypes.STRING(500),
            allowNull: true,
            comment: 'Resume file URL for students',
        },
        cover_letter: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'Default cover letter for students',
        },
        preferred_location: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true,
            comment: 'Preferred work location for students',
        },
        /* ⭐ LEGAL FIELDS */
        terms_accepted: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        privacy_accepted: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        terms_accepted_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        privacy_accepted_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        reset_otp: {
            type: sequelize_1.DataTypes.STRING(10),
            allowNull: true,
        },
        reset_otp_expiry: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        email_verified: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        email_verification_token: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true,
        },
        email_verification_token_expiry: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        phone_verified: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        phone_verification_otp: {
            type: sequelize_1.DataTypes.STRING(10),
            allowNull: true,
        },
        phone_verification_otp_expiry: {
            type: sequelize_1.DataTypes.DATE,
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
        tableName: 'users',
        sequelize,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    return UserModel;
}
