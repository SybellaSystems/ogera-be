import { Sequelize, DataTypes, Model, Optional } from "sequelize";
import { JobApplication } from "@/interfaces/jobApplication.interfaces";
import { JobModel } from "./job.model";
import { UserModel } from "./user.model";

export type JobApplicationCreationAttributes = Optional<
  JobApplication,
  "application_id" | "status" | "reviewed_at" | "reviewed_by" | "created_at" | "updated_at"
>;

export class JobApplicationModel
  extends Model<JobApplication, JobApplicationCreationAttributes>
  implements JobApplication
{
  public application_id!: string;
  public job_id!: string;
  public student_id!: string;
  public status!: "Pending" | "Accepted" | "Rejected";
  public cover_letter?: string;
  public resume_url?: string;
  public applied_at!: Date;
  public completed_at?: Date;
  public reviewed_at?: Date;
  public reviewed_by?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Sequelize associations
  public job?: JobModel;
  public student?: UserModel;
  public reviewer?: UserModel;
}

export default function (sequelize: Sequelize): typeof JobApplicationModel {
  JobApplicationModel.init(
    {
      application_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      job_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "jobs",
          key: "job_id",
        },
        onDelete: "CASCADE",
      },
      student_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
        onDelete: "CASCADE",
      },
      status: {
        type: DataTypes.ENUM("Pending", "Accepted", "Rejected"),
        allowNull: false,
        defaultValue: "Pending",
      },
      cover_letter: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      resume_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      applied_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal("NOW()"),
        allowNull: false,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      reviewed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
        onDelete: "SET NULL",
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
      tableName: "job_applications",
      sequelize,
      createdAt: "created_at",
      updatedAt: "updated_at",
      timestamps: true,
    }
  );

  return JobApplicationModel;
}

