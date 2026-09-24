import express from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
    adminOrSuperadminOnly,
    studentRoleOnly,
} from '@/middlewares/role.middleware';
import {
    createCognitiveTest,
    listCognitiveTestsAdmin,
    getCognitiveTestAdmin,
    updateCognitiveTest,
    deleteCognitiveTest,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    listPublishedCognitiveTests,
    getPublishedTestForAttempt,
    submitCognitiveAttempt,
    getMyCognitiveAttemptHistory,
} from './cognitiveTest.controller';

const router = express.Router();

router.get(
    '/published',
    authMiddleware,
    studentRoleOnly,
    listPublishedCognitiveTests,
);

router.get(
    '/published/my-attempts',
    authMiddleware,
    studentRoleOnly,
    getMyCognitiveAttemptHistory,
);

router.get(
    '/published/:id',
    authMiddleware,
    studentRoleOnly,
    getPublishedTestForAttempt,
);

router.post(
    '/published/:id/submit',
    authMiddleware,
    studentRoleOnly,
    submitCognitiveAttempt,
);

router.post('/', authMiddleware, adminOrSuperadminOnly, createCognitiveTest);

router.get('/', authMiddleware, adminOrSuperadminOnly, listCognitiveTestsAdmin);

router.get(
    '/:id',
    authMiddleware,
    adminOrSuperadminOnly,
    getCognitiveTestAdmin,
);

router.put('/:id', authMiddleware, adminOrSuperadminOnly, updateCognitiveTest);

router.delete(
    '/:id',
    authMiddleware,
    adminOrSuperadminOnly,
    deleteCognitiveTest,
);

router.post(
    '/:id/questions',
    authMiddleware,
    adminOrSuperadminOnly,
    addQuestion,
);

router.put(
    '/:id/questions/:questionId',
    authMiddleware,
    adminOrSuperadminOnly,
    updateQuestion,
);

router.delete(
    '/:id/questions/:questionId',
    authMiddleware,
    adminOrSuperadminOnly,
    deleteQuestion,
);

export default router;
