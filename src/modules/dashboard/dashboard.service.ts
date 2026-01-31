import repo from "./dashboard.repo";
import { CustomError } from "@/utils/custom-error";
import { StatusCodes } from "http-status-codes";
import logger from "@/utils/logger";

/**
 * Dashboard Metrics Interface
 */
export interface DashboardMetrics {
  totalUsers: number;
  totalStudents: number;
  activeJobs: number;
  totalEarnings: number;
}

/**
 * Get dashboard metrics for superadmin
 * Fetches all platform-wide metrics
 */
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  try {
    logger.info("[Dashboard] Fetching dashboard metrics...");
    
    const [totalUsers, totalStudents, activeJobs, totalEarnings] = await Promise.all([
      repo.getTotalUsersCount(),
      repo.getTotalStudentsCount(),
      repo.getActiveJobsCount(),
      repo.getTotalEarnings(),
    ]);

    const metrics = {
      totalUsers,
      totalStudents,
      activeJobs,
      totalEarnings,
    };

    logger.info("[Dashboard] Metrics fetched successfully:", metrics);
    return metrics;
  } catch (error) {
    logger.error("[Dashboard] Error fetching metrics:", error);
    throw new CustomError(
      "Failed to fetch dashboard metrics",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export default {
  getDashboardMetrics,
};
