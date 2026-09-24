import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { UserModel } from './user.model';

export interface UserFeedbackAttributes {
    feedback_id: string;
    user_id: string;
    rater_user_id?: string | null;
    rating: number;
    comment?: string | null;
    readonly created_at: Date;
    readonly updated_at: Date;
}

export type UserFeedbackCreationAttributes = Optional<
    UserFeedbackAttributes,
    'feedback_id' | 'rater_user_id' | 'comment' | 'created_at' | 'updated_at'
>;

export class UserFeedbackModel
    extends Model<UserFeedbackAttributes, UserFeedbackCreationAttributes>
    implements UserFeedbackAttributes
{
    public feedback_id!: string;
    public user_id!: string;
    public rater_user_id?: string | null;
    public rating!: number;
    public comment?: string | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public ratedUser?: UserModel;
    public rater?: UserModel;
}

export default function (sequelize: Sequelize): typeof UserFeedbackModel {
    UserFeedbackModel.init(
        {
            feedback_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: { model: 'users', key: 'user_id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            rater_user_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: { model: 'users', key: 'user_id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            rating: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            comment: {
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
            tableName: 'user_feedback',
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [{ fields: ['user_id'] }],
        },
    );

    return UserFeedbackModel;
}
