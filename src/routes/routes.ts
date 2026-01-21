import authRouter from '@/modules/auth/auth.routes';
import roleRouter from '@/modules/role/role.routes';
import permissionRouter from '@/modules/permission/permission.routes';
import jobRouter from '@/modules/job/job.routes';
import jobApplicationRouter from '@/modules/jobApplication/jobApplication.routes';
import academicVerificationRouter from '@/modules/academicVerification/academicVerification.routes';
import notificationRouter from '@/modules/notification/notification.routes';
import trustScoreRouter from '@/modules/trustScore/trustScore.routes';
import profileRouter from '@/modules/profile/profile.routes';
import userRouter from '@/modules/user/user.routes';
import express from 'express';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/roles', roleRouter);
router.use('/permissions', permissionRouter);
router.use('/jobs', jobRouter);
router.use('/', jobApplicationRouter);
router.use('/academic-verifications', academicVerificationRouter);
router.use('/notifications', notificationRouter);
router.use('/trust-score', trustScoreRouter);
router.use('/profile', profileRouter);
router.use('/users', userRouter);

export default router;
