import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Course } from '@/interfaces/course.interfaces';
import { CourseStepModel } from './courseStep.model';

export type CourseCreationAttributes = Optional<
    Course,
    | 'course_id'
    | 'description'
    | 'estimated_hours'
    | 'category'
    | 'is_free'
    | 'price_amount'
    | 'price_currency'
    | 'discount_trust_score_min'
    | 'discount_percent'
    | 'created_by'
    | 'created_at'
    | 'updated_at'
>;

export class CourseModel
    extends Model<Course, CourseCreationAttributes>
    implements Course
{
    public course_id!: string;
    public course_name!: string;
    public type!: string;
    public tag!: string;
    public description?: string;
    public estimated_hours?: number | null;
    public category?: string | null;
    public is_free!: boolean;
    public price_amount?: number | null;
    public price_currency?: string | null;
    public discount_trust_score_min?: number | null;
    public discount_percent?: number | null;
    public created_by?: string | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

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
            estimated_hours: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: 'SRS: Micro-courses 2-10 hours',
            },
            category: {
                type: DataTypes.STRING(100),
                allowNull: true,
                comment:
                    'SRS: Trending topics e.g. Digital Marketing, Data Analysis',
            },
            is_free: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'SRS: Free core skills vs paid premium',
            },
            price_amount: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: true,
                comment: 'RWF 2000-10000 for paid courses',
            },
            price_currency: {
                type: DataTypes.STRING(10),
                allowNull: true,
                defaultValue: 'RWF',
            },
            discount_trust_score_min: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: 'TrustScore >= this gets discount (e.g. 500 for 50%)',
            },
            discount_percent: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: 'e.g. 50 for 50% off',
            },
            created_by: {
                type: DataTypes.UUID,
                allowNull: true,
                references: { model: 'users', key: 'user_id' },
                onDelete: 'SET NULL',
                comment: 'Student-created courses (TrustScore 700+)',
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
