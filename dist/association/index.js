"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAssociations = void 0;
const user_model_1 = require("../database/models/user.model");
const roles_model_1 = require("../database/models/roles.model");
const job_model_1 = require("../database/models/job.model");
const jobApplication_model_1 = require("../database/models/jobApplication.model");
const academicVerification_model_1 = require("../database/models/academicVerification.model");
const notification_model_1 = require("../database/models/notification.model");
const jobQuestion_model_1 = require("../database/models/jobQuestion.model");
const jobApplicationAnswer_model_1 = require("../database/models/jobApplicationAnswer.model");
const userSkill_model_1 = require("../database/models/userSkill.model");
const userEmployment_model_1 = require("../database/models/userEmployment.model");
const userEducation_model_1 = require("../database/models/userEducation.model");
const userProject_model_1 = require("../database/models/userProject.model");
const userAccomplishment_model_1 = require("../database/models/userAccomplishment.model");
const userExtendedProfile_model_1 = require("../database/models/userExtendedProfile.model");
const course_model_1 = require("../database/models/course.model");
const courseStep_model_1 = require("../database/models/courseStep.model");
const setupAssociations = () => {
    // ====================== USER ↔ ROLE ======================
    user_model_1.UserModel.belongsTo(roles_model_1.RoleModel, {
        foreignKey: 'role_id',
        as: 'role',
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    });
    roles_model_1.RoleModel.hasMany(user_model_1.UserModel, {
        foreignKey: 'role_id',
        as: 'users',
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    });
    // ====================== USER (Employer) ↔ JOB ======================
    // One employer (User) can have many jobs
    user_model_1.UserModel.hasMany(job_model_1.JobModel, {
        foreignKey: 'employer_id',
        as: 'jobs',
    });
    // A job belongs to one employer (User)
    job_model_1.JobModel.belongsTo(user_model_1.UserModel, {
        foreignKey: 'employer_id',
        as: 'employer',
    });
    // ====================== JOB APPLICATION ↔ JOB ======================
    // A job can have many applications
    job_model_1.JobModel.hasMany(jobApplication_model_1.JobApplicationModel, {
        foreignKey: 'job_id',
        as: 'jobApplications',
    });
    // An application belongs to one job
    jobApplication_model_1.JobApplicationModel.belongsTo(job_model_1.JobModel, {
        foreignKey: 'job_id',
        as: 'job',
    });
    // ====================== JOB APPLICATION ↔ USER (Student) ======================
    // A student (User) can have many job applications
    user_model_1.UserModel.hasMany(jobApplication_model_1.JobApplicationModel, {
        foreignKey: 'student_id',
        as: 'jobApplications',
    });
    // An application belongs to one student (User)
    jobApplication_model_1.JobApplicationModel.belongsTo(user_model_1.UserModel, {
        foreignKey: 'student_id',
        as: 'student',
    });
    // ====================== JOB APPLICATION ↔ USER (Reviewer) ======================
    // An application is reviewed by one user (employer/admin)
    jobApplication_model_1.JobApplicationModel.belongsTo(user_model_1.UserModel, {
        foreignKey: 'reviewed_by',
        as: 'reviewer',
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });
    // ====================== USER ↔ ACADEMIC VERIFICATION ======================
    // One user (student) can have many academic verifications
    user_model_1.UserModel.hasMany(academicVerification_model_1.AcademicVerificationModel, {
        foreignKey: 'user_id',
        as: 'academicVerifications',
    });
    // An academic verification belongs to one user (student)
    academicVerification_model_1.AcademicVerificationModel.belongsTo(user_model_1.UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    // An academic verification is reviewed by one admin (User)
    academicVerification_model_1.AcademicVerificationModel.belongsTo(user_model_1.UserModel, {
        foreignKey: 'reviewed_by',
        as: 'reviewer',
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });
    // An academic verification is assigned to one admin (User) for review
    academicVerification_model_1.AcademicVerificationModel.belongsTo(user_model_1.UserModel, {
        foreignKey: 'assigned_to',
        as: 'assignedAdmin',
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });
    // ====================== USER ↔ NOTIFICATION ======================
    // A user can have many notifications
    user_model_1.UserModel.hasMany(notification_model_1.NotificationModel, {
        foreignKey: 'user_id',
        as: 'notifications',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    // A notification belongs to one user
    notification_model_1.NotificationModel.belongsTo(user_model_1.UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    // Note: Notification related_id can reference different entities (applications, jobs, etc.)
    // So we fetch related data manually in the notification service rather than using associations
    // ====================== JOB ↔ JOB QUESTION ======================
    // A job can have many questions
    job_model_1.JobModel.hasMany(jobQuestion_model_1.JobQuestionModel, {
        foreignKey: 'job_id',
        as: 'questions',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    // A question belongs to one job
    jobQuestion_model_1.JobQuestionModel.belongsTo(job_model_1.JobModel, {
        foreignKey: 'job_id',
        as: 'job',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    // ====================== JOB APPLICATION ↔ JOB APPLICATION ANSWER ======================
    // An application can have many answers
    jobApplication_model_1.JobApplicationModel.hasMany(jobApplicationAnswer_model_1.JobApplicationAnswerModel, {
        foreignKey: 'application_id',
        as: 'answers',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    // An answer belongs to one application
    jobApplicationAnswer_model_1.JobApplicationAnswerModel.belongsTo(jobApplication_model_1.JobApplicationModel, {
        foreignKey: 'application_id',
        as: 'application',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    // ====================== JOB QUESTION ↔ JOB APPLICATION ANSWER ======================
    // A question can have many answers (from different applications)
    jobQuestion_model_1.JobQuestionModel.hasMany(jobApplicationAnswer_model_1.JobApplicationAnswerModel, {
        foreignKey: 'question_id',
        as: 'answers',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    // An answer belongs to one question
    jobApplicationAnswer_model_1.JobApplicationAnswerModel.belongsTo(jobQuestion_model_1.JobQuestionModel, {
        foreignKey: 'question_id',
        as: 'question',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    // ====================== USER ↔ USER SKILLS ======================
    user_model_1.UserModel.hasMany(userSkill_model_1.UserSkillModel, {
        foreignKey: 'user_id',
        as: 'skills',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    userSkill_model_1.UserSkillModel.belongsTo(user_model_1.UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    // ====================== USER ↔ USER EMPLOYMENT ======================
    user_model_1.UserModel.hasMany(userEmployment_model_1.UserEmploymentModel, {
        foreignKey: 'user_id',
        as: 'employments',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    userEmployment_model_1.UserEmploymentModel.belongsTo(user_model_1.UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    // ====================== USER ↔ USER EDUCATION ======================
    user_model_1.UserModel.hasMany(userEducation_model_1.UserEducationModel, {
        foreignKey: 'user_id',
        as: 'educations',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    userEducation_model_1.UserEducationModel.belongsTo(user_model_1.UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    // ====================== USER ↔ USER PROJECTS ======================
    user_model_1.UserModel.hasMany(userProject_model_1.UserProjectModel, {
        foreignKey: 'user_id',
        as: 'projects',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    userProject_model_1.UserProjectModel.belongsTo(user_model_1.UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    // ====================== USER ↔ USER ACCOMPLISHMENTS ======================
    user_model_1.UserModel.hasMany(userAccomplishment_model_1.UserAccomplishmentModel, {
        foreignKey: 'user_id',
        as: 'accomplishments',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    userAccomplishment_model_1.UserAccomplishmentModel.belongsTo(user_model_1.UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    // ====================== USER ↔ USER EXTENDED PROFILE ======================
    user_model_1.UserModel.hasOne(userExtendedProfile_model_1.UserExtendedProfileModel, {
        foreignKey: 'user_id',
        as: 'extendedProfile',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    userExtendedProfile_model_1.UserExtendedProfileModel.belongsTo(user_model_1.UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    // ====================== COURSE ↔ COURSE STEP ======================
    // A course can have many steps
    course_model_1.CourseModel.hasMany(courseStep_model_1.CourseStepModel, {
        foreignKey: 'course_id',
        as: 'steps',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
    // A step belongs to one course
    courseStep_model_1.CourseStepModel.belongsTo(course_model_1.CourseModel, {
        foreignKey: 'course_id',
        as: 'course',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
};
exports.setupAssociations = setupAssociations;
