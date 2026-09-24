import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export type ProblemPuzzleDifficulty = 'easy' | 'medium' | 'hard';

export interface ProblemPuzzleQuestionAttributes {
    question_id: string;
    problem_metric_id: string;
    prompt: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_index: number;
    difficulty: ProblemPuzzleDifficulty;
    sort_order: number;
    readonly created_at: Date;
    readonly updated_at: Date;
}

export type ProblemPuzzleQuestionCreationAttributes = Optional<
    ProblemPuzzleQuestionAttributes,
    'question_id' | 'sort_order' | 'created_at' | 'updated_at'
>;

export class ProblemPuzzleQuestionModel
    extends Model<
        ProblemPuzzleQuestionAttributes,
        ProblemPuzzleQuestionCreationAttributes
    >
    implements ProblemPuzzleQuestionAttributes
{
    public question_id!: string;
    public problem_metric_id!: string;
    public prompt!: string;
    public option_a!: string;
    public option_b!: string;
    public option_c!: string;
    public option_d!: string;
    public correct_index!: number;
    public difficulty!: ProblemPuzzleDifficulty;
    public sort_order!: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

export default function (
    sequelize: Sequelize,
): typeof ProblemPuzzleQuestionModel {
    ProblemPuzzleQuestionModel.init(
        {
            question_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            problem_metric_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'problem_metrics',
                    key: 'problem_metric_id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            prompt: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            option_a: { type: DataTypes.TEXT, allowNull: false },
            option_b: { type: DataTypes.TEXT, allowNull: false },
            option_c: { type: DataTypes.TEXT, allowNull: false },
            option_d: { type: DataTypes.TEXT, allowNull: false },
            correct_index: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: { min: 0, max: 3 },
            },
            difficulty: {
                type: DataTypes.ENUM('easy', 'medium', 'hard'),
                allowNull: false,
                defaultValue: 'medium',
            },
            sort_order: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
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
            tableName: 'problem_metric_questions',
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [{ fields: ['problem_metric_id'] }],
        },
    );

    return ProblemPuzzleQuestionModel;
}
