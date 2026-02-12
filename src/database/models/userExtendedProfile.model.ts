import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { ExtendedUserProfile } from '@/interfaces/profile.interfaces';
import { UserModel } from './user.model';

export type UserExtendedProfileCreationAttributes = Optional<
    ExtendedUserProfile,
    | 'resume_headline'
    | 'profile_summary'
    | 'total_experience_years'
    | 'total_experience_months'
    | 'current_salary'
    | 'expected_salary'
    | 'salary_currency'
    | 'notice_period'
    | 'date_of_birth'
    | 'gender'
    | 'marital_status'
    | 'languages'
    | 'social_profiles'
>;

export interface ExtendedProfileWithTimestamps extends ExtendedUserProfile {
    created_at: Date;
    updated_at: Date;
}

export class UserExtendedProfileModel
    extends Model<ExtendedProfileWithTimestamps, UserExtendedProfileCreationAttributes>
    implements ExtendedProfileWithTimestamps
{
    public user_id!: string;
    public resume_headline?: string;
    public profile_summary?: string;
    public total_experience_years?: number;
    public total_experience_months?: number;
    public current_salary?: number;
    public expected_salary?: number;
    public salary_currency?: string;
    public notice_period?: string;
    public date_of_birth?: Date;
    public gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    public marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'prefer_not_to_say';
    public languages?: string[];
    public social_profiles?: {
        linkedin?: string;
        github?: string;
        portfolio?: string;
        twitter?: string;
        other?: string;
    };
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Associations
    public user?: UserModel;
}

export default function (sequelize: Sequelize): typeof UserExtendedProfileModel {
    UserExtendedProfileModel.init(
        {
            user_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            resume_headline: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },
            profile_summary: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            total_experience_years: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            total_experience_months: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            current_salary: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: true,
            },
            expected_salary: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: true,
            },
            salary_currency: {
                type: DataTypes.STRING(10),
                allowNull: true,
                defaultValue: 'INR',
            },
            notice_period: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            date_of_birth: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            gender: {
                type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
                allowNull: true,
            },
            marital_status: {
                type: DataTypes.ENUM('single', 'married', 'divorced', 'widowed', 'prefer_not_to_say'),
                allowNull: true,
            },
            languages: {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: [],
            },
            social_profiles: {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: {},
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
            tableName: 'user_extended_profiles',
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    );

    return UserExtendedProfileModel;
}

