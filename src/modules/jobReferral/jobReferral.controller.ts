import { Request, Response } from 'express';
import jobReferralService from './jobReferral.service';

const getParamString = (
    value: string | string[] | undefined,
): string => {
    if (Array.isArray(value)) {
        return value[0] ?? '';
    }

    return value ?? '';
};

export class JobReferralController {
    /**
     * Create a new job referral
     */
    async create(req: Request, res: Response) {
        try {
            // authMiddleware should already populate req.user
            if (!req.user?.user_id) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized',
                });
            }

            const referral = await jobReferralService.createReferral({
                ...req.body,

                // Always use the authenticated user as creator.
                // Do not trust created_by from the frontend.
                created_by: req.user.user_id,
            });

            return res.status(201).json({
                success: true,
                message: 'Job referral created successfully',
                data: referral,
            });
        } catch (error: any) {
            console.error('Create job referral error:', error);

            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to create job referral',
            });
        }
    }

/**
 * Get all job referrals
 *
 * Paginated:
 * GET /job-referrals?page=1&limit=8&status=active
 *
 * All:
 * GET /job-referrals?status=active&all=true
 */
async getAll(req: Request, res: Response) {
    try {
        /*
         * Check whether the request wants
         * all referrals without pagination.
         */
        const getAll =
            req.query.all === 'true';

        /*
         * Page
         *
         * Used only for normal pagination.
         */
        const requestedPage =
            Number(req.query.page);

        const page =
            Number.isFinite(requestedPage) &&
            requestedPage > 0
                ? Math.floor(requestedPage)
                : 1;

        /*
         * Limit
         *
         * Used only for normal pagination.
         */
        const requestedLimit =
            Number(req.query.limit);

        const limit =
            Number.isFinite(requestedLimit) &&
            requestedLimit > 0
                ? Math.min(
                      Math.floor(
                          requestedLimit,
                      ),
                      100,
                  )
                : 3;

        /*
         * Status
         */
        const status =
            typeof req.query.status === 'string'
                ? req.query.status
                : 'all';

        /*
         * Make sure only valid statuses
         * reach the service.
         */
        const validStatuses = [
            'all',
            'pending',
            'verified',
            'active',
            'closed',
        ] as const;

        const safeStatus =
            validStatuses.includes(
                status as (typeof validStatuses)[number],
            )
                ? (status as (typeof validStatuses)[number])
                : 'all';

        /*
         * Get referrals.
         *
         * Existing pagination:
         *
         * getAll = false
         *
         * New full list:
         *
         * getAll = true
         */
        const result =
            await jobReferralService.getAllReferrals(
                page,
                limit,
                safeStatus,
                getAll,
            );

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error(
            'Get all job referrals error:',
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                'Failed to fetch job referrals',
        });
    }
}

    /**
     * Get one job referral by ID
     */
    async getById(req: Request, res: Response) {
        try {
            const referral_id = getParamString(req.params.referral_id);

            const referral = await jobReferralService.getReferralById(
                referral_id,
            );

            return res.status(200).json({
                success: true,
                data: referral,
            });
        } catch (error: any) {
            console.error('Get job referral error:', error);

            const statusCode =
                error.message === 'Job referral not found' ? 404 : 400;

            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to fetch job referral',
            });
        }
    }

    /**
     * Get a job referral available to students
     *
     * Only Active + Verified + Approved referrals
     * are returned.
     */
    async getAvailableById(req: Request, res: Response) {
        try {
            const referral_id = getParamString(req.params.referral_id);

            const referral = await jobReferralService.getAvailableReferralById(
                referral_id,
            );

            return res.status(200).json({
                success: true,
                data: referral,
            });
        } catch (error: any) {
            console.error('Get available job referral error:', error);

            return res.status(404).json({
                success: false,
                message: error.message || 'Job referral not found',
            });
        }
    }

    /**
     * Get all / search job referrals
     */
    async search(req: Request, res: Response) {
        try {
            const search =
                typeof req.query.search === 'string'
                    ? req.query.search
                    : undefined;

            const referrals = await jobReferralService.searchReferrals(search);

            return res.status(200).json({
                success: true,
                data: referrals,
            });
        } catch (error: any) {
            console.error('Search job referrals error:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to search job referrals',
            });
        }
    }

    /**
     * Update a job referral
     */
    async update(req: Request, res: Response) {
        try {
            const referral_id = getParamString(req.params.referral_id);

            const referral = await jobReferralService.updateReferral(
                referral_id,
                req.body,
            );

            return res.status(200).json({
                success: true,
                message: 'Job referral updated successfully',
                data: referral,
            });
        } catch (error: any) {
            console.error('Update job referral error:', error);

            const statusCode =
                error.message === 'Job referral not found' ? 404 : 400;

            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to update job referral',
            });
        }
    }

    /**
     * Delete a job referral
     */
    async delete(req: Request, res: Response) {
        try {
            const referral_id = getParamString(req.params.referral_id);

            const result = await jobReferralService.deleteReferral(referral_id);

            return res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error: any) {
            console.error('Delete job referral error:', error);

            const statusCode =
                error.message === 'Job referral not found' ? 404 : 400;

            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to delete job referral',
            });
        }
    }

    /**
     * Update verification / permission status
     */
    async updateVerification(req: Request, res: Response) {
        try {
            const referral_id = getParamString(req.params.referral_id);

            const referral = await jobReferralService.updateVerification(
                referral_id,
                req.body,
            );

            return res.status(200).json({
                success: true,
                message: 'Referral verification updated successfully',
                data: referral,
            });
        } catch (error: any) {
            console.error('Update verification error:', error);

            const statusCode =
                error.message === 'Job referral not found' ? 404 : 400;

            return res.status(statusCode).json({
                success: false,
                message:
                    error.message || 'Failed to update referral verification',
            });
        }
    }

    /**
     * Update referral status
     */
    async updateStatus(req: Request, res: Response) {
        try {
            const referral_id = getParamString(req.params.referral_id);

            const { status } = req.body;

            const referral = await jobReferralService.updateStatus(
                referral_id,
                status,
            );

            return res.status(200).json({
                success: true,
                message: 'Referral status updated successfully',
                data: referral,
            });
        } catch (error: any) {
            console.error('Update referral status error:', error);

            const statusCode =
                error.message === 'Job referral not found' ? 404 : 400;

            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to update referral status',
            });
        }
    }

    /**
     * Approve a job referral
     */
    async approveReferral(req: Request, res: Response) {
        try {
            const referral_id = getParamString(req.params.referral_id);

            const { verification_notes } = req.body;

            const referral = await jobReferralService.approveReferral(
                referral_id,
                verification_notes,
            );

            return res.status(200).json({
                success: true,
                message: 'Job referral approved successfully',
                data: referral,
            });
        } catch (error: any) {
            console.error('Approve job referral error:', error);

            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to approve job referral',
            });
        }
    }

    /**
     * Reject a job referral
     */
    async rejectReferral(req: Request, res: Response) {
        try {
            const referral_id = getParamString(req.params.referral_id);

            const { verification_notes } = req.body;

            const referral = await jobReferralService.rejectReferral(
                referral_id,
                verification_notes,
            );

            return res.status(200).json({
                success: true,
                message: 'Job referral rejected successfully',
                data: referral,
            });
        } catch (error: any) {
            console.error('Reject job referral error:', error);

            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to reject job referral',
            });
        }
    }
    /**
     * Increment referral counter
     */
    async incrementReferralCounter(req: Request, res: Response) {
        try {
            const referral_id = getParamString(req.params.referral_id);
            const { type } = req.body;

            const allowedTypes = [
                'views_count',
                'apply_clicks',
                'reported_applications',
            ] as const;

            if (!type || !allowedTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid referral counter type',
                });
            }

            const referral = await jobReferralService.incrementReferralCounter(
                referral_id,
                type,
            );

            return res.status(200).json({
                success: true,
                message: 'Referral counter updated successfully',
                data: referral,
            });
        } catch (error: any) {
            console.error('Increment referral counter error:', error);

            const statusCode =
                error.message === 'Job referral not found' ? 404 : 400;

            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to update referral counter',
            });
        }
    }

    /**
     * Get referral statistics
     */
    async getStatistics(req: Request, res: Response) {
        try {
            const statistics = await jobReferralService.getStatistics();

            return res.status(200).json({
                success: true,
                data: statistics,
            });
        } catch (error: any) {
            console.error('Get referral statistics error:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch referral statistics',
            });
        }
    }

    /**
     * Get referral analytics summary
     */
    async getAnalyticsSummary(req: Request, res: Response) {
        try {
            const analytics = await jobReferralService.getAnalyticsSummary();

            return res.status(200).json({
                success: true,
                message: 'Referral analytics retrieved successfully',
                data: analytics,
            });
        } catch (error: any) {
            console.error('Get referral analytics error:', error);

            return res.status(400).json({
                success: false,
                message:
                    error.message || 'Failed to retrieve referral analytics',
            });
        }
    }

    /**
     * Get analytics for a specific referral
     */
    async getReferralAnalytics(req: Request, res: Response) {
        try {
            const referral_id = getParamString(req.params.referral_id);

            const analytics = await jobReferralService.getReferralAnalytics(
                referral_id,
            );

            return res.status(200).json({
                success: true,
                message: 'Referral analytics retrieved successfully',
                data: analytics,
            });
        } catch (error: any) {
            console.error('Get referral analytics error:', error);

            return res.status(400).json({
                success: false,
                message:
                    error.message || 'Failed to retrieve referral analytics',
            });
        }
    }

    /**
     * Get analytics for current user's referrals
     */
    async getCreatorAnalytics(req: Request, res: Response) {
        try {
            if (!req.user?.user_id) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized',
                });
            }

            const analytics = await jobReferralService.getCreatorAnalytics(
                req.user.user_id,
            );

            return res.status(200).json({
                success: true,
                message: 'Creator referral analytics retrieved successfully',
                data: analytics,
            });
        } catch (error: any) {
            console.error('Get creator referral analytics error:', error);

            return res.status(400).json({
                success: false,
                message:
                    error.message || 'Failed to retrieve creator analytics',
            });
        }
    }

    /**
     * Get top performing referrals
     */
    async getTopPerformingReferrals(req: Request, res: Response) {
        try {
            const requestedLimit = Number(req.query.limit);

            const limit =
                Number.isFinite(requestedLimit) && requestedLimit > 0
                    ? requestedLimit
                    : 10;

            const referrals =
                await jobReferralService.getTopPerformingReferrals(limit);

            return res.status(200).json({
                success: true,
                message: 'Top performing referrals retrieved successfully',
                data: referrals,
            });
        } catch (error: any) {
            console.error('Get top performing referrals error:', error);

            return res.status(400).json({
                success: false,
                message:
                    error.message ||
                    'Failed to retrieve top performing referrals',
            });
        }
    }

    /**
     * Get total referral views
     */
    async getTotalViews(req: Request, res: Response) {
        try {
            const totalViews = await jobReferralService.getTotalViews();

            return res.status(200).json({
                success: true,
                data: {
                    totalViews,
                },
            });
        } catch (error: any) {
            console.error('Get total referral views error:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch total views',
            });
        }
    }

    /**
     * Get total apply clicks
     */
    async getTotalApplyClicks(req: Request, res: Response) {
        try {
            const totalApplyClicks =
                await jobReferralService.getTotalApplyClicks();

            return res.status(200).json({
                success: true,
                data: {
                    totalApplyClicks,
                },
            });
        } catch (error: any) {
            console.error('Get total apply clicks error:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch total apply clicks',
            });
        }
    }

    /**
     * Get referrals created by a specific user
     */
    async getByCreator(req: Request, res: Response) {
        try {
            const created_by = getParamString(req.params.created_by);

            const referrals = await jobReferralService.getReferralsByCreator(
                created_by,
            );

            return res.status(200).json({
                success: true,
                data: referrals,
            });
        } catch (error: any) {
            console.error('Get referrals by creator error:', error);

            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to fetch creator referrals',
            });
        }
    }

    /**
 * Get active and verified referrals
 *
 * Initial request:
 * GET /job-referrals/active-verified?limit=9
 *
 * View More:
 * GET /job-referrals/active-verified?all=true
 *
 * Only:
 * - Active
 * - Verified
 * - Approved
 *
 * referrals are returned.
 */
async getActiveVerified(req: Request, res: Response) {
    try {
        /**
         * Check whether the frontend requested
         * all recommended jobs.
         */
        const getAll = req.query.all === 'true';

        /**
         * Limit is only relevant when getAll=false.
         *
         * Default = 9.
         */
        const requestedLimit = Number(req.query.limit);

        const limit =
            Number.isFinite(requestedLimit) &&
            requestedLimit > 0
                ? Math.min(
                      Math.floor(requestedLimit),
                      100,
                  )
                : 9;

        const referrals =
            await jobReferralService.getActiveVerifiedReferrals(
                limit,
                getAll,
            );

        return res.status(200).json({
            success: true,
            data: referrals,
        });
    } catch (error: any) {
        console.error(
            'Get active verified referrals error:',
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                'Failed to fetch active verified referrals',
        });
    }
}
}

export default new JobReferralController();
