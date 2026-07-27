import { DB } from "@/database";
import { Sequelize } from "sequelize";
import logger from "@/utils/logger";
import { MOMO_CONFIG } from "@/config";

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
      // Primary source: role relation (role_id -> roles.role_type) to reflect newly created users immediately.
      const countFromRoleRelation = await DB.Users.count({
        include: [
          {
            model: DB.Roles,
            as: 'role',
            where: { roleType: 'student' },
            attributes: [],
            required: true,
          },
        ],
        distinct: true,
        col: 'user_id',
      });

      // Fallback for legacy rows where role relation may be inconsistent but users.role_type exists.
      const count =
        Number(countFromRoleRelation ?? 0) > 0
          ? Number(countFromRoleRelation ?? 0)
          : await DB.Users.count({
              where: DB.sequelize
                ? DB.sequelize.where(
                    DB.sequelize.fn('LOWER', Sequelize.cast(DB.sequelize.col('role_type'), 'TEXT')),
                    'student',
                  )
                : { role_type: 'student' },
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
   * Get dynamic Ogera wallet balance for super admin dashboard
   * Wallet balance = total funded from employers (budget + fee) - total paid to students
   */
  getTotalEarnings: async (): Promise<number> => {
    try {
      const { Op } = require('sequelize');
      const jobs = await DB.Jobs.findAll({
        where: { funding_status: { [Op.in]: ['Funded', 'Paid'] } },
        attributes: ['budget', 'funding_status', 'amount_paid_to_student'],
        raw: true,
      }) as Array<{ budget: number | string; funding_status?: string; amount_paid_to_student?: number | string | null }>;

      const feePct = Number(MOMO_CONFIG.serviceFeePercent ?? 0);
      let totalReceived = 0;
      let totalPaidToStudents = 0;

      for (const job of jobs) {
        const budget = Number(job.budget ?? 0);
        if (!budget || Number.isNaN(budget)) continue;

        const totalForJob = budget * (1 + feePct / 100);
        totalReceived += totalForJob;

        if (job.funding_status === 'Paid') {
          const paidAmount =
            job.amount_paid_to_student !== null && job.amount_paid_to_student !== undefined
              ? Number(job.amount_paid_to_student)
              : Math.round(totalForJob * 0.9);
          totalPaidToStudents += Number.isNaN(paidAmount) ? 0 : paidAmount;
        }
      }

      const walletBalance = Math.max(0, Math.round(totalReceived - totalPaidToStudents));
      logger.info(`[Dashboard] Total earnings (wallet balance): ${walletBalance}`);
      return walletBalance;
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
      const normalizedLimit = Number.isFinite(Number(limit))
        ? Math.min(Math.max(Number(limit), 1), 50)
        : 5;

      const rows = await DB.ActivityLogs.findAll({
        order: [['created_at', 'DESC']],
        limit: normalizedLimit,
        raw: true,
      });
      return rows;
    } catch (error) {
      logger.error('[Dashboard] Error fetching recent activities:', error);
      return [];
    }
  },
  /**
   * Count applications for a student between two dates (inclusive start, exclusive end)
   */
  getStudentApplicationsCountBetween: async (studentId: string, start: Date, end: Date): Promise<number> => {
    try {
      const { Op } = require('sequelize');
      const count = await DB.JobApplications.count({
        where: {
          student_id: studentId,
          applied_at: {
            [Op.gte]: start,
            [Op.lt]: end,
          },
        },
      });
      // If there are application rows, return them.
      if (count && count > 0) {
        logger.info(`[Dashboard] Student ${studentId} applications between ${start.toISOString()} and ${end.toISOString()}: ${count} (from JobApplications)`);
        return Number(count ?? 0);
      }

      // Fallback: some environments track application events in activity_logs.
      // Count activity log entries that look like an application event.
      // We try several heuristics: entity_type 'JobApplication' or description mentioning 'apply'/'appl'.
      try {
        const altCount = await DB.ActivityLogs.count({
          where: {
            user_id: studentId,
            created_at: {
              [Op.gte]: start,
              [Op.lt]: end,
            },
            [Op.or]: [
              { entity_type: 'JobApplication' },
              { entity_type: 'Application' },
              // Description based fallback (case-insensitive)
              DB.sequelize.where(DB.sequelize.fn('LOWER', DB.sequelize.col('description')), {
                [Op.like]: '%appl%'
              }),
            ],
          },
        });

        logger.info(`[Dashboard] Student ${studentId} applications between ${start.toISOString()} and ${end.toISOString()}: ${altCount} (from ActivityLogs fallback)`);
        return Number(altCount ?? 0);
      } catch (e) {
        logger.warn('[Dashboard] ActivityLogs fallback failed:', e);
        return 0;
      }
    } catch (error) {
      logger.error('[Dashboard] Error counting student applications:', error);
      return 0;
    }
  },

  // quick stats for student dashboard
  getStudentAcceptedCount: async (studentId: string): Promise<number> => {
  try {
    const count = await DB.JobApplications.count({
      where: {
        student_id: studentId,
        status: "Accepted",
      },
    });

    return Number(count ?? 0);
  } catch (error) {
    logger.error("[Dashboard] Error counting accepted applications:", error);
    return 0;
  }
},

getStudentJobsInProgressCount: async (
  studentId: string,
): Promise<number> => {
  try {
    const { Op } = require("sequelize");

    const count = await DB.JobApplications.count({
      where: {
        student_id: studentId,
        status: "Accepted",
        completed_at: {
          [Op.is]: null,
        },
      },
    });

    return Number(count ?? 0);
  } catch (error) {
    logger.error("[Dashboard] Error counting jobs in progress:", error);
    return 0;
  }
},

getStudentInterviewScheduledCount: async (
  studentId: string,
): Promise<number> => {
  try {
    if (!(DB as any).Interviews) return 0;

    const { Op } = require("sequelize");

    const count = await (DB as any).Interviews.count({
      where: {
        student_id: studentId,
        status: {
          [Op.ne]: "cancelled",
        },
      },
    });

    return Number(count ?? 0);
  } catch (error) {
    logger.error("[Dashboard] Error counting interviews:", error);
    return 0;
  }
},

getStudentNewJobMatchesCount: async (): Promise<number> => {
  try {
    return await DB.Jobs.count({
      where: {
        status: "Active",
      },
    });
  } catch (error) {
    logger.error("[Dashboard] Error counting active jobs:", error);
    return 0;
  }
},

  /**
   * Sum earnings for a student between two dates using MoMo payout amount.
   * Source of truth: jobs.amount_paid_to_student for paid jobs.
   */
  getStudentEarningsBetween: async (studentId: string, start: Date, end: Date): Promise<{ total: number; currency: string | null }> => {
    try {
      const { Op } = require('sequelize');

      const paidApplications = await DB.JobApplications.findAll({
        where: {
          student_id: studentId,
          status: 'Accepted',
        },
        include: [
          {
            model: DB.Jobs,
            as: 'job',
            required: true,
            where: {
              funding_status: 'Paid',
              amount_paid_to_student: {
                [Op.ne]: null,
              },
              [Op.or]: [
                {
                  paid_at: {
                    [Op.gte]: start,
                    [Op.lt]: end,
                  },
                },
                {
                  paid_at: null,
                  updated_at: {
                    [Op.gte]: start,
                    [Op.lt]: end,
                  },
                },
              ],
            },
            attributes: ['job_id', 'amount_paid_to_student'],
          },
        ],
        attributes: ['application_id', 'job_id'],
      }) as Array<any>;

      const seenJobIds = new Set<string>();
      const total = paidApplications.reduce((sum, application) => {
        const jobId = String(application?.job?.job_id ?? application?.job_id ?? '');
        if (!jobId || seenJobIds.has(jobId)) return sum;
        seenJobIds.add(jobId);

        const paid = Number(application?.job?.amount_paid_to_student ?? 0);
        return sum + (Number.isNaN(paid) ? 0 : paid);
      }, 0);

      logger.info(`[Dashboard] Student ${studentId} MoMo earnings between ${start.toISOString()} and ${end.toISOString()}: ${total}`);
      return { total, currency: null };
    } catch (error) {
      logger.error('[Dashboard] Error summing student earnings:', error);
      return { total: 0, currency: null };
    }
  },
  /**
   * Sum total lifetime earnings for a student from MoMo payouts.
   * Source of truth: jobs.amount_paid_to_student for paid jobs.
   */
  getStudentTotalEarnings: async (studentId: string): Promise<{ total: number; currency: string | null }> => {
    try {
      const { Op } = require('sequelize');
      const paidApplications = await DB.JobApplications.findAll({
        where: {
          student_id: studentId,
          status: 'Accepted',
        },
        include: [
          {
            model: DB.Jobs,
            as: 'job',
            required: true,
            where: {
              funding_status: 'Paid',
              amount_paid_to_student: {
                [Op.ne]: null,
              },
            },
            attributes: ['job_id', 'amount_paid_to_student'],
          },
        ],
        attributes: ['application_id', 'job_id'],
      }) as Array<any>;

      const seenJobIds = new Set<string>();
      const total = paidApplications.reduce((sum, application) => {
        const jobId = String(application?.job?.job_id ?? application?.job_id ?? '');
        if (!jobId || seenJobIds.has(jobId)) return sum;
        seenJobIds.add(jobId);

        const paid = Number(application?.job?.amount_paid_to_student ?? 0);
        return sum + (Number.isNaN(paid) ? 0 : paid);
      }, 0);

      logger.info(`[Dashboard] Student ${studentId} total MoMo earnings: ${total}`);
      return { total, currency: null };
    } catch (error) {
      logger.error('[Dashboard] Error summing student total earnings:', error);
      return { total: 0, currency: null };
    }
  },
  /**
   * Count employer jobs posted in a date range using jobs.created_at
   */
  getEmployerJobsPostedBetween: async (employerId: string, start: Date, end: Date): Promise<number> => {
    try {
      const { Op } = require('sequelize');
      const count = await DB.Jobs.count({
        where: {
          employer_id: employerId,
          created_at: {
            [Op.gte]: start,
            [Op.lt]: end,
          },
        },
      });
      return Number(count ?? 0);
    } catch (error) {
      logger.error('[Dashboard] Error counting employer jobs posted:', error);
      return 0;
    }
  },
  /**
   * Count employer applications received in a date range.
   */
  getEmployerApplicationsReceivedBetween: async (employerId: string, start: Date, end: Date): Promise<number> => {
    try {
      const { Op } = require('sequelize');
      const count = await DB.JobApplications.count({
        include: [
          {
            model: DB.Jobs,
            as: 'job',
            required: true,
            where: {
              employer_id: employerId,
            },
            attributes: [],
          },
        ],
        where: {
          applied_at: {
            [Op.gte]: start,
            [Op.lt]: end,
          },
        },
        distinct: true,
        col: 'application_id',
      });
      return Number(count ?? 0);
    } catch (error) {
      logger.error('[Dashboard] Error counting employer applications:', error);
      return 0;
    }
  },
  /**
   * Count accepted applications (active hires) in a date range.
   */
  getEmployerActiveHiresBetween: async (employerId: string, start: Date, end: Date): Promise<number> => {
    try {
      const { Op } = require('sequelize');
      const count = await DB.JobApplications.count({
        include: [
          {
            model: DB.Jobs,
            as: 'job',
            required: true,
            where: {
              employer_id: employerId,
            },
            attributes: [],
          },
        ],
        where: {
          status: 'Accepted',
          reviewed_at: {
            [Op.gte]: start,
            [Op.lt]: end,
          },
        },
        distinct: true,
        col: 'application_id',
      });
      return Number(count ?? 0);
    } catch (error) {
      logger.error('[Dashboard] Error counting employer active hires:', error);
      return 0;
    }
  },
  /**
   * Employer application status breakdown — counts applications (across all their jobs) by status
   */
  getEmployerApplicationStatusBreakdown: async (employerId: string): Promise<{
    pending: number;
    shortlisted: number;
    accepted: number;
    rejected: number;
    total: number;
  }> => {
    try {
      const rows: Array<{ status: string; count: string }> = await DB.JobApplications.findAll({
        include: [
          {
            model: DB.Jobs,
            as: 'job',
            required: true,
            where: { employer_id: employerId },
            attributes: [],
          },
        ],
        attributes: [
          'status',
          [DB.sequelize.fn('COUNT', DB.sequelize.col('JobApplicationModel.application_id')), 'count'],
        ],
        group: ['JobApplicationModel.status'],
        raw: true,
      }) as any;

      const breakdown = { pending: 0, shortlisted: 0, accepted: 0, rejected: 0, total: 0 };
      for (const r of rows) {
        const n = Number(r.count) || 0;
        const s = String(r.status || '').toLowerCase();
        if (s === 'pending') breakdown.pending += n;
        else if (s === 'shortlisted' || s === 'reviewed') breakdown.shortlisted += n;
        else if (s === 'accepted') breakdown.accepted += n;
        else if (s === 'rejected') breakdown.rejected += n;
        breakdown.total += n;
      }
      return breakdown;
    } catch (error) {
      logger.error('[Dashboard] Error computing employer application breakdown:', error);
      return { pending: 0, shortlisted: 0, accepted: 0, rejected: 0, total: 0 };
    }
  },

  /**
   * Recent applicants for an employer — last N students who applied to any of their jobs
   */
  getEmployerRecentApplicants: async (
    employerId: string,
    limit = 5,
  ): Promise<Array<{
    application_id: string;
    student_id: string;
    student_name: string;
    student_image: string | null;
    job_id: string;
    job_title: string;
    status: string;
    applied_at: Date;
  }>> => {
    try {
      const rows: any[] = await DB.JobApplications.findAll({
        attributes: ['application_id', 'student_id', 'status', 'applied_at'],
        include: [
          {
            model: DB.Jobs,
            as: 'job',
            required: true,
            where: { employer_id: employerId },
            attributes: ['job_id', 'job_title'],
          },
          {
            model: DB.Users,
            as: 'student',
            required: false,
            attributes: ['user_id', 'full_name', 'profile_image_url'],
          },
        ],
        order: [['applied_at', 'DESC']],
        limit,
      });

      return rows.map((r) => {
        const plain = r.get({ plain: true });
        return {
          application_id: plain.application_id,
          student_id: plain.student_id,
          student_name: plain.student?.full_name || 'Unknown student',
          student_image: plain.student?.profile_image_url || null,
          job_id: plain.job?.job_id,
          job_title: plain.job?.job_title || 'Untitled job',
          status: plain.status,
          applied_at: plain.applied_at,
        };
      });
    } catch (error) {
      logger.error('[Dashboard] Error fetching recent applicants:', error);
      return [];
    }
  },

  /**
   * Sum employer funded + paid budgets in a date range.
   */
  getEmployerSpentBetween: async (employerId: string, start: Date, end: Date): Promise<number> => {
    try {
      const { Op } = require('sequelize');
      const rows = await DB.Jobs.findAll({
        where: {
          employer_id: employerId,
          funding_status: {
            [Op.in]: ['Funded', 'Paid'],
          },
          updated_at: {
            [Op.gte]: start,
            [Op.lt]: end,
          },
        },
        attributes: ['budget'],
        raw: true,
      }) as Array<{ budget: number | string }>;

      const total = rows.reduce((sum, row) => {
        const amount = Number(row?.budget ?? 0);
        return sum + (Number.isNaN(amount) ? 0 : amount);
      }, 0);

      return Math.round(total);
    } catch (error) {
      logger.error('[Dashboard] Error summing employer spent amount:', error);
      return 0;
    }
  },
    /**
     * Count jobs completed for a student between two dates (completed_at)
     */
    getStudentJobsCompletedBetween: async (studentId: string, start: Date, end: Date): Promise<number> => {
      try {
        const { Op } = require('sequelize');
        // Prefer explicit completed_at on job_applications
        const count = await DB.JobApplications.count({
          where: {
            student_id: studentId,
            completed_at: {
              [Op.gte]: start,
              [Op.lt]: end,
            },
          } as any,
        });
        logger.info(`[Dashboard] Student ${studentId} jobs completed between ${start.toISOString()} and ${end.toISOString()}: ${count}`);
        return Number(count ?? 0);
      } catch (error) {
        logger.error('[Dashboard] Error counting jobs completed:', error);
        return 0;
      }
    },

    /**
     * Build a 7-day daily timeline (Mon..Sun of the last 7 days, ending today).
     * Returns array of { day: 'Mon'|'Tue'..., date: Date }
     */
    buildLast7Days: (): Array<{ day: string; start: Date; end: Date }> => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const result: Array<{ day: string; start: Date; end: Date }> = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const next = new Date(d);
        next.setDate(d.getDate() + 1);
        result.push({ day: dayNames[d.getDay()], start: d, end: next });
      }
      return result;
    },

    /** Student weekly activity: applications + jobs completed per day for last 7 days */
    getStudentWeeklyActivity: async (studentId: string): Promise<Array<{ day: string; applications: number; completed: number }>> => {
      try {
        const days = repo.buildLast7Days();
        const out: Array<{ day: string; applications: number; completed: number }> = [];
        for (const d of days) {
          const applications = await repo.getStudentApplicationsCountBetween(studentId, d.start, d.end);
          const completed = await repo.getStudentJobsCompletedBetween(studentId, d.start, d.end);
          out.push({ day: d.day, applications, completed });
        }
        return out;
      } catch (error) {
        logger.error('[Dashboard] Error building student weekly activity:', error);
        return [];
      }
    },

    /** Employer weekly activity: applications received + active hires per day for last 7 days */
    getEmployerWeeklyActivity: async (employerId: string): Promise<Array<{ day: string; applications: number; hires: number }>> => {
      try {
        const days = repo.buildLast7Days();
        const out: Array<{ day: string; applications: number; hires: number }> = [];
        for (const d of days) {
          const applications = await repo.getEmployerApplicationsReceivedBetween(employerId, d.start, d.end);
          const hires = await repo.getEmployerActiveHiresBetween(employerId, d.start, d.end);
          out.push({ day: d.day, applications, hires });
        }
        return out;
      } catch (error) {
        logger.error('[Dashboard] Error building employer weekly activity:', error);
        return [];
      }
    },

    /** Admin weekly growth: new students + new employers per day for last 7 days */
    getAdminWeeklyGrowth: async (): Promise<Array<{ day: string; students: number; employers: number }>> => {
      try {
        const { Op } = require('sequelize');
        const days = repo.buildLast7Days();
        const out: Array<{ day: string; students: number; employers: number }> = [];
        for (const d of days) {
          const [students, employers] = await Promise.all([
            DB.Users.count({
              where: { role_type: 'student', created_at: { [Op.gte]: d.start, [Op.lt]: d.end } },
            }),
            DB.Users.count({
              where: { role_type: 'employer', created_at: { [Op.gte]: d.start, [Op.lt]: d.end } },
            }),
          ]);
          out.push({ day: d.day, students: Number(students ?? 0), employers: Number(employers ?? 0) });
        }
        return out;
      } catch (error) {
        logger.error('[Dashboard] Error building admin weekly growth:', error);
        return [];
      }
    },

    /** Student application status breakdown — counts by status across all-time */
    getStudentApplicationStatusBreakdown: async (studentId: string): Promise<{
      pending: number;
      shortlisted: number;
      accepted: number;
      rejected: number;
      total: number;
    }> => {
      try {
        const rows: Array<{ status: string; count: string }> = await DB.JobApplications.findAll({
          where: { student_id: studentId },
          attributes: [
            'status',
            [DB.sequelize.fn('COUNT', DB.sequelize.col('application_id')), 'count'],
          ],
          group: ['status'],
          raw: true,
        }) as any;

        const breakdown = { pending: 0, shortlisted: 0, accepted: 0, rejected: 0, total: 0 };
        for (const r of rows) {
          const n = Number(r.count) || 0;
          const s = String(r.status || '').toLowerCase();
          if (s === 'pending') breakdown.pending += n;
          else if (s === 'shortlisted' || s === 'reviewed') breakdown.shortlisted += n;
          else if (s === 'accepted') breakdown.accepted += n;
          else if (s === 'rejected') breakdown.rejected += n;
          breakdown.total += n;
        }
        return breakdown;
      } catch (error) {
        logger.error('[Dashboard] Error computing application status breakdown:', error);
        return { pending: 0, shortlisted: 0, accepted: 0, rejected: 0, total: 0 };
      }
    },

    /** Student rates: job completion % and application success % across all-time */
    getStudentRates: async (studentId: string): Promise<{ jobCompletionRate: number; applicationSuccessRate: number }> => {
      try {
        const { Op } = require('sequelize');
        const totalApplications = await DB.JobApplications.count({
          where: { student_id: studentId },
        });
        const acceptedApplications = await DB.JobApplications.count({
          where: { student_id: studentId, status: 'Accepted' },
        });
        const completedApplications = await DB.JobApplications.count({
          where: { student_id: studentId, completed_at: { [Op.ne]: null } } as any,
        });

        const applicationSuccessRate = totalApplications > 0
          ? Math.round((acceptedApplications / totalApplications) * 100)
          : 0;
        const jobCompletionRate = acceptedApplications > 0
          ? Math.round((completedApplications / acceptedApplications) * 100)
          : 0;

        return { jobCompletionRate, applicationSuccessRate };
      } catch (error) {
        logger.error('[Dashboard] Error computing student rates:', error);
        return { jobCompletionRate: 0, applicationSuccessRate: 0 };
      }
    },

    /**
     * Count interviews for a student between two dates (uses interviews table)
     */
    getStudentInterviewsBetween: async (studentId: string, start: Date, end: Date): Promise<number> => {
      try {
        if (!(DB as any).Interviews) return 0;
        const { Op } = require('sequelize');
        const count = await (DB as any).Interviews.count({
          where: {
            student_id: studentId,
            scheduled_at: {
              [Op.gte]: start,
              [Op.lt]: end,
            },
            status: {
              [Op.ne]: 'cancelled',
            },
          },
        });
        logger.info(`[Dashboard] Student ${studentId} interviews between ${start.toISOString()} and ${end.toISOString()}: ${count}`);
        return Number(count ?? 0);
      } catch (error) {
        logger.error('[Dashboard] Error counting interviews:', error);
        return 0;
      }
    },
};

export default repo;
