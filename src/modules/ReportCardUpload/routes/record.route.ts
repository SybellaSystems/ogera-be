import express from "express";
const router = express.Router();
import { uploadReportCard } from "../controllers/record.controller.js";
import { authenticationMiddleware } from "../../../middlewares/authMiddleware.js";
import { uploadSingle } from "../../../middlewares/multer.js";

router.post("/report-card/:studentId", authenticationMiddleware, uploadSingle('image'), uploadReportCard);

export default router;