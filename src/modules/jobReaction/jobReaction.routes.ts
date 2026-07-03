import { Router } from "express";
import controller from "./jobReaction.controller";
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

router.post(
    "/jobs/:jobId/like",
    authMiddleware,
    controller.like,
);

router.post(
    "/jobs/:jobId/dislike",
    authMiddleware,
    controller.dislike,
);

export default router;