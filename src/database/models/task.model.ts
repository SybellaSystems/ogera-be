import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Task, TaskStatus } from '@/interfaces/task.interfaces';
import { JobModel } from './job.model';
import { UserModel } from './user.model';

export type TaskCreationAttributes = Optional<
    Task,
    | 'task_id'
    | 'status'
    | 'description'
    | 'deadline'
    | 'payment_amount'
    | 'created_at'
    | 'updated_at'
>;

export class TaskModel
    extends Model<Task, TaskCreationAttributes>
    implements Task
{
    public task_id!: string;
    public job_id!: string;
    public assigned_student_id!: string;
    public title!: string;
    public description?: string;
    public status!: TaskStatus;
    public deadline?: Date | null;
    public payment_amount?: number | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    public job?: JobModel;
    public assignedStudent?: UserModel;
}

export default function (sequelize: Sequelize): typeof TaskModel {
    TaskModel.init(
        {
            task_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            job_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'jobs',
                    key: 'job_id',
                },
                onDelete: 'CASCADE',
            },
            assigned_student_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onDelete: 'CASCADE',
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM(
                    'NOT_STARTED',
                    'IN_PROGRESS',
                    'SUBMITTED',
                    'UNDER_REVIEW',
                    'COMPLETED',
                    'REJECTED',
                    'DISPUTED',
                ),
                allowNull: false,
                defaultValue: 'NOT_STARTED',
            },
            deadline: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            payment_amount: {
                type: DataTypes.DECIMAL(12, 2),
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
            tableName: 'tasks',
            sequelize,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            timestamps: true,
        },
    );

    return TaskModel;
}
