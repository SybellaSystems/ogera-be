import { Op } from 'sequelize';
import { DB } from '@/database';
import { JobReferralCreationAttributes } from '@/database/models/jobReferral.model';
const { JobReferrals, sequelize } = DB;

 type ReferralTab =
  | "all"
  | "pending"
  | "verified"
  | "active"
  | "closed";

export class JobReferralRepository {
    /**
     * Create a new job referral
     */
    async create(data: JobReferralCreationAttributes) {
        return JobReferrals.create(data);
    }

    /**
     * Find a referral by ID
     */
    async findById(referral_id: string) {
        return JobReferrals.findByPk(referral_id);
    }

    async findByCreatedReferralId(created_referral_id: string) {
        return JobReferrals.findOne({
            where: {
                created_referral_id,
            },
        });
    }

    /**
     * Find a referral that is available to students
     *
     * A referral must be:
     * - Active
     * - Verified
     * - Approved
     */
    async findActiveVerifiedById(referral_id: string) {
        return JobReferrals.findOne({
            where: {
                referral_id,
                status: 'Active',
                verification_status: 'Verified',
                permission_status: 'Approved',
            },
        });
    }

    /**
     * Find all job referrals
     */
    /**
     * Find paginated job referrals
     *
     * Returns the newest referrals first.
     */

async findAll(
    page = 1,
    limit = 3,
    status: ReferralTab = 'all',
    getAll = false,
) {
    const offset = (page - 1) * limit;

    const where: any = {};

    switch (status) {
        case 'pending':
            where.status = 'Pending';
            break;

        case 'verified':
            where.status = 'Verified';
            break;

        case 'active':
            where.status = 'Active';
            break;

        case 'closed':
            where.status = 'Closed';
            break;

        case 'all':
        default:
            break;
    }

     const queryOptions: any = {
        where,
        order: [['created_at', 'DESC']],
    };

    if (!getAll) {
        queryOptions.limit = limit;
        queryOptions.offset = offset;
    }

    const { rows, count } =
        await JobReferrals.findAndCountAll(
            queryOptions,
        );

    const [
        allCount,
        pendingCount,
        verifiedCount,
        activeCount,
        closedCount,
    ] = await Promise.all([
        // All
        JobReferrals.count(),

        // Pending
        JobReferrals.count({
            where: {
                status: 'Pending',
            },
        }),

        // Verified
        JobReferrals.count({
            where: {
                status: 'Verified',
            },
        }),

        // Active
        JobReferrals.count({
            where: {
                status: 'Active',
            },
        }),

        // Closed
        JobReferrals.count({
            where: {
                status: 'Closed',
            },
        }),
    ]);

    return {
        rows,
        count,

        counts: {
            all: allCount,
            pending_verification: pendingCount,
            verified: verifiedCount,
            active: activeCount,
            closed: closedCount,
        },
    };
}

    /**
     * Search job referrals
     */
    async search(search?: string) {
        const where: any = {};

        if (search) {
            where[Op.or] = [
                {
                    title: {
                        [Op.iLike]: `%${search}%`,
                    },
                },
                {
                    company: {
                        [Op.iLike]: `%${search}%`,
                    },
                },
                {
                    location: {
                        [Op.iLike]: `%${search}%`,
                    },
                },
            ];
        }

        return JobReferrals.findAll({
            where,
            order: [['created_at', 'DESC']],
        });
    }

    /**
     * Update a job referral
     */
    async update(
        referral_id: string,
        data: Partial<JobReferralCreationAttributes>,
    ) {
        const [updatedCount] = await JobReferrals.update(data, {
            where: {
                referral_id,
            },
        });

        if (updatedCount === 0) {
            return null;
        }

        return this.findById(referral_id);
    }

    /**
     * Delete a job referral
     */
    async delete(referral_id: string) {
        return JobReferrals.destroy({
            where: {
                referral_id,
            },
        });
    }

