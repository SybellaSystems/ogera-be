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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleJobStatusService = exports.deleteJobService = exports.updateJobService = exports.getJobByIdService = exports.getJobsByStatusService = exports.getAllJobsService = exports.createJobService = void 0;
const job_repo_1 = __importDefault(require("./job.repo"));
const custom_error_1 = require("../../utils/custom-error");
const http_status_codes_1 = require("http-status-codes");
const messages_1 = require("../../utils/messages");
const database_1 = require("../../database");
const createJobService = (jobData, user_id, userRole) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user has employer or superadmin roleType
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
    // Only employer and superadmin can create jobs
    if (roleType !== 'employer' &&
        roleType !== 'superAdmin' &&
        roleName !== 'superadmin') {
        throw new custom_error_1.CustomError('Only employer and superadmin users can create jobs', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    // If user is superadmin, they can create jobs for any employer
    // If user is employer, they can only create jobs for themselves
    const employer_id = roleType === 'employer' ? user_id : jobData.employer_id || user_id;
    // Validate required fields
    if (!jobData.job_title) {
        throw new custom_error_1.CustomError('Job title is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (!jobData.category) {
        throw new custom_error_1.CustomError('Category is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (!jobData.budget) {
        throw new custom_error_1.CustomError('Budget is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (!jobData.duration) {
        throw new custom_error_1.CustomError('Duration is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (!jobData.location) {
        throw new custom_error_1.CustomError('Location is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    const existingJob = yield job_repo_1.default.findJobByEmployerAndUniqueFields(employer_id, jobData.job_title, jobData.location);
    if (existingJob) {
        throw new custom_error_1.CustomError('A job with the same title and location already exists for this employer', http_status_codes_1.StatusCodes.CONFLICT);
    }
    const { questions } = jobData, jobPayloadData = __rest(jobData, ["questions"]);
    const jobPayload = Object.assign(Object.assign({ employer_id }, jobPayloadData), { status: jobPayloadData.status || 'Pending' });
    const job = yield job_repo_1.default.createJob(jobPayload);
    // Create questions if provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
        yield job_repo_1.default.createJobQuestions(job.job_id, questions);
    }
    // Return job with questions
    const createdJob = yield job_repo_1.default.findJobById(job.job_id);
    if (!createdJob) {
        throw new custom_error_1.CustomError('Failed to retrieve created job', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    }
    return createdJob;
});
exports.createJobService = createJobService;
const getAllJobsService = (status) => __awaiter(void 0, void 0, void 0, function* () {
    return yield job_repo_1.default.findAllJobs(status);
});
exports.getAllJobsService = getAllJobsService;
const getJobsByStatusService = (status) => __awaiter(void 0, void 0, void 0, function* () {
    return yield job_repo_1.default.findAllJobs(status);
});
exports.getJobsByStatusService = getJobsByStatusService;
const getJobByIdService = (job_id) => __awaiter(void 0, void 0, void 0, function* () {
    const job = yield job_repo_1.default.findJobById(job_id);
    if (!job) {
        throw new custom_error_1.CustomError(messages_1.Messages.Job.JOB_NOT_FOUND, http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    return job;
});
exports.getJobByIdService = getJobByIdService;
const updateJobService = (job_id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    if (updates.employer_name) {
        const employer = yield job_repo_1.default.findEmployerByNameAndRole(updates.employer_name);
        if (!employer) {
            throw new custom_error_1.CustomError('Employer not found', http_status_codes_1.StatusCodes.NOT_FOUND);
        }
        updates.employer_id = employer.user_id;
        delete updates.employer_name;
    }
    const { questions } = updates, jobUpdates = __rest(updates, ["questions"]);
    const updated = yield job_repo_1.default.updateJob(job_id, jobUpdates);
    if (!updated) {
        throw new custom_error_1.CustomError(messages_1.Messages.Job.JOB_NOT_FOUND, http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    // Update questions if provided
    if (questions !== undefined) {
        if (Array.isArray(questions)) {
            if (questions.length > 0) {
                yield job_repo_1.default.createJobQuestions(job_id, questions);
            }
            else {
                // If empty array, delete all questions
                yield database_1.DB.JobQuestions.destroy({ where: { job_id } });
            }
        }
        // Return updated job with questions
        const updatedJob = yield job_repo_1.default.findJobById(job_id);
        if (!updatedJob) {
            throw new custom_error_1.CustomError('Failed to retrieve updated job', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
        }
        return updatedJob;
    }
    return updated;
});
exports.updateJobService = updateJobService;
const deleteJobService = (job_id) => __awaiter(void 0, void 0, void 0, function* () {
    const deleted = yield job_repo_1.default.deleteJob(job_id);
    if (!deleted) {
        throw new custom_error_1.CustomError(messages_1.Messages.Job.JOB_NOT_FOUND, http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    return { message: messages_1.Messages.Job.DELETE_JOB };
});
exports.deleteJobService = deleteJobService;
// Toggle job status between Active and Inactive (employer only)
const toggleJobStatusService = (job_id, user_id, userRole) => __awaiter(void 0, void 0, void 0, function* () {
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
    // Only employer and superadmin can toggle job status
    if (roleType !== 'employer' &&
        roleType !== 'superAdmin' &&
        roleName !== 'superadmin') {
        throw new custom_error_1.CustomError('Only employer and superadmin users can toggle job status', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    // Get the job
    const job = yield job_repo_1.default.findJobById(job_id);
    if (!job) {
        throw new custom_error_1.CustomError(messages_1.Messages.Job.JOB_NOT_FOUND, http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    // If user is employer, check if they own the job
    if (roleType === 'employer' && job.employer_id !== user_id) {
        throw new custom_error_1.CustomError('You can only toggle status for your own jobs', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    // Check if job status can be toggled (Active, Inactive, and Pending can be toggled)
    if (job.status !== 'Active' &&
        job.status !== 'Inactive' &&
        job.status !== 'Pending') {
        throw new custom_error_1.CustomError('Only Active, Inactive, or Pending jobs can have their status toggled', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Toggle status: Active -> Inactive, Inactive -> Active, Pending -> Active
    let newStatus;
    if (job.status === 'Active') {
        newStatus = 'Inactive';
    }
    else if (job.status === 'Inactive') {
        newStatus = 'Active';
    }
    else if (job.status === 'Pending') {
        newStatus = 'Active';
    }
    else {
        newStatus = 'Active'; // Default fallback
    }
    const updated = yield job_repo_1.default.updateJob(job_id, { status: newStatus });
    if (!updated) {
        throw new custom_error_1.CustomError('Failed to update job status', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    }
    return updated;
});
exports.toggleJobStatusService = toggleJobStatusService;
