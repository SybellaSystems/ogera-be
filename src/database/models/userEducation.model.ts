import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { UserEducation } from '@/interfaces/profile.interfaces';
import { UserModel } from './user.model';

export type UserEducationCreationAttributes = Optional<
    UserEducation,
    | 'education_id'
    | 'end_year'
    | 'grade'
    | 'grade_type'
    | 'description'
    | 'created_at'
    | 'updated_at'
>;

export class UserEducationModel
    extends Model<UserEducation, UserEducationCreationAttributes>
    implements UserEducation
{
    public education_id!: string;
    public user_id!: string;
    public degree!: string;
    public field_of_study!: string;
    public institution_name!: string;
    public start_year!: number;
    public end_year?: number | null;
    public is_current!: boolean;
    public grade?: string;
    public grade_type?: 'percentage' | 'cgpa' | 'gpa';
    public description?: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Associations
    public user?: UserModel;
}

export default function (sequelize: Sequelize): typeof UserEducationModel {
    UserEducationModel.init(
        {
            education_id: {
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
            degree: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
            field_of_study: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
            institution_name: {
                type: DataTypes.STRING(300),
                allowNull: false,
            },
            start_year: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            end_year: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            is_current: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            grade: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            grade_type: {
                type: DataTypes.ENUM('percentage', 'cgpa', 'gpa'),
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
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
            tableName: 'user_educations',
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                {
                    fields: ['user_id'],
                },
            ],
        },
    );

    return UserEducationModel;
}

