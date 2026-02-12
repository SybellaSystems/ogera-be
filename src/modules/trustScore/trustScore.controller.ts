import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import {
    getTrustScoreService,
    getMyTrustScoreService,
} from './trustScore.service';

const response = new ResponseFormat();

/**
 * Get TrustScore for authenticated user
 */
export const getMyTrustScore = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const trustScore = await getMyTrustScoreService(user_id);

        response.response(
            res,
            true,
            StatusCodes.OK,
            trustScore,
            'TrustScore retrieved successfully',
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

/**
 * Get TrustScore for a specific user (admin only)
 */
export const getUserTrustScore = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { user_id } = req.params;

        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'User ID is required',
            );
            return;
        }

        const trustScore = await getTrustScoreService(user_id as string);

        response.response(
            res,
            true,
            StatusCodes.OK,
            trustScore,
            'TrustScore retrieved successfully',
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

