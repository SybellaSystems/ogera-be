import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Dispute, DisputeType, DisputeStatus, DisputePriority, DisputeResolution } from '@/interfaces/dispute.interfaces';
import { JobModel } from './job.model';
import { UserModel } from './user.model';

export type DisputeCreationAttributes = Optional<
    Dispute,
    | 'dispute_id'
    | 'job_application_id'
    | 'moderator_id'
    | 'escalated_to'
    | 'resolution'
    | 'resolution_notes'
    | 'escrow_amount'
    | 'refund_amount'
    | 'fee_penalty'
    | 'auto_escalated_at'
    | 'last_response_at'
    | 'resolved_at'
    | 'created_at'
    | 'updated_at'
>;

export class DisputeModel
    extends Model<Dispute, DisputeCreationAttributes>
    implements Dispute
{
    public dispute_id!: string;
    public job_id!: string;
    public job_application_id?: string;
    public student_id!: string;
    public employer_id!: string;
    public type!: DisputeType;
    public status!: DisputeStatus;
    public priority!: DisputePriority;
    public title!: string;
    public description!: string;
    public reported_by!: 'student' | 'employer';
    public moderator_id?: string | null;
    public escalated_to?: string | null;
    public resolution?: DisputeResolution;
    public resolution_notes?: string;
    public escrow_amount?: number;
    public refund_amount?: number;
    public fee_penalty?: number;
    public auto_escalated_at?: Date | null;
    public last_response_at?: Date | null;
    public resolved_at?: Date | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Sequelize associations
    public job?: JobModel;
    public student?: UserModel;
    public employer?: UserModel;
    public moderator?: UserModel;
    public escalatedAdmin?: UserModel;
}

export default function (sequelize: Sequelize): typeof DisputeModel {
    DisputeModel.init(
        {
            dispute_id: {
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
            job_application_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'job_applications',
                    key: 'application_id',
                },
                onDelete: 'SET NULL',
            },
            student_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onDelete: 'CASCADE',
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
            type: {
                type: DataTypes.ENUM('Payment', 'Contract Violation', 'Quality Issue', 'Timeline'),
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('Open', 'Under Review', 'Mediation', 'Resolved', 'Closed'),
                allowNull: false,
                defaultValue: 'Open',
            },
            priority: {
                type: DataTypes.ENUM('High', 'Medium', 'Low'),
                allowNull: false,
                defaultValue: 'Medium',
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            reported_by: {
                type: DataTypes.ENUM('student', 'employer'),
                allowNull: false,
            },
            moderator_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onDelete: 'SET NULL',
            },
            escalated_to: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onDelete: 'SET NULL',
            },
            resolution: {
                type: DataTypes.ENUM('Refunded', 'Settled', 'Dismissed', 'Escalated'),
                allowNull: true,
            },
            resolution_notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            escrow_amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            refund_amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            fee_penalty: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0,
            },
            auto_escalated_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            last_response_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            resolved_at: {
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
            tableName: 'disputes',
            sequelize,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            timestamps: true,
        },
    );

    return DisputeModel;
}






