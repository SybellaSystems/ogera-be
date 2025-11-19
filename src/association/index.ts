import { UserModel } from "@/database/models/user.model";
import { RoleModel } from "@/database/models/roles.model";

export const setupAssociations = () => {
  // User → Role (Many-to-One)
  UserModel.belongsTo(RoleModel, {
    foreignKey: "role_id",
    as: "role",
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  });

  // Role → Users (One-to-Many)
  RoleModel.hasMany(UserModel, {
    foreignKey: "role_id",
    as: "users",
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  });
};
