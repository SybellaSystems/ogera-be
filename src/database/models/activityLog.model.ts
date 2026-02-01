import { Sequelize, DataTypes, Model } from 'sequelize';

export class ActivityLogModel extends Model {
    public id!: string;
    public user_id!: string | null;
    public action!: string;
    public entity_type!: string;
    public entity_id!: string | null;
    public description!: string;
    public readonly created_at!: Date;
}

export default function (sequelize: Sequelize): typeof ActivityLogModel {
    ActivityLogModel.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            action: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },
            entity_type: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            entity_id: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: sequelize.literal('NOW()'),
            },
        },
        {
            tableName: 'activity_logs',
            sequelize,
            timestamps: false,
        },
    );

    return ActivityLogModel;
}
