import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Job } from '@/interfaces/job.interfaces';
import { JobQuestionModel } from './jobQuestion.model';

export type JobCreationAttributes = Optional<
    Job,
    | 'job_id'
    | 'applications'
    | 'status'
    | 'description'
    | 'requirements'
    | 'skills'
    | 'employment_type'
    | 'experience_level'
    | 'created_at'
    | 'updated_at'
>;

export class JobModel extends Model<Job, JobCreationAttributes> implements Job {
    public job_id!: string;
    public employer_id!: string;
    public job_title!: string;
    public applications!: number;
    public category!: string;
    public budget!: number;
    public duration!: string;
    public location!: string;
    public description?: string;
    public requirements?: string;
    public skills?: string;
    public employment_type?: string;
    public experience_level?: string;
    public status!: 'Pending' | 'Active' | 'Inactive' | 'Completed';
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Sequelize associations
    public questions?: JobQuestionModel[];
}

export default function (sequelize: Sequelize): typeof JobModel {
    JobModel.init(
        {
            job_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            employer_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onDelete: 'CASCADE',
            },
            job_title: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            applications: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            category: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            budget: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            duration: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            location: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            requirements: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            skills: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            employment_type: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            experience_level: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM('Pending', 'Active', 'Inactive', 'Completed'),
                allowNull: false,
                defaultValue: 'Active',
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
            tableName: 'jobs',
            sequelize,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            timestamps: true,
        },
    );

    return JobModel;
}
