import { Request, Response } from 'express';
import { SessionService } from './session.service';
import { StatusCodes } from 'http-status-codes';
import { clearAuthCookies } from '@/utils/authCookies';

const sessionService = new SessionService();

/**
 * Get all active sessions for the current user
 */
export const getActiveSessions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.user_id;

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'User ID not found in request',
                error: 'Unauthorized',
            });
        }

        try {
            const sessions = await sessionService.getActiveSessionsByUserId(
                userId,
            );

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Active sessions retrieved successfully',
                data: sessions || [],
            });
        } catch (serviceError: any) {
            console.error('Session service error:', serviceError);
            // Return empty sessions array if no sessions exist
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Active sessions retrieved successfully',
                data: [],
            });
        }
    } catch (error: any) {
        console.error('Error in getActiveSessions:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to retrieve sessions',
            error: error.message,
        });
    }
};

/**
 * Revoke a specific session
 */
export const revokeSession = async (req: Request, res: Response) => {
    try {
        const sessionId = Array.isArray(req.params.sessionId)
            ? req.params.sessionId[0]
            : req.params.sessionId;
        const userId = (req as any).user?.user_id;

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'User ID not found in request',
                error: 'Unauthorized',
            });
        }

        if (!sessionId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Session ID is required',
                error: 'Invalid request',
            });
        }

        // Verify user owns this session before revoking
        const sessions = await sessionService.getActiveSessionsByUserId(userId);
        const sessionExists = sessions.some((s: any) => s.id === sessionId);

        if (!sessionExists) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: 'Session not found or does not belong to user',
                error: 'Forbidden',
            });
        }

        await sessionService.revokeSession(sessionId);

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Session revoked successfully',
        });
    } catch (error: any) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to revoke session',
            error: error.message,
        });
    }
};

/**
 * Revoke all other sessions (logout from all other devices)
 */
export const revokeOtherSessions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.user_id;
        const currentSessionId = (req as any).sessionId;

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'User ID not found in request',
                error: 'Unauthorized',
            });
        }

        if (!currentSessionId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Current session ID not found',
                error: 'Invalid request',
            });
        }

        await sessionService.revokeOtherSessions(userId, currentSessionId);

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'All other sessions revoked successfully',
        });
    } catch (error: any) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to revoke sessions',
            error: error.message,
        });
    }
};

/**
 * Revoke all sessions (logout from everywhere)
 */
export const revokeAllSessions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.user_id;

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'User ID not found in request',
                error: 'Unauthorized',
            });
        }

        await sessionService.revokeAllSessions(userId);

        clearAuthCookies(res);

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'All sessions revoked successfully',
        });
    } catch (error: any) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to revoke all sessions',
            error: error.message,
        });
    }
};
