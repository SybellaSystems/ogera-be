import express from 'express';
import {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from './jobCategory.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { PermissionChecker } from '@/middlewares/role.middleware';

const jobCategoryRouter = express.Router();

// Get all categories - public endpoint (for dropdowns)
jobCategoryRouter.get(
    '/',
    authMiddleware,
    getAllCategories,
);

// Get category by ID
jobCategoryRouter.get(
    '/:id',
    authMiddleware,
    getCategoryById,
);

// Create category - only superadmin
jobCategoryRouter.post(
    '/',
    authMiddleware,
    createCategory,
);

// Update category - only superadmin
jobCategoryRouter.put(
    '/:id',
    authMiddleware,
    updateCategory,
);

// Delete category - only superadmin
jobCategoryRouter.delete(
    '/:id',
    authMiddleware,
    deleteCategory,
);

export default jobCategoryRouter;

