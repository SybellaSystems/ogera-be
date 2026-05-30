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
  public type!: 'job_application' | 'application_status' | 'job_posted' | 'system' | 'new_message';
  public title!: string;
  public message!: string;
  public related_id?: string;
  public action_url?: string;
  public entity_type?: string;
  public entity_id?: string;
  public metadata?: Record<string, any> | null;
  public is_read!: boolean;
  public read_at?: Date | null;
  public email_sent_at?: Date | null;
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
        type: DataTypes.ENUM('job_application', 'application_status', 'job_posted', 'system', 'new_message'),
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
      action_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      entity_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      entity_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      email_sent_at: {
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
      tableName: 'notifications',
      sequelize,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
      indexes: [
        {
          fields: ['user_id', 'is_read', 'created_at'],
        },
        {
          fields: ['type', 'related_id', 'created_at'],
        },
      ],
    }
  );

  return NotificationModel;
}

