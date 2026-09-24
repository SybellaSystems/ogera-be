import express, { Router } from 'express';
import {
    getEmployerDashboard,
    getMetrics,
    getRecentActivities,
    getStudentDashboard,
} from './dashboard.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { adminOrSuperadminOnly } from '@/middlewares/role.middleware';

const router: Router = express.Router();

/**
 * GET /api/dashboard/metrics
 * Get all dashboard metrics (admin/superadmin)
 * Requires: Authentication + Admin/Superadmin role
 */
router.get('/metrics', authMiddleware, adminOrSuperadminOnly, getMetrics);

/**
 * GET /api/dashboard/recent-activities
 */
router.get(
    '/recent-activities',
    authMiddleware,
    adminOrSuperadminOnly,
    getRecentActivities,
);

/**
 * GET /api/dashboard/student
 * Get dashboard metrics for authenticated student
 * Requires authentication (student)
 */
router.get('/student', authMiddleware, getStudentDashboard);

/**
 * GET /api/dashboard/employer
 * Get dashboard metrics for authenticated employer
 * Requires authentication (employer)
 */
router.get('/employer', authMiddleware, getEmployerDashboard);

export default router;
