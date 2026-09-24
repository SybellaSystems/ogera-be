import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { UserModel } from './user.model';

export interface TrustscoreHistoryAttributes {
    history_id: string;
    user_id: string;
    intelligence_score: number | null;
    experience_score: number | null;
    interaction_score: number | null;
    trust_score: number | null;
    trust_level: string | null;
    computed_at: Date;
    readonly created_at: Date;
    readonly updated_at: Date;
}

export type TrustscoreHistoryCreationAttributes = Optional<
    TrustscoreHistoryAttributes,
    'history_id' | 'created_at' | 'updated_at'
>;

export class TrustscoreHistoryModel
    extends Model<
        TrustscoreHistoryAttributes,
        TrustscoreHistoryCreationAttributes
    >
    implements TrustscoreHistoryAttributes
{
    public history_id!: string;
    public user_id!: string;
    public intelligence_score!: number | null;
    public experience_score!: number | null;
    public interaction_score!: number | null;
    public trust_score!: number | null;
    public trust_level!: string | null;
    public computed_at!: Date;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public user?: UserModel;
}

export default function (sequelize: Sequelize): typeof TrustscoreHistoryModel {
    TrustscoreHistoryModel.init(
        {
            history_id: {
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
            intelligence_score: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            experience_score: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            interaction_score: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            trust_score: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            trust_level: {
                type: DataTypes.STRING(32),
                allowNull: true,
            },
            computed_at: {
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
        },
        {
            tableName: 'trustscore_history',
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [{ fields: ['user_id'] }, { fields: ['computed_at'] }],
        },
    );

    return TrustscoreHistoryModel;
}
