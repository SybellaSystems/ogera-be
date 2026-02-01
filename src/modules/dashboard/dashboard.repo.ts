import { DB } from "@/database";
import { Sequelize } from "sequelize";
import logger from "@/utils/logger";

const repo = {
  /**
   * Get total count of all users
   * Uses efficient COUNT query at database level
   */
  getTotalUsersCount: async (): Promise<number> => {
    try {
      const count = await DB.Users.count();
      logger.info(`[Dashboard] Total users count: ${count}`);
      return Number(count ?? 0);
    } catch (error) {
      logger.error(`[Dashboard] Error counting users:`, error);
      return 0;
    }
  },

  /**
   * Get total count of students
   * Uses efficient COUNT query with WHERE clause at database level
   */
  getTotalStudentsCount: async (): Promise<number> => {
    try {
      // Use case-insensitive comparison to avoid mismatches in stored role_type casing
      const count = await DB.Users.count({
        where: DB.sequelize ? DB.sequelize.where(DB.sequelize.fn('LOWER', DB.sequelize.col('role_type')), 'student') : { role_type: 'student' },
      });
      logger.info(`[Dashboard] Total students count: ${count}`);
      return Number(count ?? 0);
    } catch (error) {
      logger.error(`[Dashboard] Error counting students:`, error);
      return 0;
    }
  },

  /**
   * Get count of active jobs
   * Uses efficient COUNT query with WHERE clause at database level
   */
  getActiveJobsCount: async (): Promise<number> => {
    try {
      const count = await DB.Jobs.count({
        where: {
          status: "Active",
        },
      });
      logger.info(`[Dashboard] Active jobs count: ${count}`);
      return count || 0;
    } catch (error) {
      logger.error(`[Dashboard] Error counting active jobs:`, error);
      return 0;
    }
  },

  /**
   * Get total earnings/revenue
   * Uses efficient SUM aggregation at database level
   * Sums budget of all jobs to represent total platform value/earnings
   */
  getTotalEarnings: async (): Promise<number> => {
    try {
      // Prefer transactions table if it exists, otherwise fall back to summing job budgets
      let totalEarnings = 0;
      if ((DB as any).Transactions && typeof (DB as any).Transactions.sum === 'function') {
        // Sum amount from transactions table
        const sumResult: any = await (DB as any).Transactions.sum('amount');
        // sumResult can be a string or number depending on dialect/driver
        totalEarnings = sumResult !== null && sumResult !== undefined ? Number(sumResult) : 0;
      } else {
        const result = await DB.Jobs.findOne({
          attributes: [
            [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('budget')), 0), 'total'],
          ],
          raw: true,
        }) as any;
        totalEarnings = result?.total ? Number(result.total) : 0;
      }
      logger.info(`[Dashboard] Total earnings: ${totalEarnings}`);
      return totalEarnings;
    } catch (error) {
      logger.error(`[Dashboard] Error calculating earnings:`, error);
      return 0;
    }
  },
  /**
   * Get recent activity logs
   */
  getRecentActivities: async (limit = 5) => {
    try {
      const rows = await DB.ActivityLogs.findAll({
        order: [['created_at', 'DESC']],
        limit,
        raw: true,
      });
      return rows;
    } catch (error) {
      logger.error('[Dashboard] Error fetching recent activities:', error);
      return [];
    }
  },
};

export default repo;
