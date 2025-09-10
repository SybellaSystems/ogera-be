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

// Use a more robust way to track applied associations
let associationsApplied = false;

export const applyRelations = (DB: DBType): void => {
  // Prevent multiple calls more effectively
  if (associationsApplied) {
    console.log('Relations already applied, skipping...');
    return;
  }

  const { User, StudentProfile, EmployerProfile, AcademicRecord, Jobs } = DB;

  try {
    // Clear any existing associations first to avoid duplicates
    Object.values(DB).forEach((model: any) => {
      if (model && typeof model.removeAssociation === 'function') {
        // This is a hacky way to clear associations, but safer
        model.associations = {};
      }
    });

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
      as: "userEmployer",
    });

    // One-to-many: StudentProfile => AcademicRecord
    StudentProfile.hasMany(AcademicRecord, {
      foreignKey: "student_id", 
      as: "academicRecords",
      onDelete: "CASCADE",
    });
    AcademicRecord.belongsTo(StudentProfile, {
      foreignKey: "student_id",
      as: "studentRecords",
    });

    // One-to-many: EmployerProfile => Jobs
    EmployerProfile.hasMany(Jobs, {
      foreignKey: "employer_id",
      as: "jobs", 
      onDelete: "CASCADE",
    });
    Jobs.belongsTo(EmployerProfile, {
      foreignKey: "employer_id",
      as: "employerJobs",
    });

    associationsApplied = true;
    console.log('Database relations applied successfully');

  } catch (error) {
    console.error('Error applying relations:', error);
    throw error;
  }
};