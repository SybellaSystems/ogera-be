import { Sequelize, DataTypes, Model, Optional } from "sequelize";
import { Role } from "@/interfaces/role.interfaces";

export type RoleCreationAttributes = Optional<
  Role,
  "id" | "created_at" | "updated_at"
>;

export class RoleModel
  extends Model<Role, RoleCreationAttributes>
  implements Role
{
  public id!: string;
  public roleName!: "student" | "employer" | "admin";
  public permission_json!: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export default function (sequelize: Sequelize): typeof RoleModel {
  RoleModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      roleName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      permission_json: {
       type: DataTypes.JSON,
       allowNull: true,
       defaultValue: [],
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
      tableName: "roles",
      sequelize,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return RoleModel;
}
