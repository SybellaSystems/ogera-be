import { UserModel } from '@/database/models/user.model';
import { RoleModel } from '@/database/models/roles.model';
import { JobModel } from '@/database/models/job.model';
import { JobApplicationModel } from '@/database/models/jobApplication.model';
import { AcademicVerificationModel } from '@/database/models/academicVerification.model';
import { NotificationModel } from '@/database/models/notification.model';
import { JobQuestionModel } from '@/database/models/jobQuestion.model';
import { JobApplicationAnswerModel } from '@/database/models/jobApplicationAnswer.model';
import { UserSkillModel } from '@/database/models/userSkill.model';
import { UserEmploymentModel } from '@/database/models/userEmployment.model';
import { UserEducationModel } from '@/database/models/userEducation.model';
import { UserProjectModel } from '@/database/models/userProject.model';
import { UserAccomplishmentModel } from '@/database/models/userAccomplishment.model';
import { UserExtendedProfileModel } from '@/database/models/userExtendedProfile.model';
import { CourseModel } from '@/database/models/course.model';
import { CourseStepModel } from '@/database/models/courseStep.model';
import { CourseEnrollmentModel } from '@/database/models/courseEnrollment.model';
import { CourseChatMessageModel } from '@/database/models/courseChatMessage.model';
import { CourseProgressModel } from '@/database/models/courseProgress.model';

