"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadResume = exports.checkStudentApplication = exports.uploadResume = exports.getApplicationById = exports.updateApplicationStatus = exports.getStudentApplications = exports.getEmployerApplications = exports.getJobApplications = exports.applyForJob = void 0;
const http_status_codes_1 = require("http-status-codes");
const responseFormat_1 = require("../../exception/responseFormat");
const jobApplication_service_1 = require("./jobApplication.service");
const response = new responseFormat_1.ResponseFormat();
// Apply for a job (student only)
const applyForJob = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const application = yield (0, jobApplication_service_1.applyForJobService)(req.params.job_id, req.user.user_id, req.body);
        if (!application) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, 'Failed to create application');
            return;
        }
        response.response(res, true, http_status_codes_1.StatusCodes.CREATED, application, 'Application submitted successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.applyForJob = applyForJob;
// Get all applications for a specific job (employer/superadmin only)
const getJobApplications = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const applications = yield (0, jobApplication_service_1.getJobApplicationsService)(req.params.job_id, req.user.user_id, req.user.role);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, applications, 'Applications retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getJobApplications = getJobApplications;
// Get all applications for an employer (employer/superadmin only)
const getEmployerApplications = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const applications = yield (0, jobApplication_service_1.getEmployerApplicationsService)(req.user.user_id, req.user.role);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, applications, 'Applications retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getEmployerApplications = getEmployerApplications;
// Get student's own applications
const getStudentApplications = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const applications = yield (0, jobApplication_service_1.getStudentApplicationsService)(req.user.user_id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, applications, 'Applications retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getStudentApplications = getStudentApplications;
// Accept or reject application (employer/superadmin only)
const updateApplicationStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const { status } = req.body;
        if (status !== 'Accepted' && status !== 'Rejected') {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, "Status must be either 'Accepted' or 'Rejected'");
            return;
        }
        const application = yield (0, jobApplication_service_1.updateApplicationStatusService)(req.params.application_id, status, req.user.user_id, req.user.role);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, application, `Application ${status.toLowerCase()} successfully`);
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.updateApplicationStatus = updateApplicationStatus;
// Get application by ID
const getApplicationById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const application = yield (0, jobApplication_service_1.getApplicationByIdService)(req.params.application_id, req.user.user_id, req.user.role);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, application, 'Application retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getApplicationById = getApplicationById;
// Upload resume for job application (student only)
const uploadResume = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const file = req.file;
        if (!file) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'Resume file is required');
            return;
        }
        const result = yield (0, jobApplication_service_1.uploadResumeService)(req.user.user_id, file);
        response.response(res, true, http_status_codes_1.StatusCodes.CREATED, result, 'Resume uploaded successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.uploadResume = uploadResume;
// Check if student has applied to a job
const checkStudentApplication = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const result = yield (0, jobApplication_service_1.checkStudentApplicationService)(req.params.job_id, req.user.user_id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Application status checked successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.checkStudentApplication = checkStudentApplication;
// Download resume file (employer/superadmin only)
const downloadResume = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const { path: filePath } = req.query;
        if (!filePath || typeof filePath !== 'string') {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'File path is required');
            return;
        }
        const decodedPath = decodeURIComponent(filePath);
        const fileData = yield (0, jobApplication_service_1.downloadResumeService)(decodedPath, req.user.user_id, req.user.role);
        // Set appropriate headers for file download
        const fileName = decodedPath.split('/').pop() || 'resume.pdf';
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        res.setHeader('Content-Type', fileData.contentType || 'application/pdf');
        // Send file
        res.send(fileData.buffer);
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.downloadResume = downloadResume;
