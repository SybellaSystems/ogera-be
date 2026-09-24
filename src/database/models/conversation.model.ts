import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { JobModel } from './job.model';
import { UserModel } from './user.model';

export interface Conversation {
    conversation_id: string;
    job_id: string;
    employer_id: string;
    student_id: string;
    created_at: Date;
    updated_at: Date;
    last_message_at?: Date;
}

export type ConversationCreationAttributes = Optional<
    Conversation,
    'conversation_id' | 'created_at' | 'updated_at' | 'last_message_at'
>;

export class ConversationModel
    extends Model<Conversation, ConversationCreationAttributes>
    implements Conversation
{
    public conversation_id!: string;
    public job_id!: string;
    public employer_id!: string;
    public student_id!: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public last_message_at?: Date;

    // Sequelize associations
    public job?: JobModel;
    public employer?: UserModel;
    public student?: UserModel;
}

export default function (sequelize: Sequelize): typeof ConversationModel {
    ConversationModel.init(
        {
            conversation_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            job_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'jobs',
                    key: 'job_id',
                },
                onDelete: 'CASCADE',
            },
            employer_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onDelete: 'CASCADE',
            },
            student_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onDelete: 'CASCADE',
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
            last_message_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: 'conversations',
            timestamps: true,
            underscored: true,
            indexes: [
                {
                    fields: ['employer_id'],
                },
                {
                    fields: ['student_id'],
                },
                {
                    fields: ['job_id'],
                },
                {
                    fields: ['employer_id', 'student_id', 'job_id'],
                    unique: true,
                },
            ],
        },
    );

    return ConversationModel;
}
