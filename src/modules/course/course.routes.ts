import express from 'express';
import multer from 'multer';
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
    uploadCourseVideo,
    streamCourseVideo,
    getStudentCompletedCourses,
    getCourseChatHistory,
} from './course.controller';
import {
    authMiddleware,
    authMiddlewareOrQueryToken,
} from '@/middlewares/auth.middleware';
import {
    PermissionChecker,
    courseAdminOrSuperadminOnly,
} from '@/middlewares/role.middleware';

const courseRouter = express.Router();

const videoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'video/mp4',
            'video/webm',
            'video/ogg',
            'video/quicktime',
        ];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only MP4, WebM, OGG, MOV videos are allowed'));
    },
});

courseRouter.get('/my-enrollments', authMiddleware, getMyEnrollments);

courseRouter.get(
    '/student/:user_id/completed',
    authMiddleware,
    getStudentCompletedCourses,
);

courseRouter.post(
    '/upload-video',
    authMiddleware,
    courseAdminOrSuperadminOnly,
    videoUpload.single('video'),
    uploadCourseVideo,
);

courseRouter.get(
    '/videos/stream',
    authMiddlewareOrQueryToken,
    streamCourseVideo,
);

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

courseRouter.get('/:id/chat', authMiddleware, getCourseChatHistory);

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
