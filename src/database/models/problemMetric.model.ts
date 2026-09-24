import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export type ProblemMetricCategory =
    | 'visual_puzzle'
    | 'situational_puzzle'
    | 'riddle'
    | 'other';

export interface ProblemMetricAttributes {
    problem_metric_id: string;
    title: string;
    description?: string | null;
    category: ProblemMetricCategory;
    published: boolean;
    created_by?: string | null;
    readonly created_at: Date;
    readonly updated_at: Date;
}

export type ProblemMetricCreationAttributes = Optional<
    ProblemMetricAttributes,
    | 'problem_metric_id'
    | 'description'
    | 'published'
    | 'created_by'
    | 'created_at'
    | 'updated_at'
>;

export class ProblemMetricModel
    extends Model<ProblemMetricAttributes, ProblemMetricCreationAttributes>
    implements ProblemMetricAttributes
{
    public problem_metric_id!: string;
    public title!: string;
    public description?: string | null;
    public category!: ProblemMetricCategory;
    public published!: boolean;
    public created_by?: string | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

export default function (sequelize: Sequelize): typeof ProblemMetricModel {
    ProblemMetricModel.init(
        {
            problem_metric_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            category: {
                type: DataTypes.ENUM(
                    'visual_puzzle',
                    'situational_puzzle',
                    'riddle',
                    'other',
                ),
                allowNull: false,
                defaultValue: 'visual_puzzle',
            },
            published: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            created_by: {
                type: DataTypes.UUID,
                allowNull: true,
                references: { model: 'users', key: 'user_id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
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
            tableName: 'problem_metrics',
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [{ fields: ['published'] }, { fields: ['created_by'] }],
        },
    );

    return ProblemMetricModel;
}
