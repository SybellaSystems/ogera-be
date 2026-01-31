import express, { Router } from "express";
import { getMetrics } from "./dashboard.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { superadminOnly } from "@/middlewares/role.middleware";

const router: Router = express.Router();

/**
 * GET /api/dashboard/metrics
 * Get all dashboard metrics (superadmin only)
 * Requires: Authentication + Superadmin role
 */
router.get(
  "/metrics",
  authMiddleware,
  superadminOnly,
  getMetrics
);

export default router;
