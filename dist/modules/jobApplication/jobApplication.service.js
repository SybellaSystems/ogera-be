"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkStudentApplicationService = exports.downloadResumeService = exports.uploadResumeService = exports.getApplicationByIdService = exports.updateApplicationStatusService = exports.getStudentApplicationsService = exports.getEmployerApplicationsService = exports.getJobApplicationsService = exports.applyForJobService = void 0;
const jobApplication_repo_1 = __importDefault(require("./jobApplication.repo"));
const custom_error_1 = require("../../utils/custom-error");
const http_status_codes_1 = require("http-status-codes");
const database_1 = require("../../database");
const storage_service_1 = require("../../utils/storage.service");
const mailer_1 = require("../../utils/mailer");
const emailTemplete_1 = require("../../templete/emailTemplete");
const sequelize_1 = require("sequelize");
const notification_service_1 = require("../../modules/notification/notification.service");
const path = __importStar(require("path"));
/**
 * Convert resume URL to API endpoint format if it's a local file path
 */
const normalizeResumeUrl = (resumeUrl) => {
    if (!resumeUrl)
        return null;
    // If it's already a full URL (S3 or API endpoint), return as is
    if (resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://')) {
        return resumeUrl;
    }
    // If it's already an API endpoint, return as is
    if (resumeUrl.startsWith('/api/resumes/download')) {
        return resumeUrl;
    }
    // If it's a local file path, convert to API endpoint
    if (resumeUrl.includes('uploads') || resumeUrl.includes('resumes')) {
        const encodedPath = encodeURIComponent(resumeUrl);
        return `/api/resumes/download?path=${encodedPath}`;
    }
    // Default: assume it's a file path and convert
    const encodedPath = encodeURIComponent(resumeUrl);
    return `/api/resumes/download?path=${encodedPath}`;
};
/**
 * Normalize resume URLs in application data
 */
const normalizeApplicationResumeUrl = (application) => {
    if (!application)
        return application;
    if (application.resume_url) {
        application.resume_url = normalizeResumeUrl(application.resume_url);
    }
    return application;
};
/**
 * Normalize resume URLs in array of applications
 */
