import { Sequelize, DataTypes, Model, Optional } from "sequelize";
import { JobReaction } from "@/interfaces/jobReaction.interfaces";

export type JobReactionCreationAttributes = Optional<
    JobReaction,
    "reaction_id" | "created_at" | "updated_at"
>;

export class JobReactionModel
    extends Model<JobReaction, JobReactionCreationAttributes>
    implements JobReaction
{
    public reaction_id!: string;

    public job_id!: string;

    public user_id!: string;

    public reaction_type!: "like" | "dislike";

    public readonly created_at!: Date;

    public readonly updated_at!: Date;
}

export default function (sequelize: Sequelize): typeof JobReactionModel {
    JobReactionModel.init(
        {
            reaction_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },

            job_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },

            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },

            reaction_type: {
                type: DataTypes.ENUM("like", "dislike"),
                allowNull: false,
            },

            created_at: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.literal("NOW()"),
            },

            updated_at: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.literal("NOW()"),
            },
        },
        {
            tableName: "job_reactions",
            sequelize,
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    return JobReactionModel;
}