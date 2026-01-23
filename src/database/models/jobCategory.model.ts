import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { JobCategory } from '@/interfaces/jobCategory.interfaces';

export type JobCategoryCreationAttributes = Optional<
    JobCategory,
    'category_id' | 'description' | 'icon' | 'color' | 'job_count' | 'created_at' | 'updated_at'
>;

export class JobCategoryModel extends Model<JobCategory, JobCategoryCreationAttributes> implements JobCategory {
    public category_id!: string;
    public name!: string;
    public description?: string;
    public icon?: string;
    public color?: string;
    public job_count?: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

export default function (sequelize: Sequelize): typeof JobCategoryModel {
    JobCategoryModel.init(
        {
            category_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            icon: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            color: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            job_count: {
                type: DataTypes.INTEGER,
                allowNull: true,
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
            tableName: 'job_categories',
            sequelize,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            timestamps: true,
        },
    );

    return JobCategoryModel;
}