    /**
     * Update verification / permission status
     */
    async updateVerification(
        referral_id: string,
        data: {
            verification_status?: 'Pending' | 'Verified' | 'Rejected';

            verification_notes?: string | null;

            permission_status?: 'Pending' | 'Approved' | 'Rejected';
        },
    ) {
        const [updatedCount] = await JobReferrals.update(data, {
            where: {
                referral_id,
            },
        });

        if (updatedCount === 0) {
            return null;
        }

        return this.findById(referral_id);
    }
    /**
     * Update referral status
     */
    async updateStatus(
        referral_id: string,
        status: 'All' | 'Pending' | 'Verified' | 'Active' | 'Closed',
    ) {
        const [updatedCount] = await JobReferrals.update(
            {
                status,
            },
            {
                where: {
                    referral_id,
                },
            },
        );

        if (updatedCount === 0) {
            return null;
        }

        return this.findById(referral_id);
    }

    /**
     * Verify and approve a referral
     */
    async approveReferral(
        referral_id: string,
        verification_notes?: string | null,
    ) {
        const [updatedCount] = await JobReferrals.update(
            {
                verification_status: 'Verified',
                permission_status: 'Approved',
                verification_notes: verification_notes ?? null,
                status: 'Active',
            },
            {
                where: {
                    referral_id,
                },
            },
        );

        if (updatedCount === 0) {
            return null;
        }

        return this.findById(referral_id);
    }

    /**
     * Reject a referral
     */
    async rejectReferral(
        referral_id: string,
        verification_notes?: string | null,
    ) {
        const [updatedCount] = await JobReferrals.update(
            {
                verification_status: 'Rejected',
                permission_status: 'Rejected',
                verification_notes: verification_notes ?? null,
                status: 'Closed',
            },
            {
                where: {
                    referral_id,
                },
            },
        );

        if (updatedCount === 0) {
            return null;
        }

        return this.findById(referral_id);
    }

    /**
     * Get total referral views
     */
    async getTotalViews() {
        return JobReferrals.sum('views_count');
    }

    /**
     * Get total referral apply clicks
     */
    async getTotalApplyClicks() {
        return JobReferrals.sum('apply_clicks');
    }

    /**
     * Increment referral counter
     */
    async incrementReferralCounter(
        referral_id: string,
        field: 'views_count' | 'apply_clicks' | 'reported_applications',
    ) {
        await JobReferrals.increment(
            { [field]: 1 },
            { where: { referral_id } },
        );
        return this.findById(referral_id);
    }

    /**
     * Get referral statistics
     */
    async getStatistics() {
        const totalReferrals = await JobReferrals.count();

        const activeReferrals = await JobReferrals.count({
            where: {
                status: 'Active',
            },
        });

        const verifiedReferrals = await JobReferrals.count({
            where: {
                verification_status: 'Verified',
            },
        });

        const pendingReferrals = await JobReferrals.count({
            where: {
                verification_status: 'Pending',
            },
        });

        const rejectedReferrals = await JobReferrals.count({
            where: {
                verification_status: 'Rejected',
            },
        });

        const totalViews = await JobReferrals.sum('views_count');

        const totalApplyClicks = await JobReferrals.sum('apply_clicks');

        const totalReportedApplications = await JobReferrals.sum(
            'reported_applications',
        );

        return {
            totalReferrals,
            activeReferrals,
            verifiedReferrals,
            pendingReferrals,
            rejectedReferrals,
            totalViews: totalViews || 0,
            totalApplyClicks: totalApplyClicks || 0,
            totalReportedApplications: totalReportedApplications || 0,
        };
    }

    /**
     * Get complete analytics summary
     */
    async getAnalyticsSummary() {
        const [
            totalReferrals,
            activeReferrals,
            inactiveReferrals,
            expiredReferrals,
            pendingReferrals,
            verifiedReferrals,
            rejectedReferrals,
            totalViews,
            totalApplyClicks,
            totalReportedApplications,
        ] = await Promise.all([
            JobReferrals.count(),

            JobReferrals.count({
                where: {
                    status: 'Active',
                },
            }),

            JobReferrals.count({
                where: {
                    status: 'Inactive',
                },
            }),

            JobReferrals.count({
                where: {
                    status: 'Expired',
                },
            }),

            JobReferrals.count({
                where: {
                    verification_status: 'Pending',
                },
            }),

            JobReferrals.count({
                where: {
                    verification_status: 'Verified',
                },
            }),

            JobReferrals.count({
                where: {
                    verification_status: 'Rejected',
                },
            }),

            JobReferrals.sum('views_count'),

            JobReferrals.sum('apply_clicks'),

            JobReferrals.sum('reported_applications'),
        ]);

        return {
            totalReferrals,

            activeReferrals,
            inactiveReferrals,
            expiredReferrals,

            pendingReferrals,
            verifiedReferrals,
            rejectedReferrals,

            totalViews: totalViews || 0,
            totalApplyClicks: totalApplyClicks || 0,
            totalReportedApplications: totalReportedApplications || 0,
        };
    }

