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
exports.RoleController = void 0;
const role_service_1 = require("./role.service");
const roleService = new role_service_1.RoleService();
class RoleController {
    // Create a new role
    createRole(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const role = yield roleService.createRole(req.body);
                res.status(201).json({
                    message: 'Role created successfully',
                    data: role,
                });
            }
            catch (err) {
                res.status(400).json({ error: err.message });
            }
        });
    }
    // Get all roles
    getAllRoles(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const roles = yield roleService.getAllRoles();
                res.status(200).json(roles);
            }
            catch (err) {
                res.status(400).json({ error: err.message });
            }
        });
    }
    // Get role by ID
    getRoleById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const role = yield roleService.getRoleById(req.params.id);
                res.status(200).json(role);
            }
            catch (err) {
                res.status(404).json({ error: err.message });
            }
        });
    }
    // Update role
    updateRole(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updated = yield roleService.updateRole(req.params.id, req.body);
                res.status(200).json({
                    message: 'Role updated successfully',
                    data: updated,
                });
            }
            catch (err) {
                res.status(400).json({ error: err.message });
            }
        });
    }
    // Delete role
    deleteRole(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield roleService.deleteRole(req.params.id);
                res.status(200).json({ message: 'Role deleted successfully' });
            }
            catch (err) {
                res.status(400).json({ error: err.message });
            }
        });
    }
}
exports.RoleController = RoleController;
