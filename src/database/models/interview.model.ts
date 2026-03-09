import { Sequelize, DataTypes, Model } from 'sequelize';

export class InterviewModel extends Model {
  public id!: string;
  public student_id!: string;
  public employer_id?: string;
  public job_id?: string;
  public scheduled_at!: Date;
  public status!: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  public notes?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export default function (sequelize: Sequelize): typeof InterviewModel {
  InterviewModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      student_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      employer_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      job_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      scheduled_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending','scheduled','completed','cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('NOW()'),
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('NOW()'),
      },
    },
    {
      tableName: 'interviews',
      sequelize,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return InterviewModel;
}
