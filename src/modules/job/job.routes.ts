import express from 'express';
import {
    createJob,
    getAllJobs,
    getActiveJobs,
    getPendingJobs,
    getCompletedJobs,
    getJobById,
    updateJob,
    deleteJob,
    toggleJobStatus,
} from './job.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { PermissionChecker } from '@/middlewares/role.middleware';

const jobRouter = express.Router();

// View jobs - requires view permission
jobRouter.get(
    '/',
    authMiddleware,
    PermissionChecker('/jobs', 'view'),
    getAllJobs,
);

// Get active jobs
jobRouter.get(
    '/active',
    authMiddleware,
    PermissionChecker('/jobs', 'view'),
    getActiveJobs,
);

// Get pending jobs
jobRouter.get(
    '/pending',
    authMiddleware,
    PermissionChecker('/jobs', 'view'),
    getPendingJobs,
);

// Get completed jobs
jobRouter.get(
    '/completed',
    authMiddleware,
    PermissionChecker('/jobs', 'view'),
    getCompletedJobs,
);

jobRouter.get(
    '/:id',
    authMiddleware,
    PermissionChecker('/jobs', 'view'),
    getJobById,
);

// Create job - requires create permission
jobRouter.post(
    '/',
    authMiddleware,
    PermissionChecker('/jobs', 'create'),
    createJob,
);

// Update job - requires edit permission
jobRouter.put(
    '/:id',
    authMiddleware,
    PermissionChecker('/jobs', 'edit'),
    updateJob,
);

// Delete job - requires delete permission
jobRouter.delete(
    '/:id',
    authMiddleware,
    PermissionChecker('/jobs', 'delete'),
    deleteJob,
);

// Toggle job status (Active/Inactive) - requires edit permission
jobRouter.patch(
    '/:id/toggle-status',
    authMiddleware,
    PermissionChecker('/jobs', 'edit'),
    toggleJobStatus,
);

export default jobRouter;
