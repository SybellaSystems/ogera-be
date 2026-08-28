import jobReferralRepository from './jobReferral.repo';
import { JobReferralCreationAttributes } from '@/database/models/jobReferral.model';

import { generateCreatedReferralId } from '@/utils/generateReferralId';

 type  ReferralTab =
    | 'all'
    | 'pending'
    | 'verified'
    | 'active'
    | 'closed';

export class JobReferralService {
    /**
     * Create a new job referral
     */
    async createReferral(data: JobReferralCreationAttributes) {
        // Basic validation
        if (!data.title?.trim()) {
            throw new Error('Job title is required');
        }

        if (!data.company?.trim()) {
            throw new Error('Company name is required');
        }

        if (!data.location?.trim()) {
            throw new Error('Job location is required');
        }

        if (!data.created_by) {
            throw new Error('Creator is required');
        }

        // Generate user-facing referral ID
        const created_referral_id = generateCreatedReferralId();

        return jobReferralRepository.create({
            ...data,
            created_referral_id,
        });
    }

    /**
     * Get a referral by ID
     */
    async getReferralById(referral_id: string) {
        if (!referral_id) {
            throw new Error('Referral ID is required');
        }

        const referral = await jobReferralRepository.findById(referral_id);

        if (!referral) {
            throw new Error('Job referral not found');
        }

        return referral;
    }

    /**
     * Get a referral that is available to students
     *
     * Only Active + Verified + Approved referrals
     * can be returned.
     */
    async getAvailableReferralById(referral_id: string) {
        if (!referral_id) {
            throw new Error('Referral ID is required');
        }

        const referral = await jobReferralRepository.findActiveVerifiedById(
            referral_id,
        );

        if (!referral) {
            throw new Error('Job referral not found or is not available');
        }

        return referral;
    }

    /**
     * Get all job referrals
     */
    /**
     * Get paginated job referrals
     */

async getAllReferrals(
    page = 1,
    limit = 3,
    status: ReferralTab = 'all',
    getAll = false,
) {
    const safePage = Math.max(
        1,
        Number(page) || 1,
    );

    const safeLimit = Math.min(
        100,
        Math.max(
            1,
            Number(limit) || 3,
        ),
    );

    const {
        rows,
        count,
        counts,
    } = await jobReferralRepository.findAll(
        safePage,
        safeLimit,
        status,
        getAll,
    );

    /*
     * When all=true, pagination is not being used.
     *
     * Therefore we expose the complete result as one page.
     */
    if (getAll) {
        return {
            referrals: rows,

            pagination: {
                currentPage: 1,
                pageSize: rows.length,
                totalItems: count,
                totalPages: 1,

                hasNextPage: false,
                hasPreviousPage: false,
            },

            counts,
        };
    }

    /*
     * Existing pagination behavior.
     */
    const totalPages = Math.ceil(
        count / safeLimit,
    );

    return {
        referrals: rows,

        pagination: {
            currentPage: safePage,
            pageSize: safeLimit,
            totalItems: count,
            totalPages,

            hasNextPage:
                safePage < totalPages,

            hasPreviousPage:
                safePage > 1,
        },

        counts,
    };
}

    /**
     * Search job referrals
     */
    async searchReferrals(search?: string) {
        return jobReferralRepository.search(search);
    }

    /**
     * Update a job referral
     */
    async updateReferral(
        referral_id: string,
        data: Partial<JobReferralCreationAttributes>,
    ) {
        if (!referral_id) {
            throw new Error('Referral ID is required');
        }

        const existingReferral = await jobReferralRepository.findById(
            referral_id,
        );

        if (!existingReferral) {
            throw new Error('Job referral not found');
        }

        return jobReferralRepository.update(referral_id, data);
    }

    /**
     * Delete a job referral
     */
    async deleteReferral(referral_id: string) {
        if (!referral_id) {
            throw new Error('Referral ID is required');
        }

        const existingReferral = await jobReferralRepository.findById(
            referral_id,
        );

        if (!existingReferral) {
            throw new Error('Job referral not found');
        }

        await jobReferralRepository.delete(referral_id);

        return {
            message: 'Job referral deleted successfully',
        };
    }

    /**
     * Update verification and permission status
     */
    async updateVerification(
        referral_id: string,
        data: {
            verification_status?: 'Pending' | 'Verified' | 'Rejected';

            verification_notes?: string | null;

            permission_status?: 'Pending' | 'Approved' | 'Rejected';
        },
    ) {
        if (!referral_id) {
            throw new Error('Referral ID is required');
        }

        const existingReferral = await jobReferralRepository.findById(
            referral_id,
        );

        if (!existingReferral) {
            throw new Error('Job referral not found');
        }

        return jobReferralRepository.updateVerification(referral_id, data);
    }

