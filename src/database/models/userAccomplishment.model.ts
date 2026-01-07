import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { UserAccomplishment } from '@/interfaces/profile.interfaces';
import { UserModel } from './user.model';

export type UserAccomplishmentCreationAttributes = Optional<
    UserAccomplishment,
    | 'accomplishment_id'
    | 'issuing_organization'
    | 'issue_date'
    | 'expiry_date'
    | 'credential_id'
    | 'credential_url'
    | 'description'
    | 'created_at'
    | 'updated_at'
>;

export class UserAccomplishmentModel
    extends Model<UserAccomplishment, UserAccomplishmentCreationAttributes>
    implements UserAccomplishment
{
    public accomplishment_id!: string;
    public user_id!: string;
    public accomplishment_type!: 'certification' | 'award' | 'publication' | 'patent' | 'other';
    public title!: string;
    public issuing_organization?: string;
    public issue_date?: Date;
    public expiry_date?: Date | null;
    public credential_id?: string;
    public credential_url?: string;
    public description?: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Associations
    public user?: UserModel;
}

export default function (sequelize: Sequelize): typeof UserAccomplishmentModel {
    UserAccomplishmentModel.init(
        {
            accomplishment_id: {
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
            accomplishment_type: {
                type: DataTypes.ENUM('certification', 'award', 'publication', 'patent', 'other'),
                allowNull: false,
                defaultValue: 'certification',
            },
            title: {
                type: DataTypes.STRING(300),
                allowNull: false,
            },
            issuing_organization: {
                type: DataTypes.STRING(300),
                allowNull: true,
            },
            issue_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            expiry_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            credential_id: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },
            credential_url: {
                type: DataTypes.STRING(500),
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
            tableName: 'user_accomplishments',
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                {
                    fields: ['user_id'],
                },
                {
                    fields: ['accomplishment_type'],
                },
            ],
        },
    );

    return UserAccomplishmentModel;
}

