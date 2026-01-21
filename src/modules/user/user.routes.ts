import express from 'express';
import {
    getAllUsers,
    getAllStudents,
    getAllEmployers,
} from './user.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { PermissionChecker } from '@/middlewares/role.middleware';

const userRouter = express.Router();

// Get all users - requires view permission
userRouter.get(
    '/',
    authMiddleware,
    PermissionChecker('/users', 'view'),
    getAllUsers,
);

// Get all students - requires view permission
userRouter.get(
    '/students',
    authMiddleware,
    PermissionChecker('/users', 'view'),
    getAllStudents,
);

// Get all employers - requires view permission
userRouter.get(
    '/employers',
    authMiddleware,
    PermissionChecker('/users', 'view'),
    getAllEmployers,
);

export default userRouter;

