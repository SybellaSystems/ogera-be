import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { UserModel } from './user.model';

export interface UserTestAttributes {
    test_id: string;
    user_id: string;
    cognitive_test_id?: string | null;
    problem_metric_id?: string | null;
    test_name?: string | null;
    score: number;
    max_score: number;
    taken_at?: Date | null;
    readonly created_at: Date;
    readonly updated_at: Date;
}

export type UserTestCreationAttributes = Optional<
    UserTestAttributes,
    | 'test_id'
    | 'cognitive_test_id'
    | 'problem_metric_id'
    | 'test_name'
    | 'taken_at'
    | 'created_at'
    | 'updated_at'
>;

export class UserTestModel
    extends Model<UserTestAttributes, UserTestCreationAttributes>
    implements UserTestAttributes
{
    public test_id!: string;
    public user_id!: string;
    public cognitive_test_id?: string | null;
    public problem_metric_id?: string | null;
    public test_name?: string | null;
    public score!: number;
    public max_score!: number;
    public taken_at?: Date | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public user?: UserModel;
}

export default function (sequelize: Sequelize): typeof UserTestModel {
    UserTestModel.init(
        {
            test_id: {
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
            cognitive_test_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'cognitive_tests',
                    key: 'cognitive_test_id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            problem_metric_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'problem_metrics',
                    key: 'problem_metric_id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            test_name: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            score: {
                type: DataTypes.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            max_score: {
                type: DataTypes.FLOAT,
                allowNull: false,
                defaultValue: 1,
            },
            taken_at: {
                type: DataTypes.DATE,
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
            tableName: 'user_tests',
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [{ fields: ['user_id'] }],
        },
    );

    return UserTestModel;
}
