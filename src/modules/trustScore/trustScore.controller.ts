import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import { CustomError } from '@/utils/custom-error';
import { DB } from '@/database';
import {
    getTrustScoreService,
    getMyTrustScoreService,
    calculateTrustScoreService,
    getTrustScoreHistoryService,
    getStudentLeaderboardService,
    getAdminTrustSummaryService,
} from './trustScore.service';

const response = new ResponseFormat();

const assertSelfOrAdmin = async (req: Request, targetUserId: string) => {
    const requester = req.user?.user_id;
    const roleName = req.user?.role;
    if (!requester) {
        throw new CustomError('User not authenticated', StatusCodes.UNAUTHORIZED);
    }
    if (requester === targetUserId) return;
    const low = roleName?.toLowerCase();
    if (low === 'superadmin' || low === 'admin') return;
    const role = await DB.Roles.findOne({ where: { roleName } });
    if (role?.roleType === 'admin') return;
    throw new CustomError('Forbidden', StatusCodes.FORBIDDEN);
};

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

export const getUserTrustScore = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.params.user_id as string;

        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'User ID is required',
            );
            return;
        }

        await assertSelfOrAdmin(req, user_id);

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

/** POST or GET /calculate/:user_id — recompute, persist users + history */
export const calculateTrustScore = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.params.user_id as string;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'User ID is required',
            );
            return;
        }
        await assertSelfOrAdmin(req, user_id);
        const data = await calculateTrustScoreService(user_id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            data,
            'TrustScore calculated and saved',
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

export const getTrustHistory = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.params.user_id as string;
        const limit = req.query.limit
            ? parseInt(String(req.query.limit), 10)
            : 20;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'User ID is required',
            );
            return;
        }
        await assertSelfOrAdmin(req, user_id);
        const history = await getTrustScoreHistoryService(user_id, limit);
        response.response(
            res,
            true,
            StatusCodes.OK,
            { user_id, history },
            'TrustScore history retrieved',
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

export const getStudentLeaderboard = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const limit = req.query.limit
            ? parseInt(String(req.query.limit), 10)
            : 20;
        const rows = await getStudentLeaderboardService(limit);
        response.response(
            res,
            true,
            StatusCodes.OK,
            { leaderboard: rows },
            'Leaderboard retrieved',
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

export const getAdminTrustSummary = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const summary = await getAdminTrustSummaryService();
        response.response(
            res,
            true,
            StatusCodes.OK,
            summary,
            'Trust analytics retrieved',
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


