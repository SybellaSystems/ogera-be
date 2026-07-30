import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { PeerReviewReply } from '@/interfaces/communityWorkspace.interfaces';

export type PeerReviewReplyCreationAttributes = Optional<
  PeerReviewReply,
  'id' | 'created_at' | 'updated_at'
>;

export class PeerReviewReplyModel
  extends Model<
    PeerReviewReply,
    PeerReviewReplyCreationAttributes
  >
  implements PeerReviewReply
{
  public id!: string;

  public review_id!: string;

  public user_id!: string;

  public reply!: string;

  public readonly created_at!: Date;

  public readonly updated_at!: Date;
}

export default function (
  sequelize: Sequelize,
): typeof PeerReviewReplyModel {
  PeerReviewReplyModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      review_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'peer_reviews',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

      reply: {
        type: DataTypes.TEXT,
        allowNull: false,
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

      tableName: 'peer_review_replies',

      timestamps: true,

      createdAt: 'created_at',

      updatedAt: 'updated_at',
    },
  );

  return PeerReviewReplyModel;
}