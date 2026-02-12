import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export interface CourseProgress {
    progress_id: string;
    user_id: string;
    course_id: string;
    step_id: string;
    completed: boolean;
    completed_at?: Date;
    readonly created_at: Date;
    readonly updated_at: Date;
}

export type CourseProgressCreationAttributes = Optional<
    CourseProgress,
    'progress_id' | 'completed_at' | 'created_at' | 'updated_at'
>;

export class CourseProgressModel extends Model<CourseProgress, CourseProgressCreationAttributes> implements CourseProgress {
    public progress_id!: string;
    public user_id!: string;
    public course_id!: string;
    public step_id!: string;
    public completed!: boolean;
    public completed_at?: Date;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

export default function (sequelize: Sequelize): typeof CourseProgressModel {
    CourseProgressModel.init(
        {
            progress_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onDelete: 'CASCADE',
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
            step_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'course_steps',
                    key: 'step_id',
                },
                onDelete: 'CASCADE',
            },
            completed: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            completed_at: {
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
            tableName: 'course_progress',
            sequelize,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ['user_id', 'course_id', 'step_id'],
                    name: 'unique_user_course_step',
                },
                {
                    fields: ['user_id', 'course_id'],
                },
            ],
        },
    );

    return CourseProgressModel;
}
