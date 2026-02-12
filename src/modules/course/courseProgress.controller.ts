import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import {
    markStepCompleteService,
    markStepIncompleteService,
    getCourseProgressService,
    getCourseCompletionService,
    getAllCoursesProgressService,
    checkCourseStartedService,
    getCourseStudentsService,
    getCourseStatisticsService,
    getCourseSpecificStatisticsService,
} from './courseProgress.service';

const response = new ResponseFormat();

export const markStepComplete = async (
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

        const { course_id, step_id } = req.body;
        const user_id = req.user.user_id;

        if (!course_id || !step_id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Course ID and Step ID are required',
            );
            return;
        }

        const result = await markStepCompleteService(user_id, course_id, step_id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Step marked as complete',
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

export const markStepIncomplete = async (
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

        const { course_id, step_id } = req.body;
        const user_id = req.user.user_id;

        if (!course_id || !step_id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Course ID and Step ID are required',
            );
            return;
        }

        const result = await markStepIncompleteService(user_id, course_id, step_id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Step marked as incomplete',
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

export const getCourseProgress = async (
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

        const { course_id } = req.params;
        const user_id = req.user.user_id;

        if (!course_id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Course ID is required',
            );
            return;
        }

        const result = await getCourseProgressService(user_id, course_id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Course progress retrieved successfully',
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

export const getCourseCompletion = async (
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

        const { course_id } = req.params;
        const user_id = req.user.user_id;

        if (!course_id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Course ID is required',
            );
            return;
        }

        const result = await getCourseCompletionService(user_id, course_id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Course completion retrieved successfully',
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

export const getAllCoursesProgress = async (
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

        const user_id = req.user.user_id;
        const result = await getAllCoursesProgressService(user_id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'All courses progress retrieved successfully',
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

export const checkCourseStarted = async (
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

        const { course_id } = req.params;
        const user_id = req.user.user_id;

        if (!course_id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Course ID is required',
            );
            return;
        }

        const result = await checkCourseStartedService(user_id, course_id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Course start status retrieved successfully',
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

export const getCourseStudents = async (
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

        const { course_id } = req.params;

        if (!course_id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Course ID is required',
            );
            return;
        }

        const result = await getCourseStudentsService(course_id);
        
        // Ensure result is an array
        const studentsArray = Array.isArray(result) ? result : [];
        
        response.response(
            res,
            true,
            StatusCodes.OK,
            studentsArray,
            'Course students retrieved successfully',
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

export const getCourseStatistics = async (
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

        const result = await getCourseStatisticsService();
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Course statistics retrieved successfully',
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

export const getCourseSpecificStatistics = async (
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

        const { course_id } = req.params;

        if (!course_id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Course ID is required',
            );
            return;
        }

        const result = await getCourseSpecificStatisticsService(course_id);
        if (!result) {
            response.errorResponse(
                res,
                StatusCodes.NOT_FOUND,
                false,
                'Course not found',
            );
            return;
        }

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Course statistics retrieved successfully',
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
