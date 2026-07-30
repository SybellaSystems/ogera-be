import express, { Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import controller from "./communityWorkspace.controller";

const router: Router = express.Router();

/**
 * Submit Profile Link
 */
router.post(
    "/link",
    authMiddleware,
    controller.submitStudentLink,
);

/**
 * My Submitted Link
 */
router.get(
    "/my-link",
    authMiddleware,
    controller.getMyStudentLink,
);

/**
 * Update Link
 */
router.put(
    "/link/:id",
    authMiddleware,
    controller.updateStudentLink,
);

/**
 * Delete Link
 */
router.delete(
    "/link/:id",
    authMiddleware,
    controller.deleteStudentLink,
);

/**
 * Community Feed
 */
router.get(
    "/feed",
    authMiddleware,
    controller.getCommunityFeed,
);

/**
 * Submit Review
 */
router.post(
    "/review/:linkId",
    authMiddleware,
    controller.submitPeerReview,
);

/**
 * Get Reviews
 */
router.get(
    "/review/:linkId",
    authMiddleware,
    controller.getReviews,
);

/**
 * Submit Reply
 */
router.post(
    "/review/:reviewId/reply",
    authMiddleware,
    controller.submitReply,
);

/**
 * Update Reply
 */
router.put(
    "/review/:reviewId/reply",
    authMiddleware,
    controller.updateReply,
);

/**
 * My Review History
 */
router.get(
    "/my-reviews",
    authMiddleware,
    controller.getMyReviews,
);

export default router;