import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { JobApplicationAnswer } from '@/interfaces/jobApplicationAnswer.interfaces';
import { JobApplicationModel } from './jobApplication.model';
import { JobQuestionModel } from './jobQuestion.model';

export type JobApplicationAnswerCreationAttributes = Optional<
    JobApplicationAnswer,
    'answer_id' | 'created_at' | 'updated_at'
>;

export class JobApplicationAnswerModel extends Model<JobApplicationAnswer, JobApplicationAnswerCreationAttributes> implements JobApplicationAnswer {
    public answer_id!: string;
    public application_id!: string;
    public question_id!: string;
    public answer_text!: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Sequelize associations
    public application?: JobApplicationModel;
    public question?: JobQuestionModel;
}

export default function (sequelize: Sequelize): typeof JobApplicationAnswerModel {
    JobApplicationAnswerModel.init(
        {
            answer_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            application_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'job_applications',
                    key: 'application_id',
                },
                onDelete: 'CASCADE',
            },
            question_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'job_questions',
                    key: 'question_id',
                },
                onDelete: 'CASCADE',
            },
            answer_text: {
                type: DataTypes.TEXT,
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
            tableName: 'job_application_answers',
            sequelize,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            timestamps: true,
        },
    );

    return JobApplicationAnswerModel;
}

