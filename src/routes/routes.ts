import authRouter from '@/modules/auth/auth.routes';
import roleRouter from '@/modules/role/role.routes';
import express from 'express';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/roles', roleRouter)

export default router;
