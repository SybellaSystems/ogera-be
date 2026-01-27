"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const userRouter = express_1.default.Router();
// Get all users - requires view permission
userRouter.get('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/users', 'view'), user_controller_1.getAllUsers);
// Get all students - requires view permission
userRouter.get('/students', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/users', 'view'), user_controller_1.getAllStudents);
// Get all employers - requires view permission
userRouter.get('/employers', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/users', 'view'), user_controller_1.getAllEmployers);
exports.default = userRouter;
