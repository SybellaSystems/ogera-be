import express from 'express';

import jobReferralController from './jobReferral.controller';

import { authMiddleware } from '@/middlewares/auth.middleware';
import { PermissionChecker } from '@/middlewares/role.middleware';

const jobReferralRouter = express.Router();

/**
 * ============================================================
 * JOB REFERRAL ROUTES
 * ============================================================
 */

/**
 * Create a new job referral
 */
jobReferralRouter.post(
    '/',
    authMiddleware,
    PermissionChecker('/job-referrals', 'create'),
    jobReferralController.create,
);

/**
 * Get all job referrals
 */
jobReferralRouter.get(
    '/',
    authMiddleware,
    PermissionChecker('/job-referrals', 'view'),
    jobReferralController.getAll,
);

/**
 * Search job referrals
 */
jobReferralRouter.get(
    '/search',
    authMiddleware,
    PermissionChecker('/job-referrals', 'view'),
    jobReferralController.search,
);

/**
 * Get referral statistics
 */
jobReferralRouter.get(
    '/statistics',
    authMiddleware,
    PermissionChecker('/job-referrals', 'view'),
    jobReferralController.getStatistics,
);

/**
 * Get total referral views
 */
jobReferralRouter.get(
    '/statistics/views',
    authMiddleware,
    PermissionChecker('/job-referrals', 'view'),
    jobReferralController.getTotalViews,
);

/**
 * Get total referral apply clicks
 */
jobReferralRouter.get(
    '/statistics/apply-clicks',
    authMiddleware,
    PermissionChecker('/job-referrals', 'view'),
    jobReferralController.getTotalApplyClicks,
);

/**
 * Get referrals created by a specific user
 */
jobReferralRouter.get(
    '/creator/:created_by',
    authMiddleware,
    PermissionChecker('/job-referrals', 'view'),
    jobReferralController.getByCreator,
);

/**
 * Get active verified referrals available to students
 */
jobReferralRouter.get(
    '/available',
    authMiddleware,
    PermissionChecker('/job-referrals', 'view'),
    jobReferralController.getActiveVerified,
);

/**
 * Get a specific referral available to students
 */
jobReferralRouter.get(
    '/available/:referral_id',
    authMiddleware,
    PermissionChecker(
        '/job-referrals',
        'view',
    ),
    jobReferralController.getAvailableById,
);


jobReferralRouter.patch(
    '/:referral_id/approve',
    authMiddleware,
    PermissionChecker(
        '/job-referrals',
        'edit',
    ),
    jobReferralController.approveReferral,
);

jobReferralRouter.patch(
    '/:referral_id/reject',
    authMiddleware,
    PermissionChecker(
        '/job-referrals',
        'edit',
    ),
    jobReferralController.rejectReferral,
);

/**
 * Referral analytics summary
 *
 * Admin / Superadmin
 */
jobReferralRouter.get(
    '/analytics',
    authMiddleware,
    PermissionChecker(
        '/job-referrals',
        'view',
    ),
    jobReferralController.getAnalyticsSummary,
);

/**
 * Top performing referrals
 */
jobReferralRouter.get(
    '/analytics/top-performing',
    authMiddleware,
    PermissionChecker(
        '/job-referrals',
        'view',
    ),
    jobReferralController.getTopPerformingReferrals,
);

/**
 * Analytics for current user's referrals
 */
jobReferralRouter.get(
    '/analytics/my',
    authMiddleware,
    PermissionChecker(
        '/job-referrals',
        'view',
    ),
    jobReferralController.getCreatorAnalytics,
);

/**
 * Analytics for one referral
 */
jobReferralRouter.get(
    '/:referral_id/analytics',
    authMiddleware,
    PermissionChecker(
        '/job-referrals',
        'view',
    ),
    jobReferralController.getReferralAnalytics,
);

/**
 * Get referral by ID
 */
jobReferralRouter.get(
    '/:referral_id',
    authMiddleware,
    PermissionChecker('/job-referrals', 'view'),
    jobReferralController.getById,
);

/**
 * Update referral
 */
jobReferralRouter.put(
    '/:referral_id',
    authMiddleware,
    PermissionChecker('/job-referrals', 'edit'),
    jobReferralController.update,
);

/**
 * Delete referral
 */
jobReferralRouter.delete(
    '/:referral_id',
    authMiddleware,
    PermissionChecker('/job-referrals', 'delete'),
    jobReferralController.delete,
);

/**
 * Update verification / permission
 */
jobReferralRouter.patch(
    '/:referral_id/verification',
    authMiddleware,
    PermissionChecker('/job-referrals', 'edit'),
    jobReferralController.updateVerification,
);

/**
 * Update referral status
 */
jobReferralRouter.patch(
    '/:referral_id/status',
    authMiddleware,
    PermissionChecker('/job-referrals', 'edit'),
    jobReferralController.updateStatus,
);

/**
 * Increment referral counter
 */
jobReferralRouter.post(
    '/:referral_id/counter',
    authMiddleware,
    PermissionChecker('/job-referrals', 'create'),
    jobReferralController.incrementReferralCounter,
);

export default jobReferralRouter;