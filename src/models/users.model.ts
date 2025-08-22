import { Sequelize, DataTypes, Model, Optional } from "sequelize";

// Interface for User
export interface User {
  user_id: string;
  email: string;
  mobile_number: string;
  password_hash: string;
  role: "Student" | "Employer" | "Admin";
  national_id: string;
  two_fa_enabled: boolean;
  two_fa_secret?: string;
  created_at: Date;
}

// Optional fields during creation
export type UserCreationAttributes = Optional<
  User,
  "user_id" | "two_fa_enabled" | "two_fa_secret" | "created_at"
>;

export class UserModel extends Model<User, UserCreationAttributes> {
  // Remove all public class fields to avoid shadowing Sequelize attributes

  static initialize(sequelize: Sequelize) {
    UserModel.init(
      {
        user_id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          validate: { isEmail: true },
        },
        mobile_number: {
          type: DataTypes.STRING(15),
          allowNull: false,
          unique: true, // Make mobile_number unique to match raw SQL
        },
        password_hash: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        role: {
          type: DataTypes.ENUM("Student", "Employer", "Admin"),
          allowNull: false,
          defaultValue: "Student",
        },
        national_id: { // adding this column because I'll use it to when creating 'student_profiles' table
          type: DataTypes.STRING(50),
          allowNull: true,
          unique: true
        },
        two_fa_enabled: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        two_fa_secret: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: Sequelize.literal("NOW()"),
        },
      },
      {
        tableName: "users",
        sequelize,
        timestamps: false,
      }
    );
  }

  // foreign key association(relationship between tables)
  static associate(models: any) {
    UserModel.hasOne(models.StudentProfile, {
      foreignKey: "user_id",
      as: "studentProfile"
    });
  }
}
