import express from 'express';
import {
    createDispute,
    getAllDisputes,
    getDisputeById,
    updateDispute,
    resolveDispute,
    addDisputeMessage,
    uploadEvidence,
    checkAutoEscalation,
    getDisputeStats,
    getUserDisputes,
    upload,
} from './dispute.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { PermissionChecker } from '@/middlewares/role.middleware';

const disputeRouter = express.Router();

// Get dispute statistics (admin/moderator)
disputeRouter.get(
    '/stats',
    authMiddleware,
    PermissionChecker('/disputes', 'view'),
    getDisputeStats,
);

// Get all disputes (admin/moderator)
disputeRouter.get(
    '/',
    authMiddleware,
    PermissionChecker('/disputes', 'view'),
    getAllDisputes,
);

// Get user's disputes (student/employer)
disputeRouter.get(
    '/my-disputes',
    authMiddleware,
    getUserDisputes,
);

// Get dispute by ID
disputeRouter.get(
    '/:id',
    authMiddleware,
    getDisputeById,
);

// Create dispute (student/employer)
disputeRouter.post(
    '/',
    authMiddleware,
    upload.array('evidence_files', 10), // Max 10 files
    createDispute,
);

// Update dispute (moderator/admin)
disputeRouter.put(
    '/:id',
    authMiddleware,
    PermissionChecker('/disputes', 'edit'),
    updateDispute,
);

// Resolve dispute (moderator/admin)
disputeRouter.post(
    '/:id/resolve',
    authMiddleware,
    PermissionChecker('/disputes', 'edit'),
    resolveDispute,
);

// Add message to dispute
disputeRouter.post(
    '/:id/messages',
    authMiddleware,
    addDisputeMessage,
);

// Upload evidence
disputeRouter.post(
    '/:id/evidence',
    authMiddleware,
    upload.single('file'),
    uploadEvidence,
);

// Check auto-escalation (admin/cron)
disputeRouter.post(
    '/check-escalation',
    authMiddleware,
    PermissionChecker('/disputes', 'edit'),
    checkAutoEscalation,
);

export default disputeRouter;