export const setupAssociations = () => {
    // ====================== USER ↔ ROLE ======================
    UserModel.belongsTo(RoleModel, {
        foreignKey: 'role_id',
        as: 'role',
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    });

    RoleModel.hasMany(UserModel, {
        foreignKey: 'role_id',
        as: 'users',
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    });

    // ====================== USER (Employer) ↔ JOB ======================
    // One employer (User) can have many jobs
    UserModel.hasMany(JobModel, {
        foreignKey: 'employer_id',
        as: 'jobs',
    });

    // A job belongs to one employer (User)
    JobModel.belongsTo(UserModel, {
        foreignKey: 'employer_id',
        as: 'employer',
    });

    // ====================== JOB APPLICATION ↔ JOB ======================
    // A job can have many applications
    JobModel.hasMany(JobApplicationModel, {
        foreignKey: 'job_id',
        as: 'jobApplications',
    });

    // An application belongs to one job
    JobApplicationModel.belongsTo(JobModel, {
        foreignKey: 'job_id',
        as: 'job',
    });

    // ====================== JOB APPLICATION ↔ USER (Student) ======================
    // A student (User) can have many job applications
    UserModel.hasMany(JobApplicationModel, {
        foreignKey: 'student_id',
        as: 'jobApplications',
    });

    // An application belongs to one student (User)
    JobApplicationModel.belongsTo(UserModel, {
        foreignKey: 'student_id',
        as: 'student',
    });

    // ====================== JOB APPLICATION ↔ USER (Reviewer) ======================
    // An application is reviewed by one user (employer/admin)
    JobApplicationModel.belongsTo(UserModel, {
        foreignKey: 'reviewed_by',
        as: 'reviewer',
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });

    // ====================== USER ↔ ACADEMIC VERIFICATION ======================
    // One user (student) can have many academic verifications
    UserModel.hasMany(AcademicVerificationModel, {
        foreignKey: 'user_id',
        as: 'academicVerifications',
    });

    // An academic verification belongs to one user (student)
    AcademicVerificationModel.belongsTo(UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // An academic verification is reviewed by one admin (User)
    AcademicVerificationModel.belongsTo(UserModel, {
        foreignKey: 'reviewed_by',
        as: 'reviewer',
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });

    // An academic verification is assigned to one admin (User) for review
    AcademicVerificationModel.belongsTo(UserModel, {
        foreignKey: 'assigned_to',
        as: 'assignedAdmin',
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });

    // ====================== USER ↔ NOTIFICATION ======================
    // A user can have many notifications
    UserModel.hasMany(NotificationModel, {
        foreignKey: 'user_id',
        as: 'notifications',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // A notification belongs to one user
    NotificationModel.belongsTo(UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // Note: Notification related_id can reference different entities (applications, jobs, etc.)
    // So we fetch related data manually in the notification service rather than using associations

    // ====================== JOB ↔ JOB QUESTION ======================
    // A job can have many questions
    JobModel.hasMany(JobQuestionModel, {
        foreignKey: 'job_id',
        as: 'questions',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // A question belongs to one job
    JobQuestionModel.belongsTo(JobModel, {
        foreignKey: 'job_id',
        as: 'job',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // ====================== JOB APPLICATION ↔ JOB APPLICATION ANSWER ======================
    // An application can have many answers
    JobApplicationModel.hasMany(JobApplicationAnswerModel, {
        foreignKey: 'application_id',
        as: 'answers',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // An answer belongs to one application
    JobApplicationAnswerModel.belongsTo(JobApplicationModel, {
        foreignKey: 'application_id',
        as: 'application',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // ====================== JOB QUESTION ↔ JOB APPLICATION ANSWER ======================
    // A question can have many answers (from different applications)
    JobQuestionModel.hasMany(JobApplicationAnswerModel, {
        foreignKey: 'question_id',
        as: 'answers',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // An answer belongs to one question
    JobApplicationAnswerModel.belongsTo(JobQuestionModel, {
        foreignKey: 'question_id',
        as: 'question',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // ====================== USER ↔ USER SKILLS ======================
    UserModel.hasMany(UserSkillModel, {
        foreignKey: 'user_id',
        as: 'skills',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    UserSkillModel.belongsTo(UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // ====================== USER ↔ USER EMPLOYMENT ======================
    UserModel.hasMany(UserEmploymentModel, {
        foreignKey: 'user_id',
        as: 'employments',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    UserEmploymentModel.belongsTo(UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // ====================== USER ↔ USER EDUCATION ======================
    UserModel.hasMany(UserEducationModel, {
        foreignKey: 'user_id',
        as: 'educations',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    UserEducationModel.belongsTo(UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // ====================== USER ↔ USER PROJECTS ======================
    UserModel.hasMany(UserProjectModel, {
        foreignKey: 'user_id',
        as: 'projects',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    UserProjectModel.belongsTo(UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // ====================== USER ↔ USER ACCOMPLISHMENTS ======================
    UserModel.hasMany(UserAccomplishmentModel, {
        foreignKey: 'user_id',
        as: 'accomplishments',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    UserAccomplishmentModel.belongsTo(UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // ====================== USER ↔ USER EXTENDED PROFILE ======================
    UserModel.hasOne(UserExtendedProfileModel, {
        foreignKey: 'user_id',
        as: 'extendedProfile',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    UserExtendedProfileModel.belongsTo(UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // ====================== COURSE ↔ COURSE STEP ======================
    // A course can have many steps
    CourseModel.hasMany(CourseStepModel, {
        foreignKey: 'course_id',
        as: 'steps',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // A step belongs to one course
    CourseStepModel.belongsTo(CourseModel, {
        foreignKey: 'course_id',
        as: 'course',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // ====================== COURSE ENROLLMENT ↔ USER & COURSE ======================
    UserModel.hasMany(CourseEnrollmentModel, {
        foreignKey: 'user_id',
        as: 'courseEnrollments',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    CourseEnrollmentModel.belongsTo(UserModel, {
        foreignKey: 'user_id',
        as: 'student',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    CourseModel.hasMany(CourseEnrollmentModel, {
        foreignKey: 'course_id',
        as: 'enrollments',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    CourseEnrollmentModel.belongsTo(CourseModel, {
        foreignKey: 'course_id',
        as: 'course',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // ====================== COURSE PROGRESS ======================

    CourseModel.hasMany(CourseProgressModel, {
        foreignKey: 'course_id',
        as: 'progress',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    CourseProgressModel.belongsTo(CourseModel, {
        foreignKey: 'course_id',
        as: 'course',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    UserModel.hasMany(CourseProgressModel, {
        foreignKey: 'user_id',
        as: 'courseProgress',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    CourseProgressModel.belongsTo(UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    CourseStepModel.hasMany(CourseProgressModel, {
        foreignKey: 'step_id',
        as: 'progress',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    CourseProgressModel.belongsTo(CourseStepModel, {
        foreignKey: 'step_id',
        as: 'step',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    // ====================== COURSE CHAT MESSAGES ======================
    CourseModel.hasMany(CourseChatMessageModel, {
        foreignKey: 'course_id',
        as: 'chatMessages',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    CourseChatMessageModel.belongsTo(CourseModel, {
        foreignKey: 'course_id',
        as: 'course',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    UserModel.hasMany(CourseChatMessageModel, {
        foreignKey: 'user_id',
        as: 'courseChatMessages',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });

    CourseChatMessageModel.belongsTo(UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    });
};
