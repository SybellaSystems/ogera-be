import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { CourseChatMessage as ICourseChatMessage } from '@/interfaces/course.interfaces';

export type CourseChatMessageCreationAttributes = Optional<
    ICourseChatMessage,
    'message_id' | 'created_at'
>;

export class CourseChatMessageModel
    extends Model<ICourseChatMessage, CourseChatMessageCreationAttributes>
    implements ICourseChatMessage
{
    public message_id!: string;
    public course_id!: string;
    public user_id!: string;
    public role!: string;
    public content!: string;
    public conversation_user_id!: string | null;
    public readonly created_at!: Date;
}

export default function (sequelize: Sequelize): typeof CourseChatMessageModel {
    CourseChatMessageModel.init(
        {
            message_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            course_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: { model: 'courses', key: 'course_id' },
                onDelete: 'CASCADE',
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: { model: 'users', key: 'user_id' },
                onDelete: 'CASCADE',
            },
            role: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            conversation_user_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: { model: 'users', key: 'user_id' },
                onDelete: 'SET NULL',
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.literal('NOW()'),
            },
        },
        {
            tableName: 'course_chat_messages',
            sequelize,
            createdAt: 'created_at',
            updatedAt: false,
            timestamps: true,
            indexes: [
                { fields: ['course_id', 'created_at'] },
                { fields: ['course_id', 'conversation_user_id', 'created_at'] },
            ],
        },
    );

    return CourseChatMessageModel;
}