    /**
     * Update referral status
     */
    async updateStatus(
        referral_id: string,
        status: 'All' | 'Pending' | 'Verified' | 'Active' | 'Closed',
    ) {
        if (!referral_id) {
            throw new Error('Referral ID is required');
        }

        const existingReferral = await jobReferralRepository.findById(
            referral_id,
        );

        if (!existingReferral) {
            throw new Error('Job referral not found');
        }

        /**
         * A referral can only become Active when
         * it has been verified and approved.
         */
        if (status === 'Active') {
            if (
                existingReferral.verification_status !== 'Verified' ||
                existingReferral.permission_status !== 'Approved'
            ) {
                throw new Error(
                    'Referral must be verified and approved before it can be activated',
                );
            }
        }

        /**
         * Rejected referrals cannot be activated.
         */
        if (
            status === 'Active' &&
            existingReferral.verification_status === 'Rejected'
        ) {
            throw new Error('Rejected referral cannot be activated');
        }

        return jobReferralRepository.updateStatus(referral_id, status);
    }

    /**
     * Approve a job referral
     */
    async approveReferral(
        referral_id: string,
        verification_notes?: string | null,
    ) {
        if (!referral_id) {
            throw new Error('Referral ID is required');
        }

        const existingReferral = await jobReferralRepository.findById(
            referral_id,
        );

        if (!existingReferral) {
            throw new Error('Job referral not found');
        }

        if (existingReferral.verification_status === 'Verified') {
            throw new Error('Job referral is already verified');
        }

        return jobReferralRepository.approveReferral(
            referral_id,
            verification_notes,
        );
    }

    /**
     * Reject a job referral
     */
    async rejectReferral(
        referral_id: string,
        verification_notes?: string | null,
    ) {
        if (!referral_id) {
            throw new Error('Referral ID is required');
        }

        if (!verification_notes?.trim()) {
            throw new Error(
                'Verification notes are required when rejecting a referral',
            );
        }

        const existingReferral = await jobReferralRepository.findById(
            referral_id,
        );

        if (!existingReferral) {
            throw new Error('Job referral not found');
        }

        if (existingReferral.verification_status === 'Rejected') {
            throw new Error('Job referral is already rejected');
        }

        return jobReferralRepository.rejectReferral(
            referral_id,
            verification_notes.trim(),
        );
    }

    /**
     * Increment a referral counter
     */
    async incrementReferralCounter(
        referral_id: string,
        field: 'views_count' | 'apply_clicks' | 'reported_applications',
    ) {
        if (!referral_id) {
            throw new Error('Referral ID is required');
        }

        const existingReferral = await jobReferralRepository.findById(
            referral_id,
        );

        if (!existingReferral) {
            throw new Error('Job referral not found');
        }

        return jobReferralRepository.incrementReferralCounter(
            referral_id,
            field,
        );
    }

    /**
     * Get referral statistics
     */
    async getStatistics() {
        const statistics = await jobReferralRepository.getStatistics();

        return {
            totalReferrals: statistics.totalReferrals ?? 0,

            activeReferrals: statistics.activeReferrals ?? 0,

            verifiedReferrals: statistics.verifiedReferrals ?? 0,

            pendingReferrals: statistics.pendingReferrals ?? 0,

            rejectedReferrals: statistics.rejectedReferrals ?? 0,

            totalViews: statistics.totalViews ?? 0,

            totalApplyClicks: statistics.totalApplyClicks ?? 0,

            totalReportedApplications:
                statistics.totalReportedApplications ?? 0,
        };
    }

    /**
     * Get complete referral analytics
     */
    async getAnalyticsSummary() {
        const analytics = await jobReferralRepository.getAnalyticsSummary();

        const totalViews = Number(analytics.totalViews) || 0;

        const totalApplyClicks = Number(analytics.totalApplyClicks) || 0;

        const applyThroughRate =
            totalViews > 0
                ? Number(((totalApplyClicks / totalViews) * 100).toFixed(2))
                : 0;

        return {
            totalReferrals: analytics.totalReferrals ?? 0,

            activeReferrals: analytics.activeReferrals ?? 0,

            inactiveReferrals: analytics.inactiveReferrals ?? 0,

            expiredReferrals: analytics.expiredReferrals ?? 0,

            pendingReferrals: analytics.pendingReferrals ?? 0,

            verifiedReferrals: analytics.verifiedReferrals ?? 0,

            rejectedReferrals: analytics.rejectedReferrals ?? 0,

            totalViews,

            totalApplyClicks,

            totalReportedApplications:
                Number(analytics.totalReportedApplications) || 0,

            applyThroughRate,
        };
    }

