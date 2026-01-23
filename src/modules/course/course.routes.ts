import express from 'express';
import {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
} from './course.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { PermissionChecker, courseAdminOrSuperadminOnly } from '@/middlewares/role.middleware';

const courseRouter = express.Router();

// View courses - requires view permission
courseRouter.get(
    '/',
    authMiddleware,
    PermissionChecker('/courses', 'view'),
    getAllCourses,
);

courseRouter.get(
    '/:id',
    authMiddleware,
    PermissionChecker('/courses', 'view'),
    getCourseById,
);

// Create course - only CourseAdmin or superAdmin can create courses
courseRouter.post(
    '/',
    authMiddleware,
    courseAdminOrSuperadminOnly,
    createCourse,
);

// Update course - requires edit permission
courseRouter.put(
    '/:id',
    authMiddleware,
    PermissionChecker('/courses', 'edit'),
    updateCourse,
);

// Delete course - requires delete permission
courseRouter.delete(
    '/:id',
    authMiddleware,
    PermissionChecker('/courses', 'delete'),
    deleteCourse,
);

export default courseRouter;


