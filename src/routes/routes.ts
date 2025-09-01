import authRouter from '@/modules/auth/auth.routes';
import jobRouter from '@/modules/job/job.routes';
import recordRouter from '@/modules/ReportCardUpload/record.route';
import express from 'express';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/jobs', jobRouter);
router.use('/upload/students', recordRouter);

export default router;
