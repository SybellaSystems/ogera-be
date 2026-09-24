import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface CognitiveQuestionAttributes {
    question_id: string;
    cognitive_test_id: string;
    prompt: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    /** 0 = A, 1 = B, 2 = C, 3 = D */
    correct_index: number;
    difficulty: QuestionDifficulty;
    sort_order: number;
    readonly created_at: Date;
    readonly updated_at: Date;
}

export type CognitiveQuestionCreationAttributes = Optional<
    CognitiveQuestionAttributes,
    'question_id' | 'sort_order' | 'created_at' | 'updated_at'
>;

export class CognitiveQuestionModel
    extends Model<
        CognitiveQuestionAttributes,
        CognitiveQuestionCreationAttributes
    >
    implements CognitiveQuestionAttributes
{
    public question_id!: string;
    public cognitive_test_id!: string;
    public prompt!: string;
    public option_a!: string;
    public option_b!: string;
    public option_c!: string;
    public option_d!: string;
    public correct_index!: number;
    public difficulty!: QuestionDifficulty;
    public sort_order!: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

export default function (sequelize: Sequelize): typeof CognitiveQuestionModel {
    CognitiveQuestionModel.init(
        {
            question_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            cognitive_test_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'cognitive_tests',
                    key: 'cognitive_test_id',
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
            tableName: 'cognitive_questions',
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [{ fields: ['cognitive_test_id'] }],
        },
    );

    return CognitiveQuestionModel;
}
