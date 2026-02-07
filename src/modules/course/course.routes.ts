import express from 'express';
import {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    enrollCourse,
    getMyEnrollments,
    getEnrollment,
    completeCourse,
    getEnrollmentsPendingReview,
    updateCertificateStatus,
} from './course.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
    PermissionChecker,
    courseAdminOrSuperadminOnly,
} from '@/middlewares/role.middleware';

const courseRouter = express.Router();

// Must be before /:id so "my-enrollments" and "enrollments" are not parsed as id
courseRouter.get('/my-enrollments', authMiddleware, getMyEnrollments);

courseRouter.get(
    '/enrollments/pending-review',
    authMiddleware,
    PermissionChecker('/courses', 'view'),
    getEnrollmentsPendingReview,
);

courseRouter.put(
    '/enrollments/:enrollment_id/certificate',
    authMiddleware,
    PermissionChecker('/courses', 'edit'),
    updateCertificateStatus,
);

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

// Student enrollment flow: enroll → complete → (admin reviews certificate)
courseRouter.post('/:id/enroll', authMiddleware, enrollCourse);

courseRouter.get('/:id/enrollment', authMiddleware, getEnrollment);

courseRouter.post('/:id/complete', authMiddleware, completeCourse);

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
