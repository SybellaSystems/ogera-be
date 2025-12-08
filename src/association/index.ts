import { UserModel } from "@/database/models/user.model";
import { RoleModel } from "@/database/models/roles.model";
import { JobModel } from "@/database/models/job.model";
import { AcademicVerificationModel } from "@/database/models/academicVerification.model";

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

  // ====================== USER ↔ ACADEMIC VERIFICATION ======================
  // One user (student) can have many academic verifications
  UserModel.hasMany(AcademicVerificationModel, {
    foreignKey: "user_id",
    as: "academicVerifications",
  });

  // An academic verification belongs to one user (student)
  AcademicVerificationModel.belongsTo(UserModel, {
    foreignKey: "user_id",
    as: "user",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  // An academic verification is reviewed by one admin (User)
  AcademicVerificationModel.belongsTo(UserModel, {
    foreignKey: "reviewed_by",
    as: "reviewer",
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });

  // An academic verification is assigned to one admin (User) for review
  AcademicVerificationModel.belongsTo(UserModel, {
    foreignKey: "assigned_to",
    as: "assignedAdmin",
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });
};
