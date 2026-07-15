import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import logger from '@/utils/logger';
import { CustomError } from '@/utils/custom-error';
import communityWorkspaceService from './communityWorkspace.service';

/**
 * POST /api/community-workspace/link
 */
export const submitStudentLink = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.user_id as string;

        const result = await communityWorkspaceService.submitStudentLink(
            userId,
            req.body,
        );

        res.status(StatusCodes.CREATED).json({
            success: true,
            status: StatusCodes.CREATED,
            data: result,
            message: 'Profile link submitted successfully.',
        });
    } catch (error) {
        logger.error('[Community Workspace] submitStudentLink:', error);

        if (error instanceof CustomError) {
            res.status(error.statusCode).json({
                success: false,
                status: error.statusCode,
                message: error.message,
            });
            return;
        }

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: 'Failed to submit profile link.',
        });
    }
};

/**
 * GET /api/community-workspace/my-link
 */
export const getMyStudentLink = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.user_id as string;

        const result = await communityWorkspaceService.getMyStudentLink(userId);

        res.status(StatusCodes.OK).json({
            success: true,
            status: StatusCodes.OK,
            data: result,
            message: 'Student link retrieved successfully.',
        });
    } catch (error) {
        logger.error('[Community Workspace] getMyStudentLink:', error);

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: 'Failed to retrieve student link.',
        });
    }
};

/**
 * PUT /api/community-workspace/link/:id
 */
export const updateStudentLink = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const id = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id;

        const result = await communityWorkspaceService.updateStudentLink(
            id,
            req.body,
        );

        res.status(StatusCodes.OK).json({
            success: true,
            status: StatusCodes.OK,
            data: result,
            message: 'Profile link updated successfully.',
        });
    } catch (error) {
        logger.error('[Community Workspace] updateStudentLink:', error);

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: 'Failed to update profile link.',
        });
    }
};

/**
 * DELETE /api/community-workspace/link/:id
 */
export const deleteStudentLink = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const id = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id;

        await communityWorkspaceService.deleteStudentLink(id);

        res.status(StatusCodes.OK).json({
            success: true,
            status: StatusCodes.OK,
            message: 'Profile link deleted successfully.',
        });
    } catch (error) {
        logger.error('[Community Workspace] deleteStudentLink:', error);

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: 'Failed to delete profile link.',
        });
    }
};

/**
 * GET /api/community-workspace/feed
 */
export const getCommunityFeed = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.user_id as string;

        const result = await communityWorkspaceService.getCommunityFeed(userId);

        res.status(StatusCodes.OK).json({
            success: true,
            status: StatusCodes.OK,
            data: result,
            message: 'Community feed retrieved successfully.',
        });
    } catch (error: any) {
        console.error(error);
        console.error(error.message);
        console.error(error.stack);

        logger.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * POST /api/community-workspace/review/:linkId
 */
export const submitPeerReview = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const reviewerId = req.user?.user_id as string;
        const linkId = Array.isArray(req.params.linkId)
            ? req.params.linkId[0]
            : req.params.linkId;

        const result = await communityWorkspaceService.submitPeerReview(
            reviewerId,
            linkId,
            req.body,
        );

        res.status(StatusCodes.CREATED).json({
            success: true,
            status: StatusCodes.CREATED,
            data: result,
            message: 'Review submitted successfully.',
        });
    } catch (error) {
        logger.error('[Community Workspace] submitPeerReview:', error);

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: 'You have already reviewed this profile.',
        });
    }
};

/**
 * GET /api/community-workspace/review/:linkId
 */
export const getReviews = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const linkId = Array.isArray(req.params.linkId)
            ? req.params.linkId[0]
            : req.params.linkId;

        const result = await communityWorkspaceService.getReviews(linkId);

        res.status(StatusCodes.OK).json({
            success: true,
            status: StatusCodes.OK,
            data: result,
            message: 'Reviews retrieved successfully.',
        });
    } catch (error) {
        logger.error('[Community Workspace] getReviews:', error);

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: 'Failed to retrieve reviews.',
        });
    }
};

export default {
    submitStudentLink,
    getMyStudentLink,
    updateStudentLink,
    deleteStudentLink,
    getCommunityFeed,
    submitPeerReview,
    getReviews,
};
