import express from 'express';
import multer from 'multer';
import {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    uploadCourseContent,
    downloadCourseContent,
} from './course.controller';
import {
    markStepComplete,
    markStepIncomplete,
    getCourseProgress,
    getCourseCompletion,
    getAllCoursesProgress,
    checkCourseStarted,
    getCourseStudents,
    getCourseStatistics,
    getCourseSpecificStatistics,
} from './courseProgress.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { PermissionChecker, courseAdminOrSuperadminOnly } from '@/middlewares/role.middleware';

const courseRouter = express.Router();

/* -------------------- Multer Config -------------------- */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and image files are allowed.'));
        }
    },
});

// View courses - requires view permission
courseRouter.get(
    '/',
    authMiddleware,
    PermissionChecker('/courses', 'view'),
    getAllCourses,
);

// Get all courses progress for current user (must be before /:id route)
courseRouter.get(
    '/progress/all',
    authMiddleware,
    PermissionChecker('/courses', 'view'),
    getAllCoursesProgress,
);

// IMPORTANT: All specific routes with suffixes must come BEFORE /:id route
// Otherwise Express will match /:id first and these routes will never be reached

// Get course progress for a specific course
courseRouter.get(
    '/:course_id/progress',
    authMiddleware,
    PermissionChecker('/courses', 'view'),
    getCourseProgress,
);

// Get course completion percentage
courseRouter.get(
    '/:course_id/completion',
    authMiddleware,
    PermissionChecker('/courses', 'view'),
    getCourseCompletion,
);

// Check if student has started the course
courseRouter.get(
    '/:course_id/started',
    authMiddleware,
    PermissionChecker('/courses', 'view'),
    checkCourseStarted,
);

// Get all students enrolled in a course (for employers/admins)
courseRouter.get(
    '/:course_id/students',
    authMiddleware,
    PermissionChecker('/courses', 'view'),
    getCourseStudents,
);

// Get statistics for a specific course
courseRouter.get(
    '/:course_id/statistics',
    authMiddleware,
    PermissionChecker('/courses', 'view'),
    getCourseSpecificStatistics,
);

// Get course by ID (must be LAST to avoid conflicts with above routes)
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

// Upload course content (PDF or Image) - requires create permission
courseRouter.post(
    '/upload-content',
    authMiddleware,
    PermissionChecker('/courses', 'create'),
    upload.fields([
        { name: 'pdf', maxCount: 1 },
        { name: 'image', maxCount: 1 },
    ]),
    uploadCourseContent,
);

// Download course content (PDF or Image) - requires view permission
courseRouter.get(
    '/content/download',
    authMiddleware,
    PermissionChecker('/courses', 'view'),
    downloadCourseContent,
);

// Course Progress Routes
// Mark step as complete
courseRouter.post(
    '/progress/complete',
    authMiddleware,
    PermissionChecker('/courses', 'view'),
    markStepComplete,
);

// Mark step as incomplete
courseRouter.post(
    '/progress/incomplete',
    authMiddleware,
    PermissionChecker('/courses', 'view'),
    markStepIncomplete,
);

// Get overall course statistics (total courses, students, completions)
courseRouter.get(
    '/statistics/overview',
    authMiddleware,
    PermissionChecker('/courses', 'view'),
    getCourseStatistics,
);

export default courseRouter;


