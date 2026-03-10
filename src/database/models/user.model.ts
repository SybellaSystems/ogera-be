import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { User } from '@/interfaces/user.interfaces';
import { RoleModel } from './roles.model';
import { JobModel } from './job.model';
import { JobApplicationModel } from './jobApplication.model';

export type UserCreationAttributes = Optional<
    User,
    | 'user_id'
    | 'two_fa_enabled'
    | 'two_fa_secret'
    | 'created_at'
    | 'national_id_number'
    | 'business_registration_id'
    | 'resume_url'
    | 'cover_letter'
    | 'preferred_location'
    | 'reset_otp'
    | 'reset_otp_expiry'
    | 'terms_accepted'
    | 'privacy_accepted'
    | 'terms_accepted_at'
    | 'privacy_accepted_at'
    | 'email_verified'
    | 'email_verification_token'
    | 'email_verification_token_expiry'
    | 'phone_verified'
    | 'phone_verification_otp'
    | 'phone_verification_otp_expiry'
    | 'login_2fa_otp'
    | 'login_2fa_otp_expiry'
    | 'role_type'
>;

export class UserModel
    extends Model<User, UserCreationAttributes>
    implements User
{
    public user_id!: string;
    public email!: string;
    public mobile_number!: string;
    public password_hash!: string;

    public role_id!: string;
    public role_type!: 'student' | 'employer' | 'superAdmin' | 'admin';

    public two_fa_enabled!: boolean;
    public two_fa_secret?: string;
    public full_name!: string;
    public national_id_number?: string;
    public business_registration_id?: string;
    public resume_url?: string;
    public cover_letter?: string;
    public preferred_location?: string;

    public terms_accepted!: boolean;
    public privacy_accepted!: boolean;
    public terms_accepted_at!: Date | null;
    public privacy_accepted_at!: Date | null;

    public reset_otp?: string | null;
    public reset_otp_expiry?: Date | null;

    public email_verified!: boolean;
    public email_verification_token?: string | null;
    public email_verification_token_expiry?: Date | null;

    public phone_verified!: boolean;
    public phone_verification_otp?: string | null;
    public phone_verification_otp_expiry?: Date | null;

    public login_2fa_otp?: string | null;
    public login_2fa_otp_expiry?: Date | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Sequelize associations
    public role?: RoleModel;
    public jobs?: JobModel[];
    public jobApplications?: JobApplicationModel[];
}

export default function (sequelize: Sequelize): typeof UserModel {
    UserModel.init(
        {
            user_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },

            // Some DB setups have an `id` column (legacy). Ensure we populate it on create
            id: {
                type: DataTypes.UUID,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
                // keep as a regular column (not primaryKey) so existing code using `user_id` remains valid
                field: 'id',
            },

            // Legacy `name` column: ensure it's populated to avoid NOT NULL constraint errors
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
                defaultValue: '',
                comment: 'Legacy name column (kept for compatibility with older DB schemas)',
                field: 'name',
            },

            email: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },

            mobile_number: {
                type: DataTypes.STRING(15),
                allowNull: false,
            },

            password_hash: {
                type: DataTypes.TEXT,
                allowNull: false,
            },

            role_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'roles',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },

            role_type: {
                type: DataTypes.ENUM(
                    'student',
                    'employer',
                    'superAdmin',
                    'admin',
                ),
                allowNull: false,
            },

            two_fa_enabled: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },

            two_fa_secret: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            full_name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },

            national_id_number: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },

            business_registration_id: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },

            resume_url: {
                type: DataTypes.STRING(500),
                allowNull: true,
                comment: 'Resume file URL for students',
            },

            cover_letter: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Default cover letter for students',
            },

            preferred_location: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: 'Preferred work location for students',
            },

            /* ⭐ LEGAL FIELDS */
            terms_accepted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            privacy_accepted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            terms_accepted_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            privacy_accepted_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            reset_otp: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },

            reset_otp_expiry: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            email_verified: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },

            email_verification_token: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },

            email_verification_token_expiry: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            phone_verified: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },

            phone_verification_otp: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },

            phone_verification_otp_expiry: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            login_2fa_otp: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },

            login_2fa_otp_expiry: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            created_at: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.literal('NOW()'),
            },

            updated_at: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.literal('NOW()'),
            },
        },
        {
            tableName: 'users',
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            hooks: {
                beforeCreate: (instance: any) => {
                    // Populate legacy `name` column from `full_name` if available
                    try {
                        const fullName = instance.getDataValue('full_name') || instance.getDataValue('fullName') || instance.getDataValue('full_name');
                        if (fullName) {
                            instance.setDataValue('name', fullName);
                        }
                    } catch (e) {
                        // swallow - defensive
                    }
                },
                beforeUpdate: (instance: any) => {
                    try {
                        const fullName = instance.getDataValue('full_name') || instance.getDataValue('fullName');
                        if (fullName) {
                            instance.setDataValue('name', fullName);
                        }
                    } catch (e) {
                        // swallow
                    }
                },
            },
        },
    );

    return UserModel;
}
