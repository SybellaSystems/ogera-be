"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRoutes = exports.deletePermission = exports.updatePermission = exports.getPermissionById = exports.getAllPermissions = exports.createPermission = void 0;
const permission_service_1 = require("./permission.service");
const http_status_codes_1 = require("http-status-codes");
const custom_error_1 = require("../../utils/custom-error");
const permissionService = new permission_service_1.PermissionService();
const createPermission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const permission = yield permissionService.createPermission(req.body);
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            message: 'Permission created successfully',
            data: permission,
        });
    }
    catch (error) {
        throw new custom_error_1.CustomError(error.message || 'Failed to create permission', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
});
exports.createPermission = createPermission;
const getAllPermissions = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const permissions = yield permissionService.getAllPermissions();
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: 'Permissions retrieved successfully',
            data: permissions,
        });
    }
    catch (error) {
        throw new custom_error_1.CustomError(error.message || 'Failed to retrieve permissions', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    }
});
exports.getAllPermissions = getAllPermissions;
const getPermissionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const permission = yield permissionService.getPermissionById(id);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: 'Permission retrieved successfully',
            data: permission,
        });
    }
    catch (error) {
        throw new custom_error_1.CustomError(error.message || 'Failed to retrieve permission', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
});
exports.getPermissionById = getPermissionById;
const updatePermission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const permission = yield permissionService.updatePermission(id, req.body);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: 'Permission updated successfully',
            data: permission,
        });
    }
    catch (error) {
        throw new custom_error_1.CustomError(error.message || 'Failed to update permission', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
});
exports.updatePermission = updatePermission;
const deletePermission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield permissionService.deletePermission(id);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: 'Permission deleted successfully',
        });
    }
    catch (error) {
        throw new custom_error_1.CustomError(error.message || 'Failed to delete permission', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
});
exports.deletePermission = deletePermission;
// Get all available routes (excluding auth routes)
const getAllRoutes = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // List of all routes excluding auth routes
        const routes = [
            '/jobs',
            '/academic-verifications',
            '/notifications',
            '/roles',
            '/disputes',
            '/analytics',
            '/transactions',
            '/job-applications',
            '/trust-score',
            '/profile',
            '/users',
            '/courses',
        ];
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: 'Routes retrieved successfully',
            data: routes,
        });
    }
    catch (error) {
        throw new custom_error_1.CustomError(error.message || 'Failed to retrieve routes', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    }
});
exports.getAllRoutes = getAllRoutes;
