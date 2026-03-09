import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import {
    CourseEnrollment as ICourseEnrollment,
    CertificateStatus,
} from '@/interfaces/course.interfaces';

export type CourseEnrollmentCreationAttributes = Optional<
    ICourseEnrollment,
    | 'enrollment_id'
    | 'enrolled_at'
    | 'completed_at'
    | 'amount_due'
    | 'amount_paid'
    | 'funded'
    | 'created_at'
    | 'updated_at'
>;

const CERTIFICATE_STATUSES: CertificateStatus[] = [
    'none',
    'pending_payment',
    'pending_review',
    'approved',
];

export class CourseEnrollmentModel
    extends Model<ICourseEnrollment, CourseEnrollmentCreationAttributes>
    implements ICourseEnrollment
{
    public enrollment_id!: string;
    public user_id!: string;
    public course_id!: string;
    public enrolled_at!: Date;
    public completed_at!: Date | null;
    public certificate_status!: CertificateStatus;
    public amount_due!: number | null;
    public amount_paid!: number | null;
    public funded!: boolean | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

export default function (sequelize: Sequelize): typeof CourseEnrollmentModel {
    CourseEnrollmentModel.init(
        {
            enrollment_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: { model: 'users', key: 'user_id' },
                onDelete: 'CASCADE',
            },
            course_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: { model: 'courses', key: 'course_id' },
                onDelete: 'CASCADE',
            },
            enrolled_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('NOW()'),
            },
            completed_at: {
                type: DataTypes.DATE,
                allowNull: true,
                comment:
                    'SRS: When student marks complete → admin reviews → certificate',
            },
            certificate_status: {
                type: DataTypes.ENUM(...CERTIFICATE_STATUSES),
                allowNull: false,
                defaultValue: 'none',
            },
            amount_due: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: true,
                comment:
                    'For paid course; deducted from balance when job completed',
            },
            amount_paid: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: true,
                defaultValue: 0,
            },
            funded: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                comment:
                    'Admin sets when balance covers amount_due → can issue certificate',
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
            tableName: 'course_enrollments',
            sequelize,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            timestamps: true,
            indexes: [
                { unique: true, fields: ['user_id', 'course_id'] },
                { fields: ['course_id'] },
                { fields: ['certificate_status'] },
            ],
        },
    );

    return CourseEnrollmentModel;
}
