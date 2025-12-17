import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { JobQuestion } from '@/interfaces/jobQuestion.interfaces';
import { JobModel } from './job.model';

export type JobQuestionCreationAttributes = Optional<
    JobQuestion,
    'question_id' | 'created_at' | 'updated_at'
>;

export class JobQuestionModel extends Model<JobQuestion, JobQuestionCreationAttributes> implements JobQuestion {
    public question_id!: string;
    public job_id!: string;
    public question_text!: string;
    public question_type!: 'text' | 'number' | 'yes_no' | 'multiple_choice';
    public is_required!: boolean;
    public options?: string;
    public display_order!: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Sequelize associations
    public job?: JobModel;
}

export default function (sequelize: Sequelize): typeof JobQuestionModel {
    JobQuestionModel.init(
        {
            question_id: {
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
            question_text: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            question_type: {
                type: DataTypes.ENUM('text', 'number', 'yes_no', 'multiple_choice'),
                allowNull: false,
                defaultValue: 'text',
            },
            is_required: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            options: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'JSON string for multiple choice options',
            },
            display_order: {
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
            tableName: 'job_questions',
            sequelize,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            timestamps: true,
        },
    );

    return JobQuestionModel;
}

