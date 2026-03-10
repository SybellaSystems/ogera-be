import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Course } from '@/interfaces/course.interfaces';
import { CourseStepModel } from './courseStep.model';

export type CourseCreationAttributes = Optional<
    Course,
    | 'course_id'
    | 'description'
    | 'created_at'
    | 'updated_at'
>;

export class CourseModel extends Model<Course, CourseCreationAttributes> implements Course {
    public course_id!: string;
    public course_name!: string;
    public type!: string;
    public tag!: string;
    public description?: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Sequelize associations
    public steps?: CourseStepModel[];
}

export default function (sequelize: Sequelize): typeof CourseModel {
    CourseModel.init(
        {
            course_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            course_name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            type: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            tag: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            description: {
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
            tableName: 'courses',
            sequelize,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            timestamps: true,
        },
    );

    return CourseModel;
}


