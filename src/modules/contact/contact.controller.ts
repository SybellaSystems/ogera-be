import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import logger from '@/utils/logger';

const response = new ResponseFormat();

export const submitContact = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fullName, email, phone, countryCode, message } = req.body;

        if (!fullName || !email || !message) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Full name, email, and message are required',
            );
            return;
        }

        // Log the contact form submission
        logger.info(`Contact form submission from ${fullName} (${email})`);

        // TODO: Send email notification or store in database

        response.response(
            res,
            true,
            StatusCodes.OK,
            null,
            'Message received! We will get back to you shortly.',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};
