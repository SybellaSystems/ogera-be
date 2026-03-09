import repo from './jobApplication.repo';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { JobApplication } from '@/interfaces/jobApplication.interfaces';
import { DB } from '@/database';
import { saveFile, getFileUrl, getLocalFile } from '@/utils/storage.service';
import { sendMail } from '@/utils/mailer';
import { JobApplicationStatusTemplate } from '@/templete/emailTemplete';
import { Op } from 'sequelize';
import {
    createJobApplicationNotification,
    createApplicationStatusNotification,
} from '@/modules/notification/notification.service';
import * as path from 'path';

/**
 * Convert resume URL to API endpoint format if it's a local file path
 */
const normalizeResumeUrl = (
    resumeUrl: string | null | undefined,
): string | null => {
    if (!resumeUrl) return null;

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
const normalizeApplicationResumeUrl = (application: any): any => {
    if (!application) return application;

    if (application.resume_url) {
        application.resume_url = normalizeResumeUrl(application.resume_url);
    }

    return application;
};

/**
 * Normalize resume URLs in array of applications
 */
const normalizeApplicationsResumeUrls = (applications: any[]): any[] => {
    if (!Array.isArray(applications)) return applications;
    return applications.map(normalizeApplicationResumeUrl);
};

// Apply for a job (student only)
export const applyForJobService = async (
    job_id: string,
    student_id: string,
    applicationData: {
        cover_letter?: string;
        resume_url?: string;
        answers?: Array<{ question_id: string; answer_text: string }>;
    },
) => {
    // Check if user is a student
    const student = await DB.Users.findOne({
        where: { user_id: student_id },
        include: [
            {
                model: DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });

    if (!student || !student.role) {
        throw new CustomError('User not found', StatusCodes.NOT_FOUND);
    }

    const roleType = student.role.roleType;
    if (roleType !== 'student') {
        throw new CustomError(
            'Only students can apply for jobs',
            StatusCodes.FORBIDDEN,
        );
    }

    // Check if job exists and get questions
    const job = await DB.Jobs.findOne({
        where: { job_id },
        include: [
            {
                model: DB.JobQuestions,
                as: 'questions',
                order: [['display_order', 'ASC']],
                required: false,
            },
        ],
    });
    if (!job) {
        throw new CustomError('Job not found', StatusCodes.NOT_FOUND);
    }

    // Validate required questions are answered
    if (job.questions && job.questions.length > 0) {
        const requiredQuestions = job.questions.filter(
            (q: any) => q.is_required,
        );
        if (requiredQuestions.length > 0) {
            if (
                !applicationData.answers ||
                !Array.isArray(applicationData.answers)
            ) {
                throw new CustomError(
                    'Answers to required questions are missing',
                    StatusCodes.BAD_REQUEST,
                );
            }

            const answeredQuestionIds = new Set(
                applicationData.answers.map(a => a.question_id),
            );

            const missingRequired = requiredQuestions.filter(
                (q: any) => !answeredQuestionIds.has(q.question_id),
            );

            if (missingRequired.length > 0) {
                throw new CustomError(
                    `Please answer all required questions: ${missingRequired
                        .map((q: any) => q.question_text)
                        .join(', ')}`,
                    StatusCodes.BAD_REQUEST,
                );
            }
        }
    }

    // Check if already applied
    const existingApplication = await repo.findApplicationByJobAndStudent(
        job_id,
        student_id,
    );
    if (existingApplication) {
        throw new CustomError(
            'You have already applied for this job',
            StatusCodes.CONFLICT,
        );
    }

    // Create application
    const application = await repo.createApplication({
        job_id,
        student_id,
        cover_letter: applicationData.cover_letter,
        resume_url: applicationData.resume_url,
        status: 'Pending',
    });

    // Create answers if provided
    if (
        applicationData.answers &&
        Array.isArray(applicationData.answers) &&
        applicationData.answers.length > 0
    ) {
        await repo.createApplicationAnswers(
            application.application_id,
            applicationData.answers,
        );
    }

    // Increment job applications count
    await repo.incrementJobApplicationsCount(job_id);

    // Get application with full details for notification
    const result = await repo.findApplicationById(application.application_id);

    // Create notification for employer
    if (result && result.job && result.job.employer_id && result.student) {
        try {
            await createJobApplicationNotification(
                result.job.employer_id,
                result.application_id,
                result.student.full_name || 'A student',
                result.job.job_title,
            );
        } catch (error) {
            // Don't fail the application if notification creation fails
            console.error('Failed to create notification:', error);
        }
    }

    // Write activity log for application (audit)
    try {
        await DB.ActivityLogs.create({
            user_id: student_id || null,
            action: 'job_application',
            entity_type: 'JobApplication',
            entity_id: application.application_id,
            description: `Student ${student_id} applied to job ${job_id}`,
        } as any);
    } catch (e) {
        // Swallow logging errors
    }

    return normalizeApplicationResumeUrl(result);
};

// Get all applications for a job (employer/superadmin only)
export const getJobApplicationsService = async (
    job_id: string,
    user_id: string,
    userRole: string,
) => {
    // Check if user has permission
    const user = await DB.Users.findOne({
        where: { user_id },
        include: [
            {
                model: DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });

    if (!user || !user.role) {
        throw new CustomError('User not found', StatusCodes.NOT_FOUND);
    }

    const roleType = user.role.roleType;
    const roleName = user.role.roleName.toLowerCase();

    // Only employer and superadmin can view applications
    if (
        roleType !== 'employer' &&
        roleType !== 'superAdmin' &&
        roleName !== 'superadmin'
    ) {
        throw new CustomError(
            'Only employer and superadmin users can view job applications',
            StatusCodes.FORBIDDEN,
        );
    }

    // Check if job exists
    const job = await DB.Jobs.findOne({ where: { job_id } });
    if (!job) {
        throw new CustomError('Job not found', StatusCodes.NOT_FOUND);
    }

    // If user is employer, check if they own the job
    if (roleType === 'employer' && job.employer_id !== user_id) {
        throw new CustomError(
            'You can only view applications for your own jobs',
            StatusCodes.FORBIDDEN,
        );
    }

    const applications = await repo.findAllApplicationsByJob(job_id);
    return normalizeApplicationsResumeUrls(applications);
};

// Get all applications for an employer (employer/superadmin only)
export const getEmployerApplicationsService = async (
    user_id: string,
    userRole: string,
    status?: string,
) => {
    // Check if user has permission
    const user = await DB.Users.findOne({
        where: { user_id },
        include: [
            {
                model: DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });

    if (!user || !user.role) {
        throw new CustomError('User not found', StatusCodes.NOT_FOUND);
    }

    const roleType = user.role.roleType;
    const roleName = user.role.roleName.toLowerCase();

    // Only employer and superadmin can view applications
    if (
        roleType !== 'employer' &&
        roleType !== 'superAdmin' &&
        roleName !== 'superadmin'
    ) {
        throw new CustomError(
            'Only employer and superadmin users can view job applications',
            StatusCodes.FORBIDDEN,
        );
    }

    const normalizedStatus =
        status && typeof status === 'string' ? status.trim() : undefined;

    // Validate status filter if provided
    const statusFilter =
        normalizedStatus &&
        ['Pending', 'Accepted', 'Rejected'].includes(normalizedStatus)
            ? (normalizedStatus as 'Pending' | 'Accepted' | 'Rejected')
            : undefined;

    // If user is employer, get their applications
    if (roleType === 'employer') {
        const applications = await repo.findAllApplicationsForEmployer(
            user_id,
            statusFilter,
        );
        return normalizeApplicationsResumeUrls(applications);
    }

    // If user is superadmin, get all applications
    const applications = await DB.JobApplications.findAll({
        ...(statusFilter ? { where: { status: statusFilter } } : {}),
        include: [
            {
                model: DB.Jobs,
                as: 'job',
                include: [
                    {
                        model: DB.Users,
                        as: 'employer',
                        attributes: ['user_id', 'full_name', 'email'],
                    },
                    {
                        model: DB.JobQuestions,
                        as: 'questions',
                        order: [['display_order', 'ASC']],
                        required: false,
                    },
                ],
            },
            {
                model: DB.Users,
                as: 'student',
                attributes: ['user_id', 'full_name', 'email', 'mobile_number'],
                include: [
                    {
                        model: DB.Roles,
                        as: 'role',
                        attributes: ['roleName', 'roleType'],
                    },
                ],
            },
            {
                model: DB.Users,
                as: 'reviewer',
                attributes: ['user_id', 'full_name', 'email'],
                required: false,
            },
            {
                model: DB.JobApplicationAnswers,
                as: 'answers',
                include: [
                    {
                        model: DB.JobQuestions,
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
};

// Get student's own applications
export const getStudentApplicationsService = async (
    student_id: string,
    status?: string,
) => {
    // Check if user is a student
    const student = await DB.Users.findOne({
        where: { user_id: student_id },
        include: [
            {
                model: DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });

    if (!student || !student.role) {
        throw new CustomError('User not found', StatusCodes.NOT_FOUND);
    }

    const roleType = student.role.roleType;
    if (roleType !== 'student') {
        throw new CustomError(
            'Only students can view their own applications',
            StatusCodes.FORBIDDEN,
        );
    }

    const normalizedStatus =
        status && typeof status === 'string' ? status.trim() : undefined;
    const statusFilter =
        normalizedStatus &&
        ['Pending', 'Accepted', 'Rejected'].includes(normalizedStatus)
            ? (normalizedStatus as 'Pending' | 'Accepted' | 'Rejected')
            : undefined;

    const applications = await repo.findAllApplicationsByStudent(
        student_id,
        statusFilter,
    );
    return normalizeApplicationsResumeUrls(applications);
};

// Accept or reject application (employer/superadmin only)
export const updateApplicationStatusService = async (
    application_id: string,
    status: 'Accepted' | 'Rejected',
    user_id: string,
    userRole: string,
) => {
    // Check if user has permission
    const user = await DB.Users.findOne({
        where: { user_id },
        include: [
            {
                model: DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });

    if (!user || !user.role) {
        throw new CustomError('User not found', StatusCodes.NOT_FOUND);
    }

    const roleType = user.role.roleType;
    const roleName = user.role.roleName.toLowerCase();

    // Only employer and superadmin can update application status
    if (
        roleType !== 'employer' &&
        roleType !== 'superAdmin' &&
        roleName !== 'superadmin'
    ) {
        throw new CustomError(
            'Only employer and superadmin users can update application status',
            StatusCodes.FORBIDDEN,
        );
    }

    // Get application with job details
    const application = await repo.findApplicationById(application_id);
    if (!application) {
        throw new CustomError('Application not found', StatusCodes.NOT_FOUND);
    }

    // If user is employer, check if they own the job
    if (roleType === 'employer') {
        const job = await DB.Jobs.findOne({
            where: { job_id: application.job_id },
        });
        if (!job || job.employer_id !== user_id) {
            throw new CustomError(
                'You can only update applications for your own jobs',
                StatusCodes.FORBIDDEN,
            );
        }
    }

    // Check if application is already processed
    if (application.status !== 'Pending') {
        throw new CustomError(
            'Application has already been processed',
            StatusCodes.BAD_REQUEST,
        );
    }

    // Update application status
    const updatedApplication = await repo.updateApplication(application_id, {
        status,
        reviewed_at: new Date(),
        reviewed_by: user_id,
    });

    if (!updatedApplication) {
        throw new CustomError(
            'Failed to update application',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }

    // Send email notification and create in-app notification for student
    if (updatedApplication.student && updatedApplication.job) {
        const studentEmail = updatedApplication.student.email;
        const studentId =
            updatedApplication.student.user_id || updatedApplication.student_id;
        const studentName = updatedApplication.student.full_name;
        const jobTitle = updatedApplication.job.job_title;

        // Send email notification
        const { html, text } = JobApplicationStatusTemplate(
            jobTitle,
            status,
            studentName,
        );

        try {
            await sendMail({
                to: studentEmail,
                subject: `Job Application ${status}: ${jobTitle}`,
                html,
                text,
            });
        } catch (error) {
            console.error('Failed to send email notification:', error);
            // Don't fail the request if email fails
        }

        // Create in-app notification for student
        try {
            await createApplicationStatusNotification(
                studentId,
                application_id,
                jobTitle,
                status,
            );
        } catch (error) {
            console.error('Failed to create notification for student:', error);
            // Don't fail the request if notification creation fails
        }
    }

    return normalizeApplicationResumeUrl(updatedApplication);
};

// Get application by ID
export const getApplicationByIdService = async (
    application_id: string,
    user_id: string,
    userRole: string,
) => {
    const application = await repo.findApplicationById(application_id);
    if (!application) {
        throw new CustomError('Application not found', StatusCodes.NOT_FOUND);
    }

    // Check if user has permission to view this application
    const user = await DB.Users.findOne({
        where: { user_id },
        include: [
            {
                model: DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });

    if (!user || !user.role) {
        throw new CustomError('User not found', StatusCodes.NOT_FOUND);
    }

    const roleType = user.role.roleType;
    const roleName = user.role.roleName.toLowerCase();

    // Student can view their own applications
    if (roleType === 'student' && application.student_id === user_id) {
        return normalizeApplicationResumeUrl(application);
    }

    // Employer can view applications for their jobs
    if (roleType === 'employer') {
        const job = await DB.Jobs.findOne({
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

    throw new CustomError(
        "You don't have permission to view this application",
        StatusCodes.FORBIDDEN,
    );
};

// Upload resume for job application (student only)
export const uploadResumeService = async (
    student_id: string,
    file: Express.Multer.File,
) => {
    // Check if user is a student
    const student = await DB.Users.findOne({
        where: { user_id: student_id },
        include: [
            {
                model: DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });

    if (!student || !student.role) {
        throw new CustomError('User not found', StatusCodes.NOT_FOUND);
    }

    const roleType = student.role.roleType;
    if (roleType !== 'student') {
        throw new CustomError(
            'Only students can upload resumes',
            StatusCodes.FORBIDDEN,
        );
    }

    // Save file to storage
    const { path, storageType } = await saveFile(file, 'resumes');

    // For S3, get the presigned URL
    // For local storage, return the file path (will be normalized to API endpoint when returning applications)
    let resumeUrl: string;
    if (storageType === 's3') {
        resumeUrl = await getFileUrl(path, storageType);
    } else {
        // Store the file path - it will be normalized to API endpoint when applications are retrieved
        resumeUrl = path;
    }

    return {
        resume_url: resumeUrl, // File path for local, presigned URL for S3
        path,
        storageType,
    };
};

// Download resume file (employer/superadmin only)
export const downloadResumeService = async (
    filePath: string,
    user_id: string,
    userRole: string,
) => {
    // Check if user has permission (employer or superadmin)
    const user = await DB.Users.findOne({
        where: { user_id },
        include: [
            {
                model: DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });

    if (!user || !user.role) {
        throw new CustomError('User not found', StatusCodes.NOT_FOUND);
    }

    const roleType = user.role.roleType;
    const roleName = user.role.roleName.toLowerCase();

    // Only employer and superadmin can download resumes
    if (
        roleType !== 'employer' &&
        roleType !== 'superAdmin' &&
        roleName !== 'superadmin'
    ) {
        throw new CustomError(
            'Only employer and superadmin users can download resumes',
            StatusCodes.FORBIDDEN,
        );
    }

    // Decode the file path in case it's URL encoded
    const decodedPath = decodeURIComponent(filePath);

    // Find application by resume path - the resume_url in DB contains the actual file path
    // We need to match against the original stored path, which might be in various formats
    const applications = await DB.JobApplications.findAll({
        where: {
            resume_url: { [Op.ne]: null as any },
        },
        include: [
            {
                model: DB.Jobs,
                as: 'job',
                attributes: ['job_id', 'employer_id'],
            },
        ],
    });

    // Find the application that matches the file path
    let application = applications.find(app => {
        if (!app.resume_url) return false;

        // Check various path formats
        const resumePath = app.resume_url;

        // Direct match
        if (resumePath === decodedPath || resumePath === filePath) return true;

        // Check if the decoded path is contained in resume_url or vice versa
        if (
            resumePath.includes(decodedPath) ||
            decodedPath.includes(resumePath)
        ) {
            // Extract filename from both paths for comparison
            const resumeFileName = resumePath.split(/[\/\\]/).pop();
            const requestFileName = decodedPath.split(/[\/\\]/).pop();
            if (resumeFileName === requestFileName) return true;
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
            } catch (e) {
                // Ignore URL parsing errors
            }
        }

        return false;
    });

    if (!application) {
        throw new CustomError('Resume not found', StatusCodes.NOT_FOUND);
    }

    // If user is employer, check if they own the job
    if (roleType === 'employer') {
        if (!application.job || application.job.employer_id !== user_id) {
            throw new CustomError(
                'You can only download resumes for your own job applications',
                StatusCodes.FORBIDDEN,
            );
        }
    }

    // Get the actual file path from the application's resume_url
    let actualFilePath = application.resume_url!;

    // If it's a normalized API URL, extract the path
    if (actualFilePath.includes('/api/resumes/download')) {
        try {
            const urlMatch = actualFilePath.match(/path=([^&]+)/);
            if (urlMatch) {
                actualFilePath = decodeURIComponent(urlMatch[1]);
            }
        } catch (e) {
            // If URL parsing fails, try using the decoded path
            actualFilePath = decodedPath;
        }
    }

    // If resume_url is an HTTP/HTTPS URL (S3), we can't serve it directly
    if (
        actualFilePath.startsWith('http://') ||
        actualFilePath.startsWith('https://')
    ) {
        throw new CustomError(
            'This resume is stored in S3. Please use the provided URL to access it.',
            StatusCodes.BAD_REQUEST,
        );
    }

    // Get file from local storage
    // Try multiple path variations
    const pathVariations = [actualFilePath, decodedPath, filePath];

    // Import storage config to check if we need to prepend the storage path
    const { STORAGE_CONFIG } = await import('@/config');

    // Add variations with storage path prepended if not already there
    if (STORAGE_CONFIG.localStoragePath) {
        for (const pathVar of [actualFilePath, decodedPath, filePath]) {
            if (
                pathVar &&
                !pathVar.startsWith(STORAGE_CONFIG.localStoragePath)
            ) {
                // Check if it's a relative path from storage
                const relativePath = pathVar.replace(/^\/+/, ''); // Remove leading slashes
                pathVariations.push(
                    path.join(STORAGE_CONFIG.localStoragePath, relativePath),
                );
                pathVariations.push(
                    path.join(STORAGE_CONFIG.localStoragePath, pathVar),
                );
            }
        }
    }

    let fileBuffer: Buffer | null = null;
    let finalPath = '';

    for (const pathVar of pathVariations) {
        if (!pathVar) continue;
        fileBuffer = getLocalFile(pathVar);
        if (fileBuffer) {
            finalPath = pathVar;
            break;
        }
    }

    if (!fileBuffer) {
        throw new CustomError(
            'Resume file not found on server',
            StatusCodes.NOT_FOUND,
        );
    }

    // Determine content type based on file extension
    const extension = finalPath.split('.').pop()?.toLowerCase() || 'pdf';
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
};

// Check if student has applied to a job
export const checkStudentApplicationService = async (
    job_id: string,
    student_id: string,
): Promise<{ hasApplied: boolean; application?: any }> => {
    const application = await repo.findApplicationByJobAndStudent(
        job_id,
        student_id,
    );

    return {
        hasApplied: !!application,
        application: application || null,
    };
};