    /**
     * Get analytics for one referral
     */
    async getReferralAnalytics(referral_id: string) {
        if (!referral_id) {
            throw new Error('Referral ID is required');
        }

        const referral = await jobReferralRepository.getReferralAnalytics(
            referral_id,
        );

        if (!referral) {
            throw new Error('Job referral not found');
        }

        const views = Number(referral.views_count) || 0;

        const applyClicks = Number(referral.apply_clicks) || 0;

        const applyThroughRate =
            views > 0 ? Number(((applyClicks / views) * 100).toFixed(2)) : 0;

        return {
            referral_id: referral.referral_id,

            title: referral.title,

            company: referral.company,

            status: referral.status,

            verification_status: referral.verification_status,

            permission_status: referral.permission_status,

            views_count: views,

            apply_clicks: applyClicks,

            reported_applications: Number(referral.reported_applications) || 0,

            applyThroughRate,

            created_at: referral.created_at,

            updated_at: referral.updated_at,
        };
    }

    /**
     * Get analytics for referrals created by a user
     */
    async getCreatorAnalytics(created_by: string) {
        if (!created_by) {
            throw new Error('Creator ID is required');
        }

        const analytics = await jobReferralRepository.getCreatorAnalytics(
            created_by,
        );

        const totalViews = Number(analytics.totalViews) || 0;

        const totalApplyClicks = Number(analytics.totalApplyClicks) || 0;

        const applyThroughRate =
            totalViews > 0
                ? Number(((totalApplyClicks / totalViews) * 100).toFixed(2))
                : 0;

        return {
            totalReferrals: analytics.totalReferrals ?? 0,

            activeReferrals: analytics.activeReferrals ?? 0,

            verifiedReferrals: analytics.verifiedReferrals ?? 0,

            pendingReferrals: analytics.pendingReferrals ?? 0,

            rejectedReferrals: analytics.rejectedReferrals ?? 0,

            totalViews,

            totalApplyClicks,

            totalReportedApplications:
                Number(analytics.totalReportedApplications) || 0,

            applyThroughRate,
        };
    }

    /**
     * Get top performing referrals
     */
    async getTopPerformingReferrals(limit = 10) {
        if (limit < 1) {
            limit = 10;
        }

        if (limit > 100) {
            limit = 100;
        }

        const referrals = await jobReferralRepository.getTopPerformingReferrals(
            limit,
        );

        return referrals.map(referral => {
            const views = Number(referral.views_count) || 0;

            const applyClicks = Number(referral.apply_clicks) || 0;

            const applyThroughRate =
                views > 0
                    ? Number(((applyClicks / views) * 100).toFixed(2))
                    : 0;

            return {
                referral_id: referral.referral_id,

                title: referral.title,

                company: referral.company,

                location: referral.location,

                status: referral.status,

                verification_status: referral.verification_status,

                views_count: views,

                apply_clicks: applyClicks,

                reported_applications:
                    Number(referral.reported_applications) || 0,

                applyThroughRate,

                created_at: referral.created_at,
            };
        });
    }

    /**
     * Get total referral views
     */
    async getTotalViews() {
        const totalViews = await jobReferralRepository.getTotalViews();

        return totalViews ?? 0;
    }

    /**
     * Get total referral apply clicks
     */
    async getTotalApplyClicks() {
        const totalApplyClicks =
            await jobReferralRepository.getTotalApplyClicks();

        return totalApplyClicks ?? 0;
    }

    /**
     * Get referrals created by a specific user
     */
    async getReferralsByCreator(created_by: string) {
        if (!created_by) {
            throw new Error('Creator ID is required');
        }

        return jobReferralRepository.findByCreator(created_by);
    }

    
    /**
 * Get active and verified referrals available to students
 *
 * Initial Recommended Jobs request:
 * - Returns maximum 9 referrals.
 *
 * View More request:
 * - Returns all available referrals.
 */
async getActiveVerifiedReferrals(
    limit = 9,
    getAll = false,
) {
    const safeLimit = Math.min(
        100,
        Math.max(1, Number(limit) || 9),
    );

    return jobReferralRepository.findActiveVerified(
        safeLimit,
        getAll,
    );
}

    /**
     * Get database transaction
     *
     * Normally controllers should not need to use this.
     * It is exposed for service-level transactional operations.
     */
    getTransaction() {
        return jobReferralRepository.getTransaction();
    }
}

export default new JobReferralService();
