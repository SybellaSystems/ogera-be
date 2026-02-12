import express from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { getMyTrustScore, getUserTrustScore } from './trustScore.controller';

const trustScoreRouter = express.Router();

// Get authenticated user's TrustScore
trustScoreRouter.get('/me', authMiddleware, getMyTrustScore);

// Get TrustScore for a specific user (requires authentication, can add admin middleware if needed)
trustScoreRouter.get('/:user_id', authMiddleware, getUserTrustScore);

export default trustScoreRouter;

