import express from 'express';
import {
    createJob,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
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

export default jobRouter;
