"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const course_controller_1 = require("./course.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const courseRouter = express_1.default.Router();
// View courses - requires view permission
courseRouter.get('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'view'), course_controller_1.getAllCourses);
courseRouter.get('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'view'), course_controller_1.getCourseById);
// Create course - only CourseAdmin or superAdmin can create courses
courseRouter.post('/', auth_middleware_1.authMiddleware, role_middleware_1.courseAdminOrSuperadminOnly, course_controller_1.createCourse);
// Update course - requires edit permission
courseRouter.put('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'edit'), course_controller_1.updateCourse);
// Delete course - requires delete permission
courseRouter.delete('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/courses', 'delete'), course_controller_1.deleteCourse);
exports.default = courseRouter;
