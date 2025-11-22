import { UserModel } from "@/database/models/user.model";
import { RoleModel } from "@/database/models/roles.model";
import { JobModel } from "@/database/models/job.model";

export const setupAssociations = () => {

  // ====================== USER ↔ ROLE ======================
  UserModel.belongsTo(RoleModel, {
    foreignKey: "role_id",
    as: "role",
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  });

  RoleModel.hasMany(UserModel, {
    foreignKey: "role_id",
    as: "users",
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  });

  // ====================== USER (Employer) ↔ JOB ======================
  // One employer (User) can have many jobs
  UserModel.hasMany(JobModel, {
    foreignKey: "employer_id",
    as: "jobs",
  });

  // A job belongs to one employer (User)
  JobModel.belongsTo(UserModel, {
    foreignKey: "employer_id",
    as: "employer",
  });
};
