"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const course_controller_1 = require("./course.controller");
const courseProgress_controller_1 = require("./courseProgress.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const courseRouter = express_1.default.Router();
/* -------------------- Multer Config -------------------- */
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
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
        }
        else {
            cb(new Error('Invalid file type. Only PDF and image files are allowed.'));
        }
    },
});
// View courses - requires view permission
courseRouter.get('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'view'), course_controller_1.getAllCourses);
// Get all courses progress for current user (must be before /:id route)
courseRouter.get('/progress/all', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'view'), courseProgress_controller_1.getAllCoursesProgress);
// IMPORTANT: All specific routes with suffixes must come BEFORE /:id route
// Otherwise Express will match /:id first and these routes will never be reached
// Get course progress for a specific course
courseRouter.get('/:course_id/progress', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'view'), courseProgress_controller_1.getCourseProgress);
// Get course completion percentage
courseRouter.get('/:course_id/completion', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'view'), courseProgress_controller_1.getCourseCompletion);
// Check if student has started the course
courseRouter.get('/:course_id/started', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'view'), courseProgress_controller_1.checkCourseStarted);
// Get all students enrolled in a course (for employers/admins)
courseRouter.get('/:course_id/students', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'view'), courseProgress_controller_1.getCourseStudents);
// Get statistics for a specific course
courseRouter.get('/:course_id/statistics', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'view'), courseProgress_controller_1.getCourseSpecificStatistics);
// Get course by ID (must be LAST to avoid conflicts with above routes)
courseRouter.get('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'view'), course_controller_1.getCourseById);
// Create course - only CourseAdmin or superAdmin can create courses
courseRouter.post('/', auth_middleware_1.authMiddleware, role_middleware_1.courseAdminOrSuperadminOnly, course_controller_1.createCourse);
// Update course - requires edit permission
courseRouter.put('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'edit'), course_controller_1.updateCourse);
// Delete course - requires delete permission
courseRouter.delete('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'delete'), course_controller_1.deleteCourse);
// Upload course content (PDF or Image) - requires create permission
courseRouter.post('/upload-content', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'create'), upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'image', maxCount: 1 },
]), course_controller_1.uploadCourseContent);
// Download course content (PDF or Image) - requires view permission
courseRouter.get('/content/download', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'view'), course_controller_1.downloadCourseContent);
// Course Progress Routes
// Mark step as complete
courseRouter.post('/progress/complete', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'view'), courseProgress_controller_1.markStepComplete);
// Mark step as incomplete
courseRouter.post('/progress/incomplete', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'view'), courseProgress_controller_1.markStepIncomplete);
// Get overall course statistics (total courses, students, completions)
courseRouter.get('/statistics/overview', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'view'), courseProgress_controller_1.getCourseStatistics);
exports.default = courseRouter;
