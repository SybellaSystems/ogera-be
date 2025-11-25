// modules/role/role.routes.ts
import { Router } from 'express';
import { RoleController } from './role.controller';

const router = Router();
const controller = new RoleController();

router.post('/create', controller.createRole);
router.get('/', controller.getAllRoles);
router.get('/:id', controller.getRoleById);
router.put('/:id', controller.updateRole);
router.delete('/:id', controller.deleteRole);

export default router;
