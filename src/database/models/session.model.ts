import { Sequelize, DataTypes, Model } from 'sequelize';

export interface SessionAttributes {
    id: string;
    user_id: string;
    token: string;
    device_type: string;
    user_agent: string;
    ip_address: string;
    last_activity: Date;
    created_at: Date;
    updated_at: Date;
    expires_at: Date;
}

export class SessionModel
    extends Model<SessionAttributes>
    implements SessionAttributes
{
    public id!: string;
    public user_id!: string;
    public token!: string;
    public device_type!: string;
    public user_agent!: string;
    public ip_address!: string;
    public last_activity!: Date;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public expires_at!: Date;
}

export default function (sequelize: Sequelize): typeof SessionModel {
    SessionModel.init(
        {
            id: {
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
                onDelete: 'CASCADE',
            },
            token: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            device_type: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: 'Desktop',
            },
            user_agent: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            ip_address: {
                type: DataTypes.STRING(45),
                allowNull: true,
            },
            last_activity: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('NOW()'),
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.literal('NOW()'),
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.literal('NOW()'),
            },
            expires_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: 'sessions',
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                {
                    fields: ['user_id'],
                },
                {
                    fields: ['token'],
                },
                {
                    fields: ['expires_at'],
                },
            ],
        },
    );

    return SessionModel;
}
