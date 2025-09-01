import authRouter from '@/modules/auth/auth.routes';
import jobRouter from '@/modules/job/job.routes';
import express from 'express';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/jobs', jobRouter); 

export default router;
