import { Request, Response } from "express";
import dashboardService, { DashboardMetrics } from "./dashboard.service";
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
    const metrics: DashboardMetrics = await dashboardService.getDashboardMetrics();

    logger.info("[Dashboard Controller] Sending metrics response:", metrics);
    res.status(StatusCodes.OK).json({
      success: true,
      status: StatusCodes.OK,
      data: metrics,
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

export default {
  getMetrics,
};
