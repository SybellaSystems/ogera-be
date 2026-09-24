import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export type CognitiveTestCategory =
    | 'numerical'
    | 'verbal'
    | 'logical'
    | 'mixed';

export interface CognitiveTestAttributes {
    cognitive_test_id: string;
    title: string;
    description?: string | null;
    category: CognitiveTestCategory;
    published: boolean;
    created_by?: string | null;
    readonly created_at: Date;
    readonly updated_at: Date;
}

export type CognitiveTestCreationAttributes = Optional<
    CognitiveTestAttributes,
    | 'cognitive_test_id'
    | 'description'
    | 'published'
    | 'created_by'
    | 'created_at'
    | 'updated_at'
>;

export class CognitiveTestModel
    extends Model<CognitiveTestAttributes, CognitiveTestCreationAttributes>
    implements CognitiveTestAttributes
{
    public cognitive_test_id!: string;
    public title!: string;
    public description?: string | null;
    public category!: CognitiveTestCategory;
    public published!: boolean;
    public created_by?: string | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

export default function (sequelize: Sequelize): typeof CognitiveTestModel {
    CognitiveTestModel.init(
        {
            cognitive_test_id: {
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
                type: DataTypes.ENUM('numerical', 'verbal', 'logical', 'mixed'),
                allowNull: false,
                defaultValue: 'numerical',
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
            tableName: 'cognitive_tests',
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [{ fields: ['published'] }, { fields: ['created_by'] }],
        },
    );

    return CognitiveTestModel;
}
