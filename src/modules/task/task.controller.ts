import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import {
    createTaskService,
    deleteTaskService,
    getMyAssignedTasksService,
    getEmployerTaskOverviewService,
    getJobTaskManagementService,
    updateTaskService,
    updateTaskStatusService,
} from './task.service';

const response = new ResponseFormat();
const getParam = (value: string | string[] | undefined): string =>
    Array.isArray(value) ? value[0] : value || '';

export const getEmployerTaskOverview = async (req: Request, res: Response) => {
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

        const data = await getEmployerTaskOverviewService(req.user.user_id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            data,
            'Employer task overview retrieved successfully',
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

export const getMyAssignedTasks = async (req: Request, res: Response) => {
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

        const data = await getMyAssignedTasksService(req.user.user_id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            data,
            'Assigned tasks retrieved successfully',
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

export const getJobTaskManagement = async (req: Request, res: Response) => {
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

        const data = await getJobTaskManagementService(
            getParam(req.params.job_id),
            req.user.user_id,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            data,
            'Job task management retrieved successfully',
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

export const createTask = async (req: Request, res: Response) => {
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

        const task = await createTaskService(
            getParam(req.params.job_id),
            req.body,
            req.user.user_id,
        );
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            task,
            'Task created successfully',
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

export const updateTask = async (req: Request, res: Response) => {
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

        const task = await updateTaskService(
            getParam(req.params.job_id),
            getParam(req.params.task_id),
            req.body,
            req.user.user_id,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            task,
            'Task updated successfully',
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

export const updateTaskStatus = async (req: Request, res: Response) => {
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

        const task = await updateTaskStatusService(
            getParam(req.params.job_id),
            getParam(req.params.task_id),
            req.body.status,
            req.user.user_id,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            task,
            'Task status updated successfully',
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

export const deleteTask = async (req: Request, res: Response) => {
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

        const result = await deleteTaskService(
            getParam(req.params.job_id),
            getParam(req.params.task_id),
            req.user.user_id,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Task deleted successfully',
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
