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
exports.courseAdminOrSuperadminOnly = exports.adminOrSuperadminOnly = exports.superadminOnly = exports.PermissionChecker = void 0;
const custom_error_1 = require("../utils/custom-error");
const database_1 = require("../database");
const PermissionChecker = (route, action) => {
    return (req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.user) {
                return next(new custom_error_1.CustomError('Unauthorized', 401));
            }
            const roleName = req.user.role;
            // ⭐ Superadmin bypasses all permissions (case-insensitive)
            // Superadmin has full access to everything
            if ((roleName === null || roleName === void 0 ? void 0 : roleName.toLowerCase()) === 'superadmin') {
                return next();
            }
            // Load role from DB to check roleType
            const role = yield database_1.DB.Roles.findOne({ where: { roleName } });
            if (!role) {
                return next(new custom_error_1.CustomError('Role not found', 403));
            }
            // ⭐ If roleType is 'admin', bypass permission checks (for backward compatibility)
            // But note: Custom admin roles (like "job-admin") should still check permissions
            // So we only bypass if the roleName is exactly "admin" (legacy behavior)
            // For custom admin roles, we check permissions below
            if (roleName === 'admin' && role.roleType === 'admin') {
                return next();
            }
            // Parse permission_json if it's a string, otherwise use it as-is
            const permissions = typeof role.permission_json === 'string'
                ? JSON.parse(role.permission_json)
                : role.permission_json || [];
            for (const perm of permissions) {
                const permRoute = perm.route || '';
                const permActions = perm.permission || {};
                const isMatch = route === permRoute ||
                    route.startsWith(permRoute + '/') ||
                    (permRoute.includes('{') &&
                        route.split('/')[1] === permRoute.split('/')[1]);
                if (isMatch) {
                    if (permActions[action] === true) {
                        return next(); // ✔ PERMISSION GRANTED
                    }
                    return next(new custom_error_1.CustomError('Forbidden: You cannot perform this action', 403));
                }
            }
            return next(new custom_error_1.CustomError('Forbidden: No permission rule for this route', 403));
        }
        catch (error) {
            next(error); // ⭐ Prevent crashes
        }
    });
};
exports.PermissionChecker = PermissionChecker;
// -------------------- SUPERADMIN ONLY MIDDLEWARE --------------------
const superadminOnly = (req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return next(new custom_error_1.CustomError('Unauthorized', 401));
        }
        const roleName = req.user.role;
        // Check if user is superadmin (case-insensitive check)
        if ((roleName === null || roleName === void 0 ? void 0 : roleName.toLowerCase()) !== 'superadmin') {
            return next(new custom_error_1.CustomError('Forbidden: Only superadmin can perform this action', 403));
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.superadminOnly = superadminOnly;
// -------------------- ADMIN OR SUPERADMIN MIDDLEWARE --------------------
const adminOrSuperadminOnly = (req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return next(new custom_error_1.CustomError('Unauthorized', 401));
        }
        const roleName = req.user.role;
        // Check if user is superadmin (case-insensitive) or admin/subadmin
        if ((roleName === null || roleName === void 0 ? void 0 : roleName.toLowerCase()) !== 'superadmin' &&
            roleName !== 'admin' &&
            roleName !== 'subadmin') {
            return next(new custom_error_1.CustomError('Forbidden: Only admin or superadmin can perform this action', 403));
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.adminOrSuperadminOnly = adminOrSuperadminOnly;
// -------------------- COURSE ADMIN OR SUPERADMIN MIDDLEWARE --------------------
const courseAdminOrSuperadminOnly = (req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return next(new custom_error_1.CustomError('Unauthorized', 401));
        }
        const roleName = req.user.role;
        // ⭐ Superadmin bypasses (case-insensitive check)
        if ((roleName === null || roleName === void 0 ? void 0 : roleName.toLowerCase()) === 'superadmin') {
            return next();
        }
        // Load role from DB to check roleType
        const role = yield database_1.DB.Roles.findOne({ where: { roleName } });
        if (!role) {
            return next(new custom_error_1.CustomError('Forbidden: Only CourseAdmin or superAdmin can create courses', 403));
        }
        // Check if user is CourseAdmin (case-insensitive) with admin roleType
        if ((roleName === null || roleName === void 0 ? void 0 : roleName.toLowerCase()) === 'courseadmin' && role.roleType === 'admin') {
            return next();
        }
        return next(new custom_error_1.CustomError('Forbidden: Only CourseAdmin or superAdmin can create courses', 403));
    }
    catch (error) {
        next(error);
    }
});
exports.courseAdminOrSuperadminOnly = courseAdminOrSuperadminOnly;
