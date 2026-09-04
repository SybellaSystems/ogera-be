import express from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { adminOrSuperadminOnly } from '@/middlewares/role.middleware';
import { CustomError } from '@/utils/custom-error';
import { DB } from '@/database';
import {
    getMyTrustScore,
    getUserTrustScore,
    calculateTrustScore,
    getTrustHistory,
    getStudentLeaderboard,
    getAdminTrustSummary,
} from './trustScore.controller';

const trustScoreRouter = express.Router();

/** Employer or any admin-type role (DB roleType) or superadmin */
const employerOrAdminLeaderboard = async (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
) => {
    try {
        if (!req.user) {
            return next(new CustomError('Unauthorized', 401));
        }
        const name = req.user.role;
        const low = name?.toLowerCase();
        if (low === 'employer' || low === 'superadmin' || low === 'admin') {
            return next();
        }
        const role = await DB.Roles.findOne({ where: { roleName: name } });
        if (role?.roleType === 'admin') {
            return next();
        }
        return next(new CustomError('Forbidden', 403));
    } catch (e) {
        next(e);
    }
};

trustScoreRouter.get('/me', authMiddleware, getMyTrustScore);

trustScoreRouter.get(
    '/leaderboard/students',
    authMiddleware,
    employerOrAdminLeaderboard,
    getStudentLeaderboard,
);

trustScoreRouter.get(
    '/admin/summary',
    authMiddleware,
    adminOrSuperadminOnly,
    getAdminTrustSummary,
);

trustScoreRouter.get(
    '/history/:user_id',
    authMiddleware,
    getTrustHistory,
);

trustScoreRouter.post(
    '/calculate/:user_id',
    authMiddleware,
    calculateTrustScore,
);

trustScoreRouter.get(
    '/calculate/:user_id',
    authMiddleware,
    calculateTrustScore,
);

trustScoreRouter.get('/:user_id', authMiddleware, getUserTrustScore);



export default trustScoreRouter;
