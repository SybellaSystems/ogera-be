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
 * Student dashboard response shape
 */
export interface StudentDashboardResponse {
  applications: {
    value: number; // total applications in current period
    change: number | null; // difference vs previous period (current - previous)
  };
  jobsCompleted: {
    value: number | null; // null when schema lacks completion field
    change: number | null;
    note?: string; // explanatory note when missing data
  };
  interviews: {
    value: number | null;
    growthPercentage: number | null;
    note?: string;
  };
  earnings: {
    value: number; // sum of transactions for this student in current period
    currency: string | null; // currency from transactions (null if none)
  };
}

/**
 * Get student dashboard metrics for a specific user
 * periodDays: number of days for the current window (default 30)
 */
export const getStudentDashboard = async (userId: string, periodDays = 30): Promise<StudentDashboardResponse> => {
  return await (async () => {
    try {
      const now = new Date();
      const periodMs = periodDays * 24 * 60 * 60 * 1000;
      const currentStart = new Date(now.getTime() - periodMs);
      const currentEnd = now;
      const prevStart = new Date(currentStart.getTime() - periodMs);
      const prevEnd = new Date(currentStart.getTime());

      // Applications: count in current and previous periods
      const currentApplications = await repo.getStudentApplicationsCountBetween(userId, currentStart, currentEnd);
      const previousApplications = await repo.getStudentApplicationsCountBetween(userId, prevStart, prevEnd);
      const applicationsChange = currentApplications - previousApplications;

      // Jobs Completed: use completed_at on job_applications
      const currentJobsCompleted = await repo.getStudentJobsCompletedBetween(userId, currentStart, currentEnd);
      const previousJobsCompleted = await repo.getStudentJobsCompletedBetween(userId, prevStart, prevEnd);
      const jobsCompletedChange = currentJobsCompleted - previousJobsCompleted;
      const jobsCompletedGrowth = previousJobsCompleted > 0 ? Math.round(((currentJobsCompleted - previousJobsCompleted) / previousJobsCompleted) * 100) : (previousJobsCompleted === 0 ? (currentJobsCompleted === 0 ? 0 : null) : null);

      // Interviews: use interviews table
      const currentInterviews = await repo.getStudentInterviewsBetween(userId, currentStart, currentEnd);
      const previousInterviews = await repo.getStudentInterviewsBetween(userId, prevStart, prevEnd);
      const interviewsChange = currentInterviews - previousInterviews;
      const interviewsGrowth = previousInterviews > 0 ? Math.round(((currentInterviews - previousInterviews) / previousInterviews) * 100) : (previousInterviews === 0 ? (currentInterviews === 0 ? 0 : null) : null);

      // Earnings: sum transactions for student in current period and get currency
      const earnings = await repo.getStudentEarningsBetween(userId, currentStart, currentEnd);
      const previousEarnings = await repo.getStudentEarningsBetween(userId, prevStart, prevEnd);
      const earningsChange = Number(earnings.total ?? 0) - Number(previousEarnings.total ?? 0);
      const earningsGrowth = (previousEarnings.total ?? 0) > 0 ? Math.round((earningsChange / (previousEarnings.total ?? 1)) * 100) : ((previousEarnings.total ?? 0) === 0 ? ((earnings.total ?? 0) === 0 ? 0 : null) : null);

      const result: StudentDashboardResponse = {
        applications: {
          value: currentApplications,
          change: applicationsChange,
        },
        jobsCompleted: {
          value: currentJobsCompleted,
          change: jobsCompletedChange,
        },
        interviews: {
          value: currentInterviews,
          growthPercentage: interviewsGrowth,
        },
        earnings: {
          value: earnings.total ?? 0,
          currency: earnings.currency || null,
        },
      };

      return result;
    } catch (error) {
      logger.error('[Dashboard Service] Error fetching student dashboard:', error);
      throw error;
    }
  })();
};

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
  getStudentDashboard,
};
