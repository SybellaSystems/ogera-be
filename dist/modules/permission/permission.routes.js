"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const permission_controller_1 = require("./permission.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const permissionRouter = express_1.default.Router();
// All routes require authentication and superadmin role
permissionRouter.post('/', auth_middleware_1.authMiddleware, role_middleware_1.superadminOnly, permission_controller_1.createPermission);
permissionRouter.get('/', auth_middleware_1.authMiddleware, role_middleware_1.superadminOnly, permission_controller_1.getAllPermissions);
permissionRouter.get('/routes', auth_middleware_1.authMiddleware, role_middleware_1.superadminOnly, permission_controller_1.getAllRoutes);
permissionRouter.get('/:id', auth_middleware_1.authMiddleware, role_middleware_1.superadminOnly, permission_controller_1.getPermissionById);
permissionRouter.put('/:id', auth_middleware_1.authMiddleware, role_middleware_1.superadminOnly, permission_controller_1.updatePermission);
permissionRouter.delete('/:id', auth_middleware_1.authMiddleware, role_middleware_1.superadminOnly, permission_controller_1.deletePermission);
exports.default = permissionRouter;
