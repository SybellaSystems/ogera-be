import express from 'express';
import {
    createJob,
    getAllJobs,
    getPublicJobs,
    getActiveJobs,
    getPendingJobs,
    getCompletedJobs,
    getJobById,
    updateJob,
    reviewJob,
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

// Get active jobs - public endpoint for landing page
jobRouter.get('/public', getPublicJobs);

// Get active jobs - public endpoint for landing page
jobRouter.get('/active', getActiveJobs);

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

// Get single job by ID - public endpoint for landing page
jobRouter.get('/:id', getJobById);

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

// Review job (Approve/Disapprove) — only admin/superadmin enforced in service.
// No permission_json gate here to avoid blocking built-in admins.
jobRouter.patch('/:id/review', authMiddleware, reviewJob);

// Delete job — service enforces: admin/superadmin can delete any job,
// employers can delete their own. No permission_json gate because admins
// without "/jobs delete" in their JSON permissions were being blocked.
jobRouter.delete('/:id', authMiddleware, deleteJob);

// Toggle job status (Active/Inactive) - requires edit permission
jobRouter.patch(
    '/:id/toggle-status',
    authMiddleware,
    PermissionChecker('/jobs', 'edit'),
    toggleJobStatus,
);

export default jobRouter;
