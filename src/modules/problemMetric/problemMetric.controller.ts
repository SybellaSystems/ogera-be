import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import {
    createProblemMetricService,
    listProblemMetricsAdminService,
    getProblemMetricAdminService,
    updateProblemMetricService,
    deleteProblemMetricService,
    addProblemMetricQuestionService,
    updateProblemMetricQuestionService,
    deleteProblemMetricQuestionService,
    listPublishedProblemMetricsService,
    getPublishedProblemMetricForAttemptService,
    submitProblemMetricAttemptService,
    getMyProblemMetricAttemptHistoryService,
} from './problemMetric.service';

const response = new ResponseFormat();

export const createProblemMetric = async (
    req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    try {
        if (!req.user) {
            response.errorResponse(res, StatusCodes.UNAUTHORIZED, false, 'Unauthorized');
            return;
        }
        const data = await createProblemMetricService(req.body, req.user.user_id);
        response.response(res, true, StatusCodes.CREATED, data as any, 'Problem metric created');
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const listProblemMetricsAdmin = async (
    req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
        const result = await listProblemMetricsAdminService({
            category: req.query.category as string | undefined,
            search: req.query.search as string | undefined,
            page,
            limit,
        });

        res.status(StatusCodes.OK).send({
            status: StatusCodes.OK,
            message: 'OK',
            success: true,
            pagination: result.pagination,
            data: result.data,
        });
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const getProblemMetricAdmin = async (
    req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    try {
        const data = await getProblemMetricAdminService(req.params.id as string);
        response.response(res, true, StatusCodes.OK, data as any, 'OK');
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const updateProblemMetric = async (
    req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    try {
        const data = await updateProblemMetricService(req.params.id as string, req.body);
        response.response(res, true, StatusCodes.OK, data as any, 'Updated');
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const deleteProblemMetric = async (
    req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    try {
        const data = await deleteProblemMetricService(req.params.id as string);
        response.response(res, true, StatusCodes.OK, data as any, 'Deleted');
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const addProblemMetricQuestion = async (
    req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    try {
        const data = await addProblemMetricQuestionService(req.params.id as string, req.body);
        response.response(res, true, StatusCodes.OK, data as any, 'Question added');
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const updateProblemMetricQuestion = async (
    req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    try {
        const data = await updateProblemMetricQuestionService(
            req.params.id as string,
            req.params.questionId as string,
            req.body,
        );
        response.response(res, true, StatusCodes.OK, data as any, 'Question updated');
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const deleteProblemMetricQuestion = async (
    req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    try {
        const data = await deleteProblemMetricQuestionService(req.params.id as string, req.params.questionId as string);
        response.response(res, true, StatusCodes.OK, data as any, 'Question deleted');
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const listPublishedProblemMetrics = async (
    _req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    try {
        const data = await listPublishedProblemMetricsService();
        response.response(res, true, StatusCodes.OK, data as any, 'OK');
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const getPublishedProblemMetricForAttempt = async (
    req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    try {
        const data = await getPublishedProblemMetricForAttemptService(req.params.id as string);
        response.response(res, true, StatusCodes.OK, data as any, 'OK');
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const submitProblemMetricAttempt = async (
    req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    try {
        if (!req.user) {
            response.errorResponse(res, StatusCodes.UNAUTHORIZED, false, 'Unauthorized');
            return;
        }
        const { answers } = req.body as { answers?: Record<string, number> };
        if (!answers || typeof answers !== 'object') {
            response.errorResponse(res, StatusCodes.BAD_REQUEST, false, 'answers object required');
            return;
        }
        const data = await submitProblemMetricAttemptService(req.user.user_id, req.params.id as string, answers);
        response.response(res, true, StatusCodes.OK, data as any, 'Attempt recorded');
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const getMyProblemMetricAttemptHistory = async (
    req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    try {
        if (!req.user) {
            response.errorResponse(res, StatusCodes.UNAUTHORIZED, false, 'Unauthorized');
            return;
        }
        const data = await getMyProblemMetricAttemptHistoryService(req.user.user_id);
        response.response(res, true, StatusCodes.OK, data as any, 'OK');
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};
