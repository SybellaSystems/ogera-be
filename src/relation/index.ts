import { Sequelize } from "sequelize";
import { UserModel } from "@/database/models/user.model";
import { JobModel } from "@/database/models/job.model";
import { StudentProfileModel } from "@/database/models/studentProfile.model";
import { EmployerProfileModel } from "@/database/models/employerProfile.model";
import { RecordModel } from "@/database/models/records.model";

export type DBType = {
  User: typeof UserModel;
  Jobs: typeof JobModel;
  StudentProfile: typeof StudentProfileModel;
  EmployerProfile: typeof EmployerProfileModel;
  AcademicRecord: typeof RecordModel;
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
};


export const applyRelations = (DB: DBType): void => {
  const { User, StudentProfile, EmployerProfile, AcademicRecord, Jobs } = DB;

  // One-to-one: User => StudentProfile
  User.hasOne(StudentProfile, {
    foreignKey: "user_id",
    as: "studentProfile",
    onDelete: "CASCADE",
  });
  StudentProfile.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });

  // One-to-one: User => EmployerProfile
  User.hasOne(EmployerProfile, {
    foreignKey: "user_id",
    as: "employerProfile",
    onDelete: "CASCADE",
  });
  EmployerProfile.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });

  // One-to-many: StudentProfile => AcademicRecord
  StudentProfile.hasMany(AcademicRecord, {
    foreignKey: "student_profile_id",
    as: "academicRecords",
    onDelete: "CASCADE",
  });
  AcademicRecord.belongsTo(StudentProfile, {
    foreignKey: "student_profile_id",
    as: "studentProfile",
  });

  // One-to-many: EmployerProfile => Jobs
  EmployerProfile.hasMany(Jobs, {
    foreignKey: "employer_profile_id",
    as: "jobs",
    onDelete: "CASCADE",
  });
  Jobs.belongsTo(EmployerProfile, {
    foreignKey: "employer_profile_id",
    as: "employerProfile",
  });
};
