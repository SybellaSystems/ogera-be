import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import {
  PeerReview,
  ReviewStatus,
} from '@/interfaces/communityWorkspace.interfaces';

export type PeerReviewCreationAttributes = Optional<
  PeerReview,
  | 'id'
  | 'status'
  | 'created_at'
  | 'updated_at'
>;

export class PeerReviewModel
  extends Model<PeerReview, PeerReviewCreationAttributes>
  implements PeerReview
{
  public id!: string;

  public link_id!: string;

  public reviewer_id!: string;

  public rating!: number;

  public review!: string;

  public status!: ReviewStatus;

  public readonly created_at!: Date;

  public readonly updated_at!: Date;
}

export default function (
  sequelize: Sequelize,
): typeof PeerReviewModel {
  PeerReviewModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      link_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'student_links',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      reviewer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
          min: 1,
          max: 5,
        },
      },

      review: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM(
          'published',
          'hidden',
        ),
        allowNull: false,
        defaultValue: 'published',
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
      sequelize,

      tableName: 'peer_reviews',

      timestamps: true,

      createdAt: 'created_at',

      updatedAt: 'updated_at',
    },
  );

  return PeerReviewModel;
}