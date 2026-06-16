import express from 'express';
import {
    getBadgeStatus,
    subscribePremium,
    getSubscriptionPaymentStatus,
    getPurchaseHistory,
    listAdminBadgePurchases,
    getBadgeStats,
} from './badge.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { adminOrSuperadminOnly, studentRoleOnly } from '@/middlewares/role.middleware';

const badgeRouter = express.Router();

badgeRouter.get('/status', authMiddleware, getBadgeStatus);
badgeRouter.post('/subscribe', authMiddleware, studentRoleOnly, subscribePremium);
badgeRouter.get('/subscribe/status/:referenceId', authMiddleware, studentRoleOnly, getSubscriptionPaymentStatus);
badgeRouter.get('/history', authMiddleware, getPurchaseHistory);
badgeRouter.get('/admin/purchases', authMiddleware, adminOrSuperadminOnly, listAdminBadgePurchases);
badgeRouter.get('/admin/stats', authMiddleware, adminOrSuperadminOnly, getBadgeStats);

export default badgeRouter;
