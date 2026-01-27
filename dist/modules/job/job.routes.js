"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const job_controller_1 = require("./job.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const jobRouter = express_1.default.Router();
// View jobs - requires view permission
jobRouter.get('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/jobs', 'view'), job_controller_1.getAllJobs);
// Get active jobs
jobRouter.get('/active', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/jobs', 'view'), job_controller_1.getActiveJobs);
// Get pending jobs
jobRouter.get('/pending', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/jobs', 'view'), job_controller_1.getPendingJobs);
// Get completed jobs
jobRouter.get('/completed', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/jobs', 'view'), job_controller_1.getCompletedJobs);
jobRouter.get('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/jobs', 'view'), job_controller_1.getJobById);
// Create job - requires create permission
jobRouter.post('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/jobs', 'create'), job_controller_1.createJob);
// Update job - requires edit permission
jobRouter.put('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/jobs', 'edit'), job_controller_1.updateJob);
// Delete job - requires delete permission
jobRouter.delete('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/jobs', 'delete'), job_controller_1.deleteJob);
// Toggle job status (Active/Inactive) - requires edit permission
jobRouter.patch('/:id/toggle-status', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/jobs', 'edit'), job_controller_1.toggleJobStatus);
exports.default = jobRouter;