    /**
     * Get analytics for a specific referral
     */
    async getReferralAnalytics(referral_id: string) {
        return JobReferrals.findByPk(referral_id, {
            attributes: [
                'referral_id',
                'title',
                'company',
                'status',
                'verification_status',
                'permission_status',
                'views_count',
                'apply_clicks',
                'reported_applications',
                'created_at',
                'updated_at',
            ],
        });
    }

    /**
     * Get analytics for referrals created by a specific user
     */
    async getCreatorAnalytics(created_by: string) {
        const [
            totalReferrals,
            activeReferrals,
            verifiedReferrals,
            pendingReferrals,
            rejectedReferrals,
            totalViews,
            totalApplyClicks,
            totalReportedApplications,
        ] = await Promise.all([
            JobReferrals.count({
                where: {
                    created_by,
                },
            }),

            JobReferrals.count({
                where: {
                    created_by,
                    status: 'Active',
                },
            }),

            JobReferrals.count({
                where: {
                    created_by,
                    verification_status: 'Verified',
                },
            }),

            JobReferrals.count({
                where: {
                    created_by,
                    verification_status: 'Pending',
                },
            }),

            JobReferrals.count({
                where: {
                    created_by,
                    verification_status: 'Rejected',
                },
            }),

            JobReferrals.sum('views_count', {
                where: {
                    created_by,
                },
            }),

            JobReferrals.sum('apply_clicks', {
                where: {
                    created_by,
                },
            }),

            JobReferrals.sum('reported_applications', {
                where: {
                    created_by,
                },
            }),
        ]);

        return {
            totalReferrals,
            activeReferrals,
            verifiedReferrals,
            pendingReferrals,
            rejectedReferrals,

            totalViews: totalViews || 0,
            totalApplyClicks: totalApplyClicks || 0,
            totalReportedApplications: totalReportedApplications || 0,
        };
    }

    /**
     * Get top performing referrals
     */
    async getTopPerformingReferrals(limit = 10) {
        return JobReferrals.findAll({
            attributes: [
                'referral_id',
                'title',
                'company',
                'location',
                'status',
                'verification_status',
                'views_count',
                'apply_clicks',
                'reported_applications',
                'created_at',
            ],

            where: {
                status: 'Active',
            },

            order: [
                ['apply_clicks', 'DESC'],
                ['views_count', 'DESC'],
            ],

            limit,
        });
    }

    /**
     * Get referrals created by a specific user
     */
    async findByCreator(created_by: string) {
        return JobReferrals.findAll({
            where: {
                created_by,
            },
            order: [['created_at', 'DESC']],
        });
    }
    
    /**
 * Get active and verified referrals available to students
 *
 * Initial request:
 * - limit = 9
 *
 * View More request:
 * - getAll = true
 * - returns all available referrals
 */
async findActiveVerified(
    limit = 9,
    getAll = false,
) {
    const queryOptions: any = {
        where: {
            status: 'Active',
            verification_status: 'Verified',
            permission_status: 'Approved',
        },
        order: [['created_at', 'DESC']],
    };

    /**
     * Only apply LIMIT for the initial request.
     *
     * When getAll = true, no limit is applied.
     */
    if (!getAll) {
        queryOptions.limit = limit;
    }

    console.log('findActiveVerified:', {
        limit,
        getAll,
        queryOptions,
    });

    return JobReferrals.findAll(queryOptions);
}

    /**
     * Get database transaction
     */
    getTransaction() {
        return sequelize.transaction();
    }
}

export default new JobReferralRepository();
