import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { UserModel } from './user.model';

export interface Message {
    message_id: string;
    conversation_id: string;
    sender_id: string;
    receiver_id: string;
    content?: string | null;
    read_status: boolean;
    file_url?: string | null;
    file_name?: string | null;
    file_type?: string | null;
    created_at: Date;
    updated_at: Date;
}

export type MessageCreationAttributes = Optional<
    Message,
    | 'message_id'
    | 'content'
    | 'read_status'
    | 'file_url'
    | 'file_name'
    | 'file_type'
    | 'created_at'
    | 'updated_at'
>;

export class MessageModel
    extends Model<Message, MessageCreationAttributes>
    implements Message
{
    public message_id!: string;
    public conversation_id!: string;
    public sender_id!: string;
    public receiver_id!: string;
    public content?: string | null;
    public read_status!: boolean;
    public file_url?: string | null;
    public file_name?: string | null;
    public file_type?: string | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Sequelize associations
    public sender?: UserModel;
    public receiver?: UserModel;
}

export default function (sequelize: Sequelize): typeof MessageModel {
    MessageModel.init(
        {
            message_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            conversation_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'conversations',
                    key: 'conversation_id',
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
            receiver_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onDelete: 'CASCADE',
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Message text content (nullable if file is provided)',
            },
            file_url: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'URL of uploaded file',
            },
            file_name: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: 'Original name of uploaded file',
            },
            file_type: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: 'MIME type of file (e.g., application/pdf, image/png)',
            },
            read_status: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            tableName: 'messages',
            timestamps: true,
            underscored: true,
            indexes: [
                {
                    fields: ['conversation_id'],
                },
                {
                    fields: ['sender_id'],
                },
                {
                    fields: ['receiver_id'],
                },
                {
                    fields: ['created_at'],
                },
            ],
        },
    );

    return MessageModel;
}
