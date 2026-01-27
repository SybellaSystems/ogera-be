"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// modules/role/role.routes.ts
const express_1 = require("express");
const role_controller_1 = require("./role.controller");
const router = (0, express_1.Router)();
const controller = new role_controller_1.RoleController();
// Allow creating superadmin role without auth, but require auth for other roles
// The controller will handle the authentication check based on the role being created
router.post('/create', controller.createRole);
router.get('/', controller.getAllRoles);
router.get('/:id', controller.getRoleById);
// Update role - requires superadmin authentication (handled in controller)
router.put('/:id', controller.updateRole);
router.delete('/:id', controller.deleteRole);
exports.default = router;
