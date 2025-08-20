import express from "express";
const router = express.Router();
import { uploadReportCard } from "../controllers/record.controller.js";
import { authenticationMiddleware } from "../../../middlewares/authMiddleware.js";

router.post('/report-card/:studentID', authenticationMiddleware, uploadReportCard);

export default router;