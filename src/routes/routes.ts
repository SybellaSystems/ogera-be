import authRouter from '@/modules/auth/auth.routes';
import roleRouter from '@/modules/role/role.routes';
import jobRouter from '@/modules/job/job.routes';
import jobApplicationRouter from '@/modules/jobApplication/jobApplication.routes';
import academicVerificationRouter from '@/modules/academicVerification/academicVerification.routes';
import notificationRouter from '@/modules/notification/notification.routes';
import express from 'express';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/roles', roleRouter);
router.use('/jobs', jobRouter);
router.use('/', jobApplicationRouter);
router.use('/academic-verifications', academicVerificationRouter);
router.use('/notifications', notificationRouter);

export default router;
