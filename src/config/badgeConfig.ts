/** Centralized badge configuration for student membership tiers */
const badgeConfig = {
    FREE: {
        applyLimit: 10,
        canSeeLatestJobs: false,
        jobDelayDays: 7,
    },
    PREMIUM: {
        applyLimit: 50,
        canSeeLatestJobs: true,
        jobDelayDays: 0,
    },
    PIONEER: {
        applyLimit: 100,
        canSeeLatestJobs: true,
        jobDelayDays: 0,
        priorityAccess: true,
    },
} as const;

export default badgeConfig;
