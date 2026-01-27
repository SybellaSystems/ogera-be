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
exports.RoleService = void 0;
const role_repo_1 = require("./role.repo");
class RoleService {
    constructor() {
        this.repo = new role_repo_1.RoleRepository();
    }
    // Create a role with roleName, roleType, and permission_json
    createRole(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate roleName
            if (!payload.roleName || payload.roleName.trim() === '') {
                throw new Error('Role name is required');
            }
            // Validate roleType
            const validRoleTypes = ['student', 'employer', 'superAdmin', 'admin'];
            if (!payload.roleType || !validRoleTypes.includes(payload.roleType)) {
                throw new Error(`Role type must be one of: ${validRoleTypes.join(', ')}`);
            }
            // Check if role already exists
            const existingRole = yield this.repo.getRoleByName(payload.roleName);
            if (existingRole) {
                throw new Error(`Role '${payload.roleName}' already exists`);
            }
            // If permission_json is not provided, initialize with empty array
            if (!payload.permission_json) {
                payload.permission_json = [];
            }
            // Validate permission_json structure if provided
            if (Array.isArray(payload.permission_json) &&
                payload.permission_json.length > 0) {
                for (const perm of payload.permission_json) {
                    if (!perm.route || typeof perm.route !== 'string') {
                        throw new Error('Each permission must have a valid route');
                    }
                    if (!perm.permission || typeof perm.permission !== 'object') {
                        throw new Error('Each permission must have a permission object');
                    }
                    const { edit, view, create, delete: del } = perm.permission;
                    if (typeof edit !== 'boolean' ||
                        typeof view !== 'boolean' ||
                        typeof create !== 'boolean' ||
                        typeof del !== 'boolean') {
                        throw new Error('Permission must have boolean values for edit, view, create, and delete');
                    }
                }
            }
            // Convert permission_json array to JSON string for storage
            const roleData = {
                roleName: payload.roleName,
                roleType: payload.roleType,
                permission_json: JSON.stringify(payload.permission_json),
            };
            return this.repo.createRole(roleData);
        });
    }
    // Get all roles
    getAllRoles() {
        return __awaiter(this, void 0, void 0, function* () {
            const roles = yield this.repo.getAllRoles();
            return roles.map(role => (Object.assign(Object.assign({}, role.toJSON()), { permission_json: typeof role.permission_json === 'string'
                    ? JSON.parse(role.permission_json)
                    : role.permission_json })));
        });
    }
    // Get role by ID
    getRoleById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const role = yield this.repo.getRoleById(id);
            if (!role)
                throw new Error('Role not found');
            return Object.assign(Object.assign({}, role.toJSON()), { permission_json: typeof role.permission_json === 'string'
                    ? JSON.parse(role.permission_json)
                    : role.permission_json });
        });
    }
    // Update role
    updateRole(id, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getRoleById(id);
            if (payload.permission_json) {
                if (!Array.isArray(payload.permission_json)) {
                    throw new Error('permission_json must be an array');
                }
                for (const perm of payload.permission_json) {
                    if (!perm.route || typeof perm.route !== 'string') {
                        throw new Error('Each permission must have a valid route');
                    }
                    if (!perm.permission || typeof perm.permission !== 'object') {
                        throw new Error('Each permission must have a permission object');
                    }
                }
                payload.permission_json = JSON.stringify(payload.permission_json);
            }
            yield this.repo.updateRole(id, payload);
            return this.getRoleById(id);
        });
    }
    // Delete role
    deleteRole(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getRoleById(id);
            return this.repo.deleteRole(id);
        });
    }
}
exports.RoleService = RoleService;
