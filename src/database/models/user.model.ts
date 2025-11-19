import { Sequelize, DataTypes, Model, Optional } from "sequelize";
import { User } from "@/interfaces/user.interfaces";

export type UserCreationAttributes = Optional<
  User,
  | "user_id"
  | "two_fa_enabled"
  | "two_fa_secret"
  | "created_at"
  | "national_id_number"
  | "business_registration_id"
  | "reset_otp"
  | "reset_otp_expiry"
>;

export class UserModel
  extends Model<User, UserCreationAttributes>
  implements User
{
  public user_id!: string;
  public email!: string;
  public mobile_number!: string;
  public password_hash!: string;

  public role_id!: string; // ⭐ Foreign Key

  public two_fa_enabled!: boolean;
  public two_fa_secret?: string;
  public full_name!: string;
  public national_id_number?: string;
  public business_registration_id?: string;
  public reset_otp?: string;
  public reset_otp_expiry?: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export default function (sequelize: Sequelize): typeof UserModel {
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
      },

      mobile_number: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },

      password_hash: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "roles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      two_fa_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      two_fa_secret: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      full_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      national_id_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      business_registration_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      reset_otp: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },

      reset_otp_expiry: {
        type: DataTypes.DATE,
        allowNull: true,
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
      tableName: "users",
      sequelize,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return UserModel;
}
