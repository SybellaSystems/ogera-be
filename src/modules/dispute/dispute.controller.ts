import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import {
    createDisputeService,
    getAllDisputesService,
    getDisputeByIdService,
    updateDisputeService,
    resolveDisputeService,
    addDisputeMessageService,
    uploadEvidenceService,
    checkAutoEscalationService,
    getDisputeStatsService,
    getUserDisputesService,
} from './dispute.service';
import { CustomError } from '@/utils/custom-error';
import multer from 'multer';

const response = new ResponseFormat();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Create dispute
export const createDispute = async (req: Request, res: Response): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        const userRole = req.user?.role?.toLowerCase() as 'student' | 'employer';

        if (!user_id || (userRole !== 'student' && userRole !== 'employer')) {
            response.errorResponse(
                res,
                StatusCodes.FORBIDDEN,
                false,
                'Only students and employers can create disputes',
            );
            return;
        }

        const files = req.files as Express.Multer.File[];
        const dispute = await createDisputeService(
            {
                ...req.body,
                evidence_files: files,
            },
            user_id,
            userRole,
        );

        response.response(
            res,
            true,
            StatusCodes.CREATED,
            dispute ?? {},
            'Dispute created successfully',
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

// Get all disputes
export const getAllDisputes = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, priority, type, page, limit } = req.query;
        const user_id = req.user?.user_id;
        const userRole = req.user?.role?.toLowerCase();
        
        // Handle multiple status values (for In Progress page)
        let statusFilter: any = status;
        if (status && typeof status === 'string' && status.includes(',')) {
            statusFilter = status.split(',').map(s => s.trim());
        } else if (Array.isArray(status)) {
            statusFilter = status;
        }
        
        const result = await getAllDisputesService(
            {
                status: statusFilter as any,
                priority: priority as any,
                type: type as string,
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined,
            },
            user_id,
            userRole,
        );

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Disputes retrieved successfully',
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

// Get dispute by ID
export const getDisputeById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
        const user_id = req.user?.user_id;
        const userRole = req.user?.role?.toLowerCase();

        if (!id) {
            response.errorResponse(res, StatusCodes.BAD_REQUEST, false, 'Dispute ID is required');
            return;
        }

        const result = await getDisputeByIdService(id, user_id, userRole);

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Dispute retrieved successfully',
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

// Update dispute
export const updateDispute = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
        const user_id = req.user?.user_id;
        const userRole = req.user?.role?.toLowerCase();

        const result = await updateDisputeService(id!, req.body, user_id!, userRole!);

        response.response(
            res,
            true,
            StatusCodes.OK,
            result ?? {},
            'Dispute updated successfully',
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

// Resolve dispute
export const resolveDispute = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
        const { resolution, resolution_notes, refund_amount } = req.body;
        const user_id = req.user?.user_id;
        const userRole = req.user?.role?.toLowerCase();

        if (!resolution || !resolution_notes) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Resolution and resolution_notes are required',
            );
            return;
        }
        const result = await resolveDisputeService(
            id!,
            resolution,
            resolution_notes,
            user_id!,
            userRole!,
            refund_amount,
        );

        response.response(
            res,
            true,
            StatusCodes.OK,
            result ?? {},
            'Dispute resolved successfully',
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

// Add message to dispute
export const addDisputeMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
        const { message, is_internal } = req.body;
        const user_id = req.user?.user_id;
        const userRole = req.user?.role?.toLowerCase() as any;

        if (!message) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Message is required',
            );
            return;
        }

        const result = await addDisputeMessageService(id!, { message, is_internal }, user_id!, userRole);

        response.response(
            res,
            true,
            StatusCodes.CREATED,
            result,
            'Message added successfully',
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

// Upload evidence
export const uploadEvidence = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
        const { description } = req.body;
        const user_id = req.user?.user_id;
        const file = req.file;

        if (!file) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'File is required',
            );
            return;
        }

        const result = await uploadEvidenceService(id!, file, description, user_id!);

        response.response(
            res,
            true,
            StatusCodes.CREATED,
            result,
            'Evidence uploaded successfully',
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

// Check auto-escalation (admin endpoint, can be called by cron)
export const checkAutoEscalation = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await checkAutoEscalationService();

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Auto-escalation check completed',
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

// Get dispute statistics
export const getDisputeStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await getDisputeStatsService();

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Dispute statistics retrieved successfully',
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

// Get user disputes
export const getUserDisputes = async (req: Request, res: Response): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        const userRole = req.user?.role?.toLowerCase() as 'student' | 'employer';

        if (!user_id || (userRole !== 'student' && userRole !== 'employer')) {
            response.errorResponse(
                res,
                StatusCodes.FORBIDDEN,
                false,
                'Only students and employers can view their disputes',
            );
            return;
        }

        const disputes = await getUserDisputesService(user_id, userRole);

        response.response(
            res,
            true,
            StatusCodes.OK,
            disputes, // Return array directly
            'User disputes retrieved successfully',
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

export { upload };


