import express from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { PermissionChecker } from '@/middlewares/role.middleware';
import {
    createTask,
    getEmployerTaskOverview,
    getMyAssignedTasks,
    getJobTaskManagement,
    updateTask,
    updateTaskStatus,
    deleteTask,
} from './task.controller';

const taskRouter = express.Router();

taskRouter.get(
    '/employer/task-management/jobs',
    authMiddleware,
    PermissionChecker('/jobs', 'view'),
    getEmployerTaskOverview,
);

taskRouter.get('/tasks/my-assigned', authMiddleware, getMyAssignedTasks);

taskRouter.get(
    '/jobs/:job_id/task-management',
    authMiddleware,
    PermissionChecker('/jobs', 'view'),
    getJobTaskManagement,
);

taskRouter.post(
    '/jobs/:job_id/tasks',
    authMiddleware,
    PermissionChecker('/jobs', 'create'),
    createTask,
);

taskRouter.put(
    '/jobs/:job_id/tasks/:task_id',
    authMiddleware,
    PermissionChecker('/jobs', 'edit'),
    updateTask,
);

taskRouter.patch(
    '/jobs/:job_id/tasks/:task_id/status',
    authMiddleware,
    updateTaskStatus,
);

taskRouter.delete(
    '/jobs/:job_id/tasks/:task_id',
    authMiddleware,
    PermissionChecker('/jobs', 'edit'),
    deleteTask,
);

export default taskRouter;
