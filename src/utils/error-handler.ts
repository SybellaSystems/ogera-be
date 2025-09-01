import { Request, Response, NextFunction } from 'express';
import { CustomError } from './custom-error';
import { ResponseFormat } from '@/exception/responseFormat';

const response = new ResponseFormat();

export const errorHandler = (
    err: Error | CustomError,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const statusCode = err instanceof CustomError ? err.statusCode : 500;
    const message = err.message || 'Internal Server Error';

    return response.errorResponse(res, statusCode, false, message);
};
