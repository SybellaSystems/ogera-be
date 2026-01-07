import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { UserProject } from '@/interfaces/profile.interfaces';
import { UserModel } from './user.model';

export type UserProjectCreationAttributes = Optional<
    UserProject,
    | 'project_id'
    | 'project_url'
    | 'start_date'
    | 'end_date'
    | 'description'
    | 'technologies'
    | 'role_in_project'
    | 'created_at'
    | 'updated_at'
>;

export class UserProjectModel
    extends Model<UserProject, UserProjectCreationAttributes>
    implements UserProject
{
    public project_id!: string;
    public user_id!: string;
    public project_title!: string;
    public project_url?: string;
    public start_date?: Date;
    public end_date?: Date | null;
    public is_ongoing!: boolean;
    public description?: string;
    public technologies?: string[];
    public role_in_project?: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Associations
    public user?: UserModel;
}

export default function (sequelize: Sequelize): typeof UserProjectModel {
    UserProjectModel.init(
        {
            project_id: {
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
            project_title: {
                type: DataTypes.STRING(300),
                allowNull: false,
            },
            project_url: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },
            start_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            end_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            is_ongoing: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            technologies: {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: [],
            },
            role_in_project: {
                type: DataTypes.STRING(200),
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
            tableName: 'user_projects',
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

    return UserProjectModel;
}

