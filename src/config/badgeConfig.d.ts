declare const badgeConfig: {
  FREE: { applyLimit: number; canSeeLatestJobs: boolean; jobDelayDays: number };
  PREMIUM: { applyLimit: number; canSeeLatestJobs: boolean; jobDelayDays: number };
  PIONEER: { applyLimit: number; canSeeLatestJobs: boolean; jobDelayDays: number; priorityAccess: boolean };
};

export default badgeConfig;
