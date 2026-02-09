import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { DisputeMessage } from '@/interfaces/dispute.interfaces';
import { DisputeModel } from './dispute.model';
import { UserModel } from './user.model';

export type DisputeMessageCreationAttributes = Optional<
    DisputeMessage,
    'message_id' | 'is_internal' | 'created_at'
>;

export class DisputeMessageModel
    extends Model<DisputeMessage, DisputeMessageCreationAttributes>
    implements DisputeMessage
{
    public message_id!: string;
    public dispute_id!: string;
    public sender_id!: string;
    public sender_type!: 'student' | 'employer' | 'moderator';
    public message!: string;
    public is_internal?: boolean;
    public readonly created_at!: Date;

    // Sequelize associations
    public dispute?: DisputeModel;
    public sender?: UserModel;
}

export default function (sequelize: Sequelize): typeof DisputeMessageModel {
    DisputeMessageModel.init(
        {
            message_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            dispute_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'disputes',
                    key: 'dispute_id',
                },
                onDelete: 'CASCADE',
            },
            sender_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onDelete: 'CASCADE',
            },
            sender_type: {
                type: DataTypes.ENUM('student', 'employer', 'moderator'),
                allowNull: false,
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            is_internal: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.literal('NOW()'),
            },
        },
        {
            tableName: 'dispute_messages',
            sequelize,
            createdAt: 'created_at',
            updatedAt: false,
            timestamps: true,
        },
    );

    return DisputeMessageModel;
}






