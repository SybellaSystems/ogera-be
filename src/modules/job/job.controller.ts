import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import { Messages } from '@/utils/messages';
import {
    createJobService,
    getAllJobsService,
    getJobsByStatusService,
    getJobByIdService,
    updateJobService,
    reviewJobService,
    deleteJobService,
    toggleJobStatusService,
} from './job.service';
import { DB } from '@/database';
import { MOMO_CONFIG } from '@/config';

const response = new ResponseFormat();

export const createJob = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        if (!req.user) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }
        const job = await createJobService(
            req.body,
            req.user.user_id,
            req.user.role,
        );
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            job,
            Messages.Job.CREATE_JOB,
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const getAllJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Math.max(
      Number(req.query.page) || 1,
      1,
    );

    const limit = Math.max(
      Number(req.query.limit) || 10,
      1,
    );

    const jobs = await getAllJobsService(
      {
        status: req.query.status as string | undefined,
        funded: req.query.funded as string | undefined,
        search: req.query.search as string | undefined,
        location: req.query.location as string | undefined,
        category: req.query.category as string | undefined,
        currency: req.query.currency as string | undefined,
        payment_range: req.query.payment_range as
          | string
          | undefined,
      },
      req.user,
      {
        page,
        limit,
      },
    );

    return res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    message: Messages.Job.GET_ALL_JOBS,
    success: true,
    pagination: jobs.pagination,
    data: jobs.data,
});
  } catch (error: any) {
    console.error("Error in getAllJobs:", error);

    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message || "Failed to fetch jobs",
    );
  }
};

// Public jobs list for landing page (no auth required)
export const getPublicJobs = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const jobs = await getAllJobsService({ status: 'Active' }, undefined);
        response.response(
            res,
            true,
            StatusCodes.OK,
            jobs,
            'Public jobs retrieved successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// Get active jobs
export const getActiveJobs = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        // Public landing page should show the same Active jobs list visible in app.
        // Use the general jobs query with status filter (no forced funded filter).
        const jobs = await getAllJobsService({ status: 'Active' }, req.user);
        response.response(
            res,
            true,
            StatusCodes.OK,
            jobs,
            'Active jobs retrieved successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// Get pending jobs
export const getPendingJobs = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const jobs = await getJobsByStatusService('Pending', req.user);
        response.response(
            res,
            true,
            StatusCodes.OK,
            jobs,
            'Pending jobs retrieved successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// Get completed jobs
export const getCompletedJobs = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const jobs = await getJobsByStatusService('Completed', req.user);
        response.response(
            res,
            true,
            StatusCodes.OK,
            jobs,
            'Completed jobs retrieved successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const getJobById = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const job = await getJobByIdService(req.params.id as string);
        const rawJob = job && typeof job.get === 'function' ? job.get({ plain: true }) : job;
        const jobData = rawJob as unknown as Record<string, unknown>;
        const userRole = req.user?.role ? String(req.user.role).toLowerCase().trim() : '';
        const jobStatus = String(jobData?.status || '');
        if (userRole === 'student' && jobStatus !== 'Active') {
            response.errorResponse(
                res,
                StatusCodes.FORBIDDEN,
                false,
                'This job has not been approved yet and is not visible to students.',
            );
            return;
        }
        if (req.user && jobData && jobData.funding_status === 'Paid') {
            const application = await DB.JobApplications.findOne({
                where: { job_id: req.params.id, status: 'Accepted' },
                attributes: ['student_id'],
            });
            const app = application as { student_id?: string } | null;
            if (app && app.student_id === req.user.user_id) {
                const paid = jobData.amount_paid_to_student;
                const budget = Number(jobData.budget) || 0;
                const feePct = MOMO_CONFIG?.serviceFeePercent ?? 10;
                (jobData as Record<string, unknown>).amount_received_by_you =
                    paid != null ? Number(paid) : Math.round(budget * (1 + feePct / 100) * 0.9);
            }
        }
        response.response(
            res,
            true,
            StatusCodes.OK,
            jobData,
            Messages.Job.GET_JOB_BY_ID,
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.NOT_FOUND,
            false,
            error.message,
        );
    }
};

export const updateJob = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const job = await updateJobService(req.params.id as string, req.body);
        response.response(
            res,
            true,
            StatusCodes.OK,
            job,
            Messages.Job.UPDATE_JOB,
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.BAD_REQUEST,
            false,
            error.message,
        );
    }
};

export const reviewJob = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        if (!req.user) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }
        const status = req.body?.status as 'Active' | 'Inactive';
        if (status !== 'Active' && status !== 'Inactive') {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Review status must be Active or Inactive',
            );
            return;
        }
        const job = await reviewJobService(
            req.params.id as string,
            req.user.user_id,
            req.user.role,
            status,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            job,
            'Job reviewed successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.BAD_REQUEST,
            false,
            error.message,
        );
    }
};

export const deleteJob = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        if (!req.user) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }
        const result = await deleteJobService(
            req.params.id as string,
            req.user.user_id,
            req.user.role,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            Messages.Job.DELETE_JOB,
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.NOT_FOUND,
            false,
            error.message,
        );
    }
};

export const toggleJobStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        if (!req.user) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }
        const job = await toggleJobStatusService(
            req.params.id as string,
            req.user.user_id,
            req.user.role,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            job,
            'Job status toggled successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};
