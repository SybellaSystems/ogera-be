import express, { Router } from 'express';
import * as sessionController from './session.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router: Router = express.Router();

/**
 * Get all active sessions for current user
 * GET /sessions
 * @auth Required - User token
 */
router.get('/', authMiddleware, sessionController.getActiveSessions);

/**
 * Revoke a specific session
 * DELETE /sessions/:sessionId
 * @auth Required - User token
 */
router.delete('/:sessionId', authMiddleware, sessionController.revokeSession);

/**
 * Revoke all other sessions
 * POST /sessions/logout/others
 * @auth Required - User token
 */
router.post(
    '/logout/others',
    authMiddleware,
    sessionController.revokeOtherSessions,
);

/**
 * Revoke all sessions
 * POST /sessions/logout/all
 * @auth Required - User token
 */
router.post('/logout/all', authMiddleware, sessionController.revokeAllSessions);

export default router;
