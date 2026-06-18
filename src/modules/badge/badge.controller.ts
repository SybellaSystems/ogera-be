import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
    getBadgeStatusService,
    initiatePremiumSubscription,
    pollBadgePaymentStatus,
    getStudentPurchaseHistory,
    getAdminBadgePurchaseHistory,
    getAdminBadgeStats,
    PREMIUM_PRICE,
    PREMIUM_DURATION_DAYS,
} from './badge.service';
import { CustomError } from '@/utils/custom-error';

export const getBadgeStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.user_id;
        const data = await getBadgeStatusService(userId);
        res.status(StatusCodes.OK).json({
            success: true,
            status: StatusCodes.OK,
            data,
            message: 'Badge status retrieved',
        });
    } catch (error: any) {
        const status = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
        res.status(status).json({
            success: false,
            status,
            message: error.message || 'Failed to get badge status',
        });
    }
};

export const subscribePremium = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.user_id;
        const { currency, payerPhone } = req.body;

        if (!currency || !payerPhone) {
            throw new CustomError('currency and payerPhone are required', StatusCodes.BAD_REQUEST);
        }

        const data = await initiatePremiumSubscription(userId, currency, payerPhone);
        res.status(StatusCodes.OK).json({
            success: true,
            status: StatusCodes.OK,
            data: {
                ...data,
                price: PREMIUM_PRICE,
                durationDays: PREMIUM_DURATION_DAYS,
            },
            message: 'Premium subscription payment initiated. Approve on your phone.',
        });
    } catch (error: any) {
        const status = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
        res.status(status).json({
            success: false,
            status,
            message: error.message || 'Failed to initiate subscription',
        });
    }
};

export const getSubscriptionPaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.user_id;
        const referenceId = String(req.params.referenceId || '');
        const data = await pollBadgePaymentStatus(referenceId, userId);
        res.status(StatusCodes.OK).json({
            success: true,
            status: StatusCodes.OK,
            data,
            message: 'Payment status retrieved',
        });
    } catch (error: any) {
        const status = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
        res.status(status).json({
            success: false,
            status,
            message: error.message || 'Failed to get payment status',
        });
    }
};

export const getPurchaseHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.user_id;
        const data = await getStudentPurchaseHistory(userId);
        res.status(StatusCodes.OK).json({
            success: true,
            status: StatusCodes.OK,
            data,
            message: 'Purchase history retrieved',
        });
    } catch (error: any) {
        const status = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
        res.status(status).json({
            success: false,
            status,
            message: error.message || 'Failed to get purchase history',
        });
    }
};

export const listAdminBadgePurchases = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(String(req.query.page || '1'), 10);
        const limit = parseInt(String(req.query.limit || '20'), 10);
        const result = await getAdminBadgePurchaseHistory(page, limit);
        res.status(StatusCodes.OK).json({
            success: true,
            status: StatusCodes.OK,
            ...result,
            message: 'Badge purchase history retrieved',
        });
    } catch (error: any) {
        const status = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
        res.status(status).json({
            success: false,
            status,
            message: error.message || 'Failed to list badge purchases',
        });
    }
};

export const getBadgeStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await getAdminBadgeStats();
        res.status(StatusCodes.OK).json({
            success: true,
            status: StatusCodes.OK,
            data,
            message: 'Badge statistics retrieved',
        });
    } catch (error: any) {
        const status = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
        res.status(status).json({
            success: false,
            status,
            message: error.message || 'Failed to get badge stats',
        });
    }
};
