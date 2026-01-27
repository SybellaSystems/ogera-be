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
exports.toggleJobStatus = exports.deleteJob = exports.updateJob = exports.getJobById = exports.getCompletedJobs = exports.getPendingJobs = exports.getActiveJobs = exports.getAllJobs = exports.createJob = void 0;
const http_status_codes_1 = require("http-status-codes");
const responseFormat_1 = require("../../exception/responseFormat");
const messages_1 = require("../../utils/messages");
const job_service_1 = require("./job.service");
const response = new responseFormat_1.ResponseFormat();
const createJob = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const job = yield (0, job_service_1.createJobService)(req.body, req.user.user_id, req.user.role);
        response.response(res, true, http_status_codes_1.StatusCodes.CREATED, job, messages_1.Messages.Job.CREATE_JOB);
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.createJob = createJob;
const getAllJobs = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if status query parameter is provided
        const status = req.query.status;
        const jobs = yield (0, job_service_1.getAllJobsService)(status);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, jobs, messages_1.Messages.Job.GET_ALL_JOBS);
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getAllJobs = getAllJobs;
// Get active jobs
const getActiveJobs = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const jobs = yield (0, job_service_1.getJobsByStatusService)('Active');
        response.response(res, true, http_status_codes_1.StatusCodes.OK, jobs, 'Active jobs retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getActiveJobs = getActiveJobs;
// Get pending jobs
const getPendingJobs = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const jobs = yield (0, job_service_1.getJobsByStatusService)('Pending');
        response.response(res, true, http_status_codes_1.StatusCodes.OK, jobs, 'Pending jobs retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getPendingJobs = getPendingJobs;
// Get completed jobs
const getCompletedJobs = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const jobs = yield (0, job_service_1.getJobsByStatusService)('Completed');
        response.response(res, true, http_status_codes_1.StatusCodes.OK, jobs, 'Completed jobs retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getCompletedJobs = getCompletedJobs;
const getJobById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const job = yield (0, job_service_1.getJobByIdService)(req.params.id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, job, messages_1.Messages.Job.GET_JOB_BY_ID);
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.NOT_FOUND, false, error.message);
    }
});
exports.getJobById = getJobById;
const updateJob = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const job = yield (0, job_service_1.updateJobService)(req.params.id, req.body);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, job, messages_1.Messages.Job.UPDATE_JOB);
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.BAD_REQUEST, false, error.message);
    }
});
exports.updateJob = updateJob;
const deleteJob = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, job_service_1.deleteJobService)(req.params.id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, messages_1.Messages.Job.DELETE_JOB);
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.NOT_FOUND, false, error.message);
    }
});
exports.deleteJob = deleteJob;
const toggleJobStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const job = yield (0, job_service_1.toggleJobStatusService)(req.params.id, req.user.user_id, req.user.role);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, job, 'Job status toggled successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.toggleJobStatus = toggleJobStatus;
