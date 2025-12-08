import authRouter from '@/modules/auth/auth.routes';
import roleRouter from '@/modules/role/role.routes';
import jobRouter from '@/modules/job/job.routes';
import academicVerificationRouter from '@/modules/academicVerification/academicVerification.routes';
import express from 'express';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/roles', roleRouter)
router.use('/jobs', jobRouter);
router.use('/academic-verifications', academicVerificationRouter);

export default router;
