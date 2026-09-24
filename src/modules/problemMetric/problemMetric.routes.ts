import express from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
    adminOrSuperadminOnly,
    studentRoleOnly,
} from '@/middlewares/role.middleware';
import {
    createProblemMetric,
    listProblemMetricsAdmin,
    getProblemMetricAdmin,
    updateProblemMetric,
    deleteProblemMetric,
    addProblemMetricQuestion,
    updateProblemMetricQuestion,
    deleteProblemMetricQuestion,
    listPublishedProblemMetrics,
    getPublishedProblemMetricForAttempt,
    submitProblemMetricAttempt,
    getMyProblemMetricAttemptHistory,
} from './problemMetric.controller';

const router = express.Router();

router.get(
    '/published',
    authMiddleware,
    studentRoleOnly,
    listPublishedProblemMetrics,
);
router.get(
    '/published/my-attempts',
    authMiddleware,
    studentRoleOnly,
    getMyProblemMetricAttemptHistory,
);
router.get(
    '/published/:id',
    authMiddleware,
    studentRoleOnly,
    getPublishedProblemMetricForAttempt,
);
router.post(
    '/published/:id/submit',
    authMiddleware,
    studentRoleOnly,
    submitProblemMetricAttempt,
);

router.post('/', authMiddleware, adminOrSuperadminOnly, createProblemMetric);
router.get('/', authMiddleware, adminOrSuperadminOnly, listProblemMetricsAdmin);
router.get(
    '/:id',
    authMiddleware,
    adminOrSuperadminOnly,
    getProblemMetricAdmin,
);
router.put('/:id', authMiddleware, adminOrSuperadminOnly, updateProblemMetric);
router.delete(
    '/:id',
    authMiddleware,
    adminOrSuperadminOnly,
    deleteProblemMetric,
);
router.post(
    '/:id/questions',
    authMiddleware,
    adminOrSuperadminOnly,
    addProblemMetricQuestion,
);
router.put(
    '/:id/questions/:questionId',
    authMiddleware,
    adminOrSuperadminOnly,
    updateProblemMetricQuestion,
);
router.delete(
    '/:id/questions/:questionId',
    authMiddleware,
    adminOrSuperadminOnly,
    deleteProblemMetricQuestion,
);

export default router;
