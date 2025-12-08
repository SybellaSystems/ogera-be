import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { AcademicVerification, AcademicVerificationStatus, StorageType } from '@/interfaces/academicVerification.interfaces';

export type AcademicVerificationCreationAttributes = Optional<
  AcademicVerification,
  | 'id'
  | 'status'
  | 'rejection_reason'
  | 'reviewed_by'
  | 'reviewed_at'
  | 'assigned_to'
  | 'created_at'
  | 'updated_at'
>;

export class AcademicVerificationModel
  extends Model<AcademicVerification, AcademicVerificationCreationAttributes>
  implements AcademicVerification
{
  public id!: string;
  public user_id!: string;
  public document_path!: string;
  public storage_type!: StorageType;
  public status!: AcademicVerificationStatus;
  public rejection_reason?: string | null;
  public reviewed_by?: string | null;
  public reviewed_at?: Date | null;
  public assigned_to?: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export default function (sequelize: Sequelize): typeof AcademicVerificationModel {
  AcademicVerificationModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      document_path: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      storage_type: {
        type: DataTypes.ENUM('local', 's3'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reviewed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      assigned_to: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('NOW()'),
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('NOW()'),
        allowNull: false,
      },
    },
    {
      tableName: 'academic_verifications',
      sequelize,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return AcademicVerificationModel;
}