const normalizeApplicationsResumeUrls = (applications) => {
    if (!Array.isArray(applications))
        return applications;
    return applications.map(normalizeApplicationResumeUrl);
};
// Apply for a job (student only)
const applyForJobService = (job_id, student_id, applicationData) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user is a student
    const student = yield database_1.DB.Users.findOne({
        where: { user_id: student_id },
        include: [
            {
                model: database_1.DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });
    if (!student || !student.role) {
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    const roleType = student.role.roleType;
    if (roleType !== 'student') {
        throw new custom_error_1.CustomError('Only students can apply for jobs', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    // Check if job exists and get questions
    const job = yield database_1.DB.Jobs.findOne({
        where: { job_id },
        include: [
            {
                model: database_1.DB.JobQuestions,
                as: 'questions',
                order: [['display_order', 'ASC']],
                required: false,
            },
        ],
    });
    if (!job) {
        throw new custom_error_1.CustomError('Job not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    // Validate required questions are answered
    if (job.questions && job.questions.length > 0) {
        const requiredQuestions = job.questions.filter((q) => q.is_required);
        if (requiredQuestions.length > 0) {
            if (!applicationData.answers ||
                !Array.isArray(applicationData.answers)) {
                throw new custom_error_1.CustomError('Answers to required questions are missing', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            const answeredQuestionIds = new Set(applicationData.answers.map(a => a.question_id));
            const missingRequired = requiredQuestions.filter((q) => !answeredQuestionIds.has(q.question_id));
            if (missingRequired.length > 0) {
                throw new custom_error_1.CustomError(`Please answer all required questions: ${missingRequired
                    .map((q) => q.question_text)
                    .join(', ')}`, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
        }
    }
    // Check if already applied
    const existingApplication = yield jobApplication_repo_1.default.findApplicationByJobAndStudent(job_id, student_id);
    if (existingApplication) {
        throw new custom_error_1.CustomError('You have already applied for this job', http_status_codes_1.StatusCodes.CONFLICT);
    }
    // Create application
    const application = yield jobApplication_repo_1.default.createApplication({
        job_id,
        student_id,
        cover_letter: applicationData.cover_letter,
        resume_url: applicationData.resume_url,
        status: 'Pending',
    });
    // Create answers if provided
    if (applicationData.answers &&
        Array.isArray(applicationData.answers) &&
        applicationData.answers.length > 0) {
        yield jobApplication_repo_1.default.createApplicationAnswers(application.application_id, applicationData.answers);
    }
    // Increment job applications count
    yield jobApplication_repo_1.default.incrementJobApplicationsCount(job_id);
    // Get application with full details for notification
    const result = yield jobApplication_repo_1.default.findApplicationById(application.application_id);
    // Create notification for employer
    if (result && result.job && result.job.employer_id && result.student) {
        try {
            yield (0, notification_service_1.createJobApplicationNotification)(result.job.employer_id, result.application_id, result.student.full_name || 'A student', result.job.job_title);
        }
        catch (error) {
            // Don't fail the application if notification creation fails
            console.error('Failed to create notification:', error);
        }
    }
    // Write activity log for application (audit)
    try {
        yield database_1.DB.ActivityLogs.create({
            user_id: student_id || null,
            action: 'job_application',
            entity_type: 'JobApplication',
            entity_id: application.application_id,
            description: `Student ${student_id} applied to job ${job_id}`,
        });
    }
    catch (e) {
        // Swallow logging errors
    }
    return normalizeApplicationResumeUrl(result);
});
exports.applyForJobService = applyForJobService;
// Get all applications for a job (employer/superadmin only)
const getJobApplicationsService = (job_id, user_id, userRole) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user has permission
    const user = yield database_1.DB.Users.findOne({
        where: { user_id },
        include: [
            {
                model: database_1.DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });
    if (!user || !user.role) {
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    const roleType = user.role.roleType;
    const roleName = user.role.roleName.toLowerCase();
    // Only employer and superadmin can view applications
    if (roleType !== 'employer' &&
        roleType !== 'superAdmin' &&
        roleName !== 'superadmin') {
        throw new custom_error_1.CustomError('Only employer and superadmin users can view job applications', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    // Check if job exists
    const job = yield database_1.DB.Jobs.findOne({ where: { job_id } });
    if (!job) {
        throw new custom_error_1.CustomError('Job not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    // If user is employer, check if they own the job
    if (roleType === 'employer' && job.employer_id !== user_id) {
        throw new custom_error_1.CustomError('You can only view applications for your own jobs', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    const applications = yield jobApplication_repo_1.default.findAllApplicationsByJob(job_id);
    return normalizeApplicationsResumeUrls(applications);
});
exports.getJobApplicationsService = getJobApplicationsService;
// Get all applications for an employer (employer/superadmin only)
const getEmployerApplicationsService = (user_id, userRole) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user has permission
    const user = yield database_1.DB.Users.findOne({
        where: { user_id },
        include: [
            {
                model: database_1.DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });
    if (!user || !user.role) {
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    const roleType = user.role.roleType;
    const roleName = user.role.roleName.toLowerCase();
    // Only employer and superadmin can view applications
    if (roleType !== 'employer' &&
        roleType !== 'superAdmin' &&
        roleName !== 'superadmin') {
        throw new custom_error_1.CustomError('Only employer and superadmin users can view job applications', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    // If user is employer, get their applications
    if (roleType === 'employer') {
        const applications = yield jobApplication_repo_1.default.findAllApplicationsForEmployer(user_id);
        return normalizeApplicationsResumeUrls(applications);
    }
    // If user is superadmin, get all applications
    const applications = yield database_1.DB.JobApplications.findAll({
        include: [
            {
                model: database_1.DB.Jobs,
                as: 'job',
                include: [
                    {
                        model: database_1.DB.Users,
                        as: 'employer',
                        attributes: ['user_id', 'full_name', 'email'],
                    },
                    {
                        model: database_1.DB.JobQuestions,
                        as: 'questions',
                        order: [['display_order', 'ASC']],
                        required: false,
                    },
                ],
            },
            {
                model: database_1.DB.Users,
                as: 'student',
                attributes: ['user_id', 'full_name', 'email', 'mobile_number'],
                include: [
                    {
                        model: database_1.DB.Roles,
                        as: 'role',
                        attributes: ['roleName', 'roleType'],
                    },
                ],
            },
            {
                model: database_1.DB.Users,
                as: 'reviewer',
                attributes: ['user_id', 'full_name', 'email'],
                required: false,
            },
            {
                model: database_1.DB.JobApplicationAnswers,
                as: 'answers',
                include: [
                    {
                        model: database_1.DB.JobQuestions,
                        as: 'question',
                        attributes: [
                            'question_id',
                            'question_text',
                            'question_type',
                            'is_required',
                        ],
                    },
                ],
                required: false,
            },
        ],
        order: [['applied_at', 'DESC']],
    });
    return normalizeApplicationsResumeUrls(applications);
});
exports.getEmployerApplicationsService = getEmployerApplicationsService;
// Get student's own applications
const getStudentApplicationsService = (student_id) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user is a student
    const student = yield database_1.DB.Users.findOne({
        where: { user_id: student_id },
        include: [
            {
                model: database_1.DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });
    if (!student || !student.role) {
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    const roleType = student.role.roleType;
    if (roleType !== 'student') {
        throw new custom_error_1.CustomError('Only students can view their own applications', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    const applications = yield jobApplication_repo_1.default.findAllApplicationsByStudent(student_id);
    return normalizeApplicationsResumeUrls(applications);
});
exports.getStudentApplicationsService = getStudentApplicationsService;
// Accept or reject application (employer/superadmin only)
const updateApplicationStatusService = (application_id, status, user_id, userRole) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user has permission
    const user = yield database_1.DB.Users.findOne({
        where: { user_id },
        include: [
            {
                model: database_1.DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });
    if (!user || !user.role) {
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    const roleType = user.role.roleType;
    const roleName = user.role.roleName.toLowerCase();
    // Only employer and superadmin can update application status
    if (roleType !== 'employer' &&
        roleType !== 'superAdmin' &&
        roleName !== 'superadmin') {
        throw new custom_error_1.CustomError('Only employer and superadmin users can update application status', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    // Get application with job details
    const application = yield jobApplication_repo_1.default.findApplicationById(application_id);
    if (!application) {
        throw new custom_error_1.CustomError('Application not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    // If user is employer, check if they own the job
    if (roleType === 'employer') {
        const job = yield database_1.DB.Jobs.findOne({
            where: { job_id: application.job_id },
        });
        if (!job || job.employer_id !== user_id) {
            throw new custom_error_1.CustomError('You can only update applications for your own jobs', http_status_codes_1.StatusCodes.FORBIDDEN);
        }
    }
    // Check if application is already processed
    if (application.status !== 'Pending') {
        throw new custom_error_1.CustomError('Application has already been processed', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Update application status
    const updatedApplication = yield jobApplication_repo_1.default.updateApplication(application_id, {
        status,
        reviewed_at: new Date(),
        reviewed_by: user_id,
    });
    if (!updatedApplication) {
        throw new custom_error_1.CustomError('Failed to update application', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    }
    // Send email notification and create in-app notification for student
    if (updatedApplication.student && updatedApplication.job) {
        const studentEmail = updatedApplication.student.email;
        const studentId = updatedApplication.student.user_id || updatedApplication.student_id;
        const studentName = updatedApplication.student.full_name;
        const jobTitle = updatedApplication.job.job_title;
        // Send email notification
        const { html, text } = (0, emailTemplete_1.JobApplicationStatusTemplate)(jobTitle, status, studentName);
        try {
            yield (0, mailer_1.sendMail)({
                to: studentEmail,
                subject: `Job Application ${status}: ${jobTitle}`,
                html,
                text,
            });
        }
        catch (error) {
            console.error('Failed to send email notification:', error);
            // Don't fail the request if email fails
        }
        // Create in-app notification for student
        try {
            yield (0, notification_service_1.createApplicationStatusNotification)(studentId, application_id, jobTitle, status);
        }
        catch (error) {
            console.error('Failed to create notification for student:', error);
            // Don't fail the request if notification creation fails
        }
    }
    return normalizeApplicationResumeUrl(updatedApplication);
});
exports.updateApplicationStatusService = updateApplicationStatusService;
// Get application by ID
const getApplicationByIdService = (application_id, user_id, userRole) => __awaiter(void 0, void 0, void 0, function* () {
    const application = yield jobApplication_repo_1.default.findApplicationById(application_id);
    if (!application) {
        throw new custom_error_1.CustomError('Application not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    // Check if user has permission to view this application
    const user = yield database_1.DB.Users.findOne({
        where: { user_id },
        include: [
            {
                model: database_1.DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });
    if (!user || !user.role) {
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    const roleType = user.role.roleType;
    const roleName = user.role.roleName.toLowerCase();
    // Student can view their own applications
    if (roleType === 'student' && application.student_id === user_id) {
        return normalizeApplicationResumeUrl(application);
    }
    // Employer can view applications for their jobs
    if (roleType === 'employer') {
        const job = yield database_1.DB.Jobs.findOne({
            where: { job_id: application.job_id },
        });
        if (job && job.employer_id === user_id) {
            return normalizeApplicationResumeUrl(application);
        }
    }
    // Superadmin can view all applications
    if (roleType === 'superAdmin' || roleName === 'superadmin') {
        return normalizeApplicationResumeUrl(application);
    }
    throw new custom_error_1.CustomError("You don't have permission to view this application", http_status_codes_1.StatusCodes.FORBIDDEN);
});
exports.getApplicationByIdService = getApplicationByIdService;
// Upload resume for job application (student only)
const uploadResumeService = (student_id, file) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user is a student
    const student = yield database_1.DB.Users.findOne({
        where: { user_id: student_id },
        include: [
            {
                model: database_1.DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });
    if (!student || !student.role) {
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    const roleType = student.role.roleType;
    if (roleType !== 'student') {
        throw new custom_error_1.CustomError('Only students can upload resumes', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    // Save file to storage
    const { path, storageType } = yield (0, storage_service_1.saveFile)(file, 'resumes');
    // For S3, get the presigned URL
    // For local storage, return the file path (will be normalized to API endpoint when returning applications)
    let resumeUrl;
    if (storageType === 's3') {
        resumeUrl = yield (0, storage_service_1.getFileUrl)(path, storageType);
    }
    else {
        // Store the file path - it will be normalized to API endpoint when applications are retrieved
        resumeUrl = path;
    }
    return {
        resume_url: resumeUrl, // File path for local, presigned URL for S3
        path,
        storageType,
    };
});
exports.uploadResumeService = uploadResumeService;
// Download resume file (employer/superadmin only)
const downloadResumeService = (filePath, user_id, userRole) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Check if user has permission (employer or superadmin)
    const user = yield database_1.DB.Users.findOne({
        where: { user_id },
        include: [
            {
                model: database_1.DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });
    if (!user || !user.role) {
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    const roleType = user.role.roleType;
    const roleName = user.role.roleName.toLowerCase();
    // Only employer and superadmin can download resumes
    if (roleType !== 'employer' &&
        roleType !== 'superAdmin' &&
        roleName !== 'superadmin') {
        throw new custom_error_1.CustomError('Only employer and superadmin users can download resumes', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    // Decode the file path in case it's URL encoded
    const decodedPath = decodeURIComponent(filePath);
    // Find application by resume path - the resume_url in DB contains the actual file path
    // We need to match against the original stored path, which might be in various formats
    const applications = yield database_1.DB.JobApplications.findAll({
        where: {
            resume_url: { [sequelize_1.Op.ne]: null },
        },
        include: [
            {
                model: database_1.DB.Jobs,
                as: 'job',
                attributes: ['job_id', 'employer_id'],
            },
        ],
    });
    // Find the application that matches the file path
    let application = applications.find(app => {
        if (!app.resume_url)
            return false;
        // Check various path formats
        const resumePath = app.resume_url;
        // Direct match
        if (resumePath === decodedPath || resumePath === filePath)
            return true;
        // Check if the decoded path is contained in resume_url or vice versa
        if (resumePath.includes(decodedPath) ||
            decodedPath.includes(resumePath)) {
            // Extract filename from both paths for comparison
            const resumeFileName = resumePath.split(/[\/\\]/).pop();
            const requestFileName = decodedPath.split(/[\/\\]/).pop();
            if (resumeFileName === requestFileName)
                return true;
        }
        // Handle normalized URL format: /api/resumes/download?path=...
        if (resumePath.includes('/api/resumes/download')) {
            try {
                const urlMatch = resumePath.match(/path=([^&]+)/);
                if (urlMatch) {
                    const urlPath = decodeURIComponent(urlMatch[1]);
                    if (urlPath === decodedPath || urlPath === filePath)
                        return true;
                }
            }
            catch (e) {
                // Ignore URL parsing errors
            }
        }
        return false;
    });
    if (!application) {
        throw new custom_error_1.CustomError('Resume not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    // If user is employer, check if they own the job
    if (roleType === 'employer') {
        if (!application.job || application.job.employer_id !== user_id) {
            throw new custom_error_1.CustomError('You can only download resumes for your own job applications', http_status_codes_1.StatusCodes.FORBIDDEN);
        }
    }
    // Get the actual file path from the application's resume_url
    let actualFilePath = application.resume_url;
    // If it's a normalized API URL, extract the path
    if (actualFilePath.includes('/api/resumes/download')) {
        try {
            const urlMatch = actualFilePath.match(/path=([^&]+)/);
            if (urlMatch) {
                actualFilePath = decodeURIComponent(urlMatch[1]);
            }
        }
        catch (e) {
            // If URL parsing fails, try using the decoded path
            actualFilePath = decodedPath;
        }
    }
    // If resume_url is an HTTP/HTTPS URL (S3), we can't serve it directly
    if (actualFilePath.startsWith('http://') ||
        actualFilePath.startsWith('https://')) {
        throw new custom_error_1.CustomError('This resume is stored in S3. Please use the provided URL to access it.', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Get file from local storage
    // Try multiple path variations
    const pathVariations = [actualFilePath, decodedPath, filePath];
    // Import storage config to check if we need to prepend the storage path
    const { STORAGE_CONFIG } = yield Promise.resolve().then(() => __importStar(require('../../config')));
    // Add variations with storage path prepended if not already there
    if (STORAGE_CONFIG.localStoragePath) {
        for (const pathVar of [actualFilePath, decodedPath, filePath]) {
            if (pathVar &&
                !pathVar.startsWith(STORAGE_CONFIG.localStoragePath)) {
                // Check if it's a relative path from storage
                const relativePath = pathVar.replace(/^\/+/, ''); // Remove leading slashes
                pathVariations.push(path.join(STORAGE_CONFIG.localStoragePath, relativePath));
                pathVariations.push(path.join(STORAGE_CONFIG.localStoragePath, pathVar));
            }
        }
    }
    let fileBuffer = null;
    let finalPath = '';
    for (const pathVar of pathVariations) {
        if (!pathVar)
            continue;
        fileBuffer = (0, storage_service_1.getLocalFile)(pathVar);
        if (fileBuffer) {
            finalPath = pathVar;
            break;
        }
    }
    if (!fileBuffer) {
        throw new custom_error_1.CustomError('Resume file not found on server', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    // Determine content type based on file extension
    const extension = ((_a = finalPath.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'pdf';
    let contentType = 'application/pdf';
    switch (extension) {
        case 'doc':
            contentType = 'application/msword';
            break;
        case 'docx':
            contentType =
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
        case 'txt':
            contentType = 'text/plain';
            break;
        case 'pdf':
        default:
            contentType = 'application/pdf';
            break;
    }
    return {
        buffer: fileBuffer,
        contentType,
    };
});
exports.downloadResumeService = downloadResumeService;
// Check if student has applied to a job
const checkStudentApplicationService = (job_id, student_id) => __awaiter(void 0, void 0, void 0, function* () {
    const application = yield jobApplication_repo_1.default.findApplicationByJobAndStudent(job_id, student_id);
    return {
        hasApplied: !!application,
        application: application || null,
    };
});
exports.checkStudentApplicationService = checkStudentApplicationService;
