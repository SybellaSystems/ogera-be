import express from 'express';
import {
    createPermission,
    getAllPermissions,
    getPermissionById,
    updatePermission,
    deletePermission,
    getAllRoutes,
} from './permission.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { superadminOnly } from '@/middlewares/role.middleware';

const permissionRouter = express.Router();

// All routes require authentication and superadmin role
permissionRouter.post(
    '/',
    authMiddleware,
    superadminOnly,
    createPermission,
);

permissionRouter.get(
    '/',
    authMiddleware,
    superadminOnly,
    getAllPermissions,
);

permissionRouter.get(
    '/routes',
    authMiddleware,
    superadminOnly,
    getAllRoutes,
);

permissionRouter.get(
    '/:id',
    authMiddleware,
    superadminOnly,
    getPermissionById,
);

permissionRouter.put(
    '/:id',
    authMiddleware,
    superadminOnly,
    updatePermission,
);

permissionRouter.delete(
    '/:id',
    authMiddleware,
    superadminOnly,
    deletePermission,
);

export default permissionRouter;


