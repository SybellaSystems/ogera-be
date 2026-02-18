import express from 'express';
import multer from 'multer';
import {
    applyForJob,
    getJobApplications,
    getEmployerApplications,
    getStudentApplications,
    updateApplicationStatus,
    getApplicationById,
    uploadResume,
    downloadResume,
    checkStudentApplication,
} from './jobApplication.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { PermissionChecker } from '@/middlewares/role.middleware';

const jobApplicationRouter = express.Router();

/* -------------------- Multer Config -------------------- */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.',
                ),
            );
        }
    },
});

// Upload resume for job application (student only)
jobApplicationRouter.post(
    '/upload-resume',
    authMiddleware,
    // Job applications live under the Jobs module in the UI/permissions
    PermissionChecker('/jobs', 'view'),
    upload.single('resume'),
    uploadResume,
);

// Download resume file (employer/superadmin only)
jobApplicationRouter.get(
    '/resumes/download',
    authMiddleware,
    PermissionChecker('/jobs', 'view'),
    downloadResume,
);

// Check if student has applied to a job (student only)
jobApplicationRouter.get(
    '/jobs/:job_id/check-application',
    authMiddleware,
    PermissionChecker('/jobs', 'view'),
    checkStudentApplication,
);

// Apply for a job (student only)
jobApplicationRouter.post(
    '/jobs/:job_id/apply',
    authMiddleware,
    PermissionChecker('/jobs', 'view'),
    applyForJob,
);

// Get all applications for a specific job (employer/superadmin only)
jobApplicationRouter.get(
    '/jobs/:job_id/applications',
    authMiddleware,
    PermissionChecker('/jobs', 'view'),
    getJobApplications,
);

// Get all applications for an employer (employer/superadmin only)
jobApplicationRouter.get(
    '/employer/applications',
    authMiddleware,
    PermissionChecker('/jobs', 'view'),
    getEmployerApplications,
);

// Get student's own applications
jobApplicationRouter.get(
    '/student/applications',
    authMiddleware,
    PermissionChecker('/jobs', 'view'),
    getStudentApplications,
);

// Get application by ID
jobApplicationRouter.get(
    '/applications/:application_id',
    authMiddleware,
    PermissionChecker('/jobs', 'view'),
    getApplicationById,
);

// Accept or reject application (employer/superadmin only)
jobApplicationRouter.patch(
    '/applications/:application_id/status',
    authMiddleware,
    PermissionChecker('/jobs', 'edit'),
    updateApplicationStatus,
);

export default jobApplicationRouter;
