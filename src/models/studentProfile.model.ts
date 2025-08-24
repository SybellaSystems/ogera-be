import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export interface StudentProfile {
  student_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  national_id: string;
  identity_status: "Pending" | "Verified" | "Rejected";
  academic_status: "Pending" | "Verified" | "Rejected";
  trust_score: number;
  impact_score: number;
  locked_out_until: Date;
}

export type StudentProfileCreationAttributes = Optional<
  StudentProfile,
  "student_id" | "identity_status" | "academic_status" | "trust_score" | "impact_score" | "locked_out_until"
>;

export class StudentProfileModel extends Model<StudentProfile, StudentProfileCreationAttributes> {
  static initialize(sequelize: Sequelize) {
    StudentProfileModel.init(
      {
        student_id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "users",
            key: "user_id"
          }
        },
        first_name: {
          type: DataTypes.STRING(20),
          allowNull: false
        },
        last_name: {
          type: DataTypes.STRING(20),
          allowNull: false
        },
        national_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        identity_status: {
          type: DataTypes.ENUM("Pending", "Verified", "Rejected"),
          defaultValue: "Pending",
          allowNull: false
        },
        academic_status: {
          type: DataTypes.ENUM("Pending", "Verified", "Rejected"),
          defaultValue: "Pending",
          allowNull: false
        },
        trust_score: {
          type: DataTypes.FLOAT,
          allowNull: false,
          defaultValue: 0.0
        },
        impact_score: {
          type: DataTypes.FLOAT,
          allowNull: false,
          defaultValue: 0.0
        },
        locked_out_until: {
          type: DataTypes.DATE,
          defaultValue: Sequelize.literal("NOW()")
        }
      },
      {
        tableName: "student_profiles",
        sequelize,
        timestamps: false,
      }
    );
  }

  // foreign key association(relationship between tables)
  static associate(models: any) {
    StudentProfileModel.hasOne(models.AcademicRecord, {
      foreignKey: "student_id",
      as: "academicRecord"
    });

    StudentProfileModel.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user"
    });
  }
}