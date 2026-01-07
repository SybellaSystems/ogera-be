import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { UserEmployment } from '@/interfaces/profile.interfaces';
import { UserModel } from './user.model';

export type UserEmploymentCreationAttributes = Optional<
    UserEmployment,
    | 'employment_id'
    | 'end_date'
    | 'location'
    | 'description'
    | 'notice_period'
    | 'current_salary'
    | 'salary_currency'
    | 'key_skills'
    | 'created_at'
    | 'updated_at'
>;

export class UserEmploymentModel
    extends Model<UserEmployment, UserEmploymentCreationAttributes>
    implements UserEmployment
{
    public employment_id!: string;
    public user_id!: string;
    public job_title!: string;
    public company_name!: string;
    public employment_type!: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
    public start_date!: Date;
    public end_date?: Date | null;
    public is_current!: boolean;
    public location?: string;
    public description?: string;
    public notice_period?: string;
    public current_salary?: number;
    public salary_currency?: string;
    public key_skills?: string[];
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Associations
    public user?: UserModel;
}

export default function (sequelize: Sequelize): typeof UserEmploymentModel {
    UserEmploymentModel.init(
        {
            employment_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            job_title: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
            company_name: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
            employment_type: {
                type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'internship', 'freelance'),
                allowNull: false,
                defaultValue: 'full_time',
            },
            start_date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            end_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            is_current: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            location: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            notice_period: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            current_salary: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: true,
            },
            salary_currency: {
                type: DataTypes.STRING(10),
                allowNull: true,
                defaultValue: 'INR',
            },
            key_skills: {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: [],
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
            tableName: 'user_employments',
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                {
                    fields: ['user_id'],
                },
                {
                    fields: ['is_current'],
                },
            ],
        },
    );

    return UserEmploymentModel;
}

