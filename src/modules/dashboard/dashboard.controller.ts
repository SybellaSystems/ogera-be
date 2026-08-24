import { Request, Response } from "express";
import dashboardService, { DashboardMetrics } from "./dashboard.service";
import { EmployerDashboardResponse, StudentDashboardResponse } from "./dashboard.service";
import repo from "./dashboard.repo";
import { StatusCodes } from "http-status-codes";
import { CustomError } from "@/utils/custom-error";
import logger from "@/utils/logger";

/**
 * Get dashboard metrics
 * Only accessible to superadmin users
 */
export const getMetrics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    logger.info("[Dashboard Controller] Getting metrics endpoint called");

    const metrics: DashboardMetrics =
      await dashboardService.getDashboardMetrics();

    // Sanitize and ensure numeric values (including 0) are returned
    const safeMetrics = {
      // Existing Super Admin metrics
      totalUsers: Number(metrics.totalUsers ?? 0),
      totalStudents: Number(metrics.totalStudents ?? 0),
      activeJobs: Number(metrics.activeJobs ?? 0),
      totalEarnings: Number(metrics.totalEarnings ?? 0),

      weeklyGrowth: metrics.weeklyGrowth ?? [],

      freeBadgeStudents: Number(metrics.freeBadgeStudents ?? 0),
      premiumStudents: Number(metrics.premiumStudents ?? 0),
      pioneerStudents: Number(metrics.pioneerStudents ?? 0),

      // New Super Admin Quick Stats
      quickStats: {
        newStudentsThisWeek: Number(
          metrics.quickStats?.newStudentsThisWeek ?? 0
        ),

        newJobsPostedThisWeek: Number(
          metrics.quickStats?.newJobsPostedThisWeek ?? 0
        ),

        pendingAcademicVerifications: Number(
          metrics.quickStats?.pendingAcademicVerifications ?? 0
        ),

        resolvedDisputes: Number(
          metrics.quickStats?.resolvedDisputes ?? 0
        ),
      },
    };

    logger.info(
      "[Dashboard Controller] Sending metrics response:",
      safeMetrics
    );

    res.status(StatusCodes.OK).json({
      success: true,
      status: StatusCodes.OK,
      data: safeMetrics,
      message: "Dashboard metrics retrieved successfully",
    });
  } catch (error) {
    logger.error("[Dashboard Controller] Error in getMetrics:", error);

    if (error instanceof CustomError) {
      res.status(error.statusCode).json({
        success: false,
        status: error.statusCode,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: "Failed to retrieve dashboard metrics",
      });
    }
  }
};

/**
 * GET /api/dashboard/student
 * Returns student-specific dashboard metrics for the authenticated user
 */
export const getStudentDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id as string | undefined;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        status: StatusCodes.UNAUTHORIZED,
        message: 'User not authenticated',
      });
      return;
    }

    // Optional: period in days for comparison (defaults to 30)
    const periodDays = Number(req.query.periodDays) || 30;

    const metrics: StudentDashboardResponse = await dashboardService.getStudentDashboard(userId, periodDays);

    res.status(StatusCodes.OK).json({
      success: true,
      status: StatusCodes.OK,
      data: metrics,
      message: 'Student dashboard metrics retrieved successfully',
    });
  } catch (error) {
    logger.error('[Dashboard Controller] Error in getStudentDashboard:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Failed to retrieve student dashboard metrics',
    });
  }
};

/**
 * GET /api/dashboard/employer
 * Returns employer-specific dashboard metrics for the authenticated user
 */
export const getEmployerDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id as string | undefined;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        status: StatusCodes.UNAUTHORIZED,
        message: 'User not authenticated',
      });
      return;
    }

    const periodDays = Number(req.query.periodDays) || 30;
    const metrics: EmployerDashboardResponse = await dashboardService.getEmployerDashboard(userId, periodDays);

    res.status(StatusCodes.OK).json({
      success: true,
      status: StatusCodes.OK,
      data: metrics,
      message: 'Employer dashboard metrics retrieved successfully',
    });
  } catch (error) {
    logger.error('[Dashboard Controller] Error in getEmployerDashboard:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Failed to retrieve employer dashboard metrics',
    });
  }
};

/**
 * GET /api/dashboard/recent-activities
 */
export const getRecentActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('[Dashboard Controller] Getting recent activities');
    const limit = Number(req.query.limit) || 5;
    const rows = await repo.getRecentActivities(limit);

    // Return JSON only
    res.status(StatusCodes.OK).json({
      success: true,
      status: StatusCodes.OK,
      data: rows,
      message: 'Recent activities retrieved successfully',
    });
  } catch (error) {
    logger.error('[Dashboard Controller] Error in getRecentActivities:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Failed to retrieve recent activities',
    });
  }
};

export default {
  getMetrics,
  getRecentActivities,
};
