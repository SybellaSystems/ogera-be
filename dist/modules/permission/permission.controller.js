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
        // Check if permission already exists - return existing one with helpful message
        if (error.message && error.message.includes('already exists')) {
            try {
                const existingPermission = yield permissionService.getPermissionByApiName(req.body.api_name);
                if (existingPermission) {
                    // Return existing permission with a message suggesting to use update
                    return res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
                        success: false,
                        message: `Permission with API name '${req.body.api_name}' already exists. Please update the existing permission instead.`,
                        data: existingPermission,
                        errorCode: 'PERMISSION_ALREADY_EXISTS',
                    });
                }
            }
            catch (findError) {
                // If we can't find it, continue with original error
            }
        }
        // Return error response instead of throwing (prevents app crash)
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: error.message || 'Failed to create permission',
            error: error.message,
        });
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
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to retrieve permissions',
            error: error.message,
        });
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
        res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
            success: false,
            message: error.message || 'Failed to retrieve permission',
            error: error.message,
        });
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
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: error.message || 'Failed to update permission',
            error: error.message,
        });
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
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: error.message || 'Failed to delete permission',
            error: error.message,
        });
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
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to retrieve routes',
            error: error.message,
        });
    }
});
exports.getAllRoutes = getAllRoutes;
