import { Sequelize, DataTypes, Model, Optional } from "sequelize";
import { Job } from "@/interfaces/job.interfaces";

// Optional fields during creation
export type JobCreationAttributes = Optional<
  Job,
  "job_id" | "applications" | "status" | "created_at" | "updated_at"
>;

export class JobModel extends Model<Job, JobCreationAttributes> {
  public job_id!: string;
  public employer_id!: string;
  public job_title!: string;
  public applications!: number;
  public category!: string;
  public budget!: number;
  public duration!: string;
  public location!: string;
  public status!: "Pending" | "Active" | "Completed";
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // --- Static methods ---

  static initialize(sequelize: Sequelize) {
    JobModel.init(
      {
        job_id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        employer_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "users", // points to UserModel
            key: "user_id",
          },
          onDelete: "CASCADE",
        },
        job_title: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        applications: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        category: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        budget: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        duration: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        location: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM("Pending", "Active", "Completed"),
          allowNull: false,
          defaultValue: "Pending",
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
        tableName: "jobs",
        sequelize,
        createdAt: "created_at",
        updatedAt: "updated_at",
        timestamps: true,
      }
    );
  }

  static associate(models: any) {
    // Job belongs to an Employer (User with role=Employer)
    JobModel.belongsTo(models.User, {
      foreignKey: "employer_id",
      as: "employer",
    });
  }
}
