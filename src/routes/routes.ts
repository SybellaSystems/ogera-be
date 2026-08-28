import authRouter from '@/modules/auth/auth.routes';
import roleRouter from '@/modules/role/role.routes';
import permissionRouter from '@/modules/permission/permission.routes';
import sessionRouter from '@/modules/session/session.routes';
import jobRouter from '@/modules/job/job.routes';
import jobCategoryRouter from '@/modules/jobCategory/jobCategory.routes';
import jobApplicationRouter from '@/modules/jobApplication/jobApplication.routes';
import academicVerificationRouter from '@/modules/academicVerification/academicVerification.routes';
import notificationRouter from '@/modules/notification/notification.routes';
import trustScoreRouter from '@/modules/trustScore/trustScore.routes';
import profileRouter from '@/modules/profile/profile.routes';
import userRouter from '@/modules/user/user.routes';
import courseRouter from '@/modules/course/course.routes';
import pesapalRouter from '@/modules/pesapal/pesapal.routes';
import momoRouter from '@/modules/momo/momo.routes';
import dashboardRouter from '@/modules/dashboard/dashboard.routes';
import disputeRouter from '@/modules/dispute/dispute.routes';
import cognitiveTestRouter from '@/modules/cognitiveTest/cognitiveTest.routes';
import problemMetricRouter from '@/modules/problemMetric/problemMetric.routes';
import academicRecordRouter from '@/modules/academicRecord/academicRecord.routes';

import contactRouter from '@/modules/contact/contact.routes';
import interviewRouter from '@/modules/interview/interview.routes';

import taskRouter from '@/modules/task/task.routes';
import messagesRouter from '@/modules/messages/messages.routes';
import badgeRouter from '@/modules/badge/badge.routes';

import jobReactionRouter from "@/modules/jobReaction/jobReaction.routes";
import communityWorkspaceRouter from '@/modules/communityWorkspace/communityWorkspace.routes';
import jobReferralRouter from '@/modules/jobReferral/jobReferral.routes';

import express from 'express';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/roles', roleRouter);
router.use('/permissions', permissionRouter);
router.use('/sessions', sessionRouter);
router.use('/jobs', jobRouter);
router.use('/job-categories', jobCategoryRouter);
router.use('/', jobApplicationRouter);
router.use('/academic-verifications', academicVerificationRouter);
router.use('/notifications', notificationRouter);
router.use('/trust-score', trustScoreRouter);
router.use('/trustscore', trustScoreRouter);
router.use('/profile', profileRouter);
router.use('/users', userRouter);
router.use('/courses', courseRouter);
router.use('/payments', pesapalRouter);
router.use('/momo', momoRouter);
router.use('/dashboard', dashboardRouter);
router.use('/disputes', disputeRouter);
router.use('/cognitive-tests', cognitiveTestRouter);
router.use('/problem-metrics', problemMetricRouter);
router.use('/academic-records', academicRecordRouter);

router.use('/contact', contactRouter);
router.use('/interviews', interviewRouter);

router.use('/messages', messagesRouter);
router.use('/badge', badgeRouter);
router.use('/', taskRouter);

router.use("/", jobReactionRouter);
router.use('/community-workspace', communityWorkspaceRouter);
router.use('/job-referrals', jobReferralRouter);

export default router;
