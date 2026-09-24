import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import {
    createCognitiveTestService,
    listCognitiveTestsAdminService,
    getCognitiveTestAdminService,
    updateCognitiveTestService,
    deleteCognitiveTestService,
    addQuestionService,
    updateQuestionService,
    deleteQuestionService,
    listPublishedCognitiveTestsService,
    getPublishedTestForAttemptService,
    submitCognitiveAttemptService,
    getMyCognitiveAttemptHistoryService,
} from './cognitiveTest.service';

const response = new ResponseFormat();

export const createCognitiveTest = async (
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
                'Unauthorized',
            );
            return;
        }
        const data = await createCognitiveTestService(
            req.body,
            req.user.user_id,
        );
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            data as any,
            'Cognitive test created',
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

export const listCognitiveTestsAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
        const result = await listCognitiveTestsAdminService({
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

export const getCognitiveTestAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const data = await getCognitiveTestAdminService(
            req.params.id as string,
        );
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

export const updateCognitiveTest = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const data = await updateCognitiveTestService(
            req.params.id as string,
            req.body,
        );
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

export const deleteCognitiveTest = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const data = await deleteCognitiveTestService(req.params.id as string);
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

export const addQuestion = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const data = await addQuestionService(
            req.params.id as string,
            req.body,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            data as any,
            'Question added',
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

export const updateQuestion = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const data = await updateQuestionService(
            req.params.id as string,
            req.params.questionId as string,
            req.body,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            data as any,
            'Question updated',
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

export const deleteQuestion = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const data = await deleteQuestionService(
            req.params.id as string,
            req.params.questionId as string,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            data as any,
            'Question deleted',
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

export const listPublishedCognitiveTests = async (
    _req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const data = await listPublishedCognitiveTestsService();
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

export const getPublishedTestForAttempt = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const data = await getPublishedTestForAttemptService(
            req.params.id as string,
        );
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

export const submitCognitiveAttempt = async (
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
                'Unauthorized',
            );
            return;
        }
        const { answers } = req.body as { answers?: Record<string, number> };
        if (!answers || typeof answers !== 'object') {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'answers object required',
            );
            return;
        }
        const data = await submitCognitiveAttemptService(
            req.user.user_id,
            req.params.id as string,
            answers,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            data as any,
            'Attempt recorded',
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

export const getMyCognitiveAttemptHistory = async (
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
                'Unauthorized',
            );
            return;
        }
        const data = await getMyCognitiveAttemptHistoryService(
            req.user.user_id,
        );
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
