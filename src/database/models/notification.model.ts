import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Notification } from '@/interfaces/notification.interfaces';

export type NotificationCreationAttributes = Optional<
  Notification,
  'notification_id' | 'is_read' | 'created_at' | 'updated_at'
>;

export class NotificationModel
  extends Model<Notification, NotificationCreationAttributes>
  implements Notification
{
  public notification_id!: string;
  public user_id!: string;
  public type!: 'job_application' | 'application_status' | 'job_posted' | 'system';
  public title!: string;
  public message!: string;
  public related_id?: string;
  public is_read!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export default function (sequelize: Sequelize): typeof NotificationModel {
  NotificationModel.init(
    {
      notification_id: {
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
        onDelete: 'CASCADE',
      },
      type: {
        type: DataTypes.ENUM('job_application', 'application_status', 'job_posted', 'system'),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      related_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      tableName: 'notifications',
      sequelize,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
    }
  );

  return NotificationModel;
}

