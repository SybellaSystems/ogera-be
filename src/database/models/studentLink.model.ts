import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import {
  StudentLink,
  LinkStatus,
  LinkType,
} from '@/interfaces/communityWorkspace.interfaces';

export type StudentLinkCreationAttributes = Optional<
  StudentLink,
  | 'id'
  | 'visibility'
  | 'status'
  | 'created_at'
  | 'updated_at'
>;

export class StudentLinkModel
  extends Model<StudentLink, StudentLinkCreationAttributes>
  implements StudentLink
{
  public id!: string;

  public user_id!: string;

  public link_type!: LinkType;

  public url!: string;

  public visibility!: boolean;

  public status!: LinkStatus;

  public readonly created_at!: Date;

  public readonly updated_at!: Date;
}

export default function (
  sequelize: Sequelize,
): typeof StudentLinkModel {
  StudentLinkModel.init(
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

      link_type: {
        type: DataTypes.ENUM(
          'github',
          'linkedin',
          'portfolio',
          'other',
        ),
        allowNull: false,
      },

      url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      visibility: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      status: {
        type: DataTypes.ENUM(
          'active',
          'inactive',
        ),
        allowNull: false,
        defaultValue: 'active',
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    },
    {
      tableName: 'student_links',

      sequelize,

      timestamps: true,

      createdAt: 'created_at',

      updatedAt: 'updated_at',
    },
  );

  return StudentLinkModel;
}