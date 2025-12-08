// modules/role/role.routes.ts
import { Router } from 'express';
import { RoleController } from './role.controller';

const router = Router();
const controller = new RoleController();

// Allow creating superadmin role without auth, but require auth for other roles
// The controller will handle the authentication check based on the role being created
router.post('/create', controller.createRole);
router.get('/', controller.getAllRoles);
router.get('/:id', controller.getRoleById);
// Update role - requires superadmin authentication (handled in controller)
router.put('/:id', controller.updateRole);
router.delete('/:id', controller.deleteRole);

export default router;
