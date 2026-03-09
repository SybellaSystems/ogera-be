import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { CourseStep, CourseStepType } from '@/interfaces/course.interfaces';

export type CourseStepCreationAttributes = Optional<
    CourseStep,
    'step_id' | 'step_title' | 'created_at' | 'updated_at'
>;

export class CourseStepModel
    extends Model<CourseStep, CourseStepCreationAttributes>
    implements CourseStep
{
    public step_id!: string;
    public course_id!: string;
    public step_type!: CourseStepType;
    public step_content!: string;
    public step_title?: string;
    public step_order!: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

const STEP_TYPES: CourseStepType[] = [
    'video',
    'link',
    'pdf',
    'image',
    'text',
    'quiz',
];

export default function (sequelize: Sequelize): typeof CourseStepModel {
    CourseStepModel.init(
        {
            step_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            course_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'courses',
                    key: 'course_id',
                },
                onDelete: 'CASCADE',
            },
            step_type: {
                type: DataTypes.ENUM(...STEP_TYPES),
                allowNull: false,
            },
            step_content: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            step_title: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            step_order: {
                type: DataTypes.INTEGER,
                allowNull: false,
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
            tableName: 'course_steps',
            sequelize,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            timestamps: true,
        },
    );

    return CourseStepModel;
}
