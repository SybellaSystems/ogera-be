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
    deleteJobService,
    toggleJobStatusService,
} from './job.service';

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
        // Check if status query parameter is provided
        const status = req.query.status as string | undefined;
        const jobs = await getAllJobsService(status);
        response.response(
            res,
            true,
            StatusCodes.OK,
            jobs,
            Messages.Job.GET_ALL_JOBS,
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
        const jobs = await getJobsByStatusService('Active');
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
        const jobs = await getJobsByStatusService('Pending');
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
        const jobs = await getJobsByStatusService('Completed');
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
        const job = await getJobByIdService(req.params.id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            job,
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
        const job = await updateJobService(req.params.id, req.body);
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

export const deleteJob = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const result = await deleteJobService(req.params.id);
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
            req.params.id,
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
