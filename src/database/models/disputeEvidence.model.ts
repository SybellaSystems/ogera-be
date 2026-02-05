import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { DisputeEvidence } from '@/interfaces/dispute.interfaces';
import { DisputeModel } from './dispute.model';
import { UserModel } from './user.model';

export type DisputeEvidenceCreationAttributes = Optional<
    DisputeEvidence,
    'evidence_id' | 'description' | 'created_at'
>;

export class DisputeEvidenceModel
    extends Model<DisputeEvidence, DisputeEvidenceCreationAttributes>
    implements DisputeEvidence
{
    public evidence_id!: string;
    public dispute_id!: string;
    public uploaded_by!: string;
    public file_url!: string;
    public file_name!: string;
    public file_type!: string;
    public file_size!: number;
    public description?: string;
    public readonly created_at!: Date;

    // Sequelize associations
    public dispute?: DisputeModel;
    public uploader?: UserModel;
}

export default function (sequelize: Sequelize): typeof DisputeEvidenceModel {
    DisputeEvidenceModel.init(
        {
            evidence_id: {
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
            uploaded_by: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onDelete: 'CASCADE',
            },
            file_url: {
                type: DataTypes.STRING(500),
                allowNull: false,
            },
            file_name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            file_type: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            file_size: {
                type: DataTypes.INTEGER,
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
        },
        {
            tableName: 'dispute_evidence',
            sequelize,
            createdAt: 'created_at',
            updatedAt: false,
            timestamps: true,
        },
    );

    return DisputeEvidenceModel;
}




