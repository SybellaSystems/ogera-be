import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { DisputeTimeline } from '@/interfaces/dispute.interfaces';
import { DisputeModel } from './dispute.model';
import { UserModel } from './user.model';

export type DisputeTimelineCreationAttributes = Optional<
    DisputeTimeline,
    'timeline_id' | 'details' | 'created_at'
>;

export class DisputeTimelineModel
    extends Model<DisputeTimeline, DisputeTimelineCreationAttributes>
    implements DisputeTimeline
{
    public timeline_id!: string;
    public dispute_id!: string;
    public action!: string;
    public performed_by!: string;
    public performed_by_type!: 'student' | 'employer' | 'moderator' | 'system';
    public details?: string;
    public readonly created_at!: Date;

    // Sequelize associations
    public dispute?: DisputeModel;
    public performer?: UserModel;
}

export default function (sequelize: Sequelize): typeof DisputeTimelineModel {
    DisputeTimelineModel.init(
        {
            timeline_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            dispute_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'disputes',
                    key: 'dispute_id',
                },
                onDelete: 'CASCADE',
            },
            action: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            performed_by: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onDelete: 'CASCADE',
            },
            performed_by_type: {
                type: DataTypes.ENUM('student', 'employer', 'moderator', 'system'),
                allowNull: false,
            },
            details: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.literal('NOW()'),
            },
        },
        {
            tableName: 'dispute_timeline',
            sequelize,
            createdAt: 'created_at',
            updatedAt: false,
            timestamps: true,
        },
    );

    return DisputeTimelineModel;
}






