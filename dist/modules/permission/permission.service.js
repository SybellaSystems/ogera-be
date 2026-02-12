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
exports.PermissionService = void 0;
const permission_repo_1 = require("./permission.repo");
class PermissionService {
    constructor() {
        this.repo = new permission_repo_1.PermissionRepository();
    }
    createPermission(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate api_name
            if (!payload.api_name || payload.api_name.trim() === '') {
                throw new Error('API name is required');
            }
            // Validate route
            if (!payload.route || payload.route.trim() === '') {
                throw new Error('Route is required');
            }
            // Validate permission object
            if (!payload.permission || typeof payload.permission !== 'object') {
                throw new Error('Permission object is required');
            }
            const { edit, view, create, delete: del } = payload.permission;
            if (typeof edit !== 'boolean' ||
                typeof view !== 'boolean' ||
                typeof create !== 'boolean' ||
                typeof del !== 'boolean') {
                throw new Error('Permission must have boolean values for edit, view, create, and delete');
            }
            // Check if api_name already exists
            const existingPermission = yield this.repo.getPermissionByApiName(payload.api_name);
            if (existingPermission) {
                throw new Error(`Permission with API name '${payload.api_name}' already exists`);
            }
            return this.repo.createPermission({
                api_name: payload.api_name.trim(),
                route: payload.route.trim(),
                permission: payload.permission,
            });
        });
    }
    getAllPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            const permissions = yield this.repo.getAllPermissions();
            return permissions.map(permission => (Object.assign(Object.assign({}, permission.toJSON()), { permission: typeof permission.permission === 'string'
                    ? JSON.parse(permission.permission)
                    : permission.permission })));
        });
    }
    getPermissionById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const permission = yield this.repo.getPermissionById(id);
            if (!permission)
                throw new Error('Permission not found');
            return Object.assign(Object.assign({}, permission.toJSON()), { permission: typeof permission.permission === 'string'
                    ? JSON.parse(permission.permission)
                    : permission.permission });
        });
    }
    updatePermission(id, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getPermissionById(id);
            if (payload.permission) {
                if (typeof payload.permission !== 'object') {
                    throw new Error('Permission must be an object');
                }
                const { edit, view, create, delete: del } = payload.permission;
                if (typeof edit !== 'boolean' ||
                    typeof view !== 'boolean' ||
                    typeof create !== 'boolean' ||
                    typeof del !== 'boolean') {
                    throw new Error('Permission must have boolean values for edit, view, create, and delete');
                }
            }
            // Check if api_name is being updated and if it already exists
            if (payload.api_name) {
                const existingPermission = yield this.repo.getPermissionByApiName(payload.api_name);
                if (existingPermission && existingPermission.id !== id) {
                    throw new Error(`Permission with API name '${payload.api_name}' already exists`);
                }
            }
            const updateData = {};
            if (payload.api_name)
                updateData.api_name = payload.api_name.trim();
            if (payload.route)
                updateData.route = payload.route.trim();
            if (payload.permission)
                updateData.permission = payload.permission;
            yield this.repo.updatePermission(id, updateData);
            return this.getPermissionById(id);
        });
    }
    deletePermission(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getPermissionById(id);
            return this.repo.deletePermission(id);
        });
    }
    getPermissionByApiName(api_name) {
        return __awaiter(this, void 0, void 0, function* () {
            const permission = yield this.repo.getPermissionByApiName(api_name);
            if (!permission)
                return null;
            return Object.assign(Object.assign({}, permission.toJSON()), { permission: typeof permission.permission === 'string'
                    ? JSON.parse(permission.permission)
                    : permission.permission });
        });
    }
}
exports.PermissionService = PermissionService;
