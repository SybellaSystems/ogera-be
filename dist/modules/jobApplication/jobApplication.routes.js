"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const jobApplication_controller_1 = require("./jobApplication.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const jobApplicationRouter = express_1.default.Router();
/* -------------------- Multer Config -------------------- */
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
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
        }
        else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
        }
    },
});
// Upload resume for job application (student only)
jobApplicationRouter.post('/upload-resume', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/job-applications', 'create'), upload.single('resume'), jobApplication_controller_1.uploadResume);
// Download resume file (employer/superadmin only)
jobApplicationRouter.get('/resumes/download', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/job-applications', 'view'), jobApplication_controller_1.downloadResume);
// Check if student has applied to a job (student only)
jobApplicationRouter.get('/jobs/:job_id/check-application', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/job-applications', 'view'), jobApplication_controller_1.checkStudentApplication);
// Apply for a job (student only)
jobApplicationRouter.post('/jobs/:job_id/apply', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/job-applications', 'create'), jobApplication_controller_1.applyForJob);
// Get all applications for a specific job (employer/superadmin only)
jobApplicationRouter.get('/jobs/:job_id/applications', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/job-applications', 'view'), jobApplication_controller_1.getJobApplications);
// Get all applications for an employer (employer/superadmin only)
jobApplicationRouter.get('/employer/applications', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/job-applications', 'view'), jobApplication_controller_1.getEmployerApplications);
// Get student's own applications
jobApplicationRouter.get('/student/applications', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/job-applications', 'view'), jobApplication_controller_1.getStudentApplications);
// Get application by ID
jobApplicationRouter.get('/applications/:application_id', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/job-applications', 'view'), jobApplication_controller_1.getApplicationById);
// Accept or reject application (employer/superadmin only)
jobApplicationRouter.patch('/applications/:application_id/status', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/job-applications', 'edit'), jobApplication_controller_1.updateApplicationStatus);
exports.default = jobApplicationRouter;
